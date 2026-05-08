import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import TopBar from "./components/layout/TopBar";
import Sidebar from "./components/layout/Sidebar";

import PortfolioOverviewPage from "./pages/PortfolioOverviewPage";
import NewApplicationPage from "./pages/NewApplicationPage";
import RiskAnalyticsPage from "./pages/RiskAnalyticsPage";
import ComplianceEnginePage from "./pages/ComplianceEnginePage";
import AuditLogsPage from "./pages/AuditLogsPage";
import SystemSettingsPage from "./pages/SystemSettingsPage";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col font-sans">
      {/* Sticky top bar */}
      <TopBar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — reads URL itself via useLocation */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main — expands/contracts based on sidebar width */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-surface">
          <div className="p-6 max-w-7xl mx-auto">
            <Routes>
              {/* Default redirect to overview */}
              <Route path="/" element={<Navigate to="/overview" replace />} />
              <Route
                path="/overview"
                element={
                  <PageWrapper>
                    <PortfolioOverviewPage />
                  </PageWrapper>
                }
              />
              <Route
                path="/application"
                element={
                  <PageWrapper>
                    <NewApplicationPage />
                  </PageWrapper>
                }
              />
              <Route
                path="/analytics"
                element={
                  <PageWrapper>
                    <RiskAnalyticsPage />
                  </PageWrapper>
                }
              />
              <Route
                path="/compliance"
                element={
                  <PageWrapper>
                    <ComplianceEnginePage />
                  </PageWrapper>
                }
              />
              <Route
                path="/audit"
                element={
                  <PageWrapper>
                    <AuditLogsPage />
                  </PageWrapper>
                }
              />
              <Route
                path="/settings"
                element={
                  <PageWrapper>
                    <SystemSettingsPage />
                  </PageWrapper>
                }
              />
              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/overview" replace />} />
            </Routes>
          </div>
        </main>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* Wraps each page with a fade-up entrance animation */
function PageWrapper({ children }) {
  return <div style={{ animation: "fadeUp 0.3s ease both" }}>{children}</div>;
}
