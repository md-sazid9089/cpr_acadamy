# Deploying to Vercel

The app deploys as **two Vercel projects from this one repository**:

| Project | Root directory | Serves |
|---|---|---|
| Frontend | `frontend` | The website, e.g. `cprmedicalacademy.com` |
| Backend | `backend` | The API, on `api.cprmedicalacademy.com` |

The frontend forwards every `/api/*` request to the backend (see `frontend/vercel.json`), so the browser only ever talks to one domain. That matters: the API hands out relative links such as `/api/content/<token>` for lesson videos and notes.

## Before you start

You need three outside services:

1. **PostgreSQL**, e.g. [Neon](https://neon.tech). Vercel has no disk, so the built-in local database (PGlite) cannot be used. Use Neon's **pooled** connection string (the host contains `-pooler`): every serverless instance opens its own connections.
2. **Cloudinary**, for every upload: course posters, gallery photos, payment screenshots and lecture PDFs. Files are sent from the browser straight to Cloudinary, because Vercel refuses any request or response larger than 4.5 MB. On a free Cloudinary plan, turn on **Settings → Security → "Allow delivery of PDF and ZIP files"**, or lecture PDFs will not open.
3. **SMS and email providers** (webhook SMS gateway, Resend), as for any production deployment.

## 1. Backend project

Create a Vercel project with **Root Directory = `backend`**. `backend/vercel.json` sets the framework and the build command and schedules the daily maintenance call.

Set these **Environment Variables** (Production, and Preview if you use it):

| Variable | Value |
|---|---|
| `DATABASE_URL` | Neon pooled connection string, with `sslmode=require` |
| `TOKEN_SECRET` | At least 32 random characters. Keep it stable: changing it signs everyone out |
| `CORS_ORIGINS` | **Every** address the site is opened on, comma-separated, e.g. `https://cprmedicalacademy.com,https://www.cprmedicalacademy.com`. The API refuses sign-ins and every form from any other address. A frontend preview URL (`*.vercel.app`) cannot sign in unless it is listed too |
| `DATABASE_MODE` | `postgres` |
| `TRUST_PROXY` | `true` |
| `CRON_SECRET` | At least 16 random characters. Vercel sends it to the maintenance call automatically |
| `ADMIN_GATE_KEY` | At least 16 random characters. Admins type it on the staff access page before their password works. Share it only with admins. Changing it (then redeploying) signs every admin out and voids every staff pass at once, so anyone who knew the old key is locked out |
| `CLOUDINARY_URL` | `cloudinary://<api_key>:<api_secret>@<cloud_name>` |
| `SMS_MODE`, `SMS_WEBHOOK_URL`, `SMS_WEBHOOK_TOKEN` | Your SMS gateway (see `backend/.env.example`) |
| `EMAIL_MODE`, `RESEND_API_KEY`, `EMAIL_FROM` | Your email settings |
| `SKIP_PHONE_VERIFICATION` | `false` (or `true` together with `ACKNOWLEDGE_UNVERIFIED_MOBILES=true`) |

You do **not** need `WORKER_MODE` or `PORT`: on Vercel the API runs the serverless worker automatically. `DATABASE_POOL_MAX` is optional (default 3 per instance). Every variable above must also be available to the **build**: production deployments run the database migrations while building, with the same production checks as the live API, and the build stops with a clear error if one is missing.

What happens on each deploy:

- **Production** deployments apply any pending database migrations before building. **Preview** deployments skip them, so a branch never changes the production schema. If previews should use their own database, give the Preview environment a different `DATABASE_URL` (a Neon branch).
- Background work (sending SMS and email, closing abandoned exams, expiring enrolments, clean-up) runs straight after API requests, and once a day from Vercel Cron in case the site is quiet.

Then add the domain **`api.cprmedicalacademy.com`** to this project.

Create the first administrator from your own computer, pointing at the production database:

```bash
cd backend
DATABASE_URL="<pooled url>" NODE_ENV=production TOKEN_SECRET=... ADMIN_GATE_KEY=... CORS_ORIGINS=... TRUST_PROXY=true WORKER_MODE=external \
  ADMIN_MOBILE=017XXXXXXXX ADMIN_NAME="Admin Name" ADMIN_PASSWORD="<12+ characters>" npm run admin:create
```

## 2. Frontend project

Create a second Vercel project with **Root Directory = `frontend`**. `frontend/vercel.json` already sets the build, the `/api` forwarding and the security headers.

| Variable | Value |
|---|---|
| `VITE_WHATSAPP_NUMBER` | Digits only, country code first |
| `VITE_API_BASE_URL` | **Leave unset** |
| `VITE_ADMIN_GATE_PATH` | Hard-to-guess path for the staff sign-in page, e.g. `cpr-staff-7x9k2q` (admins open `https://<site>/cpr-staff-7x9k2q`) |

Add your site domain (e.g. `cprmedicalacademy.com`) to this project.

> If the backend lives somewhere other than `api.cprmedicalacademy.com`, change the `/api/:path*` destination in `frontend/vercel.json` and the `connect-src` entry in its Content-Security-Policy to match.

## 3. Check it

1. `https://api.cprmedicalacademy.com/api/ready` should return `{"status":"ready","worker":"ok"}`.
2. Open the site, sign in as the administrator, and upload a course poster and a lecture PDF.
3. In Vercel → Backend project → **Settings → Cron Jobs**, the maintenance job should be listed. Use "Run" once to check it returns 200.
4. **Check the API sees real visitor addresses.** Open `https://<site>/api/health` on Wi-Fi and again on mobile data. `clientIp` should show two different addresses, each the network you were on. If both show the **same** address, the `/api` forwarding hides visitors, so every user shares one rate-limit allowance: a handful of wrong staff-key or password guesses could then block every admin and sign-in for 15 minutes. In that case set `TRUST_PROXY=false` on the backend and redeploy (the limits are then widened for the shared address instead).

## Limits to know

- **Lesson videos**: use YouTube (unlisted) links. A video file hosted elsewhere is relayed through the API, and Vercel cuts off responses over 4.5 MB.
- **Lecture notes** uploaded to Cloudinary or linked from Google Drive open by a direct link. The link is hard to guess but does not expire.
- **Hobby plan**: Vercel Cron runs at most once a day, which is why the API also does its background work after requests.
- **Docker** still works unchanged (`backend/Dockerfile`, `WORKER_MODE=embedded` or `external`).
