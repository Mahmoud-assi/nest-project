# Run everything locally (localhost)

Use a **local PostgreSQL** database so the app and migrations run on your machine with no cloud (no Supabase/Neon, no ENOTFOUND or firewall issues).

---

## 1. Start PostgreSQL locally

**Option A – Docker (easiest)**

```bash
docker run -d --name nest-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=nest_db -p 5432:5432 postgres:16
```

**Option B – PostgreSQL installed on Windows**

- Install from https://www.postgresql.org/download/windows/
- Start the service (e.g. via `services.msc` or `Start-Service postgresql-x64-16`)
- Create the database: `psql -U postgres -c "CREATE DATABASE nest_db;"`

---

## 2. Use only local URLs in `.env`

Point both the app and Prisma at **localhost**:

```env
# Local PostgreSQL – same URL for app and migrations
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nest_db"

# Not needed for local DB; only used when DIRECT_URL is set (Neon/Supabase)
# DIRECT_URL="..."

JWT_SECRET="your-secret-key"
```

- **Do not set** `DIRECT_URL` (or comment it out). Then `prisma.config.ts` uses `DATABASE_URL` for migrations.
- If your local PostgreSQL user/password or DB name are different, change the URL accordingly (e.g. `postgresql://USER:PASSWORD@localhost:5432/DATABASE_NAME`).

---

## 3. Run migrations and the app

```bash
pnpm prisma:migrate
pnpm run start:dev
```

- App: **http://localhost:3000**
- Swagger: **http://localhost:3000/api**
- Database: **localhost:5432** (only from your machine)

---

## Summary

| Goal              | What to do                                                                 |
|-------------------|----------------------------------------------------------------------------|
| Local only        | PostgreSQL on localhost (Docker or installed), only `DATABASE_URL` in `.env`, no `DIRECT_URL`. |
| Cloud (Neon/Supabase) | Set `DIRECT_URL` (direct) and `DATABASE_URL` (pooler) and fix network/DNS if you get ENOTFOUND. |

Running `prisma migrate` and `nest start` on your PC is always "local" – the difference is whether the database URL points to **localhost** or to a **cloud host**.
