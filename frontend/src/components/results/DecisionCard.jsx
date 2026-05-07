import Icon from "../ui/Icon";

/**
 * DecisionCard — displays the final Accepted / Rejected decision badge
 * with a supporting description.
 *
 * Props:
 *   approved — boolean
 *   status   — 'Accepted' | 'Rejected'
 */
export default function DecisionCard({ approved, status }) {
  return (
    <div
      className="bg-surface-container-lowest border border-outline-variant
      rounded-xl p-6 shadow-sm flex flex-col"
    >
      <p
        className="text-[11px] font-bold uppercase tracking-widest
        text-on-surface-variant mb-4"
      >
        Final Decision Status
      </p>

      <div className="flex-1 flex flex-col justify-center">
        {/* Badge + icon row */}
        <div className="flex items-center gap-4">
          <span
            className={`px-5 py-2 text-[22px] font-semibold rounded-full
              border shadow-sm leading-tight
              ${
                approved
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                  : "bg-error-container text-on-error-container border-error"
              }`}
          >
            {status}
          </span>
          <Icon
            name={approved ? "check_circle" : "cancel"}
            size={44}
            className={approved ? "text-emerald-600" : "text-error"}
          />
        </div>

        {/* Supporting text */}
        <p className="mt-5 text-[14px] text-on-surface-variant leading-relaxed">
          {approved
            ? "The AI engine confirms acceptable delinquency probability. Risk metrics are within approved parameters for this loan tier."
            : "The AI engine identifies high delinquency probability based on historical profiles and current volatility metrics."}
        </p>
      </div>
    </div>
  );
}
