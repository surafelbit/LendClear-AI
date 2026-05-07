/**
 * ConfidenceRing — animated SVG donut showing model confidence percentage.
 *
 * Props:
 *   pct        — number (0–100)
 *   isRejected — boolean (drives red vs green stroke color)
 */
export default function ConfidenceRing({ pct, isRejected }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const strokeColor = isRejected ? "#ba1a1a" : "#16a34a";

  return (
    <div
      className="bg-surface-container-lowest border border-outline-variant
        rounded-xl p-6 shadow-sm flex flex-col items-center justify-center
        min-h-[220px] relative overflow-hidden"
    >
      {/* Subtle dot-grid background decoration */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 50%, #000 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Donut SVG */}
      <div className="relative z-10 w-full text-center">
        <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
            {/* Track */}
            <circle
              cx="64"
              cy="64"
              r={r}
              fill="transparent"
              stroke="#e6e8ea"
              strokeWidth="10"
            />
            {/* Progress arc */}
            <circle
              cx="64"
              cy="64"
              r={r}
              fill="transparent"
              stroke={strokeColor}
              strokeWidth="10"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{
                transition: "stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)",
              }}
            />
          </svg>

          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[32px] font-bold leading-none tracking-tight text-primary">
              {pct}%
            </span>
            <span
              className="text-[11px] font-semibold uppercase tracking-widest
                text-on-surface-variant mt-1"
            >
              Confidence
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
