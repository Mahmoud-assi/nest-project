# Backend Commands Guide — Senior Developer Cheat Sheet

A concise reference for **NestJS** and **Prisma** commands with Arabic explanations.

---

## 1. NestJS CLI Commands

| Command | Purpose | شرح بسيط بالعربي |
|--------|---------|-------------------|
| `npm run start:dev` or `nest start --watch` | Start the app in **watch mode**: code changes trigger an automatic restart. | تشغيل السيرفر في وضع المراقبة: أي تعديل على الكود يعيد تشغيل التطبيق تلقائياً. |
| `nest generate module <name>` or `nest g mo <name>` | Create a new **module** (e.g. `nest g mo users`). | إنشاء وحدة جديدة (مثل users) تحتوي على مجلد وملف module. |
| `nest generate controller <name>` or `nest g co <name>` | Create a **controller** (handles HTTP). Use `--no-spec` to skip test file. | إنشاء كونترولر لاستقبال الطلبات وإرجاع الردود. |
| `nest generate service <name>` or `nest g s <name>` | Create a **service** (business logic). Use `--no-spec` to skip test file. | إنشاء سيرفس يحتوي على المنطق البرمجي (قاعدة البيانات، الحسابات، إلخ). |
| `npm run build` or `nest build` | **Build for production**: compile TypeScript to `dist/`. | تجهيز المشروع للإنتاج: تحويل الكود إلى مجلد dist جاهز للتشغيل. |

### Quick generate examples

```bash
# Module only
nest g mo clinic

# Module + Controller + Service in one go (inside 'clinic')
nest g resource clinic --no-spec

# Controller and Service separately (e.g. inside existing 'auth' module)
nest g co auth --no-spec
nest g s auth --no-spec
```

| Concept | شرح بسيط بالعربي |
|--------|-------------------|
| **Watch mode** | وضع التطوير: السيرفر يعيد التشغيل عند حفظ الملفات. |
| **Generate** | أوامر لإنشاء ملفات وجداول جاهزة بدلاً من كتابتها يدوياً. |
| **Build** | تحويل المشروع إلى ملفات جاهزة للتشغيل على السيرفر (production). |

---

## 2. Prisma Core Commands

| Command | Purpose | شرح بسيط بالعربي |
|--------|---------|-------------------|
| `npx prisma migrate dev --name <migration_name>` | **Sync schema with DB**: reads `schema.prisma`, creates a new migration file, and applies it. Keeps a **history** of changes. | يطبق تغييرات الـ schema على قاعدة البيانات ويحفظ سجل التعديلات في مجلد migrations. |
| `npx prisma db seed` | **Seed the database**: runs the seed script (e.g. `prisma/seed.ts`) to insert **initial data** (admin user, clinics, etc.). | تنفيذ سكربت الـ seed لملء قاعدة البيانات ببيانات أولية للتجربة. |
| `npx prisma studio` | **Visual GUI**: opens a web interface to browse and edit tables and data. | واجهة ويب لفتح قاعدة البيانات وتصفح وتعديل الجداول والبيانات. |
| `npx prisma generate` | **Regenerate Prisma Client**: updates TypeScript types and client code after you change `schema.prisma`. Required so your code stays in sync with the DB shape. | بعد تعديل الـ schema، هذا الأمر يحدّث أنواع TypeScript والعميل حتى يطابق الكود شكل قاعدة البيانات. |

### Short reference

```bash
# Develop: create migration and apply (use a descriptive name)
npx prisma migrate dev --name add_user_avatar

# Fill DB with initial data
npx prisma db seed

# Open Prisma Studio (browser)
npx prisma studio

# After editing schema.prisma — refresh types and client
npx prisma generate
```

| Concept | شرح بسيط بالعربي |
|--------|-------------------|
| **migrate dev** | يربط الـ schema بقاعدة البيانات ويحفظ كل تغيير في ملف migration. |
| **db seed** | يشغّل السكربت الذي يضع البيانات الابتدائية (مستخدمين، عيادات، إلخ). |
| **studio** | برنامج مرئي لفتح قاعدة البيانات من المتصفح. |
| **generate** | يحدّث مكتبة Prisma وأنواع TypeScript بعد تغيير الـ schema. |

---

## 3. Database Sync Workflow (After Modifying `schema.prisma`)

