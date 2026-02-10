# Package.json – Package Reference

This document explains each package in `package.json` and how it is used in this NestJS project.

---

## Dependencies (runtime)

### NestJS core

| Package | Purpose |
|--------|---------|
| **@nestjs/common** | Core Nest building blocks: decorators (`@Injectable`, `@Controller`, `@Get`, etc.), pipes, guards, filters, and base classes. Used in every Nest app. |
| **@nestjs/core** | Nest runtime: application bootstrap, dependency injection, module system. Required by all Nest applications. |
| **@nestjs/platform-express** | Uses Express under the hood for HTTP. Lets Nest handle HTTP requests/responses via the Express adapter. |

### Configuration & environment

| Package | Purpose |
|--------|---------|
| **@nestjs/config** | Loads `.env` and exposes values via `ConfigService` (e.g. `DATABASE_URL`, `JWT_SECRET`, `PORT`). Used with `ConfigModule.forRoot()`. |
| **dotenv** | Loads environment variables from a `.env` file. Used by `@nestjs/config` and by Prisma config (`prisma.config.ts`). |

### Authentication & security

| Package | Purpose |
|--------|---------|
| **@nestjs/jwt** | JWT module for Nest: sign and verify tokens. Used in `AuthService` to issue JWTs after login/sign-up. |
| **@nestjs/passport** | Integrates Passport.js with Nest’s dependency injection so you can use strategies (e.g. JWT) as guards. |
| **passport** | Authentication middleware: supports many strategies (local, JWT, OAuth, etc.). This project uses the JWT strategy. |
| **passport-jwt** | Passport strategy that validates a JWT from the `Authorization: Bearer <token>` header and attaches the payload to `req.user`. |
| **bcrypt** | Hashes passwords with bcrypt. Used in `AuthService` and `UsersService` to hash passwords before storing and to compare on login. |

### Database (Prisma)

| Package | Purpose |
|--------|---------|
| **@prisma/client** | Generated, type-safe Prisma Client for your schema. Used in `PrismaService` to run queries (e.g. `user.findMany()`). |
| **@prisma/adapter-pg** | Prisma 7 driver adapter for PostgreSQL. Connects Prisma to the DB via the `pg` driver; required when using the default “client” engine in Prisma 7. |

### Validation & transformation

| Package | Purpose |
|--------|---------|
| **class-validator** | Decorators to validate DTOs (e.g. `@IsEmail()`, `@IsString()`, `@MinLength()`). Works with Nest’s `ValidationPipe`. |
| **class-transformer** | Transforms plain objects into class instances and can exclude properties (e.g. strip `password` from responses). Used with validation and serialization. |

### API documentation

| Package | Purpose |
|--------|---------|
| **@nestjs/swagger** | OpenAPI (Swagger) for Nest: decorators like `@ApiTags()`, `@ApiBearerAuth()`, `@ApiOperation()`. Serves the interactive docs at `/api`. |

### Other runtime

| Package | Purpose |
|--------|---------|
| **reflect-metadata** | Required for decorators and dependency injection. Used by TypeScript/Nest to read metadata at runtime. |
| **rxjs** | Reactive extensions; Nest uses Observables for streams (e.g. interceptors, some built-in features). |

---

## DevDependencies (build, test, lint, DB tooling)

### NestJS tooling

| Package | Purpose |
|--------|---------|
| **@nestjs/cli** | Nest CLI: `nest build`, `nest start`, `nest generate`, etc. Used for development and production build. |
| **@nestjs/schematics** | Code generators used by `nest generate` (e.g. module, controller, service). |
| **@nestjs/testing** | Testing utilities: `Test.createTestingModule()`, mocks for Nest modules. Used in unit and e2e tests. |

### TypeScript & build

| Package | Purpose |
|--------|---------|
| **typescript** | TypeScript compiler and type checking. |
| **ts-loader** | Webpack loader for TypeScript; used by the Nest CLI build. |
| **ts-node** | Runs TypeScript files directly (e.g. Jest, some scripts). |
| **tsconfig-paths** | Resolves path aliases from `tsconfig.json` (e.g. `@/...`) at runtime. Used in debug and test scripts. |

### Linting & formatting

| Package | Purpose |
|--------|---------|
| **eslint** | JavaScript/TypeScript linter. Finds style and potential bugs. |
| **@eslint/eslintrc** | ESLint config file format support. |
| **@eslint/js** | ESLint JavaScript parser and rules. |
| **typescript-eslint** | ESLint rules and parser for TypeScript. |
| **eslint-config-prettier** | Turns off ESLint rules that conflict with Prettier. |
| **eslint-plugin-prettier** | Runs Prettier as an ESLint rule so `eslint --fix` also formats. |
| **prettier** | Code formatter. Used by the `format` script and often on save in the editor. |
| **globals** | Global variables for different environments; used by ESLint for Node/browser. |

### Testing

| Package | Purpose |
|--------|---------|
| **jest** | Test runner. Used by `pnpm test` and `pnpm run test:e2e`. |
| **ts-jest** | Jest preprocessor for TypeScript. |
| **supertest** | HTTP assertions for testing API endpoints (e.g. request/response in e2e tests). |
| **@types/jest** | TypeScript types for Jest. |
| **@types/supertest** | TypeScript types for Supertest. |

### Type definitions (dev)

| Package | Purpose |
|--------|---------|
| **@types/node** | TypeScript types for Node.js built-ins. |
| **@types/express** | TypeScript types for Express (used by `@nestjs/platform-express`). |
| **@types/bcrypt** | TypeScript types for the `bcrypt` package. |
| **@types/passport-jwt** | TypeScript types for `passport-jwt`. |

### Database & Prisma (dev)

| Package | Purpose |
|--------|---------|
| **prisma** | Prisma CLI: `prisma generate`, `prisma migrate dev`, `prisma studio`. Used in development and CI. |
| **pg** | PostgreSQL client for Node. Used by `@prisma/adapter-pg` at runtime; listed in devDependencies for type support and scripts (e.g. `test:db`). |

### Other dev

| Package | Purpose |
|--------|---------|
| **source-map-support** | Makes Node use source maps for stack traces so you see TypeScript file/line numbers in errors. |

---

## Scripts (quick reference)

| Script | What it does |
|--------|----------------|
| `start:dev` | Starts the app in watch mode (recompile on file change). |
| `build` | Compiles TypeScript to `dist/`. |
| `start` | Runs the compiled app once. |
| `start:prod` | Runs `node dist/main` (production). |
| `postinstall` | Runs after `pnpm install`; executes `prisma generate`. |
| `prisma:generate` | Generates Prisma Client from `schema.prisma`. |
| `prisma:migrate` | Applies migrations in dev (`prisma migrate dev`). |
| `prisma:studio` | Opens Prisma Studio for the database. |
| `lint` | Runs ESLint on `src` and `test`. |
| `format` | Runs Prettier on `src` and `test`. |
| `test` | Runs Jest unit tests. |
| `test:e2e` | Runs end-to-end tests with the e2e Jest config. |
