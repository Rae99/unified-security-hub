# Layer 2: Lambda API

**File:** `api/lambda/index.mjs`
**Stack:** Node.js (ESM), AWS SDK v3, API Gateway + Lambda

Lambda is a serverless function — AWS wakes it up per request. No `app.listen()`, no always-on server. API Gateway sits in front and translates HTTP into the `event` object Lambda receives.

> Auth concepts (API Key vs JWT, Cookie vs localStorage, XSS, CSRF) → `learning/concepts/auth-mechanisms.md`
> CORS and CSRF in depth → `learning/concepts/cors-and-csrf.md`

---

## Lambda vs Express mental model

| Express (familiar) | Lambda (this layer) |
|---|---|
| `app.listen(3000)` | AWS starts it per request |
| `(req, res) => {}` | `handler(event)` |
| `req.method` / `req.path` | `event.httpMethod` / `event.resource` |
| `req.body` | `JSON.parse(event.body)` |
| `req.params.id` | `event.pathParameters?.findingId` |
| `res.json({...})` | `return res(statusCode, {...})` |

The routing is manual `if` chains instead of `app.get/post`. Same concept, no framework doing the plumbing.

---

## Helper functions (read these first)

### `res()` — line 228
Lambda must return `{ statusCode, headers, body }` where body is a **string**, not an object. API Gateway requires this exact shape to produce an HTTP response. `res()` is a one-liner wrapper so every route doesn't repeat this boilerplate:

```js
const res = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  body: JSON.stringify(body),   // object → string
});
```

### `formatItem()` — line 210
DynamoDB stores every value with a type tag: `{ S: "hello" }`, `{ N: "42" }`, `{ BOOL: true }`. This is because DynamoDB has no fixed schema — it needs to know what type each value is.

`formatItem` strips the tags so the frontend gets plain JS objects:
```js
// raw from DynamoDB          after formatItem
item.status = { S: "PENDING" }  →  item.status = "PENDING"
```

### `CORS_HEADERS` — line 222
Added to every response so the browser allows the frontend to read the data.
→ see `learning/concepts/cors-and-csrf.md`

---

## Routes

### POST /scan-jobs (line 27)
Creates a new scan job. Full lifecycle:
1. Parse and validate body (`scanType`, `targetUrl`)
2. Write record to DynamoDB with status `PENDING`
3. If SAST: generate a pre-signed S3 upload URL (15 min expiry)
4. Return `{ findingId, status, uploadUrl }`

**DynamoDB write** uses `{ S: value }` type tags (see above). The composite key is `finding_id` (PK) + `timestamp` (SK) — both required for any later update.

### GET /scan-jobs (line 69)
Lists jobs. No simple "scan all" in DynamoDB — must query by an indexed field.
- With `?source=SAST`: uses `SourceIndex` GSI
- Without filter: queries `StatusIndex` GSI for each status separately, merges results

### GET /scan-jobs/{findingId} (line 104)
Uses `QueryCommand` (not `GetItemCommand`) because we only have the PK (`finding_id`) and not the SK (`timestamp`). Query finds it; Get requires both keys.

### POST /scan-jobs/{findingId}/start (line 121)
Triggers the actual scan:
1. Look up the job, verify it's `PENDING`
2. Update status → `RUNNING` in DynamoDB
3. Call Step Functions `StartExecutionCommand` with the job details
4. Step Functions handles the rest (Layer 5)

### GET /scan-jobs/{findingId}/report (line 175)
Reads `s3ReportKey` from DynamoDB, then fetches the report JSON directly from S3 and streams it back. The report is too large to store in DynamoDB.

---

## Pre-signed S3 URLs

Lambda generates a temporary URL that allows the browser to PUT a file directly to S3:

```
Browser → Lambda: create SAST job
Lambda  → Browser: here's a signed URL (valid 15 min)
Browser → S3: PUT zip file using that URL  (Lambda not involved)
```

Why skip Lambda? Lambda has a 6MB payload limit — too small for source code zips. The signed URL is a one-time authorization token baked into the URL itself.
→ `learning/concepts/presigned-url.md`

---

## API Key

API Gateway requires `x-api-key` on every request. Missing = 403 before Lambda even runs. The frontend sends it via the `headers()` function in `api/client.js:12`.

The `x-` prefix means "custom/non-standard header" — a naming convention from older HTTP specs. `x-api-key` has no formal RFC; it's AWS's chosen name.

### How API Key verification works

Verification happens at **API Gateway**, before Lambda runs:

```
Frontend sends request with x-api-key: abc123xyz

API Gateway receives it
  → checks its own list of valid keys: is abc123xyz in the list?
  → yes → forward request to Lambda
  → no  → return 403, Lambda never runs
```

API Key verification is a simple lookup — is this key in the allowed list?

| | API Key | JWT |
|---|---|---|
| Verification | Lookup in key list | Cryptographic signature check |
| Needs database? | Yes (key list) | No (signature is self-contained) |
| Knows which user? | No | Yes (userId in payload) |

API Key = security badge checked against a list. JWT = ID with a photo — verifiable without a list.

→ see `learning/concepts/cors-and-csrf.md` for CSRF relationship

---

## Key concepts introduced in this layer

| Concept | Where | Notes |
|---------|-------|-------|
| Serverless handler shape | `index.mjs:15` | Must return `{ statusCode, headers, body }` |
| DynamoDB type tags | `index.mjs:44` | `{ S: "val" }` — no schema means explicit types |
| Composite key (PK + SK) | `index.mjs:104` | Get requires both; Query can use just PK |
| GSI (Global Secondary Index) | `index.mjs:75` | Query by non-key fields like `source`, `status` |
| Pre-signed S3 URL | `index.mjs:59` | Browser uploads direct; Lambda generates token |
| Step Functions trigger | `index.mjs:158` | Lambda starts the pipeline, SFN runs it |
| CORS preflight (OPTIONS) | `index.mjs:17` | Return 200 immediately, no logic needed |

## Status
not started
