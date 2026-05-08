import { useState } from "react";
import { runEvaluation } from "../api/evaluate";

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const INITIAL_FORM = {
  income: "",
  credit_score: "",
  loan_amount: "",
  years_employed: "",
  points: "",
  city: "",
};

const FIELDS = [
  {
    key: "income",
    label: "Annual Income (USD)",
    placeholder: "e.g. 85,000",
    prefix: "$",
    prefixType: "text",
    icon: null,
  },
  {
    key: "credit_score",
    label: "Credit Score (300–850)",
    placeholder: "720",
    prefix: null,
    icon: "credit_score",
  },
  {
    key: "loan_amount",
    label: "Loan Amount (USD)",
    placeholder: "250,000",
    prefix: "$",
    prefixType: "text",
    icon: null,
  },
  {
    key: "years_employed",
    label: "Years Employed",
    placeholder: "5",
    prefix: null,
    icon: "work",
  },
  {
    key: "points",
    label: "Internal Risk Points",
    placeholder: "102",
    prefix: null,
    icon: "token",
  },
  {
    key: "city",
    label: "City Code (Numeric)",
    placeholder: "e.g. New York",
    prefix: null,

    icon: "location_on",
  },
];

const SHAP_LABELS = {
  credit_score: "Credit Score Impact",
  income: "Annual Income Impact",
  loan_amount: "Loan Amount Impact",
  years_employed: "Years Employed Impact",
  city: "Location Volatility",
  points: "Risk Points Impact",
};

/* ─────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────── */

/** Single form field with optional $ prefix or material icon prefix */
function FormField({ field, value, onChange }) {
  const { key, label, placeholder, prefix, prefixType, icon } = field;
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
        {label}
      </label>
      <div className="relative">
        {/* Prefix — either a $ text or a material icon */}
        {prefix && (
          <span
            className="absolute left-4 top-1/2 -translate-y-1/2 text-outline font-medium text-[15px]
            pointer-events-none"
          >
            {prefix}
          </span>
        )}
        {icon && (
          <span
            className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2
            text-outline pointer-events-none text-[20px]"
          >
            {icon}
          </span>
        )}
        <input
          type={key === "city" ? "text" : "number"} // Dynamic type
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(key, e.target.value)}
          className={`
    w-full py-3 pr-4 bg-surface border border-outline-variant rounded-lg
    text-[14px] font-medium text-on-surface
    focus:ring-2 focus:ring-primary focus:border-primary
    outline-none transition-all placeholder:text-outline
    ${prefix || icon ? "pl-8" : "pl-4"}
  `}
        />
      </div>
    </div>
  );
}