When you change **table names**, **columns**, or **relations** in `prisma/schema.prisma`, follow this order:

| Step | Command / Action | شرح بسيط بالعربي |
|------|-------------------|-------------------|
| **1. Migrate** | `npx prisma migrate dev --name <short_description>` | ينشئ ملف migration ويطبّق التعديلات على قاعدة البيانات. |
| **2. Generate** | `npx prisma generate` (often runs automatically after migrate) | يحدّث Prisma Client وأنواع TypeScript. |
| **3. Restart / Seed** | Restart the Nest app (`npm run start:dev`). If you reset the DB, run `npx prisma db seed` to repopulate. | إعادة تشغيل التطبيق. إذا أعدت ضبط قاعدة البيانات، شغّل الـ seed لملئها من جديد. |

### Step-by-step (copy-paste)

```bash
# 1) Create and apply migration (replace 'your_change' with a short name)
npx prisma migrate dev --name your_change

# 2) Regenerate client (if you didn't run migrate, or only changed schema)
npx prisma generate

# 3) Restart dev server
npm run start:dev

# Optional: if you reset the DB and need initial data again
npx prisma db seed
```

| Concept | شرح بسيط بالعربي |
|--------|-------------------|
| **Workflow** | ترتيب ثابت: 1) migrate لتطبيق التغييرات على الداتابيز، 2) generate لتحديث الكود، 3) إعادة تشغيل التطبيق (والـ seed عند الحاجة). |

---

## 4. Helpful Troubleshooting

### Reset the database completely

| Command | Purpose | شرح بسيط بالعربي |
|--------|---------|-------------------|
| `npx prisma migrate reset` | **Drops the database**, reapplies **all migrations** from scratch, and runs the **seed** script. Use when you want a clean DB and initial data again. | يحذف قاعدة البيانات، يعيد تطبيق كل الـ migrations من البداية، ثم يشغّل الـ seed. |

```bash
npx prisma migrate reset
```

**Warning:** All data will be deleted. Use only in development or when you intentionally want a fresh DB.

| Concept | شرح بسيط بالعربي |
|--------|-------------------|
| **migrate reset** | يمسح قاعدة البيانات ويعيد بناءها من ملفات الـ migrations ثم يشغّل الـ seed. |

---

### Clean `node_modules` and reinstall

| Step | Command | شرح بسيط بالعربي |
|------|---------|-------------------|
| 1 | `Remove-Item -Recurse -Force node_modules` (PowerShell) or `rm -rf node_modules` (Bash) | حذف مجلد node_modules. |
| 2 | Delete lockfile (optional): `Remove-Item pnpm-lock.yaml` or `rm pnpm-lock.yaml` | حذف ملف القفل إذا أردت تثبيت نسخ جديدة من الحزم. |
| 3 | `pnpm install` or `npm install` | إعادة تثبيت كل الحزم من الصفر. |
| 4 | `npx prisma generate` | إعادة توليد Prisma Client بعد التثبيت. | شرح بسيط بالعربي: إعادة توليد عميل Prisma بعد تثبيت الحزم. |

```powershell
# PowerShell (Windows)
Remove-Item -Recurse -Force node_modules
pnpm install
npx prisma generate
```

```bash
# Bash (Linux / macOS / Git Bash)
rm -rf node_modules
pnpm install
npx prisma generate
```

| Concept | شرح بسيط بالعربي |
|--------|-------------------|
| **Clean reinstall** | حذف node_modules ثم التثبيت من جديد لحل مشاكل الحزم أو الـ cache. |

---

## Quick reference table

| Task | Command |
|------|---------|
| Start dev (watch) | `npm run start:dev` |
| Build production | `npm run build` |
| Generate module | `nest g mo <name>` |
| Generate controller | `nest g co <name> --no-spec` |
| Generate service | `nest g s <name> --no-spec` |
| Apply schema to DB | `npx prisma migrate dev --name <name>` |
| Regenerate Prisma Client | `npx prisma generate` |
| Seed database | `npx prisma db seed` |
| Open DB GUI | `npx prisma studio` |
| Reset DB + seed | `npx prisma migrate reset` |

---

*Last updated for NestJS 11 and Prisma 7. Adjust package manager (`npm` / `pnpm` / `yarn`) to match your project.*
