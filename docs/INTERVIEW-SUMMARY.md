# How to Explain This Project in a Job Interview

Use this as a cheat sheet for the **golden points** to mention when presenting the Clinic Booking API as a portfolio piece.

---

## 1. One-line pitch

> "I built a **production-style clinic booking API** in NestJS with JWT auth, role-based access (ADMIN/DOCTOR/PATIENT), appointment booking with **Prisma transactions** to prevent double booking, **i18n** (English and Arabic), file uploads for medical records, background tasks for confirmation emails, and full **Swagger** docs and **unit tests**."

---

## 2. Golden points to mention (in order of impact)

### Architecture & NestJS

- **Modular structure:** Auth, Users, Clinic, Upload, Health are separate modules. Each has a clear responsibility (like feature-based structure in a large app).
- **Guards and decorators:** `JwtAuthGuard` for authentication; custom `@CheckPermissions(Role.ADMIN)` + `PermissionsGuard` for authorization. The role comes from the DB (JWT → load user), not just from the token payload.
- **Interceptors and filters:** Global **response interceptor** wraps every success in `{ success: true, data }`. Global **exception filter** translates i18n keys (e.g. `common.USER_NOT_FOUND`) using `Accept-Language` or `?lang=` so the same key returns different messages in en/ar.
- **Pipes:** `I18nValidationPipe` so validation errors (e.g. invalid email) are returned in the request language.

### Data & concurrency

- **Prisma transactions:** For booking, we run "check slot free" + "create appointment" inside `$transaction`. The **unique constraint** `(doctorId, scheduledAt)` is the real guarantee against double booking; we also catch Prisma’s P2002 and map it to a user-facing i18n message.
- **Why transactions:** They keep the check-and-create logically atomic and give a consistent view; the unique constraint handles the race when two requests try to book the same slot.

### i18n

- **Resolvers:** Language from **query** `?lang=ar` first, then **Accept-Language** header, then fallback to English. All error messages (validation, not found, forbidden) use keys from `common.json` (en + ar).

### Background work

- **EventEmitter:** After a successful booking we **emit** an event and return the response immediately. A listener runs in the background and “sends” the confirmation (e.g. console.log; in production you’d send email or push to a queue). This keeps the API fast and avoids blocking on I/O.

### File upload

- **Multer:** Same idea as in the browser: client sends `multipart/form-data` with a file; Nest’s `FileInterceptor` + Multer parse it and we get `Express.Multer.File`. We use **disk storage** under `uploads/` and store the path and metadata in a **MedicalRecord** table.

### Quality & ops

- **Swagger:** All controllers are documented with `@ApiTags`, `@ApiOperation`, and `@ApiResponse` (including error codes and i18n keys). DTOs use `@ApiProperty` so request/response shapes are clear.
- **Unit tests:** We test **ClinicService.book()** with **Jest mocks** for Prisma and EventEmitter: successful booking, doctor not found, doctor not available at that time, slot already taken (inside transaction), and P2002 unique violation. No real DB; we control every dependency’s return value.
- **Health check:** `GET /health` returns server status and **database** status (e.g. `$queryRaw SELECT 1`) so load balancers or monitoring can check both.
- **Security and CORS:** **Helmet** for security headers; **CORS** enabled so a React (or other) frontend can call the API from another origin.

---

## 3. How Jest mocks the Prisma service

- We **don't use a real database** in unit tests. We pass a **fake** `PrismaService` into the test module: `{ provide: PrismaService, useValue: mockPrisma }`.
- `mockPrisma` has the same **method names** the service uses: `user.findFirst`, `workingHour.findMany`, `$transaction`. Each is a **Jest mock** (`jest.fn()`).
- We control behaviour with **mockResolvedValue** / **mockRejectedValue** / **mockImplementation**. For example: "Doctor not found" → `prisma.user.findFirst.mockResolvedValue(null)`; "Slot taken" → inside `$transaction.mockImplementation(cb => cb(mockTx))`, we set `mockTx.appointment.findFirst.mockResolvedValue({ id: 'existing' })`.
- The **real** `ClinicService` runs with this **fake** Prisma. We assert on the service's **output** (return value or thrown exception) and that the right methods were called. No DB, fast and deterministic.

---

## 4. If they ask “How do you test the booking logic?”

- “We **unit test** `ClinicService.book()` with **mocked Prisma and EventEmitter**. We don’t use a real database: we replace `PrismaService` with a fake that has the same methods. Each test sets `mockResolvedValue` or `mockImplementation` so that, for example, the doctor doesn’t exist, or there are no working hours, or the transaction callback sees an existing appointment. Then we assert that the service throws the right exception (e.g. `NotFoundException('common.DOCTOR_NOT_FOUND')` or `ConflictException('common.SLOT_ALREADY_BOOKED')`) or returns the appointment and that the event emitter was called. That way we cover success, doctor not found, doctor not available, and slot already taken without touching the DB.”

---

## 4. If they ask “How do you avoid two users booking the same slot?”

- “We have a **unique constraint** in the database on `(doctorId, scheduledAt)`. So only one row per doctor per time is allowed. We also run the create inside a **Prisma transaction**. If two requests run at the same time, both might pass our ‘is the slot free?’ check, but the second `create` will hit the unique constraint and Prisma will throw. We catch that (P2002) and return a translated conflict error (e.g. `common.SLOT_ALREADY_BOOKED`) so the user sees a clear message.”

---

## 5. If they ask “Why not send the email inside the request?”

- “Sending email can take hundreds of milliseconds or more and can fail or timeout. If we do it inside the booking request, the user waits for that and the API feels slow. So we **emit an event** after saving the appointment and return the response right away. A listener runs **asynchronously** and handles the email (or enqueue to BullMQ in production). The user gets a fast response and we don’t block on I/O.”

---

## 7. Short checklist before the interview

- [ ] Run the app and open Swagger at `/api`.
- [ ] Show `GET /health` (server + DB).
- [ ] Show a protected route (e.g. `GET /clinic/admin-only`) with and without JWT.
- [ ] Show `POST /clinic/book` with 409 when the slot is taken.
- [ ] Show validation error with `Accept-Language: ar` or `?lang=ar`.
- [ ] Run `npm test` and point to `ClinicService` tests for booking.

This project shows you understand **NestJS modules, guards, interceptors, filters, pipes, Prisma, transactions, i18n, background tasks, file upload, testing with mocks, and API documentation**—all strong interview talking points.
