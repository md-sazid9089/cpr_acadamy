# CPR Medical Academy

An online learning platform for postgraduate medical exam preparation (FCPS, MRCP, residency, etc.). Students browse batches, enrol and pay manually (bKash, Nagad or Rocket), watch recorded lessons, read lecture notes and sit timed SBA/MTF exams with leaderboards. Administrators run courses, exams, approvals, payments, notices, the gallery and reports from one dashboard.

```
.
├── backend/    Next.js 16 API (route handlers only), PostgreSQL / PGlite, background worker
├── frontend/   React 18 + Vite SPA, Tailwind, TanStack Query, Zustand
├── .github/    CI: backend tests + npm audit
└── DEPLOY-VERCEL.md   Production deployment guide
```

---

## Live demo

| | Link |
|---|---|
| **Website (frontend)** | <https://cpr-academy-frontend.vercel.app> |
| **API (backend)** | <https://cpr-academy-backend.vercel.app/api> · health check: [/api/ready](https://cpr-academy-backend.vercel.app/api/ready) |

Sign in with the **mobile number** and password:

| Role | Mobile | Password | Where to sign in |
|---|---|---|---|
| Student | `01722222222` | `StudentPassword123!` | [/login](https://cpr-academy-frontend.vercel.app/login) |
| Admin | `01711111111` | `AdminPassword123!` | The staff access page (its link and access key are shared privately) |

The demo student is enrolled in **FCPS Part-1 Medicine Foundation Batch** and can open its lessons and take the *Cardiology & Pulmonology Mock Exam 01*. Administrators cannot sign in from `/login`: the staff access page asks for an access key first.

Both sites deploy automatically from `main` on Vercel; see [DEPLOY-VERCEL.md](DEPLOY-VERCEL.md).

---

## Features

**Students**
- Sign up by mobile number with an SMS OTP, then wait for an administrator to approve the account
- Browse batches and courses by category, see schedules, offers and instructor reviews
- Check out with a manual mobile-money payment (transaction ID + screenshot), get invoices
- Course hub: at-a-glance view, class schedule, recorded lessons (YouTube or hosted video), PDF notes
- Exams: practice, mock and live papers; SBA, MTF and mixed; negative marking; autosave; results, explanations and leaderboards
- Subscriptions (active, unpaid, previous), complaints, account settings, password reset by email

**Administrators**
- Overview dashboard and reports
- Student approvals and per-student detail
- Course builder: details, chapters, lessons, schedule, exams (question builder), subscriptions, leaderboard, publish checks
- Transactions panel (on the admin dashboard): confirm or reject manual payments
- Notices, complaints and gallery management
- Staff-only sign-in page protected by an access key (`ADMIN_GATE_KEY`)

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, React Router 7, Tailwind CSS 3, TanStack Query 5, Zustand, React Hook Form + Zod, Axios |
| Backend | Next.js 16 (API route handlers), Node.js 22, Zod (validation + OpenAPI) |
| Database | PostgreSQL in production; embedded [PGlite](https://pglite.dev) for local development (no install needed) |
| Files | Cloudinary (falls back to local disk at `backend/public/uploads` in development) |
| Messaging | SMS via HTTPS webhook gateway, email via Resend (both can print to the console in development) |
| Hosting | Vercel (two projects) or Docker |

---

## Prerequisites

- **Node.js 22.13 or newer** (the backend requires it; the frontend needs 20.19+)
- npm
- Git

No database server is needed for local development: the backend uses PGlite, an embedded PostgreSQL that stores its data in `backend/.local/database`.

---

## Setup guide (local development)

### 1. Clone and install

```bash
git clone <repository-url> CPR_Academy_Web_App
cd CPR_Academy_Web_App

cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure the backend

```bash
cd backend
cp .env.example .env
```

The defaults work for local development. For a convenient dev setup, change these lines in `backend/.env`:

```env
DATABASE_MODE=pglite
PGLITE_PATH=.local/database
SMS_MODE=console        # OTP codes are printed in the backend terminal
EMAIL_MODE=console      # password-reset codes are printed in the backend terminal
WORKER_MODE=embedded
```

Leave `ADMIN_GATE_KEY` empty in development so admins can sign in from the normal `/login` page. If you set it (16+ characters), admins must sign in through the staff access page instead (see [Admin sign-in](#admin-sign-in)).

Leave `TOKEN_SECRET` empty and a random one is generated at each start (which signs everyone out on restart). Set a 32+ character value if you want sessions to survive restarts.

### 3. Configure the frontend (optional)

```bash
cd frontend
cp .env.example .env.local
```

Nothing is required. In development Vite proxies `/api` to `http://127.0.0.1:3001`, so leave `VITE_API_BASE_URL` unset.

### 4. Load demo data

Run the seed scripts **while the backend is stopped** (PGlite allows only one process to open the database at a time):

```bash
cd backend
node --env-file-if-exists=.env scripts/seed-demo.js          # admin, student, one course, lessons, a mock exam, a notice
node --env-file-if-exists=.env scripts/seed-demo-course.js   # optional: full demo course + 10 students with graded attempts
```

Both scripts create the database and apply migrations if needed. They refuse to run against production or any PostgreSQL database unless `ALLOW_DEMO_SEED=true` is set for a non-production database.

### 5. Start both apps

In two terminals:

```bash
# Terminal 1: API on http://127.0.0.1:3001 (migrations run automatically in development)
cd backend
npm run dev

# Terminal 2: website on http://localhost:5173
cd frontend
npm run dev
```

Open <http://localhost:5173>. If port 5173 is busy, Vite picks the next free one; read the port from its output.

Check the API: <http://127.0.0.1:3001/api/health> and <http://127.0.0.1:3001/api/ready>. The OpenAPI document is at `/api/openapi.json`.

---

## Demo credentials

> For the live site, see [Live demo](#live-demo). Locally, these accounts exist **only after running the seed scripts**. The scripts refuse to run with `NODE_ENV=production`, and against any PostgreSQL database unless `ALLOW_DEMO_SEED=true` is set.

Sign in with the **mobile number** and password.

| Role | Mobile | Password | Created by |
|---|---|---|---|
| Admin | `01711111111` | `AdminPassword123!` | `scripts/seed-demo.js` |
| Student | `01722222222` | `StudentPassword123!` | `scripts/seed-demo.js` |
| Demo students (10) | `01911100001` … `01911100010` | `DemoStudent123!` | `scripts/seed-demo-course.js` |

The seeded student is already approved and enrolled in **FCPS Part-1 Medicine Foundation Batch**, with two lessons and the *Cardiology & Pulmonology Mock Exam 01* ready to take.

The ten demo students (Tanvir Ahmed, Nusrat Jahan, Rafiul Islam, …) have graded exam attempts so the leaderboards have data.

To see who is in your local database:

```bash
cd backend
node --env-file-if-exists=.env scripts/list-users.js
```

### Admin sign-in

- **`ADMIN_GATE_KEY` empty (default in development):** admins sign in at `/login` like everyone else and land on `/admin`.
- **`ADMIN_GATE_KEY` set (required in production):** the normal login refuses admin accounts. Open the staff access page at `/<VITE_ADMIN_GATE_PATH>` (default `/staff-access`), enter the access key, then the admin mobile and password. The key unlocks that device for 12 hours.

### Creating a real administrator

There is no default admin outside the demo seed. Create one with the backend stopped:

```bash
cd backend
ADMIN_MOBILE=017XXXXXXXX ADMIN_NAME="Academy Admin" ADMIN_PASSWORD="<at least 12 characters>" npm run admin:create
```

On Windows PowerShell:

```powershell
$env:ADMIN_MOBILE="017XXXXXXXX"; $env:ADMIN_NAME="Academy Admin"; $env:ADMIN_PASSWORD="<at least 12 characters>"; npm run admin:create
```

### Trying the student sign-up flow

1. Register at `/register` with any Bangladeshi mobile number.
2. With `SMS_MODE=console`, copy the OTP from the backend terminal into `/verify-otp`.
3. The account waits at `/pending-approval` until an admin approves it under **Admin → Students**.
4. Enrol in a course, submit a payment, then confirm it as the admin in the transactions panel on the **Admin → Dashboard** page.

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Dev default | Notes |
|---|---|---|
| `DATABASE_MODE` | `pglite` | `postgres` in production (required) |
| `PGLITE_PATH` | `.local/database` | Where the embedded database lives |
| `DATABASE_URL` | – | PostgreSQL URL with TLS; required when `DATABASE_MODE=postgres` |
| `DATABASE_POOL_MAX` | `10` (`3` on Vercel) | Connection pool size per instance |
| `TOKEN_SECRET` | random per start | Production: 32+ characters, keep stable |
| `ADMIN_GATE_KEY` | – | Production: 16+ characters. Required for admin sign-in when set |
| `CORS_ORIGINS` | `http://localhost:5173,…` | Comma-separated frontend origins |
| `TRUST_PROXY` / `TRUST_PROXY_HOPS` | `false` / `1` | Production must set `TRUST_PROXY` explicitly |
| `SMS_MODE` | `disabled` | `console` (dev), `webhook` (needs `SMS_WEBHOOK_URL` over HTTPS + `SMS_WEBHOOK_TOKEN`) |
| `EMAIL_MODE` | `disabled` | `console` (dev), `resend` (needs `RESEND_API_KEY` + `EMAIL_FROM`) |
| `SKIP_PHONE_VERIFICATION` | `false` | `true` skips OTP; production also needs `ACKNOWLEDGE_UNVERIFIED_MOBILES=true` |
| `CLOUDINARY_URL` | – | `cloudinary://<key>:<secret>@<cloud>`; without it uploads go to local disk |
| `WORKER_MODE` | `embedded` | `embedded`, `external` (`npm run worker`) or `serverless` (Vercel, automatic) |
| `CRON_SECRET` | – | Vercel: 16+ characters, protects `/api/cron/maintenance` |
| `PORT` | `3001` | |

### Frontend (`frontend/.env.local`)

All `VITE_` variables are public once built. Never put a secret in them.

| Variable | Default | Notes |
|---|---|---|
| `VITE_API_BASE_URL` | `/api` (same origin) | Leave unset unless the API is on another origin |
| `VITE_WHATSAPP_NUMBER` | – | Floating chat bubble; digits only, country code first |
| `VITE_ADMIN_GATE_PATH` | `staff-access` | Path of the staff sign-in page |
| `VITE_DEV_API_ORIGIN` | `http://127.0.0.1:3001` | Dev proxy target |

---

## Scripts

### Backend (`cd backend`)

| Command | What it does |
|---|---|
| `npm run dev` | API on `127.0.0.1:3001` with auto-applied migrations |
| `npm run build` / `npm start` | Production build (standalone) and start |
| `npm test` | Node test runner over `test/*.test.js` |
| `npm run db:migrate` | Apply pending migrations (required before starting in production) |
| `npm run worker` | Run the background worker as a separate process (`WORKER_MODE=external`) |
| `npm run admin:create` | Create an administrator from `ADMIN_MOBILE`, `ADMIN_NAME`, `ADMIN_PASSWORD` |
| `node --env-file-if-exists=.env scripts/seed-demo.js` | Demo admin, student, course and exam (dev only) |
| `node --env-file-if-exists=.env scripts/seed-demo-course.js` | Full demo course with 10 graded students (dev only) |
| `node --env-file-if-exists=.env scripts/list-users.js` | List users (dev only) |
| `scripts/smoke.ps1`, `scripts/smoke-student.ps1` | End-to-end smoke tests against a running API |

### Frontend (`cd frontend`)

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on port 5173 with `/api` proxy |
| `npm run build` | Optimises background images, then builds to `dist/` |
| `npm run preview` | Serve the built app |
| `npm test` | Node test runner over `test/*.test.js` |

---

## Project structure

```
backend/
├── app/api/[[...path]]/route.js   Single catch-all route that dispatches to the API
├── app/api/cron/maintenance/      Daily maintenance job (Vercel Cron)
├── migrations/                    Ordered SQL/JS migrations (001 … 019)
├── scripts/                       migrate, seed, admin, worker, build helpers
├── src/
│   ├── app.js, web-app.js, http.js   Routing, validation, rate limits, errors
│   ├── config.js                     Environment parsing and production checks
│   ├── db.js                         PostgreSQL / PGlite access and migrations
│   ├── security.js                   Password hashing, signed tokens
│   ├── worker.js                     SMS/email delivery, exam finalisation, clean-up
│   └── modules/                      auth, billing, courses, exams, gallery, media,
│                                     reports, students, result release/revisions
└── test/                          Backend test suites

frontend/src/
├── app/            App, providers, router (lazy-loaded dashboard/admin routes)
├── components/     Layout (navbar, sidebar, footer) and UI primitives
├── constants/      Roles, storage keys, payment methods, admin gate path
├── features/       admin, auth, course-hub, courses, exams, learning,
│                   marketing, payments, student-dashboard
└── lib/            Auth/theme stores, API client, utilities
```

Frontend conventions (colour tokens, icons, dark mode, performance rules) are documented in [frontend/README.md](frontend/README.md).

### Main routes

| Area | Paths |
|---|---|
| Public | `/`, `/about`, `/contact`, `/faq`, `/gallery`, `/batches`, `/courses`, `/schedule` |
| Auth | `/login`, `/register`, `/verify-otp`, `/pending-approval`, `/forgot-password`, `/reset-password`, `/staff-access` |
| Student | `/dashboard`, `/dashboard/courses`, `/dashboard/course/:slug`, `/dashboard/exams`, `/dashboard/subscriptions`, `/dashboard/payments`, `/dashboard/complaints`, `/dashboard/account` |
| Admin | `/admin` (overview + transactions), `/admin/students`, `/admin/courses`, `/admin/notices`, `/admin/complaints`, `/admin/gallery`, `/admin/reports` |

---

## Testing

```bash
cd backend && npm test
cd frontend && npm test
```

GitHub Actions ([.github/workflows/backend.yml](.github/workflows/backend.yml)) runs the backend tests and `npm audit` on every push and pull request that touches `backend/`.

---

## Deployment

- **Vercel (recommended):** two projects from this repository, `frontend` and `backend`, with Neon PostgreSQL and Cloudinary. Follow [DEPLOY-VERCEL.md](DEPLOY-VERCEL.md) step by step.
- **Docker:** `backend/Dockerfile` builds a standalone API image on port 3001 with a `/api/ready` health check. Run `npm run db:migrate` before starting, and set `WORKER_MODE=embedded` or run a second container with `node scripts/worker.js`.

Production refuses to start unless it has PostgreSQL, a 32+ character `TOKEN_SECRET`, a 16+ character `ADMIN_GATE_KEY`, `CORS_ORIGINS`, an explicit `TRUST_PROXY` and a `WORKER_MODE`.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Seed script or `admin:create` hangs or fails with a lock error | Stop `npm run dev` first; PGlite allows one process at a time |
| Everyone is signed out after restarting the API | Set a fixed `TOKEN_SECRET` in `backend/.env` |
| Admin login says "Administrators sign in from the staff access page" | `ADMIN_GATE_KEY` is set; use `/staff-access` (or your `VITE_ADMIN_GATE_PATH`) |
| No OTP arrives during sign-up | Set `SMS_MODE=console` and read the code from the backend terminal, or `SKIP_PHONE_VERIFICATION=true` in development |
| Frontend shows network errors | Make sure the backend is running on port 3001 and `VITE_API_BASE_URL` is unset |
| Want a clean database | Stop the backend and delete `backend/.local/database`, then seed again |

---

## License

MIT. See [frontend/LICENSE](frontend/LICENSE).
