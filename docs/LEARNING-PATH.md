# How to learn NestJS from this project

You're coming from **React** and are new to **NestJS**. This doc is a step-by-step learning path using this repo as a tutorial. Read the code in the order below and use the comments in the files—they explain **why** and **when** each piece is used.

**Quick link:** [NESTJS-TERMS.md](./NESTJS-TERMS.md) — glossary of Nest keywords (bootstrap, module, guard, DTO, pipe, JWT, Prisma, etc.).

---

## Before you start

- **Run the app** so you can try the API while reading:
  ```bash
  pnpm install
  # Set up DB (see docs/CREATE-POSTGRES-DB.md) and run:
  pnpm prisma:migrate
  pnpm run start:dev
  ```
- Open **http://localhost:3000/api** (Swagger) and keep it open.
- The codebase has **comments** in the code; read them as you go.

---

## Part 1: How the app starts (15 min)

**Goal:** See how a Nest app boots and where the "root" lives.

### 1.1 Entry point

**File:** `src/main.ts`

- This is like `index.js` in Express or the file that renders `<App />` in React.
- It **creates the app** from `AppModule`, adds **global validation** (ValidationPipe), sets up **Swagger**, and **listens** on a port.
- **Read the comments** in `main.ts` to see what `ValidationPipe` and Swagger do.

### 1.2 Root module

**File:** `src/app.module.ts`

- In Nest, the app is a tree of **modules**. The root is **AppModule**.
- Think of it like the root `<App>` in React: it **imports** other "pieces" (ConfigModule, PrismaModule, UsersModule, AuthModule) and declares the root controller and service.
- **Notice:** We don't put all logic here—we split it into **UsersModule** and **AuthModule**. Same idea as splitting React into components and pages.

**Takeaway:** `main.ts` → creates app from `AppModule` → `AppModule` imports feature modules (Users, Auth, Prisma, Config).

---

## Part 2: One feature end-to-end — Users (45 min)

**Goal:** Understand **Module → Controller → Service → DTO** and how a request becomes a DB call.

Follow this order. Each file has comments; use them as your guide.

### 2.1 Module (the "container")

**File:** `src/users/users.module.ts`

- A **module** groups everything for one feature (controllers, services, and what it exports).
- **Read:** Why we `export` `UsersService` (so AuthModule can use it).

### 2.2 DTOs (request shape and validation)

**Files:**  
- `src/users/dto/create-user.dto.ts`  
- `src/users/dto/update-user.dto.ts`

- **DTO** = Data Transfer Object: the **shape** of the request body and the **validation** rules.
- Decorators like `@IsEmail()`, `@MinLength(8)` come from **class-validator**. With `ValidationPipe` in `main.ts`, invalid bodies are rejected with 400 before they reach the controller.
- **Compare to React:** Like validating form inputs, but on the server. The `@ApiProperty` decorators are for **Swagger** so the docs show the right fields.

### 2.3 Service (business logic and DB)

**File:** `src/users/users.service.ts`

- The **controller** only handles HTTP. The **service** holds the real logic (DB, hashing, checks).
- **Read:** How it uses `PrismaService` (injected) to talk to the DB: `this.prisma.user.findMany()`, `findUnique()`, `create()`, etc.
- **Notice:** Passwords are hashed with bcrypt and never returned (see `omitPassword`).
- **Compare to React:** Like a "hook" or a store that does the real work; the "component" (controller) just calls it and returns the result.

### 2.4 Controller (HTTP routes)

**File:** `src/users/users.controller.ts`

- The **controller** maps **URL + method** to a **handler** and calls the **service**.
- **Read:** `@Controller('users')`, `@Get()`, `@Post()`, `@Patch(':id')`, `@Delete(':id')`, and `@UseGuards(JwtAuthGuard)`.
- **Notice:** Protected routes use `JwtAuthGuard`; Swagger uses `@ApiBearerAuth()` so you can pass the JWT in the UI.

**Flow to memorize:**  
**Request** → Controller (route + DTO) → Service (logic + Prisma) → **Response**.