/** Processing / loading overlay */
function ProcessingOverlay() {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-6 text-center px-6">
        {/* Spinner */}
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-4 border-surface-container-highest rounded-full" />
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-[28px] animate-pulse">
              analytics
            </span>
          </div>
        </div>

        <div>
          <h3 className="text-[20px] font-semibold text-primary">
            Analyzing Financial Data
          </h3>
          <p className="text-[14px] text-on-surface-variant mt-1">
            Running risk simulations on regional datasets…
          </p>
        </div>

        {/* Skeleton bars */}
        <div className="grid grid-cols-2 gap-3 w-72">
          {[1, 0.8, 0.9, 0.6].map((w, i) => (
            <div
              key={i}
              className="h-3 bg-surface-container-highest rounded-full animate-pulse"
              style={{ width: `${w * 100}%`, animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Decision banner — Approved (green) or Rejected (red) */
function DecisionBanner({ approved, status, confidence }) {
  const isApproved = approved;
  return (
    <div
      className={`rounded-xl px-6 py-5 flex items-center justify-between gap-4 flex-wrap
        ${
          isApproved
            ? "bg-emerald-50 border border-emerald-200"
            : "bg-red-50 border border-red-200"
        }`}
      style={{ animation: "fadeUp 0.4s ease both" }}
    >
      <div className="flex items-center gap-5">
        {/* Icon circle */}
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg flex-shrink-0
            ${isApproved ? "bg-emerald-600" : "bg-red-600"}`}
        >
          <span
            className="material-symbols-outlined text-white text-[30px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {isApproved ? "check_circle" : "cancel"}
          </span>
        </div>
        <div>
          <h4
            className={`text-[30px] font-bold leading-none tracking-tight
              ${isApproved ? "text-emerald-900" : "text-red-900"}`}
          >
            Application {status}
          </h4>
          <p
            className={`text-[14px] mt-1 ${
              isApproved ? "text-emerald-700" : "text-red-700"
            }`}
          >
            {isApproved
              ? "The candidate meets all required risk thresholds for the requested amount."
              : "The candidate does not meet the minimum risk thresholds for this loan tier."}
          </p>
        </div>
      </div>

      {/* Confidence */}
      <div className="text-right flex-shrink-0">
        <span
          className={`text-[11px] font-bold uppercase tracking-widest block mb-1
          ${isApproved ? "text-emerald-800" : "text-red-800"}`}
        >
          Confidence Score
        </span>
        <span
          className={`text-[36px] font-bold leading-none
          ${isApproved ? "text-emerald-600" : "text-red-600"}`}
        >
          {Math.round(confidence * 100)}%
        </span>
      </div>
    </div>
  );
}

/** AI voice analysis card — dark themed */
function AIVoiceCard({ message, approved }) {
  return (
    <div
      className="bg-primary-container rounded-xl p-6 flex flex-col gap-4 relative overflow-hidden shadow-xl"
      style={{ animation: "fadeUp 0.4s ease both", animationDelay: "80ms" }}
    >
      {/* Decorative blur orb */}
      <div
        className="absolute -top-10 -right-10 w-48 h-48 bg-secondary-container
        opacity-10 rounded-full blur-3xl pointer-events-none"
      />

      <div className="flex items-center gap-2 z-10">
        <span
          className="material-symbols-outlined text-secondary-container text-[22px]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          auto_awesome
        </span>
        <span className="text-[11px] font-bold uppercase tracking-widest text-on-primary-container">
          AI Financial Analyst
        </span>
      </div>

      <blockquote className="text-[15px] text-on-primary-fixed leading-relaxed italic z-10 flex-1">
        "{message}"
      </blockquote>

      {/* Voice synth animation */}
      <div className="flex items-center gap-2 z-10 mt-auto">
        <div className="flex items-end gap-0.5 h-5">
          {[3, 5, 4, 2, 4, 3, 5].map((h, i) => (
            <div
              key={i}
              className={`w-1 rounded-full ${
                approved ? "bg-emerald-400" : "bg-red-400"
              }`}
              style={{
                height: `${h * 3}px`,
                animation: `pulse 1s ease-in-out infinite`,
                animationDelay: `${i * 120}ms`,
              }}
            />
          ))}
        </div>
        <span className="text-[10px] text-on-primary-container font-semibold tracking-wider">
          PROCESSING VOICE SYNTH…
        </span>
      </div>
    </div>
  );
}

/** Single SHAP bar row */
function ShapBar({ label, value, maxAbs, index }) {
  const isPos = value >= 0;
  const pct = Math.round((Math.abs(value) / maxAbs) * 100);
  const barPct = Math.round(pct * 0.45); // max 45% width from center

  return (
    <div
      style={{
        animation: "fadeUp 0.4s ease both",
        animationDelay: `${index * 70}ms`,
      }}
    >
      {/* Label row */}
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[13px] font-medium text-on-surface">{label}</span>
        <span
          className={`text-[13px] font-bold font-mono ${
            isPos ? "text-emerald-600" : "text-error"
          }`}
        >
          {isPos ? "+" : ""}
          {value.toFixed(3)}
        </span>
      </div>

      {/* Diverging bar track */}
      <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden flex">
        {isPos ? (
          <>
            <div className="w-1/2" /> {/* left spacer */}
            <div
              className="h-full bg-emerald-500 rounded-r-full transition-all duration-700"
              style={{ width: `${barPct}%` }}
            />
          </>
        ) : (
          <>
            <div className="flex-1" /> {/* push bar to right */}
            <div
              className="h-full bg-error rounded-l-full transition-all duration-700"
              style={{ width: `${barPct}%` }}
            />
            <div className="w-1/2" /> {/* right spacer */}
          </>
        )}
      </div>
    </div>
  );
}

/** Full SHAP risk analysis card */
function RiskAnalysisCard({ rawData }) {
  const entries = Object.entries(rawData).sort(
    (a, b) => Math.abs(b[1]) - Math.abs(a[1])
  );
  const maxAbs = Math.max(...entries.map(([, v]) => Math.abs(v)));

  return (
    <div
      className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6
        shadow-[0_4px_20px_-2px_rgba(0,0,0,0.06)]"
      style={{ animation: "fadeUp 0.4s ease both", animationDelay: "160ms" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h5 className="text-[18px] font-semibold text-on-surface">
            Risk Factor Breakdown
          </h5>
          <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mt-0.5">
            SHAP Impact Value Analysis
          </p>
        </div>
        <span className="material-symbols-outlined text-outline text-[22px]">
          info
        </span>
      </div>

      {/* Axis label */}
      <div
        className="flex text-[10px] font-bold uppercase tracking-widest text-on-surface-variant
        mb-3 px-1"
      >
        <span className="flex-1 text-right pr-2 text-error">← Hurts</span>
        <span className="w-px bg-outline-variant" />
        <span className="flex-1 pl-2 text-emerald-600">Helps →</span>
      </div>

      {/* Bars */}
      <div className="flex flex-col gap-4">
        {entries.map(([key, value], i) => (
          <ShapBar
            key={key}
            label={SHAP_LABELS[key] || key}
            value={value}
            maxAbs={maxAbs}
            index={i}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-outline-variant flex items-center justify-center gap-8">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            Reduces Risk
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-error" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            Increases Risk
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN PAGE COMPONENT
───────────────────────────────────────────── */
export default function NewApplicationPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [view, setView] = useState("form"); // 'form' | 'results'

  const handleChange = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    setError(null);

    // Validate all fields
    const parsed = {};
    for (const { key, label } of FIELDS) {
      const rawValue = form[key];

      // Check if the field is the city field
      if (key === "city") {
        if (!rawValue.trim()) {
          setError(`"${label}" cannot be empty.`);
          return;
        }
        parsed[key] = rawValue; // Keep as string
      } else {
        // Keep numeric logic for all other fields
        const n = parseFloat(rawValue);
        if (isNaN(n)) {
          setError(`"${label}" must be a valid number.`);
          return;
        }
        parsed[key] = n;
      }
    }

    setLoading(true);
    try {
      const data = await runEvaluation(parsed);
      setResult(data);
      setView("results");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      // evaluate.js throws a plain Error with a readable message
      setError(e?.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setForm(INITIAL_FORM);
    setError(null);
    setView("form");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {/* ── Processing overlay ── */}
      {loading && <ProcessingOverlay />}

      <div className="space-y-6">
        {/* ── Page header ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-[24px] font-semibold text-on-surface tracking-tight">
              {view === "form"
                ? "Loan Eligibility Check"
                : "Eligibility Report"}
            </h3>
            <p className="text-[14px] text-on-surface-variant mt-0.5">
              {view === "form"
                ? "Configure the parameters below to run the AI risk assessment model."
                : `Assessment complete — reviewed on ${new Date().toLocaleDateString(
                    "en-US",
                    { month: "long", day: "numeric", year: "numeric" }
                  )}`}
            </p>
          </div>

          {/* Reset button — only in results view */}
          {view === "results" && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-5 py-2.5 border border-outline
                text-on-surface-variant rounded-lg hover:bg-surface-variant
                transition-all text-[12px] font-bold uppercase tracking-widest"
            >
              <span className="material-symbols-outlined text-[18px]">
                restart_alt
              </span>
              New Evaluation
            </button>
          )}
        </div>

        {/* ══════════════════════════════
            FORM VIEW
        ══════════════════════════════ */}
        {view === "form" && (
          <div
            className="bg-surface-container-lowest rounded-xl border border-outline-variant
              shadow-[0_4px_20px_-2px_rgba(0,0,0,0.06)] p-6"
            style={{ animation: "fadeUp 0.3s ease both" }}
          >
            {/* Input grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {FIELDS.map((field) => (
                <FormField
                  key={field.key}
                  field={field}
                  value={form[field.key]}
                  onChange={handleChange}
                />
              ))}
            </div>

            {/* Error message */}
            {error && (
              <div
                className="mt-5 flex items-center gap-2 bg-error-container
                text-on-error-container rounded-lg px-4 py-3 text-[13px]"
              >
                <span className="material-symbols-outlined text-[18px]">
                  error
                </span>
                {error}
              </div>
            )}

            {/* Submit */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-primary text-on-primary px-7 py-3 rounded-lg
                  text-[13px] font-bold uppercase tracking-widest
                  hover:opacity-90 active:scale-[0.98] transition-all
                  flex items-center gap-2
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Check Eligibility
                <span className="material-symbols-outlined text-[18px]">
                  bolt
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════
            RESULTS VIEW
        ══════════════════════════════ */}
        {view === "results" && result && (
          <div className="space-y-5">
            {/* Mock data notice */}
            {result._mock && (
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-[13px] text-amber-800">
                <span className="material-symbols-outlined text-[18px] text-amber-600">
                  info
                </span>
                <span>
                  <strong>Mock data</strong> — FastAPI not detected on port
                  8000. Run{" "}
                  <code className="bg-amber-100 px-1 rounded font-mono text-[12px]">
                    uvicorn main:app --reload
                  </code>{" "}
                  to use real predictions.
                </span>
              </div>
            )}

            {/* 1 — Decision banner */}
            <DecisionBanner
              approved={result.approved}
              status={result.status}
              confidence={result.confidence}
            />

            {/* 2 — Bento grid: AI card + SHAP chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* AI Voice card — 1 col */}
              <div className="lg:col-span-1">
                <AIVoiceCard
                  message={result.ai_voice_message}
                  approved={result.approved}
                />
              </div>

              {/* SHAP chart — 2 cols (the star of the page) */}
              <div className="lg:col-span-2">
                <RiskAnalysisCard rawData={result.raw_data} />
              </div>
            </div>

            {/* 3 — Top reason callout */}
            <div
              className="flex items-center gap-3 bg-surface-container-lowest
              border border-outline-variant rounded-xl px-5 py-4
              shadow-[0_4px_20px_-2px_rgba(0,0,0,0.04)]"
              style={{
                animation: "fadeUp 0.4s ease both",
                animationDelay: "240ms",
              }}
            >
              <span className="material-symbols-outlined text-outline text-[22px]">
                flag
              </span>
              <div>
                <span
                  className="text-[11px] font-bold uppercase tracking-widest
                  text-on-surface-variant"
                >
                  Primary Deciding Factor
                </span>
                <p className="text-[15px] font-semibold text-on-surface mt-0.5">
                  {result.top_reason}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
