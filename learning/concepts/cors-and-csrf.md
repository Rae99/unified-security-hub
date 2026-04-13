# CORS and CSRF

Two browser security mechanisms with similar-sounding names. Easy to confuse — they solve opposite problems.

---

## CORS — Cross-Origin Resource Sharing

**Problem it solves:** Prevent random websites from reading responses from other origins.

### The rule

"Origin" = scheme + hostname + port. `localhost:5173` and `localhost:3000` are different origins.

CORS behaves differently depending on request complexity:

### Simple requests (e.g. plain GET)

The browser sends the request directly. The server receives it and responds normally. The browser then checks the response for `Access-Control-Allow-Origin`:

```
Browser → server: GET /data   (request sent unconditionally)
Server  → browser: 200 OK + response body

  has Access-Control-Allow-Origin → JS can read the response
  missing header                  → browser hides the response from JS, CORS error
```

**The request already reached the server.** CORS does not prevent the request from being sent — it prevents JS from reading the response.

### Complex requests (custom headers like `x-api-key`, or `Content-Type: application/json`)

The browser sends an OPTIONS preflight first to avoid triggering side effects on a server that didn't expect the request:

```
Browser → server: OPTIONS — "I want to POST with x-api-key, is that ok?"
Server  → browser: 200 + CORS headers — "yes, allowed"
Browser → server: actual POST   (only sent after approval)
```

This is why `index.mjs:17` handles OPTIONS separately — just return 200 immediately, no business logic needed.

### How the server grants permission

```
Access-Control-Allow-Origin: *
```

`*` = any origin allowed. Could also be specific: `Access-Control-Allow-Origin: https://app.example.com`

### In this project

`CORS_HEADERS` in `index.mjs:222` are added to every Lambda response:
```js
"Access-Control-Allow-Origin":  "*",
"Access-Control-Allow-Headers": "Content-Type,x-api-key",
"Access-Control-Allow-Methods": "GET,POST,OPTIONS",
```

Without these, the frontend JS would get CORS errors on every API call.

---

## CSRF — Cross-Site Request Forgery

**Problem it solves:** Prevent malicious sites from making requests on behalf of an authenticated user.

### The attack

Cookies are sent automatically by the browser on every matching request — you don't write code to attach them. An attacker can exploit this:

```
1. You log in to bank.com → browser stores session Cookie
2. You visit evil.com
3. evil.com's JS runs: fetch("bank.com/transfer?to=hacker&amount=10000")
4. Browser automatically attaches bank.com's Cookie
5. Bank sees a valid session → executes transfer
```

The attacker never sees the Cookie. The browser did the work for them.

### Defense: SameSite cookie attribute

Modern browsers support the `SameSite` attribute on cookies:

```
Set-Cookie: session=abc123; SameSite=Strict
```

- `SameSite=Strict` — Cookie only sent if the request originates from the same site. Cross-site requests (from evil.com) get no Cookie attached.
- `SameSite=Lax` — Cookie sent on top-level navigation (clicking a link) but not on background fetch/XHR.

```
evil.com → fetch("bank.com/transfer")
Browser: SameSite=Strict, cross-site request → no Cookie attached
Bank: no session → rejects request
```

### Whether CSRF works depends on one thing

> **Is the credential sent automatically?**

```
Stored in Cookie (session or JWT)
  → browser attaches it automatically
  → CSRF works ✗

Stored in localStorage, JS manually adds to header
  → evil.com's form can't add custom headers
  → CSRF doesn't work ✓

API Key manually added to header (this project)
  → same as above, CSRF doesn't work ✓
```

JWT itself has no inherent relationship with CSRF — **what matters is where JWT is stored**.

### Cookie vs JWT/API Key

| | Cookie | JWT in localStorage / API Key |
|---|---|---|
| Who attaches it | Browser automatically | Your JS code manually |
| CSRF risk | Yes (if SameSite not set) | No — forms can't add custom headers |
| XSS risk | No (HttpOnly blocks JS access) | Yes — JS can read localStorage |
| Good for | Web apps with server-side sessions | APIs, mobile apps, server-to-server |

**This project uses API Key** (`x-api-key` header) — immune to CSRF by design, because `evil.com`'s form has no way to add a custom header.

### Summary: all the pieces together

```
CSRF attack
  └── exploits: Cookie sent automatically

Defenses:
  ├── SameSite Cookie  → browser won't attach Cookie on cross-origin requests
  ├── CSRF Token       → server requires a value evil.com can't know
  └── Manual header    → API Key / JWT in localStorage
                          forms can't set custom headers
```

### Why websites still use cookies (the consent popup)

The GDPR (EU law) requires explicit consent for **tracking cookies** — cookies that record browsing behavior for analytics or advertising. Session cookies (for login) are exempt.

The popup is a legal compliance requirement, not a security warning.

---

## One-line summary

| | What it is | Who enforces it |
|---|---|---|
| CORS | Server tells the browser which origins can read its responses | Browser (on response) |
| CSRF | Attacker tricks browser into sending authenticated requests | Browser (via SameSite) / Server (via tokens) |
