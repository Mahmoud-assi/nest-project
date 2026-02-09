# NestJS and project terms — glossary

All important keywords used in Nest and in this project, with short definitions. Use this as a quick reference when you see an unfamiliar term in the code or in [LEARNING-PATH.md](./LEARNING-PATH.md).

---

## App and startup

| Term | Definition |
|------|------------|
| **Bootstrap** | The process of starting the app. In Nest, the `bootstrap()` function in `main.ts` creates the app, applies global config (pipes, Swagger), and starts the HTTP server. |
| **Entry point** | The file that runs first. In this project it's `src/main.ts`, which calls `bootstrap()` and creates the app from the root module. |
| **Root module** | The top-level module (usually `AppModule`) that is passed to `NestFactory.create()`. It imports all feature modules and is the root of the dependency tree. |

---

## Modules and structure

| Term | Definition |
|------|------------|
| **Module** | A class with `@Module()` that groups **controllers**, **providers** (e.g. services), and **imports/exports**. It's the main way to organize the app (e.g. `UsersModule`, `AuthModule`). |
| **Import** | In a module, `imports: [SomeModule]` means "this module can use what `SomeModule` **exports**" (e.g. its services). |
| **Export** | In a module, `exports: [SomeService]` means other modules that **import** this module can inject `SomeService`. |
| **Global module** | A module with `@Global()`. Once imported in the root (or any module), its providers can be injected **anywhere** without importing that module again. Example: `PrismaModule`. |
| **Feature module** | A module that handles one part of the app (e.g. users, auth, reports). Contrast with the root `AppModule`. |

---

## Controllers and routes

| Term | Definition |
|------|------------|
| **Controller** | A class with `@Controller('path')` that handles HTTP. Its methods are **route handlers** bound to a URL and method via decorators like `@Get()`, `@Post()`, `@Patch()`, `@Delete()`. |
| **Route / Endpoint** | One URL + HTTP method (e.g. `GET /users`, `POST /auth/login`). In Nest, each route is a method on a controller. |
| **Route handler** | A controller method that runs when a request matches its path and method. It usually receives input (body, params, query) and returns the response. |
| **Decorator** | A function that starts with `@` and adds metadata or behavior to a class, method, or parameter. Examples: `@Controller()`, `@Get()`, `@Body()`, `@UseGuards()`. |

---

## Business logic and DI

| Term | Definition |
|------|------------|
| **Service** | A class (often with `@Injectable()`) that holds **business logic**: DB access, calculations, calling other services. Controllers are thin and delegate to services. |
| **Provider** | Any class that Nest can **inject** (create and supply to other classes). Services are providers; so are guards, pipes, and interceptors when they're in `providers: []`. |
| **Dependency Injection (DI)** | Nest creates instances of providers and **injects** them (e.g. via constructor parameters) where they're needed. You don't `new` services yourself; Nest does it and manages a single instance per scope. |
| **Inject** | To receive a dependency from Nest (usually via the constructor). Example: `constructor(private readonly usersService: UsersService)` injects `UsersService`. |
| **Injectable** | The `@Injectable()` decorator marks a class as a **provider** that Nest can inject. Used on services and other providers. |

---

## Request data and validation

| Term | Definition |
|------|------------|
| **DTO (Data Transfer Object)** | A class that describes the **shape** of input (often request body). Used with decorators for validation and for Swagger docs. Example: `CreateUserDto`, `LoginDto`. |
| **Pipe** | A class that runs before the route handler and can **transform** or **validate** input (params, query, body). If validation fails, the pipe can throw and Nest returns an error (e.g. 400). |
| **ValidationPipe** | Built-in Nest pipe that uses **class-validator** (and optionally **class-transformer**) to validate DTOs. Invalid data is rejected before reaching the controller. |
| **class-validator** | Library that provides decorators like `@IsEmail()`, `@MinLength()` for DTOs. Used with `ValidationPipe` for automatic validation. |
| **Body / Params / Query** | In controllers, `@Body()` = request body, `@Param()` = path params (e.g. `:id`), `@Query()` = query string. They bind request data to handler arguments. |

---

## Security and auth

| Term | Definition |
|------|------------|
| **Guard** | A class that decides if the request **may proceed** to the route handler. It runs after middleware and before the handler. If it returns `false` or throws (e.g. 401), the handler is not called. Example: `JwtAuthGuard`. |
| **JWT (JSON Web Token)** | A signed token that encodes data (e.g. user id, email). The client sends it in `Authorization: Bearer <token>`. The server verifies the signature and reads the payload instead of keeping session state. |
| **Bearer token** | The value after `Bearer ` in the `Authorization` header. In this project, the JWT is sent as a Bearer token. |
| **Passport** | Library for authentication (login strategies). Nest integrates it via `@nestjs/passport`. It handles extracting the token and calling your **strategy**. |
| **Strategy** | In Passport, a strategy (e.g. `JwtStrategy`) knows how to **validate** the credential (e.g. decode JWT, check signature, load user). What you return from `validate()` is attached to `request.user`. |
| **AuthGuard** | Nest's base class for guards that use Passport. `AuthGuard('jwt')` means "use the strategy named `'jwt'`." Your `JwtAuthGuard` extends it. |

