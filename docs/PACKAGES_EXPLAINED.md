# Packages Explained — Clinic Booking API

Every major package in this project: why we use it here and how it relates to the React ecosystem or why the backend needs it.

---

## NestJS core

### `@nestjs/core` & `@nestjs/common`

| | |
|--|--|
| **Why we use it** | The Nest runtime and shared building blocks: decorators (`@Controller`, `@Get`, `@Injectable`, `@UseGuards`), base classes for guards/pipes/filters/interceptors, and HTTP types (e.g. `NotFoundException`). |
| **React / frontend equivalent** | No direct equivalent. React is UI; Nest is a server framework. Conceptually, decorators and modules are a bit like a router + context: they declare "this class handles these routes" and "this class is available to others." |

### `@nestjs/platform-express`

| | |
|--|--|
| **Why we use it** | Lets Nest use **Express** under the hood for HTTP (request/response, middleware, Multer for file uploads). So every request is an Express request; Nest adds structure (modules, DI, decorators) on top. |
| **React equivalent** | N/A. In React you call APIs; the backend needs a server. Express is one of the standard Node HTTP layers Nest can sit on. |

### `@nestjs/config`

| | |
|--|--|
| **Why we use it** | Loads `.env` and exposes values via `ConfigService.get('JWT_SECRET')`, `ConfigService.get('DATABASE_URL')`, etc. We use it in `main.ts`, `PrismaService`, and `JwtStrategy`. |
| **React equivalent** | Like using `process.env.REACT_APP_*` or a config module; but in Nest, ConfigService is injectable and testable. Backend needs env for secrets and DB URLs. |

---

## Auth & security

### `@nestjs/jwt` & `@nestjs/passport` & `passport` & `passport-jwt`

| | |
|--|--|
| **Why we use it** | **JWT:** sign and verify tokens (e.g. after login we `jwtService.signAsync({ sub: userId, email })`). **Passport:** pluggable auth strategies. **passport-jwt:** strategy that reads `Authorization: Bearer <token>`, verifies it, and calls our `JwtStrategy.validate()` to load the user and set `req.user`. |
| **React equivalent** | Frontend stores the token (e.g. in memory or localStorage) and sends it in the header. The backend must verify it and load the user; Passport + JwtStrategy is the standard way in Nest/Express. |

### `bcrypt`

| | |
|--|--|
| **Why we use it** | Hash passwords before storing and compare on login. We never store plain-text passwords. |
| **React equivalent** | Hashing is done only on the server. React sends the password over HTTPS; the backend hashes it. There is no browser equivalent for password hashing in the same way. |

### `helmet`

| | |
|--|--|
| **Why we use it** | Sets security-related HTTP headers (e.g. X-Content-Type-Options, X-Frame-Options) to reduce certain attacks. Applied once in `main.ts` with `app.use(helmet())`. |
| **React equivalent** | N/A. Headers are a server concern. Frontend benefits from them when the server sends responses. |

---

## Database & ORM

### `@prisma/client` & `@prisma/adapter-pg` & `prisma` (dev)

| | |
|--|--|
| **Why we use it** | **Prisma** is the ORM: we define models in `schema.prisma`, run `prisma migrate` and `prisma generate`, then use a type-safe client (`prisma.user.findMany()`, `prisma.$transaction()`). **adapter-pg** is the PostgreSQL driver adapter required by Prisma 7+. **prisma** (CLI, dev) is for migrations and code generation. |
| **React equivalent** | No ORM in React; React talks to an API. The backend needs a way to talk to the DB. Prisma is like an ORM in other stacks (e.g. TypeORM, Sequelize, or Drizzle): schema as code, type-safe queries, migrations. |

---

## Validation & DTOs

### `class-validator` & `class-transformer`

| | |
|--|--|
| **Why we use it** | **class-validator:** decorators on DTOs (`@IsEmail()`, `@MinLength(8)`) so that when a request body is bound to a DTO, validation runs and invalid payloads get 400 with messages. **class-transformer:** turns plain objects into class instances (so validators run). Used by Nest’s validation pipe (and our I18nValidationPipe). |
| **React equivalent** | Form validation (e.g. react-hook-form + zod). Here validation runs on the server so invalid data is rejected before it reaches the service. Backend must validate; these libraries are the standard in Nest. |

---

## i18n (translations)

### `nestjs-i18n`

| | |
|--|--|
| **Why we use it** | Loads translation files (`lang/en/common.json`, `lang/ar/common.json`), resolves language from query (`?lang=ar`) or header (`Accept-Language`), and provides `I18nValidationPipe` (validation errors in the right language) and `I18nContext.current().t('common.KEY')` for translating messages in code. Our exception filter uses it to translate error keys before sending the response. |
| **React equivalent** | i18n libraries (e.g. react-i18next, react-intl) that switch UI text by locale. Same idea: one key, many languages. Backend needs it so API error messages match the client’s language. |

---

## File upload

### Multer (via `@nestjs/platform-express`) & `@types/multer`

