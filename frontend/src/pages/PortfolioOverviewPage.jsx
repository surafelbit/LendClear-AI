import Icon from "../components/ui/Icon";

const STATS = [
  {
    label: "Total Applications",
    value: "1,284",
    change: "+12%",
    icon: "description",
    up: true,
  },
  {
    label: "Approval Rate",
    value: "68.4%",
    change: "+3.1%",
    icon: "check_circle",
    up: true,
  },
  {
    label: "Avg. Credit Score",
    value: "692",
    change: "-4pts",
    icon: "credit_score",
    up: false,
  },
  {
    label: "Avg. Loan Amount",
    value: "$124K",
    change: "+8.2%",
    icon: "account_balance",
    up: true,
  },
];

const RECENT = [
  {
    id: "APP-1041",
    name: "Marcus Bell",
    score: 720,
    amount: "$85,000",
    status: "Accepted",
    conf: "87%",
  },
  {
    id: "APP-1040",
    name: "Priya Sharma",
    score: 582,
    amount: "$450,000",
    status: "Rejected",
    conf: "94%",
  },
  {
    id: "APP-1039",
    name: "James Okafor",
    score: 695,
    amount: "$200,000",
    status: "Accepted",
    conf: "79%",
  },
  {
    id: "APP-1038",
    name: "Sofia Mendes",
    score: 610,
    amount: "$320,000",
    status: "Rejected",
    conf: "88%",
  },
  {
    id: "APP-1037",
    name: "Derek Huang",
    score: 755,
    amount: "$95,000",
    status: "Accepted",
    conf: "92%",
  },
];

function StatCard({ label, value, change, icon, up }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
          {label}
        </p>
        <div className="w-9 h-9 rounded-lg bg-surface-container-low border border-outline-variant flex items-center justify-center">
          <Icon name={icon} size={18} className="text-on-surface-variant" />
        </div>
      </div>
      <p className="text-[30px] font-bold text-primary tracking-tight leading-none">
        {value}
      </p>
      <div
        className={`flex items-center gap-1 mt-2 text-[12px] font-semibold ${
          up ? "text-emerald-600" : "text-error"
        }`}
      >
        <Icon name={up ? "trending_up" : "trending_down"} size={14} />
        {change} vs last month
      </div>
    </div>
  );
}

export default function PortfolioOverviewPage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-[36px] font-bold text-primary tracking-tight leading-tight">
          Portfolio Overview
        </h2>
        <p className="text-[16px] text-on-surface-variant mt-1">
          High-level view of all loan activity and performance metrics.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {STATS.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Recent applications table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-outline-variant">
          <Icon name="history" size={20} className="text-primary" />
          <h3 className="text-[16px] font-semibold text-primary">
            Recent Applications
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-surface-container-low">
              <tr>
                {[
                  "App ID",
                  "Applicant",
                  "Credit Score",
                  "Loan Amount",
                  "Decision",
                  "Confidence",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RECENT.map((r, i) => (
                <tr
                  key={r.id}
                  className={`border-t border-outline-variant hover:bg-surface-container-low transition-colors ${
                    i % 2 === 0 ? "" : "bg-surface-container-lowest"
                  }`}
                >
                  <td className="px-5 py-3 font-mono text-[12px] text-on-surface-variant">
                    {r.id}
                  </td>
                  <td className="px-5 py-3 font-semibold text-primary">
                    {r.name}
                  </td>
                  <td className="px-5 py-3 font-mono">{r.score}</td>
                  <td className="px-5 py-3 font-mono">{r.amount}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-bold
                      ${
                        r.status === "Accepted"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-error-container text-on-error-container"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono text-on-surface-variant">
                    {r.conf}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
