import Icon from "../components/ui/Icon";

const METRICS = [
  {
    label: "Default Rate",
    value: "4.2%",
    trend: "-0.8%",
    up: true,
    icon: "warning",
  },
  {
    label: "Avg. Risk Score",
    value: "61.3",
    trend: "+2.1",
    up: false,
    icon: "analytics",
  },
  {
    label: "High-Risk Apps",
    value: "183",
    trend: "-22",
    up: true,
    icon: "gpp_bad",
  },
  {
    label: "Model Accuracy",
    value: "91.8%",
    trend: "+0.4%",
    up: true,
    icon: "model_training",
  },
];

const FACTORS = [
  { name: "Credit Score", weight: 68, color: "bg-error" },
  { name: "Income Level", weight: 41, color: "bg-emerald-500" },
  { name: "Loan-to-Income", weight: 35, color: "bg-error" },
  { name: "Employment Tenure", weight: 20, color: "bg-emerald-500" },
  { name: "City Risk Index", weight: 12, color: "bg-outline" },
  { name: "Relationship Points", weight: 6, color: "bg-emerald-500" },
];

export default function RiskAnalyticsPage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-[36px] font-bold text-primary tracking-tight leading-tight">
          Risk Analytics
        </h2>
        <p className="text-[16px] text-on-surface-variant mt-1">
          Model performance indicators and portfolio risk distribution.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {METRICS.map((m) => (
          <div
            key={m.label}
            className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                {m.label}
              </p>
              <div className="w-9 h-9 rounded-lg bg-surface-container-low border border-outline-variant flex items-center justify-center">
                <Icon
                  name={m.icon}
                  size={18}
                  className="text-on-surface-variant"
                />
              </div>
            </div>
            <p className="text-[30px] font-bold text-primary tracking-tight leading-none">
              {m.value}
            </p>
            <div
              className={`flex items-center gap-1 mt-2 text-[12px] font-semibold ${
                m.up ? "text-emerald-600" : "text-error"
              }`}
            >
              <Icon name={m.up ? "trending_up" : "trending_down"} size={14} />
              {m.trend} vs last month
            </div>
          </div>
        ))}
      </div>

      {/* Feature importance */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <Icon name="bar_chart" size={22} className="text-primary" />
          <div>
            <h3 className="text-[18px] font-semibold text-primary">
              Global Feature Importance
            </h3>
            <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mt-0.5">
              Average SHAP contribution across all applications
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {FACTORS.map((f) => (
            <div key={f.name}>
              <div className="flex justify-between mb-1.5">
                <span className="text-[13px] font-medium text-primary">
                  {f.name}
                </span>
                <span className="text-[13px] font-bold font-mono text-on-surface-variant">
                  {f.weight}%
                </span>
              </div>
              <div className="h-3 bg-surface-container-high rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${f.color} transition-all duration-700`}
                  style={{ width: `${f.weight}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
