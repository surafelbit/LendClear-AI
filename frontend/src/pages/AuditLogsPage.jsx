import Icon from "../components/ui/Icon";

const LOGS = [
  {
    time: "14:32:11",
    user: "Alex Rivers",
    action: "Evaluated application APP-1041",
    type: "evaluation",
    result: "Accepted",
  },
  {
    time: "14:18:05",
    user: "Alex Rivers",
    action: "Evaluated application APP-1040",
    type: "evaluation",
    result: "Rejected",
  },
  {
    time: "13:55:44",
    user: "System",
    action: "Model retrain triggered (v2.4.1)",
    type: "system",
    result: null,
  },
  {
    time: "13:40:02",
    user: "Maria Santos",
    action: "Exported report APP-1039 (PDF)",
    type: "export",
    result: null,
  },
  {
    time: "13:21:30",
    user: "Maria Santos",
    action: "Evaluated application APP-1039",
    type: "evaluation",
    result: "Accepted",
  },
  {
    time: "12:58:17",
    user: "System",
    action: "Compliance rule CR-005 flagged for review",
    type: "compliance",
    result: null,
  },
  {
    time: "12:34:09",
    user: "Derek Huang",
    action: "Evaluated application APP-1038",
    type: "evaluation",
    result: "Rejected",
  },
  {
    time: "11:50:55",
    user: "Alex Rivers",
    action: "Updated system threshold: min credit score → 650",
    type: "config",
    result: null,
  },
];

const typeStyle = {
  evaluation: {
    icon: "analytics",
    color: "text-primary",
    bg: "bg-surface-container-high",
  },
  system: {
    icon: "settings",
    color: "text-on-surface-variant",
    bg: "bg-surface-variant",
  },
  export: { icon: "download", color: "text-emerald-600", bg: "bg-emerald-50" },
  compliance: {
    icon: "verified_user",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  config: { icon: "tune", color: "text-primary", bg: "bg-primary-container" },
};

export default function AuditLogsPage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-[36px] font-bold text-primary tracking-tight leading-tight">
          Audit Logs
        </h2>
        <p className="text-[16px] text-on-surface-variant mt-1">
          Full tamper-proof activity trail for compliance and review.
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        {["All Events", "Evaluations", "System", "Exports", "Config"].map(
          (f, i) => (
            <button
              key={f}
              className={`px-4 py-2 rounded-full text-[12px] font-bold uppercase tracking-wider transition-all
            ${
              i === 0
                ? "bg-primary text-on-primary shadow-sm"
                : "bg-surface-container-lowest border border-outline-variant text-on-surface-variant hover:bg-surface-variant"
            }`}
            >
              {f}
            </button>
          )
        )}
        <div className="ml-auto flex items-center gap-2 px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-full">
          <Icon
            name="calendar_today"
            size={14}
            className="text-on-surface-variant"
          />
          <span className="text-[12px] font-semibold text-on-surface-variant">
            Today
          </span>
        </div>
      </div>

      {/* Log timeline */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-outline-variant">
          <Icon name="history" size={20} className="text-primary" />
          <h3 className="text-[16px] font-semibold text-primary">
            Activity Stream
          </h3>
          <span className="ml-auto text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
            {LOGS.length} events today
          </span>
        </div>

        <div className="divide-y divide-outline-variant">
          {LOGS.map((log, i) => {
            const s = typeStyle[log.type];
            return (
              <div
                key={i}
                className="flex items-start gap-4 px-6 py-4 hover:bg-surface-container-low transition-colors"
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${s.bg}`}
                >
                  <Icon name={s.icon} size={18} className={s.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-semibold text-primary">
                      {log.user}
                    </span>
                    {log.result && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold
                        ${
                          log.result === "Accepted"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-error-container text-on-error-container"
                        }`}
                      >
                        {log.result}
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-on-surface-variant mt-0.5">
                    {log.action}
                  </p>
                </div>
                <span className="text-[11px] font-mono text-on-surface-variant flex-shrink-0 mt-0.5">
                  {log.time}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
