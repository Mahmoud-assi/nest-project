# How to create a new PostgreSQL database (step by step)

Pick one method below. After that, put the connection URL in your `.env` as `DATABASE_URL`.

---

## Method 1: PostgreSQL installed on Windows (pgAdmin)

**Step 1.** Install PostgreSQL for Windows  
- Go to: https://www.postgresql.org/download/windows/  
- Run the installer (e.g. from EDB).  
- Set a password for the `postgres` user and remember it.  
- Keep default port **5432**.  
- Finish the install (you can skip Stack Builder).

**Step 2.** Start PostgreSQL  
- Press `Win + R`, type `services.msc`, Enter.  
- Find **postgresql-x64-15** (or 16 / your version).  
- Right‑click → **Start** (or set Startup type to Automatic).

**Step 3.** Open pgAdmin  
- Start menu → **pgAdmin 4**.  
- First time: set a master password for pgAdmin (optional; you can skip).

**Step 4.** Connect to the server  
- In the left panel: **Servers** → **PostgreSQL 15** (or your version).  
- Double‑click; enter the **postgres** user password you set in Step 1.  
- Check “Save password” if you want, then OK.

**Step 5.** Create the database  
- Right‑click **Databases** → **Create** → **Database**.  
- **Database:** `nest_db` (or any name you want).  
- **Owner:** leave as `postgres`.  
- Click **Save**.

**Step 6.** Use it in your project  
- In your project `.env`:
  ```env
  DATABASE_URL="postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/nest_db"
  ```
- Replace `YOUR_POSTGRES_PASSWORD` with the password from Step 1.

**Step 7.** Run migrations  
```bash
pnpm prisma:migrate
```

---

## Method 2: PostgreSQL on Windows (command line – psql)

**Step 1.** Install and start PostgreSQL (same as Method 1, Steps 1–2).

**Step 2.** Open a terminal (PowerShell or CMD).  
- Go to the PostgreSQL `bin` folder (adjust version if needed):
  ```powershell
  cd "C:\Program Files\PostgreSQL\16\bin"
  ```

**Step 3.** Connect as the `postgres` user:
  ```powershell
  .\psql.exe -U postgres -h localhost
  ```
  - Enter the postgres password when asked.

**Step 4.** Create the database (in the `psql` prompt):
  ```sql
  CREATE DATABASE nest_db;
  ```

**Step 5.** (Optional) Create a dedicated user and password:
  ```sql
  CREATE USER myuser WITH PASSWORD 'mypassword';
  GRANT ALL PRIVILEGES ON DATABASE nest_db TO myuser;
  \q
  ```
  Then in `.env` you could use:
  ```env
  DATABASE_URL="postgresql://myuser:mypassword@localhost:5432/nest_db"
  ```
  Or keep using `postgres`:
  ```env
  DATABASE_URL="postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/nest_db"
  ```

**Step 6.** Run migrations:
  ```bash
  pnpm prisma:migrate
  ```

---

## Method 3: Docker (no PostgreSQL install on the machine)

**Step 1.** Install Docker Desktop for Windows: https://www.docker.com/products/docker-desktop/

**Step 2.** Start Docker Desktop and wait until it’s running.

**Step 3.** In a terminal (PowerShell or CMD), run:
  ```powershell
  docker run -d --name nest-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=nest_db -p 5432:5432 postgres:16
  ```
  - This creates a container named `nest-postgres`, a DB named `nest_db`, and user `postgres` with password `postgres`.

**Step 4.** In your project `.env`:
  ```env
  DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nest_db"
  ```

**Step 5.** Run migrations:
  ```bash
  pnpm prisma:migrate
  ```

**Useful Docker commands:**
- Stop: `docker stop nest-postgres`
- Start again: `docker start nest-postgres`
- Remove container: `docker rm -f nest-postgres` (you’d need to run the `docker run` again to recreate it)

---

## Method 4: Free cloud PostgreSQL (no install, good for learning)

**Step 1.** Sign up for a free account, e.g.:  
- **Neon:** https://neon.tech  
- **Supabase:** https://supabase.com  
- **Railway:** https://railway.app  

**Step 2.** Create a new project and add a PostgreSQL database.

**Step 3.** Copy the **connection string** (often called “Connection string”, “URI”, or “DATABASE_URL”).  
- It looks like:  
  `postgresql://user:password@host.region.aws.neon.tech/neondb?sslmode=require`

**Step 4.** Put it in your project `.env`:
  ```env
  DATABASE_URL="postgresql://user:password@host.../dbname?sslmode=require"
  JWT_SECRET="your-secret"
  ```

**Step 5.** Run migrations:
  ```bash
  pnpm prisma:migrate
  ```

---

## Quick checklist

| Step | What you did |
|------|-----------------------------|
| 1 | PostgreSQL running (local install, Docker, or cloud). |
| 2 | A **database** created (e.g. `nest_db`). |
| 3 | `DATABASE_URL` in `.env` with correct user, password, host, port, and database name. |
| 4 | `pnpm prisma:migrate` run so tables exist. |

After that, `pnpm run start:dev` will connect to your new DB.
