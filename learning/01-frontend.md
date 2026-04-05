# Layer 1: Frontend

**Files:** `frontend/src/`
**Stack:** React 18, React Router v6, Vite, Tailwind CSS

The frontend is a static React SPA deployed to S3. It has no backend of its own — all data comes from the Lambda API on AWS.

---

## Boot sequence

```
index.html
  └── main.jsx          mounts <App> into <div id="root">
        └── App.jsx     defines all routes
              └── Layout.jsx  the persistent shell (sidebar + header)
                    └── <Outlet />  ← swapped per URL
                          ├── Dashboard.jsx
                          ├── NewScan.jsx
                          └── ReportDetail.jsx
```

## File-by-file

### `main.jsx`
Mounts the app into `<div id="root">` in `index.html` — the single empty div that React takes over. Without it React has nowhere to inject the component tree into the page.

`<React.StrictMode>` is a dev-only wrapper with no effect in production. It intentionally runs things like `useEffect` twice in dev to surface bugs (missing cleanup, impure renders). The app works fine without it — you just lose the extra warnings.

### `App.jsx`
Uses React Router v6 **nested routes**. `Layout` is the parent route — it renders the sidebar and header, then an `<Outlet>` placeholder. React Router fills that slot with the matching child page. The shell never unmounts; only the slot changes.

The `<Route index ...>` redirects `/` → `/dashboard` automatically.

→ learning/concepts/nested-routing.md *(to be written)*

### `components/Layout.jsx`
- `<Outlet />` is the slot where pages render.
- `NavLink` (not `Link`) is used for nav items because it provides an `isActive` callback for active styling.
- `PageTitle()` uses `useLocation()` to read the current URL and compute the header text dynamically.

### `api/client.js`
The entire AWS bridge. Three key patterns:

**Mock toggle** — `VITE_USE_MOCK=true` in `.env` makes every function return fake data. Lets you build UI without AWS. `import.meta.env` is Vite's way to expose env vars to the browser (only `VITE_` prefixed ones are exposed).

**API key header** — Every real request sends `'x-api-key': API_KEY`. API Gateway checks this before the Lambda runs. Missing key = 403.

**Pre-signed URL upload** — The browser uploads `.zip` files directly to S3 using a temporary URL that Lambda generated. Lambda never touches the file. This sidesteps Lambda's 6MB payload limit.
→ learning/concepts/presigned-url.md *(to be written)*

### `pages/NewScan.jsx`
Two sub-forms (SAST and Pentest) switched by a `tab` state.

**SAST 3-step flow:**
1. `createSASTJob()` — Lambda creates the DB record and returns a pre-signed S3 URL
2. `uploadZip(uploadUrl, file)` — browser PUTs zip directly to S3
3. `startScan(id)` — Lambda triggers Step Functions

**`step` as a state machine:** `idle → uploading → scanning → done | error`. Drives both the button label and the `StepIndicator` UI.

### `useEffect` cleanup — how it actually works

`useEffect` lets you return a cleanup function. React calls it in two situations:
1. **Before re-running the effect** — if a dependency changed, React cleans up the old effect first, then runs the new one.
2. **When the component unmounts** — e.g. the user navigates away.

```js
useEffect(() => {
  const timer = setInterval(fetchJobs, POLL_INTERVAL)
  return () => clearInterval(timer)   // cleanup
}, [])
```

`[]` means the effect runs once on mount, so the cleanup only fires on unmount. But cleanup isn't special to empty arrays — it's just as useful when dependencies change:

```js
useEffect(() => {
  const timer = setInterval(fetchJobs, 1000)
  return () => clearInterval(timer)
}, [userId])   // userId changes → cleanup old timer → start new one
```

The pattern is always the same: **the cleanup undoes whatever the effect set up.** Without it, timers, subscriptions, and event listeners stack up every time the effect re-runs.

**Hidden file input trick:** Native `<input type="file">` is unstyled. Pattern: hide it (`className="hidden"`), render a styled div, call `inputRef.current.click()` when div is clicked. `useRef` gives a direct DOM handle.

**Drag-and-drop:** `onDrop` receives the file. `e.preventDefault()` on `onDragOver` is required — without it the browser opens the file itself and the drop event is swallowed.

### `pages/Dashboard.jsx`
Polls the API every 10 seconds using `setInterval` inside `useEffect`.

```js
useEffect(() => {
  fetchJobs()
  const timer = setInterval(fetchJobs, POLL_INTERVAL)
  return () => clearInterval(timer)   // cleanup on unmount
}, [])
```

The cleanup function (`return () => clearInterval`) is critical — without it, the interval survives navigation, causing memory leaks and background API calls.

Only `COMPLETED` rows are clickable (navigate to report). `PENDING` / `RUNNING` rows are inert.

### `pages/ReportDetail.jsx`
Fetches job metadata and the full report JSON in **parallel**:
```js
const [j, r] = await Promise.all([getJob(id), getReport(id)])
```
`Promise.all` fires both requests at the same time. Sequential `await`s would be ~2× slower.

**Two different report shapes:**
- SAST: `results` is `{ filename: [finding, ...], ... }` — flattened with `Object.values(...).flat()`
- Pentest: `results` is a flat array of `{ id, name, status, findings }` test objects

The component renders different JSX for each type based on `report.scanType`.

`FindingsGroup` defaults to `open = (severity === 'HIGH')` — HIGH findings start expanded, others collapsed.

### `components/StatusBadge.jsx` + `SeverityBadge.jsx`
Data-driven styling: a plain object maps a status/severity string to a Tailwind class string. Cleaner than `if/else` chains, easy to extend.

---

## Key concepts introduced in this layer

| Concept | Where | Notes |
|---------|-------|-------|
| Nested routes / `<Outlet>` | `App.jsx`, `Layout.jsx` | Shell stays mounted, slot swaps |
| Pre-signed S3 URL | `api/client.js:49` | Browser uploads direct to S3 |
| Mock toggle via env var | `api/client.js:3` | `VITE_USE_MOCK=true` |
| `useRef` for DOM access | `NewScan.jsx:38` | Hidden file input trick |
| Step state machine | `NewScan.jsx` | `idle→uploading→scanning→done` |
| `setInterval` + cleanup | `Dashboard.jsx:35` | Always clear on unmount |
| `Promise.all` | `ReportDetail.jsx:20` | Parallel fetches |
| Data-driven Tailwind | `StatusBadge.jsx` | Object lookup instead of switch |

## Status
✅ Complete