**Try it:** In Swagger, call **POST /users** to create a user, then **GET /users** (you'll need to log in first and Authorize with the token—see Part 3).

---

## Part 3: Auth — login, JWT, guards (45 min)

**Goal:** Understand **sign-up, login, JWT, and how routes are protected**.

### 3.1 Auth module and DTOs

**File:** `src/auth/auth.module.ts`

- See how it **imports** `UsersModule` (to use `UsersService` for registration) and configures **JwtModule** and **PassportModule**.

**Files:** `src/auth/dto/login.dto.ts`, `sign-up.dto.ts`, `forgot-password.dto.ts`, `reset-password.dto.ts`

- Same idea as user DTOs: they define and validate the body for each auth endpoint.

### 3.2 Auth service (login, sign-up, tokens)

**File:** `src/auth/auth.service.ts`

- **signUp:** Creates user via `UsersService.create`, then returns a JWT.
- **login:** Finds user by email, checks password with bcrypt, returns JWT.
- **forgotPassword:** Creates a reset token and stores it (in a real app you'd send an email).
- **resetPassword:** Validates the token and updates the password.
- **Read** the comments to see why we separate this from `UsersService`.

### 3.3 JWT strategy and guard

**File:** `src/auth/strategies/jwt.strategy.ts`

- When a request has `Authorization: Bearer <token>`, **Passport** uses this strategy to **decode the JWT**, check it, and call `validate()`. Whatever you return from `validate()` becomes **`request.user`**.
- **File:** `src/auth/guards/jwt-auth.guard.ts`
  - **Guard** = "can this request proceed?". `JwtAuthGuard` uses the JWT strategy; if the token is missing or invalid, Nest returns 401 before the controller runs.
- **Compare to React:** Like a "protected route" that checks the user; here the check happens on the server with a JWT.

### 3.4 Auth controller

**File:** `src/auth/auth.controller.ts`

- **POST /auth/sign-up**, **POST /auth/login**, **POST /auth/forgot-password**, **POST /auth/reset-password**, **GET /auth/profile**.
- Profile uses `@UseGuards(JwtAuthGuard)` and reads `req.user` set by the JWT strategy.

**Try it:**  
1. In Swagger: **POST /auth/sign-up** with `email`, `password`, optional `name`. Copy the `access_token`.  
2. Click **Authorize**, paste the token, then call **GET /users** or **GET /auth/profile**.

---

## Part 4: Database and Prisma (30 min)

**Goal:** See how the **schema** becomes **tables** and how the app talks to the DB.

### 4.1 Schema (tables and relations)

**File:** `prisma/schema.prisma`

- This is the **definition** of your DB: models (tables), fields (columns), and relations.
- **User** and **PasswordResetToken** are defined here. Prisma generates a type-safe client from this file.
- **Read** the comments in the schema.

### 4.2 Prisma service (shared DB client)

**File:** `src/prisma/prisma.service.ts`

- Extends **PrismaClient** (the generated client). Nest **injects** this so any service can use it.
- **File:** `src/prisma/prisma.module.ts`  
  - **@Global()** means you don't have to import `PrismaModule` in every module; you can inject `PrismaService` anywhere after it's imported once in `AppModule`.

**Takeaway:** You define the DB in `prisma/schema.prisma`, run `prisma migrate dev`, and then use `PrismaService` in your services to read/write data.

---

## Part 5: Quick reference — React vs Nest

| React (frontend)        | NestJS (backend)              |
|-------------------------|-------------------------------|
| Component               | Module + Controller           |
| State / API call logic  | Service                       |
| Route (e.g. React Router) | Controller + method + decorators |
| Form state / validation | DTO + class-validator         |
| Protected route         | Guard (e.g. JwtAuthGuard)     |
| Context / global state  | Module imports + dependency injection |
| useEffect (run once)     | OnModuleInit / OnModuleDestroy |

---

## Part 6: Suggested order of reading (checklist)

Use this order so concepts build on each other:

1. [ ] `src/main.ts` — bootstrap and global pipes  
2. [ ] `src/app.module.ts` — root module and imports  
3. [ ] `prisma/schema.prisma` — how the DB is defined  
4. [ ] `src/prisma/prisma.service.ts` and `prisma.module.ts` — shared DB client  
5. [ ] `src/users/users.module.ts` — one feature module  
6. [ ] `src/users/dto/create-user.dto.ts` — validation and Swagger  
7. [ ] `src/users/users.service.ts` — business logic and Prisma  
8. [ ] `src/users/users.controller.ts` — routes and guards  
9. [ ] `src/auth/auth.module.ts` — JWT and Passport setup  
10. [ ] `src/auth/auth.service.ts` — login, sign-up, tokens  
11. [ ] `src/auth/strategies/jwt.strategy.ts` — how the JWT becomes `req.user`  
12. [ ] `src/auth/guards/jwt-auth.guard.ts` — how routes are protected  
13. [ ] `src/auth/auth.controller.ts` — auth endpoints  

---

## Part 7: Hands-on ideas

- **Change a DTO:** Add a field to `CreateUserDto` (e.g. `phone`), then create a user in Swagger with that field.  
- **Add a route:** In `UsersController`, add a simple `@Get('count')` that returns `this.usersService.count()` and implement `count()` in the service.  
- **Break validation:** Send an invalid body (e.g. short password) and see the 400 response from `ValidationPipe`.  
- **Use the token:** Call a protected route without Authorize, then with the token, and see the difference.

---

## Part 8: What to learn next

- **Tests:** Look at `src/app.controller.spec.ts` and the Nest testing docs (unit tests for services, e2e for APIs).  
- **Validation:** Deep dive into **class-validator** and **class-transformer**.  
- **Nest docs:** [nestjs.com](https://nestjs.com) — Fundamentals, then Modules, Controllers, Providers, Guards.  
- **Prisma:** [prisma.io/docs](https://www.prisma.io/docs) — Schema, Client API, Migrate.

---

**All NestJS and project keywords** are defined in a separate glossary: **[NESTJS-TERMS.md](./NESTJS-TERMS.md)**.

---

## Summary

- **main.ts** → creates app and global config.  
- **AppModule** → root that imports feature modules.  
- **Each feature:** Module + Controller (HTTP) + Service (logic) + DTOs (validation).  
- **Auth:** JWT strategy fills `req.user`, guards protect routes.  
- **DB:** Prisma schema + PrismaService; run migrations, then use the service in your code.

Use the **comments in the code** and **Swagger** as you go; change small things and re-run to see how they behave. That's the fastest way to get comfortable with Nest.
