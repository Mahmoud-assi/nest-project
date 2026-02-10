# Clinic Booking System – Step 1: Schema & Roles

This doc explains **what we changed** and **why**, and what to do next.

---

## 1. What We Did

### Prisma schema

- **Enums**
  - `Role`: `ADMIN` | `DOCTOR` | `PATIENT` (replaces the old string `"user"`).
  - `AppointmentStatus`: `PENDING` | `CONFIRMED` | `CANCELLED` | `COMPLETED`.
- **User**
  - `role` is now type `Role` with default `PATIENT`.
  - Optional `clinicId` (doctors link to a clinic).
  - Relations: `workingHours`, `appointmentsAsDoctor`, `appointmentsAsPatient`.
- **Clinic**
  - `name`, `address`, and relations to doctors and appointments.
- **WorkingHour**
  - Per-doctor availability: `doctorId`, `dayOfWeek` (0–6), `startMinutes`, `endMinutes` (minutes from midnight).
- **Appointment**
  - `patientId`, `doctorId`, `clinicId`, `scheduledAt`, `durationMinutes`, `status`.
  - **Unique on `(doctorId, scheduledAt)`** so the same slot cannot be double-booked (we’ll use transactions when booking).

### Code updates for the new schema

- **PrismaService**  
  Now uses the client from `src/generated/prisma` (your schema’s `output`), so it sees the new models and enums.
- **Users**
  - DTOs and service use the `Role` enum from the generated client; default role for new users is `PATIENT`.

---

## 2. Run the migration

You added new tables and changed `User.role` from string to enum. Create and apply a migration:

```bash
npx prisma migrate dev --name clinic_roles_appointments
```

- If you **already have rows** with `role = 'user'`, PostgreSQL may complain when switching the column to the enum. In that case you can:
  - Either clear the `User` table in dev and re-run the migration, or
  - Add a custom migration step that updates `'user'` → `'PATIENT'` before changing the column type.

After the migration, `npx prisma generate` is already done; your app should run with the new schema.

---

## 3. How this fits Nest (and your React background)

| Concept        | In Nest / Prisma                         | React analogy                          |
|----------------|------------------------------------------|----------------------------------------|
| **Schema**     | Single source of truth for DB shape      | Like defining TypeScript types + DB     |
| **Enums**      | Fixed set of values in DB and in code    | Union type in TS, but enforced in DB   |
| **Relations**  | `User` → `Appointment` etc. in schema    | Like normalized state / foreign keys   |
| **Unique**     | `@@unique([doctorId, scheduledAt])`      | DB guarantee; no duplicate slots        |

---

## 4. Next steps (when you’re ready)

We’ll do these in order:

1. **Roles & permissions** – `@CheckPermissions()` decorator and guards so only e.g. doctors can cancel appointments.
2. **i18n** – `nestjs-i18n` so messages (e.g. “User not found”) follow `Accept-Language` (e.g. Arabic).
3. **Clinic logic** – Doctors set working hours; patients book; booking uses **Prisma transactions** to avoid double-booking.
4. **Global utilities** – Exception filter (consistent error JSON) and response interceptor (e.g. `{ success: true, data }`).

When you’re ready for step 2 (permissions), say so and we’ll add the decorator and guard.

---

## 5. Step 2 & 3: i18n, Permissions, Clinic admin route, Response interceptor

### How i18n language detection works (headers vs query)

**By default, nestjs-i18n resolves the request language in this order:**

1. **Query parameter** (if you configured it)  
   We use `QueryResolver` with option `['lang']`, so **`?lang=ar`** or **`?lang=en`** on the URL sets the language for that request. Useful for testing and for clients that prefer query over headers.

2. **Accept-Language header**  
   We use `AcceptLanguageResolver`, so the standard HTTP header **`Accept-Language: ar`** (or `ar-EG`, `en`, etc.) sets the language. Browsers and many HTTP clients send this automatically based on user locale. The resolver parses the header and picks the first supported language (we support `en` and `ar`).

**Order in our config:** We register `QueryResolver` first, then `AcceptLanguageResolver`. So **query wins over header**: if the request has both `?lang=en` and `Accept-Language: ar`, the result is `en` because the query resolver runs first. If you want header to win, put `AcceptLanguageResolver` first in the `resolvers` array.

**Summary:** Language is detected from **query param `lang`** first, then from **`Accept-Language`** header. Fallback is `en` (configured in `I18nModule.forRoot({ fallbackLanguage: 'en' })`).

### What was added

- **lang folder**  
  `src/lang/en/common.json` and `src/lang/ar/common.json` with keys like `USER_NOT_FOUND`, `UNAUTHORIZED`, `FORBIDDEN`, and validation messages. Nest copies `lang/**` to `dist` via `nest-cli.json` assets.

- **I18nValidationPipe**  
  Replaces the default `ValidationPipe`. DTO validation errors use `i18nValidationMessage('common.KEY')` and are returned in the request language.

- **HttpExceptionI18nFilter**  
  When you throw e.g. `NotFoundException('common.USER_NOT_FOUND')`, the filter translates that key and returns the translated message in the JSON response.

- **@CheckPermissions(Role.ADMIN)**  
  Custom decorator that stores allowed roles in metadata. Use with `PermissionsGuard` (after `JwtAuthGuard`). The guard reads `req.user.role` (from DB via JwtStrategy) and throws `ForbiddenException('common.FORBIDDEN')` if the role is not allowed.

- **GET /clinic/admin-only**  
  Protected by `JwtAuthGuard` and `PermissionsGuard` with `@CheckPermissions(Role.ADMIN)`. Returns a message and data; response is wrapped by the global interceptor.

