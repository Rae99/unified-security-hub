---
name: What is an API
description: What "API" actually means — browser APIs, library APIs, HTTP APIs, and why fetch is all three
type: reference
---

# What is an API?

"API" gets thrown around a lot and means different things in different contexts. The core definition is always the same:

> **API = someone else's code, exposed for you to use.**

It doesn't have to involve a network request. Anything that gives you functions or methods to call is an API.

## Three kinds you'll encounter constantly

**Browser APIs** — built into the browser, no install needed:
- `fetch()` — make network requests
- `setTimeout()` — delay execution
- `document.getElementById()` — access the DOM
- `localStorage.getItem()` — read persisted data

**Library/Framework APIs** — installed as packages:
- `useState()`, `useEffect()` — React's API
- `navigate()` — React Router's API
- `createSlice()` — Redux Toolkit's API

**HTTP APIs** — a server that exposes endpoints you call over the network:
- `POST /scan-jobs` — this project's Lambda API
- Any REST or GraphQL backend

## `fetch` is a function AND an API — both are correct

They're not contradictory. `fetch` is a function you call, and it's also part of the browser's network API. Calling `fetch()` is how you use the browser's networking capability.

Same logic: `document.getElementById` is a function, and it's part of the DOM API.

## How to read "API" in context

| Someone says | They mean |
|---|---|
| "calling the browser API" | using a built-in browser feature |
| "calling the backend API" | sending an HTTP request to a server |
| "React's API" | the hooks and functions React exposes |
| "this function's API" | its parameters and return value |

## Where it shows up in this codebase

| Code | Which kind of API |
|------|-------------------|
| `fetch(uploadUrl, { method: 'PUT', ... })` | Browser API (network) |
| `useState()`, `useEffect()` | React library API |
| `POST /scan-jobs` in `client.js` | HTTP API (Lambda backend) |
| `localStorage.getItem()` | Browser API (storage) |