---

## Request lifecycle (other building blocks)

| Term | Definition |
|------|------------|
| **Middleware** | A function that runs **before** the route handler (and before guards). Used for logging, parsing, or modifying the request. Not used in this project but common in Nest. |
| **Interceptor** | A class that wraps the handler (and can wrap the response). Used for transforming the result, logging, timeouts, etc. Runs after guards, around the handler. |
| **Exception filter** | Catches thrown exceptions and turns them into HTTP responses (status code and body). Nest has built-in filters; you can add custom ones for a consistent error format. |
| **Exception** | In Nest, throwing classes like `NotFoundException`, `UnauthorizedException` is the standard way to end a request with an error. The exception layer turns them into the right status code (e.g. 404, 401). |

---

## Lifecycle hooks

| Term | Definition |
|------|------------|
| **OnModuleInit** | Interface for a hook that runs when the module has been initialized (dependencies ready). Used to run setup (e.g. connect to the DB) when the app starts. |
| **OnModuleDestroy** | Interface for a hook that runs when the app is shutting down. Used to clean up (e.g. disconnect from the DB). |
| **OnApplicationBootstrap** | Hook that runs once the app is fully started and listening. Less common than `OnModuleInit`. |

---

## Configuration and env

| Term | Definition |
|------|------------|
| **ConfigModule** | Nest module that loads environment variables (e.g. from `.env`) and exposes them via `ConfigService`. `ConfigModule.forRoot({ isGlobal: true })` makes it available everywhere. |
| **ConfigService** | Service you inject to read env vars: `configService.get<string>('JWT_SECRET')`. Used in strategies and modules that need config. |
| **.env** | File (not committed) that holds secrets and config like `DATABASE_URL`, `JWT_SECRET`. Loaded by `ConfigModule` or `dotenv`. |

---

## API documentation

| Term | Definition |
|------|------------|
| **Swagger** | Tool that generates interactive API docs (UI) from your routes and DTOs. In this project it's at `/api`. You can try every endpoint from the browser. |
| **OpenAPI** | The standard (spec) that describes REST APIs (paths, methods, bodies, responses). Swagger UI is one implementation of OpenAPI. |
| **@ApiProperty** | Decorator from `@nestjs/swagger` on DTO fields. Documents the field for Swagger (type, example, description). |
| **@ApiTags** | Groups endpoints in Swagger (e.g. all "users" routes under one section). |
| **@ApiBearerAuth()** | Tells Swagger that the endpoint expects a Bearer token; the UI shows an "Authorize" flow for that route. |
| **@ApiOperation()** | Adds a short summary/description for the endpoint in Swagger. |

---

## Database (Prisma)

| Term | Definition |
|------|------------|
| **ORM (Object-Relational Mapping)** | Layer that lets you work with the DB using objects and methods instead of raw SQL. Prisma is an ORM. |
| **Prisma** | ORM for Node.js. You define the DB in `schema.prisma`; Prisma generates a type-safe client and runs **migrations**. |
| **Schema (Prisma)** | The `prisma/schema.prisma` file where you define **models** (tables), **fields** (columns), and **relations**. |
| **Model** | In Prisma, one model = one table. Example: `User`, `PasswordResetToken`. |
| **PrismaClient** | The generated client that has methods for each model (e.g. `prisma.user.findMany()`, `prisma.user.create()`). |
| **Migration** | A set of SQL changes that update the DB to match the schema. `prisma migrate dev` creates and applies migrations; `prisma migrate deploy` only applies them (e.g. in production). |
| **PrismaService** | In this project, a Nest **service** that extends `PrismaClient` and is injected everywhere. It connects on startup and disconnects on shutdown. |

---

## Testing (mentioned in the project)

| Term | Definition |
|------|------------|
| **Unit test** | Test that checks one class (e.g. a service) in isolation, often with dependencies **mocked**. In Nest, typically `*.spec.ts` files using the testing module. |
| **E2E test** | Test that hits the real HTTP API (e.g. with Supertest) and checks full request/response. Lives in `test/` and runs against the running app. |
| **Spec file** | A test file; in Nest often named like `users.service.spec.ts` next to `users.service.ts`. |
| **Mock** | A fake implementation of a dependency (e.g. fake `PrismaService`) so the test doesn't use the real DB. |