- **ResponseWrapInterceptor**  
  Global interceptor that wraps successful responses as `{ success: true, message?: string, data }`. If the handler returns `{ message, data }`, those are used; otherwise the return value becomes `data`.

---

## 6. Clinic booking flow (working hours + book)

### Endpoints

- **POST /clinic/working-hours** (DOCTOR only) – Add a working-hour slot: `dayOfWeek` (0–6), `startMinutes`, `endMinutes` (minutes from midnight).
- **POST /clinic/book** (PATIENT only) – Body: `doctorId`, `scheduledAt` (ISO 8601), `durationMinutes` (optional). Validates doctor exists, time is within working hours, then creates the appointment inside a Prisma transaction.

### How Prisma transactions prevent double booking (race conditions)

When two patients book the same slot at the same time:

1. **Without a transaction:** Both requests could pass the “is this slot free?” check, then both run `create`. One would succeed and the other would fail on the **unique constraint** `(doctorId, scheduledAt)` with a Prisma `P2002` error. So the DB already prevents double booking, but you’d have to detect P2002 and map it to a friendly message.

2. **With a transaction:** We run the “check slot free” + “create appointment” inside `prisma.$transaction(async (tx) => { ... })`. That groups the work into one atomic unit. If two requests run in parallel:
   - Both can still pass the `findFirst` check before either commits.
   - So the **unique constraint** is still the real guard: the second `create` will fail with P2002.
   - We catch P2002 (and the explicit `findFirst` + throw inside the transaction) and throw `ConflictException('common.SLOT_ALREADY_BOOKED')`, which the global filter translates.

**Summary:** The transaction keeps “check + create” logically together and ensures a consistent view during the transaction; the **unique constraint** is what actually prevents two rows for the same (doctorId, scheduledAt). Catching P2002 and throwing a translated key gives a clean, i18n-friendly error.

### Using I18nContext inside a service for translated errors

You have two patterns:

1. **Throw a key; let the global filter translate**  
   `throw new NotFoundException('common.DOCTOR_NOT_FOUND');`  
   The `HttpExceptionI18nFilter` sees `common.DOCTOR_NOT_FOUND`, translates it with the request language, and returns it in the JSON response.

2. **Translate in the service with I18nContext**  
   When you need the translated string inside the service (e.g. for logging or a custom payload):

   ```ts
   const t = I18nContext.current()?.t as ((k: string) => string) | undefined;
   const message = t ? t('common.DOCTOR_NOT_AVAILABLE') : 'common.DOCTOR_NOT_AVAILABLE';
   throw new BadRequestException(message);
   ```

   `I18nContext.current()` uses the same async context as the request, so the language is already set by the i18n resolver (e.g. `Accept-Language` or `?lang=`). Use this when the response body must contain the translated message directly and you don’t want the filter to run (or when you need the string for something other than the exception message).

---

## 7. Final phase: Upload, Logging, Background tasks, Search

### Prisma: MedicalRecord model

```prisma
model MedicalRecord {
  id           String   @id @default(cuid())
  filePath     String   // Relative path under uploads/ (e.g. 2025/02/abc123.pdf)
  originalName String?
  mimeType     String?
  uploadedById String
  uploadedBy   User     @relation(fields: [uploadedById], references: [id], onDelete: Cascade)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  @@index([uploadedById])
}
```

User has `medicalRecords MedicalRecord[]`. Run `npx prisma migrate dev` after adding this.

### Multer (file upload) – for React devs

In the browser you use `<input type="file">` or `FormData` and get a `File` object. In Nest, the client still sends **multipart/form-data** with a field (e.g. `file`). **Multer** is the middleware that parses that request body: it reads the file stream and either keeps it in memory or writes it to disk. Nest’s `FileInterceptor('file', options)` uses Multer under the hood. So:

- **Client:** `FormData` with key `file` and value = the File.
- **Nest:** `@UseInterceptors(FileInterceptor('file', multerOptions))` so Multer runs first; then the handler receives `@UploadedFile() file: Express.Multer.File`, which has `.path`, `.originalname`, `.mimetype`, etc.

We use **disk storage** so the file is saved under `uploads/YYYY/MM/` and we store that path in `MedicalRecord.filePath`. Allowed types: PDF and images (JPEG, PNG); invalid files are rejected and the i18n keys `FILE_REQUIRED`, `INVALID_FILE_TYPE` are used.

### Why background tasks for emails

Sending an email can take hundreds of ms or more (SMTP, retries). If we do it **inside** the booking request, the user waits that long and the request can time out or feel slow. So we **don’t** wait: we create the appointment, emit an event (`appointment.booked`), and return the response immediately. A listener (`AppointmentEventsListener`) runs **asynchronously** and “sends” the email (here, `console.log`). The user gets a fast response; the email is handled in the background. For production you’d use a queue (e.g. BullMQ + Redis) so failed emails can be retried and not lost if the process restarts.

### What was added

- **UploadModule:** `POST /upload/medical-report` (DOCTOR or PATIENT), Multer disk storage, `MedicalRecord` created with `file_path`, `originalName`, `mimeType`. New i18n keys: `FILE_REQUIRED`, `INVALID_FILE_TYPE`, `UPLOAD_FAILED` (en + ar).
- **LoggerMiddleware:** Logs every request as `METHOD URL STATUS_CODE DURATION_MS` (like the browser Network tab). Applied to all routes in `AppModule.configure()`.
- **EventEmitter:** On successful `book()`, `ClinicService` emits `appointment.booked` with appointment details; `AppointmentEventsListener` handles it and logs the “confirmation email” (replace with real email later).
- **GET /clinic/search?q=...**  
  Public endpoint. Searches users with `role: DOCTOR` by **name** (case-insensitive) or **clinic name** (relation filter). Returns doctor id, name, email, clinic info.
