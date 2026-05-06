import { useState, useRef } from "react";

/* ─────────────────────────────────────────
   MOCK API  — swap this for your FastAPI call
   ───────────────────────────────────────── */
async function runEvaluation(payload) {
  await new Promise((r) => setTimeout(r, 2000));
  const approved = payload.credit_score >= 650;
  return {
    approved,
    status: approved ? "Accepted" : "Rejected",
    confidence: approved ? 0.87 : 0.94,
    top_reason: approved ? "Annual Income" : "Credit Score",
    ai_voice_message: approved
      ? "Decision Logic Path: Application cleared for funding. Primary accelerating factor: Annual Income. Strong employment tenure offsets the moderate loan-to-income ratio at the requested amount."
      : "Decision Logic Path: Application flagged for secondary review. Primary deciding factor: Credit Score. Income stability is insufficient to offset the perceived risk at the requested loan amount.",
    raw_data: {
      credit_score: approved ? 0.223 : -0.682,
      income: approved ? 0.412 : 0.154,
      loan_amount: approved ? 0.087 : -0.112,
      years_employed: approved ? 0.198 : 0.043,
      city: approved ? 0.034 : -0.021,
      points: approved ? 0.056 : 0.012,
    },
  };
}

const SHAP_LABELS = {
  credit_score: "Credit Score",
  income: "Annual Income",
  loan_amount: "Loan Amount",
  years_employed: "Employment Duration",
  city: "City Index",
  points: "Relationship Points",
};

const FORM_FIELDS = [
  { key: "city", label: "City Code", placeholder: "e.g. 102" },
  { key: "income", label: "Annual Income ($)", placeholder: "e.g. 68500" },
  { key: "credit_score", label: "Credit Score", placeholder: "e.g. 720" },
  { key: "loan_amount", label: "Loan Amount ($)", placeholder: "e.g. 450000" },
  { key: "years_employed", label: "Years Employed", placeholder: "e.g. 3" },
  { key: "points", label: "Relationship Points", placeholder: "e.g. 12" },
];

const NAV_ITEMS = [
  { icon: "dashboard", label: "Portfolio Overview", active: false },
  { icon: "add_circle", label: "New Application", active: true },
  { icon: "analytics", label: "Risk Analytics", active: false },
  { icon: "verified_user", label: "Compliance Engine", active: false },
  { icon: "history", label: "Audit Logs", active: false, divider: true },
  { icon: "settings", label: "System Settings", active: false },
];

/* ── tiny helpers ── */
const Icon = ({ name, size = 24, className = "" }) => (
  <span
    className={`material-symbols-outlined select-none leading-none ${className}`}
    style={{ fontSize: size }}
  >
    {name}
  </span>
);

const Spinner = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className="animate-spin"
  >
    <circle
      className="opacity-20"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="3"
    />
    <path
      className="opacity-80"
      fill="currentColor"
      d="M4 12a8 8 0 018-8v8H4z"
    />
  </svg>
);

/* ── Confidence donut ── */
function ConfidenceRing({ pct, isRejected }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const color = isRejected ? "#ba1a1a" : "#16a34a";
  return (
    <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="transparent"
          stroke="#e6e8ea"
          strokeWidth="10"
        />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="transparent"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: "stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[32px] font-bold leading-none tracking-tight text-primary font-display">
          {pct}%
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant mt-1">
          Confidence
        </span>
      </div>
    </div>
  );
}

