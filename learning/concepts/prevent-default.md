---
name: preventDefault
description: When and why to call e.preventDefault() — browser defaults, form submit, drag-and-drop
type: reference
---

# `preventDefault()`

Stops the browser's built-in behavior for an event. Every event has a default action that fires automatically unless you cancel it.

## Common cases

| Event | Default browser behavior | Why you stop it |
|-------|--------------------------|-----------------|
| `onDragOver` | Opens the dragged file in the browser | So `onDrop` can fire and you handle the file yourself |
| `<form>` submit | Sends an HTTP request and reloads the page | So you can call `fetch` yourself without losing React state |
| `<a>` click | Follows the href | So you can run your own navigation logic |

## Form submit — the most common case

Always call it as the **first line** of a submit handler, before anything else runs:

```js
const handleSubmit = (e) => {
  e.preventDefault()   // stop page reload — do this first
  fetch(...)           // then handle it yourself
}
```

Without it: the page reloads → all React state resets to initial values → your `fetch` is cancelled mid-flight.

## What about localStorage?

If you stored all the form data in localStorage, a reload would restore it — so you could technically skip `preventDefault`. But in practice:

- An in-flight `fetch` (a Promise) can't be stored in localStorage — it dies on reload regardless
- Recovering mid-flow state (which step were we on? did the upload finish?) requires complex logic
- `preventDefault` is one line and avoids the problem entirely

localStorage is the right tool for **long-lived state** (login session, shopping cart) — data the user built up over time and expects to survive a refresh. Temporary operation state (file being uploaded, form step progress) isn't worth persisting.

## Where it shows up in this codebase

| File | Event | What's being prevented |
|------|-------|------------------------|
| `frontend/src/pages/NewScan.jsx` | `onDragOver` | Browser opening the dragged file |
