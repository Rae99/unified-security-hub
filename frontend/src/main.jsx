import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// [LEARN] 'root' refers to <div id="root"></div> in index.html — the single
// empty div that React mounts the entire app into. Without it React has
// nowhere to inject the component tree into the actual page.
//
// [LEARN] StrictMode is a dev-only wrapper — no effect in production, no
// extra DOM. In dev it intentionally runs things like useEffect twice to
// surface bugs (missing cleanup, impure renders). Remove it and the app
// still works; you just lose the extra warnings.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)