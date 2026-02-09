# How the database is set up (real-project style)

## 1. Create the empty database (once per environment)

PostgreSQL must be running. Then create an **empty** database. Prisma does **not** create the database itself—only the tables inside it.

**Local (one-time):**

```bash
# Using psql (replace 16 with your PostgreSQL version)
psql -U postgres -h localhost -c "CREATE DATABASE nest_db;"

# Or with Docker:
# docker run -d --name nest-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=nest_db -p 5432:5432 postgres:16
```

**Staging/Production:** The DB is usually created by your host (e.g. Neon, Supabase, RDS). You get a `DATABASE_URL` from their dashboard.

---

## 2. Define the schema (in the repo)

All **tables and columns** are defined in code:

- **`prisma/schema.prisma`** – models (User, PasswordResetToken, etc.).
- Changes are applied via **migrations**.

So “how we define the DB” = edit `prisma/schema.prisma`, then run migrations.

---

## 3. Point the app at the database

Set **`DATABASE_URL`** for each environment:

- **Local:** in `.env` (copy from `.env.example`).
- **CI/Staging/Prod:** environment variables in your host (e.g. Railway, Render, Vercel, or server env).

Format:

```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE_NAME
```

---

## 4. Apply the schema (create/update tables)

| Command                | When to use |
|------------------------|-------------|
| `pnpm prisma:migrate`  | **Local dev** – creates migration files and applies them. |
| `prisma migrate deploy` | **CI/Staging/Prod** – only applies existing migrations (no new migration creation). |

So in a real Nest project:

1. **Create** the empty PostgreSQL database (manually or via cloud).
2. **Define** the schema in `prisma/schema.prisma`.
3. Set **`DATABASE_URL`** in that environment.
4. Run **migrations** so the DB has the right tables.
