# Layer 3: SAST Scanner

**Files:** `sast/backend/index.js`, `sast/backend/scanner.js`
**Stack:** Node.js, AWS SDK v3, runs as a one-shot ECS Fargate container

> SAST = Static Application Security Testing — scans source code without running it.

---

## One-shot container pattern

Unlike a web server that listens forever, this container starts, does one job, and exits.
Step Functions monitors the exit code to determine success or failure:

```
process.exit(0)  → success → Step Functions marks job COMPLETED
process.exit(1)  → failure → Step Functions marks job FAILED
```

This is why there's no Express server here — no persistent listener needed.

### Why one container per scan task

- **Isolation** — user A's source code never touches user B's scan process
- **Simplicity** — no concurrency management needed; the code just runs start to finish
- **Scalability** — 10 jobs at once = Step Functions spins up 10 containers in parallel

### Startup time and cold start

ECS Fargate container cold start: **~10-30 seconds** (pull image, allocate resources, start process).

This is acceptable because the scan itself takes much longer (tens of seconds to minutes).

**Cold start vs container startup** — these are different things:

| | Lambda cold start | Container startup |
|---|---|---|
| What it is | Lambda execution env recycled after inactivity | New container spun up |
| Time | ~100ms–1s | ~10–30s |
| When | Occasional (warm if traffic is steady) | Every scan job |

Lambda handles API requests (steady traffic = stays warm). Containers only start when a scan is triggered — the slower startup is acceptable there.

---

## How it connects to Lambda

These two files never call each other directly. They communicate through shared AWS state:

```
Lambda index.mjs
  → triggers Step Functions (StartExecutionCommand)
      → Step Functions starts ECS container with env vars injected:
            FINDING_ID, S3_BUCKET, DYNAMODB_TABLE
          → container runs sast/backend/index.js
              → reads job from DynamoDB
              → scans code
              → writes report to S3
              → writes s3ReportKey + severity back to DynamoDB

Lambda index.mjs (GET /report)
  → reads s3ReportKey from DynamoDB
  → fetches report from S3
```

The connection is the **same DynamoDB record** — Lambda creates it, SAST fills it in, Lambda reads it back.

---

## main() flow (index.js)

```
1. getJob()         — query DynamoDB for timestamp (SK) and s3UploadKey
2. downloadFromS3() — stream zip file to local disk
3. execAsync unzip  — extract to temp directory
4. scanDirectory()  — run scanner.js over all JS/TS files
5. uploadReport()   — write report JSON to S3
6. updateJobResult()— write s3ReportKey + severity back to DynamoDB
7. process.exit(0)  — signal success to Step Functions
```

### Temp workspace (line 90-93)

```js
const tmpDir  = path.join(os.tmpdir(), `sast-${FINDING_ID}`)
// os.tmpdir() → /tmp on Linux containers
// result: /tmp/sast-abc-123-uuid  (unique per job — avoids conflicts if tasks run in parallel)

const zipPath = path.join(tmpDir, "source.zip")  // downloaded zip lands here
const srcDir  = path.join(tmpDir, "source")      // zip extracted here

mkdirSync(srcDir, { recursive: true })
// creates the full directory tree, like mkdir -p
// recursive: true means parent dirs are created too, no error if they already exist
```

`finally` block at the end calls `rmSync(tmpDir, ...)` — cleans up the entire temp directory before the container exits, regardless of success or failure.

---

## DynamoDB fields written by this container

`s3ReportKey` and `severity` are NOT set when the job is created — they don't exist yet.
This container adds them after the scan completes:

```js
UpdateExpression: "SET s3ReportKey = :r, severity = :sev"
```

No `ExpressionAttributeNames` needed here — `s3ReportKey` and `severity` are not reserved words.
`status` and `source` ARE reserved words → need `#s` alias (as seen in Lambda layer).

---

## scanner.js (teacher-provided)

### How it works

Each rule in `vulnerabilityRules` has one or more regex patterns. `scanCode()` runs every pattern against the source code string, records every match with its line number and surrounding context.

```js
while ((match = regex.exec(code)) !== null) {
  // record: rule id, severity, line number, matched text
}
```

Results are sorted HIGH → MEDIUM → LOW before returning.

### topSeverity() — picking the worst level

```js
const topSeverity = (vulns) => {
  for (const sev of ["HIGH", "MEDIUM", "LOW"]) {
    if (vulns.some(v => v.severity === sev)) return sev
  }
  return "INFO"
}
```

Priority order is hardcoded in the array. `return` exits the entire function — not just the loop iteration — so the first match wins immediately.

`vulns.some(v => v.severity === sev)` — `some()` stops at the first match, more efficient than `filter().length > 0`.

### Vulnerability types detected

| ID | Severity | What it catches |
|---|---|---|
| HARDCODED_SECRET | HIGH | API keys, passwords, AWS keys hardcoded in source |
| SQL_INJECTION | HIGH | String concatenation or template literals in SQL queries |
| NOSQL_INJECTION | HIGH | Direct user input passed to MongoDB find/update/delete |
| XSS | HIGH | `innerHTML =`, `document.write()`, `dangerouslySetInnerHTML` |
| PATH_TRAVERSAL | HIGH | User input passed to `fs.readFile`, `path.join` |
| INSECURE_FUNCTION | HIGH | `eval()`, `exec()`, `new Function()` |
| INSECURE_RANDOM | MEDIUM | `Math.random()` for security-sensitive values |
| SENSITIVE_DATA_LOG | MEDIUM | `console.log(password)` etc. |
| WEAK_CRYPTO | MEDIUM | MD5, SHA1, deprecated `createCipher` |
| HARDCODED_IP | MEDIUM | IPv4 addresses embedded in strings |
| SECURITY_TODO | LOW | `// TODO: fix auth` style comments |

## Status
not started
