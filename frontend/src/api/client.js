import { mockJobs, mockReport } from '../mock/data'

// [LEARN] import.meta.env is Vite's way to read .env variables in the browser.
// Only vars prefixed with VITE_ are exposed — others are stripped at build time.
// USE_MOCK=true lets you develop the UI without real AWS credentials.
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const API_URL  = import.meta.env.VITE_API_URL
const API_KEY  = import.meta.env.VITE_API_KEY

// [LEARN] API Gateway requires x-api-key on every request.
// If it's missing, AWS rejects the request with 403 before Lambda even runs.
const headers = () => ({
  'Content-Type': 'application/json',
  'x-api-key': API_KEY,
})

// ── List all jobs ────────────────────────────────────────────────────────────
export const listJobs = async () => {
  if (USE_MOCK) return { jobs: mockJobs }
  const res = await fetch(API_URL, { headers: headers() })
  return res.json()
}

// ── Get single job ───────────────────────────────────────────────────────────
export const getJob = async (findingId) => {
  if (USE_MOCK) return mockJobs.find(j => j.findingId === findingId) || mockJobs[0]
  const res = await fetch(`${API_URL}/${findingId}`, { headers: headers() })
  return res.json()
}

// ── Create SAST job → returns { findingId, uploadUrl } ──────────────────────
export const createSASTJob = async (userId = 'default-user') => {
  if (USE_MOCK) return { findingId: 'mock-new-123', uploadUrl: null, status: 'PENDING' }
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ scanType: 'SAST', userId }),
  })
  return res.json()
}

// ── Create Pentest job ───────────────────────────────────────────────────────
export const createPentestJob = async (targetUrl, userId = 'default-user') => {
  if (USE_MOCK) return { findingId: 'mock-new-456', status: 'PENDING' }
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ scanType: 'PENTEST', targetUrl, userId }),
  })
  return res.json()
}

// ── Upload zip to S3 pre-signed URL ─────────────────────────────────────────
// [LEARN] The browser uploads the zip DIRECTLY to S3, bypassing Lambda entirely.
// Why? Lambda has a 6MB payload limit — too small for source code.
// Instead, Lambda generated a temporary signed URL (valid 15 min) that allows
// a single PUT. The browser uses it here. Lambda never touches the file.
// → learning/concepts/presigned-url.md
export const uploadZip = async (uploadUrl, file) => {
  if (USE_MOCK) return
  await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/zip' },
    body: file,
  })
}

// ── Start scan ───────────────────────────────────────────────────────────────
// [LEARN] fetch sends any HTTP method you specify.
// POST is used here because /start is an ACTION (trigger a scan), not a data read.
// Convention: GET = read data, POST = trigger action / create something.
//
// fetch version (used here):
//   const res = await fetch(`${API_URL}/${findingId}/start`, {
//     method: 'POST',
//     headers: headers(),
//   })
//   return res.json()   ← must manually parse JSON
//
// axios equivalent:
//   const res = await axios.post(`${API_URL}/${findingId}/start`, null, {
//     headers: headers(),
//   })
//   return res.data     ← axios auto-parses JSON
export const startScan = async (findingId) => {
  if (USE_MOCK) return { findingId, status: 'RUNNING' }
  const res = await fetch(`${API_URL}/${findingId}/start`, {
    method: 'POST',
    headers: headers(),
  })
  return res.json()
}

// ── Get report from S3 ───────────────────────────────────────────────────────
export const getReport = async (findingId) => {
  if (USE_MOCK) return mockReport
  const res = await fetch(`${API_URL}/${findingId}/report`, { headers: headers() })
  if (!res.ok) return null
  return res.json()
}
