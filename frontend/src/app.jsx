import { useState } from 'react'

import TopBar    from './components/layout/TopBar'
import Sidebar   from './components/layout/Sidebar'

// Pages
import PortfolioOverviewPage from './pages/PortfolioOverviewPage'
import NewApplicationPage    from './pages/NewApplicationPage'
import RiskAnalyticsPage     from './pages/RiskAnalyticsPage'
import ComplianceEnginePage  from './pages/ComplianceEnginePage'
import AuditLogsPage         from './pages/AuditLogsPage'
import SystemSettingsPage    from './pages/SystemSettingsPage'

/* ── Page registry — maps nav id → component ── */
const PAGES = {
  overview:    PortfolioOverviewPage,
  application: NewApplicationPage,
  analytics:   RiskAnalyticsPage,
  compliance:  ComplianceEnginePage,
  audit:       AuditLogsPage,
  settings:    SystemSettingsPage,
}

export default function App() {
  const [activePage,   setActivePage]   = useState('application')
  const [sidebarOpen,  setSidebarOpen]  = useState(true)

  const handleNavigate = (id) => {
    setActivePage(id)
    // On mobile, sidebar auto-closes inside Sidebar's handleNav already,
    // but also scroll to top on page change
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleSidebar = () => setSidebarOpen(v => !v)
  const closeSidebar  = () => setSidebarOpen(false)

  // Resolve the active page component
  const PageComponent = PAGES[activePage] ?? NewApplicationPage

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col font-sans">

      {/* ── Top bar ── */}
      <TopBar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={toggleSidebar}
        activePage={activePage}
      />

      {/* ── Body row: sidebar + main ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ── */}
        <Sidebar
          isOpen={sidebarOpen}
          activePage={activePage}
          onNavigate={handleNavigate}
          onClose={closeSidebar}
        />

        {/* ── Main content ── */}
        <main
          className="flex-1 overflow-y-auto bg-surface"
          /* Push content right when sidebar is open on desktop so it doesn't
             sit behind the fixed sidebar on mobile */
          style={{ minWidth: 0 }}
        >
          <div className="p-6 max-w-7xl mx-auto">
            {/* Animate page transitions */}
            <div
              key={activePage}
              style={{ animation: 'fadeUp 0.3s ease both' }}
            >
              <PageComponent />
            </div>
          </div>
        </main>
      </div>

      {/* ── Global keyframe (Tailwind doesn't ship fadeUp by default) ── */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>
    </div>
  )
}