| | |
|--|--|
| **Why we use it** | **Multer** parses `multipart/form-data` (file uploads). Nest’s `FileInterceptor('file', options)` uses Multer; we configure disk storage in `upload/multer.options.ts` and get `Express.Multer.File` (path, originalname, mimetype) in the controller. We then save the path in the `MedicalRecord` table. |
| **React equivalent** | In React you use `<input type="file">` or `FormData` and send the file to the API. The backend needs something to parse that request body; Multer is the standard in Express/Nest. |

---

## Background tasks

### `@nestjs/event-emitter`

| | |
|--|--|
| **Why we use it** | After an appointment is booked we don’t wait for the "confirmation email"; we emit an event (`appointment.booked`) and return the response. A listener (`AppointmentEventsListener`) runs asynchronously and does the email (here, `console.log`). Keeps the API fast and decouples booking from side effects. |
| **React equivalent** | No direct equivalent. In React you might use callbacks or pub/sub in the client. On the backend, events (or a queue like BullMQ) are the standard way to do work after the response is sent. For production you’d often use **BullMQ + Redis** for retries and durability; EventEmitter is simple and good for demos. |

---

## API documentation

### `@nestjs/swagger`

| | |
|--|--|
| **Why we use it** | Generates **OpenAPI (Swagger)** docs from decorators: `@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiProperty` on DTOs. Our UI at `/api` shows all endpoints, request/response shapes, and possible errors (including i18n keys). |
| **React equivalent** | No direct equivalent. Frontend devs use the same OpenAPI spec (or the Swagger UI) to know how to call the API. Like having a typed contract; some tools generate React/TS clients from OpenAPI. |

---

## Utilities & runtime

### `reflect-metadata`

| | |
|--|--|
| **Why we use it** | Required for decorators that store metadata (e.g. `@CheckPermissions(Role.ADMIN)` uses `SetMetadata`; the guard reads it with `Reflector`). Nest and TypeScript use this for DI and route metadata. |
| **React equivalent** | N/A. Used by the Nest/TS decorator and DI system. |

### `rxjs`

| | |
|--|--|
| **Why we use it** | Nest uses RxJS internally (e.g. for some interceptors and event streams). We don’t write RxJS in our app code much; it’s a dependency of the framework. |
| **React equivalent** | Different model (observables vs. components and hooks). Backend uses it for async streams where needed. |

### `dotenv`

| | |
|--|--|
| **Why we use it** | Loads `.env` into `process.env`. Often used indirectly via `@nestjs/config`. Ensures env vars are available before the app uses them. |
| **React equivalent** | Create React App / Vite also use `.env` (e.g. `REACT_APP_*`). Same idea: env-based config. |

---

## Testing

### `@nestjs/testing` & `jest` & `ts-jest`

| | |
|--|--|
| **Why we use it** | **@nestjs/testing:** `Test.createTestingModule()` builds a minimal Nest app for tests and lets us override providers (e.g. mock `PrismaService`). **jest** + **ts-jest:** test runner and TypeScript support. We use them in `clinic.service.spec.ts` to unit-test booking without a real DB. |
| **React equivalent** | Jest + React Testing Library for components. Same idea: run code in isolation with mocks. Here we mock the DB and event emitter instead of the DOM. |

---

## Summary table

| Package | Role in this project | React / backend note |
|---------|----------------------|------------------------|
| @nestjs/core, common | Framework core and decorators | Backend framework. |
| @nestjs/platform-express | Express under the hood, Multer | Server and file upload. |
| @nestjs/config | Env vars via ConfigService | Like env in React, but injectable. |
| @nestjs/jwt, passport, passport-jwt | JWT sign/verify and auth strategy | Backend auth; frontend sends token. |
| bcrypt | Password hashing | Server-only. |
| helmet | Security headers | Server-only. |
| @prisma/client, prisma | ORM and migrations | Backend DB layer. |
| class-validator, class-transformer | DTO validation | Like form validation, on the server. |
| nestjs-i18n | Translations for errors and validation | Like react-i18next, for API messages. |
| Multer (@types/multer) | Parse file uploads | Backend parses FormData. |
| @nestjs/event-emitter | Fire-and-forget events (e.g. email) | Backend async work; cf. BullMQ in prod. |
| @nestjs/swagger | OpenAPI docs from decorators | Contract for frontend and docs. |
| reflect-metadata, rxjs, dotenv | Nest/TS and env | Framework and config. |
| @nestjs/testing, jest | Unit tests with mocks | Same idea as Jest in React. |

---

## Cheat sheet (duplicate for quick reference)

Same as in **LEARNING_ROADMAP.md** — keep these in mind:

| Command | Purpose |
|---------|--------|
| `pnpm run start:dev` | Run app in watch mode. |
| `pnpm run build` | Build for production. |
| `pnpm run prisma:generate` | Regenerate Prisma client. |
| `npx prisma migrate dev --name <name>` | Create and apply migration. |
| `pnpm run prisma:studio` | Open DB GUI. |
| `pnpm test` | Run unit tests. |
| `pnpm run lint` | Lint and fix. |

**More:** For request lifecycle, key files to study, dependency injection, a full **CLI cheat sheet**, and an **interview script** for describing the architecture, see **LEARNING_ROADMAP.md**.
