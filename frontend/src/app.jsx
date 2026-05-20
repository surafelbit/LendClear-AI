import { useState, useRef } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

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
            <AnimatedRoutes />
          </div>
        </main>
      </div>

      <style>{`
        @keyframes pageIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <div
      key={location.pathname}
      style={{ animation: "pageIn 0.4s cubic-bezier(0.16,1,0.3,1) both" }}
    >
      <Routes location={location}>
        <Route path="/" element={<Navigate to="/overview" replace />} />
        <Route path="/overview" element={<PortfolioOverviewPage />} />
        <Route path="/application" element={<NewApplicationPage />} />
        <Route path="/analytics" element={<RiskAnalyticsPage />} />
        <Route path="/compliance" element={<ComplianceEnginePage />} />
        <Route path="/audit" element={<AuditLogsPage />} />
        <Route path="/settings" element={<SystemSettingsPage />} />
        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Routes>
    </div>
  );
}
