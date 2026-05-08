import Icon from "../components/ui/Icon";

const RULES = [
  {
    id: "CR-001",
    name: "Minimum Credit Score Threshold",
    standard: "Basel III",
    status: "Active",
    severity: "High",
  },
  {
    id: "CR-002",
    name: "Debt-to-Income Ratio Cap (43%)",
    standard: "CFPB QM",
    status: "Active",
    severity: "High",
  },
  {
    id: "CR-003",
    name: "Employment Verification Check",
    standard: "Internal",
    status: "Active",
    severity: "Medium",
  },
  {
    id: "CR-004",
    name: "Anti-Money Laundering Screen",
    standard: "BSA/AML",
    status: "Active",
    severity: "High",
  },
  {
    id: "CR-005",
    name: "Fair Lending Bias Detection",
    standard: "ECOA",
    status: "Review",
    severity: "High",
  },
  {
    id: "CR-006",
    name: "Flood Zone Property Check",
    standard: "FEMA",
    status: "Inactive",
    severity: "Low",
  },
];

const sevColor = {
  High: "bg-error-container text-on-error-container",
  Medium: "bg-amber-100 text-amber-800",
  Low: "bg-surface-container-high text-on-surface-variant",
};
const statusColor = {
  Active: "text-emerald-600",
  Review: "text-amber-600",
  Inactive: "text-on-surface-variant",
};
const statusIcon = {
  Active: "check_circle",
  Review: "pending",
  Inactive: "cancel",
};

export default function ComplianceEnginePage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-[36px] font-bold text-primary tracking-tight leading-tight">
          Compliance Engine
        </h2>
        <p className="text-[16px] text-on-surface-variant mt-1">
          Regulatory rule management and real-time compliance monitoring.
        </p>
      </div>

      {/* Summary pills */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          {
            label: "Active Rules",
            value: "4",
            icon: "verified_user",
            color: "text-emerald-600",
            bg: "bg-emerald-50 border-emerald-200",
          },
          {
            label: "Under Review",
            value: "1",
            icon: "pending",
            color: "text-amber-600",
            bg: "bg-amber-50  border-amber-200",
          },
          {
            label: "Inactive Rules",
            value: "1",
            icon: "block",
            color: "text-outline",
            bg: "bg-surface-container-low border-outline-variant",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`${s.bg} border rounded-xl p-5 flex items-center gap-4`}
          >
            <Icon name={s.icon} size={28} className={s.color} />
            <div>
              <p className="text-[28px] font-bold text-primary leading-none">
                {s.value}
              </p>
              <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">
                {s.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Rules table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-outline-variant">
          <Icon name="rule" size={20} className="text-primary" />
          <h3 className="text-[16px] font-semibold text-primary">
            Compliance Rules Registry
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-surface-container-low">
              <tr>
                {["Rule ID", "Rule Name", "Standard", "Severity", "Status"].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {RULES.map((r, i) => (
                <tr
                  key={r.id}
                  className="border-t border-outline-variant hover:bg-surface-container-low transition-colors"
                >
                  <td className="px-5 py-3 font-mono text-[12px] text-on-surface-variant">
                    {r.id}
                  </td>
                  <td className="px-5 py-3 font-medium text-primary">
                    {r.name}
                  </td>
                  <td className="px-5 py-3 font-mono text-[12px]">
                    {r.standard}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        sevColor[r.severity]
                      }`}
                    >
                      {r.severity}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div
                      className={`flex items-center gap-1.5 font-semibold text-[12px] ${
                        statusColor[r.status]
                      }`}
                    >
                      <Icon name={statusIcon[r.status]} size={15} />
                      {r.status}
                    </div>
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
