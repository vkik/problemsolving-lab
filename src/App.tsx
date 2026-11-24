import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useProjects } from './store/projects'
import { useDocumentDirection } from './i18n'
import { Layout } from './components/Layout'
import { DialogHost, ToastHost } from './components/ui'
import { Dashboard } from './pages/Dashboard'
import { Workspace } from './pages/Workspace'
import { StepPage } from './pages/StepPage'
import { ReportPage } from './pages/ReportPage'
import { About } from './pages/About'

/**
 * HashRouter keeps every route working on GitHub Pages (no server rewrites needed)
 * and offline from the service worker's single cached index.html.
 */
export default function App() {
  const init = useProjects((s) => s.init)
  const loaded = useProjects((s) => s.loaded)
  useDocumentDirection()
  useEffect(() => {
    void init()
  }, [init])

  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout loaded={loaded} />}>
          <Route index element={<Dashboard />} />
          <Route path="about" element={<About />} />
          <Route path="p/:projectId" element={<Workspace />} />
          <Route path="p/:projectId/step/:step" element={<StepPage />} />
          <Route path="p/:projectId/report" element={<ReportPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <DialogHost />
      <ToastHost />
    </HashRouter>
  )
}
