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

Two demo accounts work against the mock API (any password of 8+ characters
containing a letter and a number):

| Mobile        | Role    |
| ------------- | ------- |
| `01711111111` | Student |
| `01799999999` | Admin   |

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

- `public/assets/spotlight/cpr logo.png` is **5.8 MB** and loads on every page
  in the navbar and footer, where it renders at 72×72. Exporting it at 144×144
  takes the homepage from roughly 10 MB to under 1 MB.
- `profileb.png` (2.7 MB) and the six carousel posters (1.5 MB) are likewise far
  larger than their display size.
- `public/assets/spotlight/profile.jpeg` (1.9 MB) is referenced nowhere and can
  be deleted.
- The JS bundle is a single 586 KB chunk; route-level `React.lazy` on
  `/dashboard`, `/admin` and the auth pages defers about 32% of it.
