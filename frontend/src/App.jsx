import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import NewScan from './pages/NewScan'
import ReportDetail from './pages/ReportDetail'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/*
          [LEARN] Nested routes: Layout is the parent route — it renders the
          sidebar/header shell permanently. Its <Outlet> is a slot that React
          Router fills with whichever child route matches the URL.
          → learning/concepts/nested-routing.md
        */}
        <Route path="/" element={<Layout />}>
          {/* [LEARN] index route: visiting "/" auto-redirects to "/dashboard" */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="scan/new" element={<NewScan />} />
          {/* [LEARN] :id is a URL param — read in ReportDetail via useParams() */}
          <Route path="scan/:id" element={<ReportDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}