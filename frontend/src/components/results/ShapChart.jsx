import Icon from "../ui/Icon";
import { SHAP_LABELS } from "../../constants";

/* ── Single SHAP row ── */
function ShapRow({ label, value, maxAbs, index }) {
  const isPos = value >= 0;
  // Each side of the diverging chart occupies up to 45% of the track
  const pct = Math.round((Math.abs(value) / maxAbs) * 45);

  return (
    <div
      className="grid items-center gap-4 py-3 border-b border-surface-container-high
        hover:bg-surface-container-low transition-colors rounded-sm"
      style={{
        gridTemplateColumns: "160px 1fr 72px",
        animation: "fadeUp 0.45s ease both",
        animationDelay: `${index * 90}ms`,
      }}
    >
      {/* Variable name */}
      <span className="text-[14px] font-medium text-primary">{label}</span>

      {/* Diverging bar */}
      <div className="relative h-7 flex items-center">
        {/* Center line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-outline-variant z-10" />

        {isPos ? (
          <div
            className="absolute h-5 rounded-sm bg-emerald-500 shadow-sm"
            style={{
              left: "50%",
              width: `${pct}%`,
              transition: `width 0.9s cubic-bezier(0.16,1,0.3,1) ${
                index * 90
              }ms`,
            }}
          />
        ) : (
          <div
            className="absolute h-5 rounded-sm bg-error shadow-sm"
            style={{
              right: `${50 - pct}%`,
              width: `${pct}%`,
              transition: `width 0.9s cubic-bezier(0.16,1,0.3,1) ${
                index * 90
              }ms`,
            }}
          />
        )}
      </div>

      {/* Numeric value */}
      <span
        className="text-right font-mono text-[13px] font-bold tabular-nums"
        style={{ color: isPos ? "#16a34a" : "#ba1a1a" }}
      >
        {isPos ? "+" : ""}
        {value.toFixed(3)}
      </span>
    </div>
  );
}

/* ── Full chart card ── */
/**
 * ShapChart — Risk Factor Attribution card with a diverging SHAP bar chart.
 *
 * Props:
 *   raw_data — { [key]: number } SHAP values from backend
 */
export default function ShapChart({ raw_data }) {
  const entries = Object.entries(raw_data).sort(
    (a, b) => Math.abs(b[1]) - Math.abs(a[1])
  );
  const maxAbs = Math.max(...entries.map(([, v]) => Math.abs(v)));

  return (
    <div
      className="bg-surface-container-lowest border border-outline-variant
        rounded-xl p-6 shadow-sm"
      style={{ animation: "fadeUp 0.4s ease both", animationDelay: "200ms" }}
    >
      {/* Card header */}
      <div className="flex justify-between items-end flex-wrap gap-4 mb-6">
        <div>
          <h3 className="text-[20px] font-semibold text-primary">
            Risk Factor Attribution
          </h3>
          <p
            className="text-[11px] font-bold uppercase tracking-widest
            text-on-surface-variant mt-1"
          >
            SHAP Impact Value Analysis
          </p>
        </div>

        {/* Legend */}
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-emerald-500" />
            <span className="text-[12px] font-semibold text-on-surface-variant">
              Positive
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-error" />
            <span className="text-[12px] font-semibold text-on-surface-variant">
              Negative
            </span>
          </div>
        </div>
      </div>

      {/* Column labels */}
      <div
        className="grid pb-2 border-b border-outline-variant mb-1"
        style={{ gridTemplateColumns: "160px 1fr 72px" }}
      >
        <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
          Variable
        </span>
        <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant text-center">
          Impact Magnitude
        </span>
        <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant text-right">
          Value
        </span>
      </div>

      {/* SHAP rows */}
      <div>
        {entries.map(([key, value], i) => (
          <ShapRow
            key={key}
            label={SHAP_LABELS[key] || key}
            value={value}
            maxAbs={maxAbs}
            index={i}
          />
        ))}
      </div>

      {/* Export footer */}
      <div className="mt-6 pt-4 border-t border-surface-container-high flex justify-end">
        <button
          className="flex items-center gap-2 text-primary
          text-[12px] font-bold uppercase tracking-widest hover:underline transition-all"
        >
          <Icon name="download" size={16} />
          Export Detail Report (PDF)
        </button>
      </div>
    </div>
  );
}
