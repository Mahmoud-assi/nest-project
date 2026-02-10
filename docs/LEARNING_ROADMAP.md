# Learning Roadmap — Clinic Booking API (for React Devs)

A guided tour of this NestJS project so you can map backend concepts to what you already know from React and see exactly where each piece runs in the request lifecycle.

---

## 1. How to Explore This Project

### Start here (in order)

| Step | Where to look | What you're seeing |
|------|----------------|--------------------|
| 1 | `src/main.ts` | App entry point: creates app, registers global pipe/filters/interceptor, Swagger, CORS, Helmet. Like `index.js` + app-wide config. |
| 2 | `src/app.module.ts` | Root module: imports all feature modules (Auth, Users, Clinic, Upload, Health, Prisma, I18n, EventEmitter) and applies `LoggerMiddleware` to every route. Think of it as the "app shell" that wires everything. |
| 3 | `prisma/schema.prisma` | Single source of truth for the database: models (User, Clinic, Appointment, WorkingHour, MedicalRecord) and enums (Role, AppointmentStatus). No SQL; Prisma generates the client from this. |
| 4 | One feature end-to-end | Pick **Clinic**: open `src/clinic/clinic.module.ts` → `clinic.controller.ts` → `clinic.service.ts`. Follow a request from HTTP to DB and back. |
| 5 | Auth flow | `src/auth/auth.controller.ts` (login/sign-up) → `auth.service.ts` → `auth/strategies/jwt.strategy.ts` (how JWT becomes `req.user`) and `auth/guards/jwt-auth.guard.ts`. |
| 6 | Shared cross-cutting code | `src/common/` — middleware, guards, decorators, filters, interceptors. Used by multiple modules. |

### Folder map (React analogy)

| NestJS | React analogy |
|--------|----------------|
| `src/*.module.ts` | Feature or app-level "context" / bundle of related code |
| `src/*.controller.ts` | Route handlers (like API route files or a router config) |
| `src/*.service.ts` | Business logic (like hooks or services called by components) |
| `src/*/dto/*.ts` | Typed request/response shapes (like TypeScript types for API calls) |
| `src/common/` | Shared utilities, guards, interceptors (like shared hooks or wrappers) |
| `prisma/schema.prisma` | Schema definition (like defining types + DB structure in one place) |

---

## 2. Request Lifecycle — Which File Is Hit First

For a request like `POST /clinic/book` (with JWT and body), execution flows in this order. Each step names the **file(s)** involved.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  1. MIDDLEWARE (runs first for every request)                               │
│     File: src/common/middleware/logger.middleware.ts                         │
│     → Logs method, URL; on "finish" logs status code and duration.          │
│     → next() passes to the next layer.                                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                        ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│  2. GUARDS (only on routes that use @UseGuards)                              │
│     Files: src/auth/guards/jwt-auth.guard.ts                                │
│            src/common/guards/permissions.guard.ts                           │
│     → JwtAuthGuard: uses Passport + JwtStrategy → validates JWT, loads user │
│       (strategy: src/auth/strategies/jwt.strategy.ts → AuthService, DB).    │
│     → PermissionsGuard: reads @CheckPermissions() and checks req.user.role │
│       (decorator: src/common/decorators/check-permissions.decorator.ts).   │
│     → If any guard fails → exception → skip to step 7 (Exception filters).  │
└─────────────────────────────────────────────────────────────────────────────┘
                                        ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│  3. INTERCEPTORS (before handler)                                           │
│     We don’t have a custom "before" interceptor; nestjs-i18n may run here   │
│     to set request language.                                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                        ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│  4. PIPE (validation / transformation)                                      │
│     Configured in: src/main.ts (I18nValidationPipe, global)                 │
│     → Validates body/query/params against DTOs (e.g. BookAppointmentDto).    │
│     → If validation fails → I18nValidationExceptionFilter (step 7).         │
└─────────────────────────────────────────────────────────────────────────────┘
                                        ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│  5. CONTROLLER → SERVICE → PRISMA                                            │
│     Controller: src/clinic/clinic.controller.ts (book method)               │
│     Service:    src/clinic/clinic.service.ts (book())                       │
│     DB access:  src/prisma/prisma.service.ts (injected into ClinicService)  │
│     → Controller gets req.user (from guard), calls clinicService.book().   │
│     → Service uses prisma.$transaction, prisma.user.findFirst, etc.        │
└─────────────────────────────────────────────────────────────────────────────┘
                                        ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│  6. INTERCEPTORS (after handler — response)                                 │
