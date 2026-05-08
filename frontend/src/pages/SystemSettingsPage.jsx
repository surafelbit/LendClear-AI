import { useState } from "react";
import Icon from "../components/ui/Icon";

function SettingRow({ label, description, children }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-outline-variant last:border-0 gap-4">
      <div className="flex-1">
        <p className="text-[14px] font-semibold text-primary">{label}</p>
        <p className="text-[12px] text-on-surface-variant mt-0.5">
          {description}
        </p>
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ defaultOn = false }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      onClick={() => setOn((v) => !v)}
      className={`w-11 h-6 rounded-full transition-colors relative ${
        on ? "bg-primary" : "bg-surface-container-high"
      }`}
    >
      <div
        className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow-sm ${
          on ? "left-6" : "left-1"
        }`}
      />
    </button>
  );
}

export default function SystemSettingsPage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-[36px] font-bold text-primary tracking-tight leading-tight">
          System Settings
        </h2>
        <p className="text-[16px] text-on-surface-variant mt-1">
          Configure model parameters, integrations, and user preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Model config */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-outline-variant">
            <Icon name="model_training" size={20} className="text-primary" />
            <h3 className="text-[16px] font-semibold text-primary">
              Model Configuration
            </h3>
          </div>
          <div className="px-6">
            <SettingRow
              label="Active Model Version"
              description="Currently deployed ML model"
            >
              <span className="font-mono text-[13px] font-bold bg-surface-container-high px-3 py-1.5 rounded-lg">
                v2.4.1
              </span>
            </SettingRow>
            <SettingRow
              label="Min. Credit Score Threshold"
              description="Applications below this are auto-rejected"
            >
              <input
                type="number"
                defaultValue="650"
                className="w-24 bg-surface-container-low border border-outline-variant rounded-lg px-3 py-1.5 font-mono text-[13px] outline-none focus:ring-2 focus:ring-primary"
              />
            </SettingRow>
            <SettingRow
              label="Max. Debt-to-Income Ratio"
              description="CFPB Qualified Mortgage cap"
            >
              <input
                type="number"
                defaultValue="43"
                className="w-24 bg-surface-container-low border border-outline-variant rounded-lg px-3 py-1.5 font-mono text-[13px] outline-none focus:ring-2 focus:ring-primary"
              />
            </SettingRow>
            <SettingRow
              label="Auto-approve High-confidence"
              description="Auto-approve if confidence ≥ 95% and score ≥ 750"
            >
              <Toggle defaultOn={false} />
            </SettingRow>
          </div>
        </div>

        {/* Integrations */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-outline-variant">
            <Icon
              name="integration_instructions"
              size={20}
              className="text-primary"
            />
            <h3 className="text-[16px] font-semibold text-primary">
              Integrations
            </h3>
          </div>
          <div className="px-6">
            <SettingRow
              label="FastAPI Backend"
              description="http://127.0.0.1:8000/predict"
            >
              <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-[12px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Connected
              </div>
            </SettingRow>
            <SettingRow
              label="Gemini Voice Engine"
              description="AI narrative generation for decisions"
            >
              <div className="flex items-center gap-1.5 text-amber-600 font-semibold text-[12px]">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Standby
              </div>
            </SettingRow>
            <SettingRow
              label="PDF Export Service"
              description="Report generation and delivery"
            >
              <Toggle defaultOn={true} />
            </SettingRow>
            <SettingRow
              label="Email Notifications"
              description="Send decision alerts to applicants"
            >
              <Toggle defaultOn={false} />
            </SettingRow>
          </div>
        </div>

        {/* User preferences */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-outline-variant">
            <Icon name="manage_accounts" size={20} className="text-primary" />
            <h3 className="text-[16px] font-semibold text-primary">
              User Preferences
            </h3>
          </div>
          <div className="px-6">
            <SettingRow
              label="Display Name"
              description="Shown in the sidebar and reports"
            >
              <input
                type="text"
                defaultValue="Alex Rivers"
                className="w-40 bg-surface-container-low border border-outline-variant rounded-lg px-3 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-primary"
              />
            </SettingRow>
            <SettingRow
              label="Role"
              description="Your analyst permission level"
            >
              <span className="font-mono text-[13px] font-bold bg-surface-container-high px-3 py-1.5 rounded-lg">
                Principal
              </span>
            </SettingRow>
            <SettingRow
              label="Show SHAP Values by Default"
              description="Pre-expand attribution chart on results"
            >
              <Toggle defaultOn={true} />
            </SettingRow>
            <SettingRow
              label="Compact Sidebar"
              description="Collapse sidebar to icon-only rail"
            >
              <Toggle defaultOn={false} />
            </SettingRow>
          </div>
        </div>

        {/* Danger zone */}
        <div className="bg-surface-container-lowest border border-error rounded-xl shadow-sm">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-error">
            <Icon name="warning" size={20} className="text-error" />
            <h3 className="text-[16px] font-semibold text-error">
              Danger Zone
            </h3>
          </div>
          <div className="p-6 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[14px] font-semibold text-primary">
                  Clear All Application History
                </p>
                <p className="text-[12px] text-on-surface-variant mt-0.5">
                  Permanently removes all cached evaluation records
                </p>
              </div>
              <button className="px-4 py-2 border border-error text-error text-[12px] font-bold uppercase tracking-wider rounded-lg hover:bg-error-container transition-colors">
                Clear
              </button>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[14px] font-semibold text-primary">
                  Reset Model to Default
                </p>
                <p className="text-[12px] text-on-surface-variant mt-0.5">
                  Reverts all thresholds and config to factory defaults
                </p>
              </div>
              <button className="px-4 py-2 border border-error text-error text-[12px] font-bold uppercase tracking-wider rounded-lg hover:bg-error-container transition-colors">
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