/* ── SHAP row with diverging bar ── */
function ShapRow({ label, value, maxAbs, index }) {
  const isPos = value >= 0;
  // Each side occupies up to 45% of the track width
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
      {/* Label */}
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

      {/* Value */}
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

/* ════════════════════════════════════════
   ROOT COMPONENT
════════════════════════════════════════ */
export default function App() {
  const [form, setForm] = useState({
    city: "102",
    income: "68500",
    credit_score: "582",
    loan_amount: "450000",
    years_employed: "3",
    points: "12",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const resultRef = useRef(null);

  const setField = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const evaluate = async () => {
    setError(null);
    const parsed = {};
    for (const { key, label } of FORM_FIELDS) {
      const n = parseFloat(form[key]);
      if (isNaN(n)) {
        setError(`"${label}" must be a valid number.`);
        return;
      }
      parsed[key] = n;
    }
    setLoading(true);
    setResult(null);
    try {
      const data = await runEvaluation(parsed);
      setResult(data);
      setTimeout(
        () =>
          resultRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          }),
        120
      );
    } catch {
      setError("Backend connection failed. Check your FastAPI endpoint.");
    } finally {
      setLoading(false);
    }
  };

  const maxAbs = result
    ? Math.max(...Object.values(result.raw_data).map(Math.abs))
    : 1;
  const confPct = result ? Math.round(result.confidence * 100) : 0;

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col font-sans">
      {/* ═══════════════════════════════════
          TOP APP BAR
      ═══════════════════════════════════ */}
      <header
        className="bg-surface-container-lowest border-b border-outline-variant
        flex justify-between items-center px-6 py-3 w-full sticky top-0 z-50 shadow-sm"
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Icon name="account_balance" size={30} className="text-primary" />
          <h1 className="text-[22px] font-bold text-primary tracking-tight leading-none">
            LendClear AI
          </h1>
        </div>

        {/* Center search */}
        <div
          className="hidden md:flex items-center gap-2 px-4 py-2
          bg-surface-container-low rounded-full border border-outline-variant w-72"
        >
          <Icon name="search" size={18} className="text-on-surface-variant" />
          <input
            className="bg-transparent border-none focus:ring-0 outline-none text-[14px]
              text-on-surface placeholder:text-on-surface-variant w-full"
            placeholder="Search applications..."
          />
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <button
            className="w-9 h-9 flex items-center justify-center rounded-full
            hover:bg-surface-container-high transition-colors text-on-surface-variant"
          >
            <Icon name="notifications" size={22} />
          </button>
          <div
            className="flex items-center gap-2 cursor-pointer
            hover:bg-surface-container-high px-2 py-1 rounded-full transition-colors"
          >
            <div
              className="w-8 h-8 rounded-full bg-primary-container flex items-center
              justify-center border border-outline-variant overflow-hidden"
            >
              <span className="text-[11px] font-bold text-on-primary-container">
                AR
              </span>
            </div>
            <Icon
              name="expand_more"
              size={18}
              className="text-on-surface-variant"
            />
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════
          BODY — sidebar + main
      ═══════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden">
        {/* ─── SIDEBAR ─── */}
        <aside
          className="hidden lg:flex flex-col w-64 sticky top-[57px]
          h-[calc(100vh-57px)] p-4 gap-2 bg-surface-container-low
          border-r border-outline-variant overflow-y-auto flex-shrink-0"
        >
          {/* User block */}
          <div className="flex flex-col gap-1 mb-4 p-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
              Workspace
            </p>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg bg-primary flex items-center
                justify-center flex-shrink-0 shadow-sm"
              >
                <Icon
                  name="shield_person"
                  size={20}
                  className="text-on-primary"
                />
              </div>
              <div>
                <p className="text-[16px] font-semibold text-primary leading-tight">
                  Alex Rivers
                </p>
                <p className="text-[11px] font-semibold text-on-surface-variant tracking-wide">
                  Principal Analyst
                </p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex flex-col gap-1 flex-1">
            {NAV_ITEMS.map(({ icon, label, active, divider }) => (
              <div key={label}>
                {divider && <div className="h-px bg-outline-variant my-2" />}
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-all
                    text-[12px] font-semibold tracking-wider uppercase
                    ${
                      active
                        ? "bg-primary text-on-primary shadow-sm"
                        : "text-on-surface-variant hover:bg-surface-variant hover:text-on-surface"
                    }`}
                >
                  <Icon name={icon} size={20} />
                  <span>{label}</span>
                </a>
              </div>
            ))}
          </nav>

          {/* Engine status */}
          <div className="mt-auto p-3 bg-surface-container-highest rounded-xl">
            <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
              Engine Status
            </p>
            <div className="flex items-center gap-2 mt-2 text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
              <span className="font-mono text-[13px] font-medium">
                Gemini-Pro Active
              </span>
            </div>
          </div>
        </aside>

        {/* ═══════════════════════════════════
            MAIN CONTENT
        ═══════════════════════════════════ */}
        <main className="flex-1 overflow-y-auto p-6 bg-surface">
          <div className="max-w-7xl mx-auto">
            {/* Page title */}
            <div className="mb-6">
              <h2 className="text-[36px] font-bold text-primary tracking-tight leading-tight">
                Loan Evaluation Dashboard
              </h2>
              <p className="text-[16px] text-on-surface-variant mt-1">
                Precision analytical processing for risk assessment.
              </p>
            </div>

            {/* 12-col grid */}
            <div className="grid grid-cols-12 gap-6">
              {/* ══════════════════════════
                  LEFT — INPUT FORM
              ══════════════════════════ */}
              <section className="col-span-12 xl:col-span-4">
                <div
                  className="bg-surface-container-lowest border border-outline-variant
                  rounded-xl p-6 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <Icon name="edit_note" size={24} className="text-primary" />
                    <h3 className="text-[20px] font-semibold text-primary">
                      Applicant Metrics
                    </h3>
                  </div>

                  {/* Inputs */}
                  <div className="flex flex-col gap-4">
                    {FORM_FIELDS.map(({ key, label, placeholder }) => (
                      <div key={key} className="flex flex-col gap-2">
                        <label
                          className="text-[11px] font-bold uppercase tracking-widest
                          text-on-surface-variant"
                        >
                          {label}
                        </label>
                        <input
                          type="number"
                          value={form[key]}
                          placeholder={placeholder}
                          onChange={(e) => setField(key)(e.target.value)}
                          className="bg-surface-container-low border border-outline-variant
                            rounded-lg px-4 py-3 outline-none transition-all
                            font-mono text-[14px] text-on-surface
                            focus:ring-2 focus:ring-primary focus:border-primary
                            placeholder:text-outline"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Error */}
                  {error && (
                    <div
                      className="mt-4 flex items-center gap-2 bg-error-container
                      text-on-error-container rounded-lg px-4 py-3 text-[14px]"
                    >
                      <Icon name="error" size={18} />
                      {error}
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    onClick={evaluate}
                    disabled={loading}
                    className="mt-6 w-full bg-primary text-on-primary
                      text-[18px] font-semibold py-4 rounded-lg shadow-md
                      hover:opacity-90 active:scale-95 transition-all
                      flex items-center justify-center gap-2
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Spinner size={20} /> Evaluating…
                      </>
                    ) : (
                      <>
                        <Icon name="rocket_launch" size={20} /> Evaluate
                        Application
                      </>
                    )}
                  </button>
                </div>
              </section>

              {/* ══════════════════════════
                  RIGHT — RESULTS
              ══════════════════════════ */}
              <section
                ref={resultRef}
                className="col-span-12 xl:col-span-8 flex flex-col gap-6"
              >
                {/* Empty state */}
                {!result && !loading && (
                  <div
                    className="flex-1 flex flex-col items-center justify-center
                    border-2 border-dashed border-outline-variant rounded-xl
                    p-16 text-center min-h-[420px]"
                  >
                    <Icon
                      name="bar_chart"
                      size={52}
                      className="text-outline-variant mb-4"
                    />
                    <p className="text-[20px] font-semibold text-on-surface-variant">
                      Awaiting Evaluation
                    </p>
                    <p className="text-[14px] text-on-surface-variant mt-2 max-w-xs leading-relaxed">
                      Fill in the applicant metrics on the left and click
                      "Evaluate Application" to run the AI risk engine.
                    </p>
                  </div>
                )}

                {/* Loading */}
                {loading && (
                  <div
                    className="flex-1 flex flex-col items-center justify-center
                    min-h-[420px] gap-4"
                  >
                    <div
                      className="w-16 h-16 rounded-full border-4 border-outline-variant
                      border-t-primary animate-spin"
                    />
                    <p className="text-[18px] font-semibold text-on-surface-variant">
                      Running ML inference…
                    </p>
                    <p className="text-[13px] text-on-surface-variant font-mono animate-pulse">
                      Processing SHAP attribution values
                    </p>
                  </div>
                )}

                {/* ── RESULTS ── */}
                {result && !loading && (
                  <>
                    {/* ── Row 1: Decision + Confidence ── */}
                    <div
                      className="grid grid-cols-1 md:grid-cols-2 gap-6"
                      style={{ animation: "fadeUp 0.4s ease both" }}
                    >
                      {/* Decision card */}
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
                          <div className="flex items-center gap-4">
                            <span
                              className={`px-5 py-2 text-[22px] font-semibold rounded-full
                              border shadow-sm leading-tight
                              ${
                                result.approved
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                  : "bg-error-container text-on-error-container border-error"
                              }`}
                            >
                              {result.status}
                            </span>
                            <Icon
                              name={result.approved ? "check_circle" : "cancel"}
                              size={44}
                              className={
                                result.approved
                                  ? "text-emerald-600"
                                  : "text-error"
                              }
                            />
                          </div>
                          <p className="mt-5 text-[14px] text-on-surface-variant leading-relaxed">
                            {result.approved
                              ? "The AI engine confirms acceptable delinquency probability. Risk metrics are within approved parameters for this loan tier."
                              : "The AI engine identifies high delinquency probability based on historical profiles and current volatility metrics."}
                          </p>
                        </div>
                      </div>

                      {/* Confidence ring card */}
                      <div
                        className="bg-surface-container-lowest border border-outline-variant
                        rounded-xl p-6 shadow-sm flex flex-col items-center justify-center
                        min-h-[220px] relative overflow-hidden"
                      >
                        {/* Subtle bg decoration */}
                        <div
                          className="absolute inset-0 opacity-[0.03] pointer-events-none"
                          style={{
                            backgroundImage:
                              "radial-gradient(circle at 50% 50%, #000 1px, transparent 1px)",
                            backgroundSize: "24px 24px",
                          }}
                        />
                        <div className="relative z-10 w-full text-center">
                          <ConfidenceRing
                            pct={confPct}
                            isRejected={!result.approved}
                          />
                        </div>
                      </div>
                    </div>

                    {/* ── Row 2: AI Reasoning ── */}
                    <div
                      className={`rounded-xl p-6 shadow-md border-l-4
                        ${
                          result.approved
                            ? "bg-primary-container border-emerald-600"
                            : "bg-primary-container border-error"
                        }`}
                      style={{
                        animation: "fadeUp 0.4s ease both",
                        animationDelay: "100ms",
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <Icon
                          name="psychology"
                          size={32}
                          className="text-tertiary-fixed-dim flex-shrink-0 mt-0.5"
                        />
                        <div className="flex-1">
                          <h3 className="text-[20px] font-semibold text-on-primary mb-2">
                            AI Evaluation Reasoning
                          </h3>
                          <p className="text-[16px] text-on-primary-container leading-relaxed">
                            {/* Bold the key factor inside the message */}
                            {result.ai_voice_message
                              .split(result.top_reason)
                              .map((part, i, arr) => (
                                <span key={i}>
                                  {part}
                                  {i < arr.length - 1 && (
                                    <span
                                      className={`font-bold text-on-primary underline
                                    decoration-2 underline-offset-4
                                    ${
                                      result.approved
                                        ? "decoration-emerald-500"
                                        : "decoration-error"
                                    }`}
                                    >
                                      {result.top_reason}
                                    </span>
                                  )}
                                </span>
                              ))}
                          </p>
                          <div className="mt-3 flex items-center gap-2 opacity-60">
                            <Icon
                              name="settings_voice"
                              size={16}
                              className="text-on-primary-container"
                            />
                            <span className="text-[12px] italic text-on-primary-container">
                              Gemini Voice engine is currently on standby
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ── Row 3: SHAP Attribution ── */}
                    <div
                      className="bg-surface-container-lowest border border-outline-variant
                        rounded-xl p-6 shadow-sm"
                      style={{
                        animation: "fadeUp 0.4s ease both",
                        animationDelay: "200ms",
                      }}
                    >
                      {/* Header */}
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
                        <span
                          className="text-[11px] font-bold uppercase tracking-widest
                          text-on-surface-variant"
                        >
                          Variable
                        </span>
                        <span
                          className="text-[11px] font-bold uppercase tracking-widest
                          text-on-surface-variant text-center"
                        >
                          Impact Magnitude
                        </span>
                        <span
                          className="text-[11px] font-bold uppercase tracking-widest
                          text-on-surface-variant text-right"
                        >
                          Value
                        </span>
                      </div>

                      {/* Rows — sorted by absolute magnitude */}
                      <div>
                        {Object.entries(result.raw_data)
                          .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
                          .map(([key, value], i) => (
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
                      <div
                        className="mt-6 pt-4 border-t border-surface-container-high
                        flex justify-end"
                      >
                        <button
                          className="flex items-center gap-2 text-primary
                          text-[12px] font-bold uppercase tracking-widest
                          hover:underline transition-all"
                        >
                          <Icon name="download" size={16} />
                          Export Detail Report (PDF)
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </section>
            </div>
            {/* /grid */}
          </div>
          {/* /max-w */}
        </main>
      </div>
      {/* /body */}
    </div>
  );
}