│     File: src/common/interceptors/response-wrap.interceptor.ts              │
│     → Wraps return value in { success: true, data: ... }.                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                        ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│  7. EXCEPTION FILTERS (only if an exception was thrown anywhere above)      │
│     Files: I18nValidationExceptionFilter (nestjs-i18n) — validation errors │
│            src/common/filters/http-exception-i18n.filter.ts — HTTP errors   │
│     → Translate keys like 'common.SLOT_ALREADY_BOOKED' using request lang.  │
│     → Send JSON response with status code and translated message.          │
└─────────────────────────────────────────────────────────────────────────────┘
```

**One-line summary:** Middleware → Guards → Pipe → Controller → Service → Prisma; then response flows back through Interceptor (wrap) and, on error, through Exception filters.

---

## 3. The 5 Most Important Files to Study

These five files give you the core NestJS concepts used in this project.

| # | File | What you learn |
|---|------|----------------|
| 1 | **`src/app.module.ts`** | How the app is composed: imports (Config, I18n, Prisma, Auth, Clinic, Upload, Health), controllers, providers, and how middleware is applied with `configure(consumer)`. This is the "dependency graph" at app level. |
| 2 | **`src/auth/strategies/jwt.strategy.ts`** | How a request gets a user: JWT is extracted and validated, then `validate()` loads the user from the DB and attaches it to `req.user`. Shows integration with Passport and dependency injection (ConfigService, AuthService). |
| 3 | **`src/clinic/clinic.service.ts`** | Business logic in one place: validation (doctor exists, working hours), Prisma transaction for booking, and emitting an event. Shows service as the core of a feature and how it uses injected Prisma and EventEmitter. |
| 4 | **`src/common/guards/permissions.guard.ts`** | How to read metadata (from `@CheckPermissions()`) and use the request (e.g. `req.user.role`) to allow or deny access. Shows Reflector and ExecutionContext. |
| 5 | **`src/common/filters/http-exception-i18n.filter.ts`** | How exceptions are turned into HTTP responses: read exception message, detect i18n keys, translate with I18nContext, send JSON. Shows ExceptionFilter and integration with i18n. |

After these, add: `src/main.ts` (global pipe, filters, interceptor), `prisma/schema.prisma` (data model), and one controller (e.g. `clinic.controller.ts`) to see how routes and DTOs are declared.

---

## 4. Dependency Injection in This Project — Where It Happens

NestJS creates instances of your classes and injects their dependencies. You don’t `new` services or Prisma; you declare them in modules and use constructors.

### Where dependencies are declared (the "providers")

| File | What it provides | Who can inject it |
|------|------------------|-------------------|
| `src/prisma/prisma.module.ts` | `PrismaService` (global) | Any module that imports `PrismaModule` (e.g. ClinicModule, UploadModule, HealthModule, AuthModule, UsersModule). |
| `src/auth/auth.module.ts` | `AuthService`, `JwtStrategy`, etc. | Controllers and other services inside AuthModule; JwtStrategy is used by JwtAuthGuard. |
| `src/clinic/clinic.module.ts` | `ClinicService`, `PermissionsGuard`, `AppointmentEventsListener` | ClinicController injects ClinicService; guard is used by controller. |
| `src/app.module.ts` | `AppService` | AppController. |

### Where injection happens (constructor parameters)

| File | Injected dependency | How |
|------|---------------------|-----|
| `src/clinic/clinic.service.ts` | `PrismaService`, `EventEmitter2` | `constructor(private readonly prisma: PrismaService, private readonly eventEmitter: EventEmitter2)` |
| `src/auth/strategies/jwt.strategy.ts` | `ConfigService`, `AuthService` | `constructor(private readonly configService: ConfigService, private readonly authService: AuthService)` |
| `src/common/guards/permissions.guard.ts` | `Reflector` | `constructor(private readonly reflector: Reflector)` |
| `src/upload/upload.controller.ts` | `MedicalRecordsService` | Controller declares it; Nest resolves it because UploadModule lists the service in `providers`. |

### How Nest resolves it

1. You list a class in a module’s `providers` (or import a module that exports it).
2. Nest creates one instance (or one per scope) and keeps it in the "container".
3. When creating a controller or another service, Nest looks at its constructor parameters and injects the matching providers by type.

So: **declare in a module** → **ask for in constructor** → Nest injects. No manual `new` for services or Prisma.

---

## 5. Cheat Sheet — CLI Commands You Need

| Command | What it does |
|---------|----------------|
| `pnpm install` | Install dependencies (runs `prisma generate` after install). |
| `pnpm run start:dev` | Start the app in watch mode (restarts on file change). |
| `pnpm run build` | Compile TypeScript to `dist/`. |
| `pnpm run prisma:generate` | Regenerate Prisma client after changing `schema.prisma`. |
| `pnpm run prisma:migrate` | Create and apply a migration (e.g. after adding MedicalRecord). Use: `npx prisma migrate dev --name your_migration_name`. |
| `pnpm run prisma:studio` | Open Prisma Studio (DB GUI) in the browser. |
| `pnpm test` | Run all unit tests (Jest). |
| `pnpm test -- clinic.service.spec` | Run only the clinic service tests. |
| `pnpm run lint` | Run ESLint (and fix where possible). |
| `pnpm run format` | Format code with Prettier. |

**Typical workflow after changing the schema:**

```bash
npx prisma migrate dev --name add_something
# prisma generate runs automatically after migrate; if you only changed schema without migrating:
pnpm run prisma:generate
pnpm run build
```

---

## 6. Interview Script — How to Describe the Architecture

Use this as a short script to describe the project to a recruiter or in an interview.

**"How is this project structured?"**

> "It’s a **modular NestJS backend**: one codebase, one app, but split into **feature modules** — Auth, Users, Clinic, Upload, Health — plus shared pieces in a **common** folder. Each feature has its own controller, service, and DTOs; some share the same database and the same Prisma client. So it’s **modular by feature**, not a monorepo with multiple apps. The root **AppModule** imports all feature modules and applies global middleware, so the app stays in one place but is easy to extend with new modules."

**"How do you handle auth and permissions?"**

> "We use **JWT** for authentication: login returns a token, and protected routes use a **JwtAuthGuard** that validates the token and loads the user from the DB into `req.user`. For authorization we have a custom **PermissionsGuard** and a **@CheckPermissions** decorator: the decorator stores which roles are allowed (e.g. ADMIN, DOCTOR), and the guard checks `req.user.role` against that. So the role is always coming from the database, not just from the token."

**"How do you keep the API consistent and secure?"**

> "We use **global** pipe, filters, and interceptor: one validation pipe for all DTOs, one exception filter that translates error keys into the user’s language, and one response interceptor that wraps success responses in `{ success: true, data }`. We also use **Helmet** for security headers and **CORS** so our React frontend can call the API. So consistency and security are applied in one place instead of per route."

You can then point to the **Request Lifecycle** (section 2) and the **5 key files** (section 3) to show you know exactly where each concept lives in the codebase.
