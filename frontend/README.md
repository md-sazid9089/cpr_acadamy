# CPR Medical Academy — Frontend

React 18 + Vite + JavaScript (JSX, no TypeScript). Tailwind for styling, Zustand
for session and theme, TanStack Query for server state, Axios for transport.

## Local development

```bash
cd frontend
npm install
cp .env.example .env.local   # optional; sensible defaults apply without it
npm run dev                  # http://localhost:5173
```

Vite falls through to the next free port (5174, 5175, …) if 5173 is taken, so
read the port off the banner rather than assuming it.

`npm run lint` is declared in `package.json` but ESLint is **not** installed and
there is no config, so the script fails. Nothing in CI or the Vercel build runs
it; install `eslint` first if you want it.

### Demo accounts

Three accounts work against the mock API. **Login accepts any non-empty
password** — the 8-character / one-letter / one-number rule applies to the
registration form, not to signing in. Mobile numbers must match
`01[3-9]` plus eight digits, or the form rejects them before the API is reached.

| Mobile        | Role    | Status            |
| ------------- | ------- | ----------------- |
| `01711111111` | Student | Active            |
| `01799999999` | Admin   | Active            |
| `01722222222` | Student | Awaiting approval |

## Routes

Public pages render inside `PublicLayout` (announcement strip, navbar, footer,
chat bubble). Everything under `/dashboard` and `/admin` sits behind
`ProtectedRoute`, which also enforces the admin-approval gate.

| Area      | Paths                                                                                                                                                                        |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Marketing | `/`, `/about`, `/contact`, `/faq`, `/gallery`, `/class`                                                                                                                        |
| Catalogue | `/batches`, `/courses`, `/courses/:category`, `/courses/:category/:slug`, `/courses/:category/:slug/schedule`, `/schedule`                                                      |
| Auth      | `/login`, `/register`, `/verify-otp`, `/pending-approval`, `/forgot-password`, `/reset-password`                                                                                |
| Student   | `/dashboard`, `/dashboard/courses`, `/dashboard/course/:slug`, `/dashboard/progress`, `/dashboard/exams(/:examId[/result])`, `/dashboard/payments`, `/dashboard/invoices/:id`   |
|           | `/dashboard/account`, `/dashboard/complaints(/:id)`, `/dashboard/subscriptions(/:batchId[/add])`, `/dashboard/checkout/:slug`, `/dashboard/learn/:slug`                         |
| Player    | `/learn/:courseSlug/:lessonId` — full-bleed, outside `PublicLayout`, own auth guard                                                                                            |
| Admin     | `/admin`, `/admin/students`, `/admin/courses`, `/admin/videos`, `/admin/exams`, `/admin/schedules`, `/admin/reports`                                                            |

## Conventions

### Colour

Every colour comes from the theme tokens in `tailwind.config.js`. **Do not write
a raw hex or a stock Tailwind hue into a component** — that drift has been
cleaned up once already and is easy to reintroduce, because `blue-600` and the
brand navy look similar in isolation but wrong side by side.

| Token         | Role                                                     |
| ------------- | -------------------------------------------------------- |
| `brand-*`     | Navy, anchored at `brand-600` **#1B3F8B**. The default.   |
| `accent-*`    | Red, anchored at `accent-600` **#E31E24**. Used sparingly. |
| `surface-*`   | Page and card grounds, light and dark.                   |
| `slate-*`     | Neutrals — text, borders, muted surfaces.                 |

The only sanctioned exceptions:

- **Status semantics** — `emerald` (success/paid), `amber` (warning/pending),
  `red` (danger/form error), `sky` (info). Reach for `<Badge tone="…">` or
  `<StatusBadge status="…">` before hand-rolling these.
- **Third-party brand colours** — Facebook, YouTube, Telegram and WhatsApp in
  the footer and chat bubble.

Prefer the primitives in `src/components/ui/` (`Button`, `Card`, `Badge`,
`Input`, `Modal`, `Table`, `Spinner`, `EmptyState`) over bespoke markup. If you
find yourself passing `className="bg-…"` to `<Button>`, you probably want a
different `variant` instead — the variants carry their dark-mode pairs, an
override usually loses them.

### Icons

Icons are React components from `react-icons` (the `fa6` set), never emoji
characters in JSX. Emoji render differently on every platform and carry no
accessible name. Mark them `aria-hidden="true"` when a visible label sits
alongside, which is nearly always.

### Dark mode

