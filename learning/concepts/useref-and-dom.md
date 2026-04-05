---
name: useRef and DOM access
description: What useRef does, how ref={...} attaches to a DOM node, and common use cases beyond the hidden input trick
type: reference
---

# `useRef` and Direct DOM Access

## What `useRef` does

`useRef()` returns a plain object `{ current: null }`. When you attach it to a JSX element with `ref={...}`, React sets `current` to the actual DOM node after the component mounts. This gives you a direct handle to the element — the same thing you'd get from `document.getElementById(...)` in plain JS.

```js
const inputRef = useRef()         // { current: null } initially

<input ref={inputRef} ... />      // after mount: { current: <input> }

inputRef.current.click()          // now you can call any DOM method on it
```

"Attaching a ref" is the term — you attach a ref to an element via `ref={...}`.

---

## The hidden input trick (this codebase)

The native `<input type="file">` is ugly and impossible to style. The pattern:

1. Render the real input but hide it: `className="hidden"`
2. Attach a ref so you can reach it: `ref={inputRef}`
3. Render a nice-looking `<div>` with `onClick={() => inputRef.current?.click()}`
4. When the div is clicked, it programmatically clicks the hidden input → file picker opens

```jsx
const inputRef = useRef()

<div onClick={() => inputRef.current?.click()}>
  Click me (styled however you want)
</div>

<input ref={inputRef} type="file" className="hidden" onChange={...} />
```

The `?.` in `inputRef.current?.click()` is optional chaining — safe no-op if `current` is still null (component not yet mounted).

---

## Other common uses of `useRef`

Hiding unstyled elements is just one use case. `useRef` is useful any time you need to do something React's state/props system can't do:

| Use case | Example |
|----------|---------|
| Hide unstyled native elements | `<input type="file">`, `<input type="color">` |
| Focus an input programmatically | `inputRef.current.focus()` after a modal opens |
| Read scroll position | `divRef.current.scrollTop` |
| Store a value without re-rendering | A timer ID, a previous value — `useRef` doesn't trigger re-render when `.current` changes, unlike `useState` |
| Integrate with third-party libraries | Libraries like charts or maps need a raw DOM node to attach to |

---

## `useRef` vs `useState`

| | `useState` | `useRef` |
|---|---|---|
| Triggers re-render when changed | yes | no |
| Accessible in JSX | yes | no (`.current` is not reactive) |
| Use for | UI state | DOM handles, non-visual values |

---

## Where it shows up in this codebase

| File | What's attached | Why |
|------|----------------|-----|
| `frontend/src/pages/NewScan.jsx` | Hidden `<input type="file">` | Trigger file picker from a styled div |