`darkMode: 'class'`. The theme store (`src/lib/theme.js`) persists to
`localStorage` under `cpr-theme` and **defaults to `light`, not `system`** — so
`prefers-color-scheme` alone will not put the app in dark mode. An inline script
in `index.html` reads that key before first paint to avoid a flash. Every
surface needs its `dark:` pair; there is no automatic inversion.

## Performance

The homepage was 4.4 MB with a 2.7 s first paint; it is now ~1.5 MB and ~0.9 s.
Four things keep it there, and each regresses quietly if ignored:

- **Never read `window.scrollY` (or `offsetTop`, `getBoundingClientRect`) from a
  scroll handler.** Each read forces a synchronous layout, and during load the
  document is dirty on nearly every one — this single pattern cost ~1 s of
  blocked main thread. `src/hooks/useScrolled.js` watches a hidden sentinel with
  an `IntersectionObserver` instead; copy that approach.
- **Give every above-the-fold image `width` and `height`.** Without them the
  layout has no height until the image decodes, and the resulting reflow can
  cascade — the hero portrait was forcing the carousel beside it to re-measure.
- **Loading placeholders use `min-h-screen`, not `min-h-[60vh]`.** A short
  placeholder leaves the footer inside the viewport, so arriving content shoves
  it down and that counts as layout shift (it was worth 0.27 CLS on the course
  detail page).
- **Build `Intl` formatters once.** `toLocaleString` / `toLocaleDateString`
  construct a fresh formatter per call; the cached ones live in `src/lib/utils.js`.

Assets: keep new artwork **under ~1200 px on the long edge**. Nothing on the
site paints wider than about 600 CSS px, so that still covers 2× displays.

Routing: the dashboard, admin, auth, course-hub and player routes are code-split
with `React.lazy` in `src/app/router.jsx`. The entry chunk is ~565 KB (174 KB
gzipped). Marketing pages stay eager on purpose — they are the landing surface,
and splitting them would only add a round trip before first paint.

## Deploying to Vercel

1. Import the repository in Vercel.
2. **Set Root Directory to `frontend`.** The repo keeps the app in a
   subdirectory, so a default import finds no `package.json` and the build
   fails immediately.
3. Leave the build settings alone — `vercel.json` declares the framework, the
   build command and the output directory.
4. Add the environment variables below if the defaults are not wanted.
5. Deploy.

### Environment variables

Only `VITE_`-prefixed variables reach the browser, and all of them are **public**
once built. Never put a secret in one.

| Variable               | Default | Purpose                                     |
| ---------------------- | ------- | ------------------------------------------- |
| `VITE_API_BASE_URL`    | `/api`  | Backend origin used by `src/lib/api-client` |
| `VITE_WHATSAPP_NUMBER` | —       | Floating chat bubble, digits only           |

### What `vercel.json` does

- **SPA rewrite** — every path that is not a real file serves `index.html`.
  Without it, refreshing on `/batches` or opening a `/learn/...` link directly
  returns 404, because the routes exist only in the client-side router.
- **Immutable caching** for `/assets/:file` — Vite content-hashes those, so they
  can be cached for a year.
- **Short caching** for `/assets/carousel/*` and `/assets/spotlight/*` — these
  come from `public/` and keep stable filenames, so they must stay replaceable.
- **Baseline security headers** — nosniff, referrer policy, framing, and a
  permissions policy denying camera/mic/geolocation.

## Before going live

The app currently runs entirely on mock data. Every data module carries a
`TODO:` naming the endpoint that replaces it; `src/lib/api-client.js` already
holds the auth-token and single-device-login interceptors and becomes live the
moment those bodies are swapped.

Known items worth resolving first:

- `public/assets/spotlight/cpr logo.png` (5.7 MB) and `profile.jpeg` (1.8 MB)
  are referenced nowhere — the navbar uses the 62 KB `cpr-logo.png`. Nothing
  fetches them, so they cost deploy size only, but they can be deleted.
- **Gallery captions are unreachable on touch devices.** They live in
  `opacity-0 group-hover:opacity-100` overlays in `src/features/marketing/Gallery.jsx`,
  and there is no hover on a phone.
- **Muted text falls below WCAG AA.** `slate-400` / `slate-500` at 11–14 px —
  card meta ("Starts 05 Jan 2026"), struck-through prices, the footer copyright,
  the contact-page field labels. Ratios land between 2.6 and 4.4 against a
  required 4.5.
- **Login errors are not announced.** The message renders visually but sits in no
  `role="alert"` / `aria-live` region, so screen readers stay silent on a failed
  sign-in.
