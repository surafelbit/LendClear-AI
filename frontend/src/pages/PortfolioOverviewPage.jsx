import { useState, useEffect } from "react";
import axios from "axios";

/* ─────────────────────────────────────────────
   API ENDPOINTS
───────────────────────────────────────────── */
const STATS_URL = "http://localhost:8000/history/summary/stats";
const HISTORY_URL = "http://localhost:8000/history/";

/* ─────────────────────────────────────────────
   FORMATTERS
───────────────────────────────────────────── */
const fmt$ = (n) =>
  n == null
    ? "—"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(n);

const fmtPct = (n) => (n == null ? "—" : `${parseFloat(n).toFixed(1)}%`);

const fmtScore = (n) => (n == null ? "—" : Math.round(n).toLocaleString());

const fmtName = (n) => n?.trim() || "—";

const fmtInitials = (name) => {
  if (!name?.trim()) return "??";
  const p = name.trim().split(" ");
  return p.length >= 2
    ? (p[0][0] + p[p.length - 1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase();
};

const fmtTS = (ts) => {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const normalizeConf = (raw) => {
  const n = parseFloat(raw);
  if (isNaN(n)) return null;
  return n > 1 ? Math.round(n) : Math.round(n * 100);
};

const SHAP_LABELS = {
  city: "Location",
  income: "Income",
  credit_score: "Credit Score",
  loan_amount: "Loan Amount",
  years_employed: "Employment",
  points: "Points",
};

/* ─────────────────────────────────────────────
   SKELETON
───────────────────────────────────────────── */
function Skeleton({ className = "" }) {
  return <div className={`bg-zinc-800 rounded animate-pulse ${className}`} />;
}

/* ─────────────────────────────────────────────
   KPI CARD
───────────────────────────────────────────── */
function KpiCard({ label, value, sub, loading, children }) {
  return (
    <div className="border border-zinc-800 rounded-lg p-5 flex flex-col gap-3 bg-zinc-950">
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">
        {label}
      </p>
      {loading ? (
        <Skeleton className="h-9 w-28" />
      ) : (
        <p className="text-[32px] font-bold text-white leading-none tracking-tight">
          {value}
        </p>
      )}
      {sub && !loading && <p className="text-[12px] text-zinc-500">{sub}</p>}
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
   APPROVAL PROGRESS BAR
───────────────────────────────────────────── */
function ApprovalBar({ pct, loading }) {
  const p = parseFloat(pct) || 0;
  return (
    <div className="flex flex-col gap-2">
      {loading ? (
        <Skeleton className="h-1.5 w-full" />
      ) : (
        <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-1000"
            style={{ width: `${Math.min(p, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   SHAP MINI CHART  (horizontal diverging bars)
───────────────────────────────────────────── */
function ShapChart({ data }) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <p className="text-[12px] text-zinc-600 italic">
        No SHAP data available.
      </p>
    );
  }

  const entries = Object.entries(data).sort(
    (a, b) => Math.abs(b[1]) - Math.abs(a[1])
  );
  const maxAbs = Math.max(...entries.map(([, v]) => Math.abs(v)), 0.001);

  return (
    <div className="flex flex-col gap-2.5">
      {entries.map(([key, val]) => {
        const isPos = val >= 0;
        const barW = Math.round((Math.abs(val) / maxAbs) * 44); // max 44% from center
        const label = SHAP_LABELS[key] ?? key;

        return (
          <div
            key={key}
            className="grid items-center gap-3"
            style={{ gridTemplateColumns: "90px 1fr 52px" }}
          >
            <span className="text-[11px] text-zinc-500 truncate">{label}</span>

            {/* Diverging track */}
            <div className="relative h-3 flex items-center">
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-zinc-700 z-10" />
              {isPos ? (
                <div
                  className="absolute h-2 bg-white rounded-r-sm"
                  style={{ left: "50%", width: `${barW}%` }}
                />
              ) : (
                <div
                  className="absolute h-2 bg-zinc-400 rounded-l-sm"
                  style={{ right: `${50 - barW}%`, width: `${barW}%` }}
                />
              )}
            </div>

            <span
              className={`text-[11px] font-mono font-bold text-right ${
                isPos ? "text-white" : "text-zinc-400"
              }`}
            >
              {isPos ? "+" : ""}
              {val.toFixed(3)}
            </span>
          </div>
        );
      })}

      {/* Legend */}
      <div className="flex items-center gap-5 pt-2 border-t border-zinc-800 mt-1">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1.5 bg-white rounded-sm" />
          <span className="text-[10px] text-zinc-600 uppercase tracking-wider">
            Positive
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1.5 bg-zinc-400 rounded-sm" />
          <span className="text-[10px] text-zinc-600 uppercase tracking-wider">
            Negative
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   EXPANDED ROW TRAY
───────────────────────────────────────────── */
function ExpandedTray({ record }) {
  const shapSrc = record.raw_shap_data ?? record.raw_data ?? {};

  return (
    <tr>
      <td colSpan={7} className="p-0 border-b border-zinc-800">
        <div
          className="bg-zinc-900 border-t border-zinc-800 px-6 py-5"
          style={{ animation: "expandDown 0.22s ease both" }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Explanation */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600 mb-3 flex items-center gap-2">
                <span className="inline-block w-3 h-px bg-zinc-600" />
                AI Evaluation Statement
              </p>
              {record.ai_voice_message ? (
                <blockquote
                  className="text-[13px] text-zinc-300 italic leading-relaxed
                  border-l-2 border-zinc-600 pl-4"
                >
                  "{record.ai_voice_message}"
                </blockquote>
              ) : (
                <p className="text-[12px] text-zinc-600 italic">
                  No AI message recorded.
                </p>
              )}

              {/* Meta row */}
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-4">
                {[
                  { label: "City", val: record.city ?? "—" },
                  {
                    label: "Confidence",
                    val: `${normalizeConf(record.confidence) ?? "—"}%`,
                  },
                  { label: "Date", val: fmtTS(record.timestamp) },
                  { label: "Top Factor", val: record.top_reason ?? "—" },
                ].map(({ label, val }) => (
                  <div key={label}>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                      {label}
                    </p>
                    <p className="text-[12px] font-semibold text-zinc-300 mt-0.5">
                      {val}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* SHAP chart */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600 mb-3 flex items-center gap-2">
                <span className="inline-block w-3 h-px bg-zinc-600" />
                Risk Factor Attribution
              </p>
              <ShapChart data={shapSrc} />
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

/* ─────────────────────────────────────────────
   STATUS BADGE
───────────────────────────────────────────── */
function StatusBadge({ status }) {
  const accepted = status === "Accepted";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold
      uppercase tracking-wider border
      ${
        accepted
          ? "border-zinc-600 text-zinc-200 bg-transparent"
          : "border-zinc-700 text-zinc-400 bg-transparent"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          accepted ? "bg-white" : "bg-zinc-500"
        }`}
      />
      {status ?? "—"}
    </span>
  );
}

/* ─────────────────────────────────────────────
   CHEVRON ICON (inline SVG — no dep needed)
───────────────────────────────────────────── */
function Chevron({ open }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform duration-200 ${
        open ? "rotate-180" : ""
      }`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   MAIN DASHBOARD PAGE
───────────────────────────────────────────── */
export default function PortfolioOverviewPage() {
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  const [history, setHistory] = useState([]);
  const [histLoading, setHistLoading] = useState(true);
  const [histError, setHistError] = useState(null);

  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  /* ── Fetch stats ── */
  useEffect(() => {
    let cancelled = false;
    axios
      .get(STATS_URL, { timeout: 8000 })
      .then(({ data }) => {
        if (!cancelled) setStats(data);
      })
      .catch((err) => {
        if (!cancelled) setStatsError(err?.message ?? "Failed");
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /* ── Fetch history ── */
  useEffect(() => {
    let cancelled = false;
    axios
      .get(HISTORY_URL, { timeout: 8000 })
      .then(({ data }) => {
        if (!cancelled) setHistory(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!cancelled) setHistError(err?.message ?? "Failed");
      })
      .finally(() => {
        if (!cancelled) setHistLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /* ── Filter ── */
  const filtered = history.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      (r.applicant_name ?? "").toLowerCase().includes(q) ||
      (r.city ?? "").toLowerCase().includes(q) ||
      String(r.id).includes(q);
    const matchStatus = filterStatus === "All" || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const toggleRow = (id) => setExpandedId((prev) => (prev === id ? null : id));

  const approvalPct = stats?.approval_rate_percentage ?? null;

  return (
    <>
      <style>{`
        @keyframes expandDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        className="min-h-screen bg-zinc-950 text-white"
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        <div className="max-w-7xl mx-auto px-0 py-0 space-y-0">
          {/* ── PAGE HEADER ── */}
          <div
            className="border-b border-zinc-800 pb-5 mb-8"
            style={{ animation: "fadeUp 0.35s ease both" }}
          >
            <div className="flex items-end justify-between flex-wrap gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-1">
                  LendClear AI · Portfolio
                </p>
                <h1 className="text-[32px] font-bold text-white tracking-tight leading-none">
                  Risk Overview
                </h1>
                <p className="text-[14px] text-zinc-500 mt-2">
                  Live analytics and eligibility decision feed.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Live
                </span>
              </div>
            </div>
          </div>

          {/* ── KPI CARDS ── */}
          {statsError ? (
            <div className="border border-zinc-800 rounded-lg px-5 py-4 flex items-center gap-3 mb-8 bg-zinc-900">
              <span className="text-zinc-500 text-[20px]">⚠</span>
              <div>
                <p className="text-[13px] font-semibold text-zinc-300">
                  Stats unavailable
                </p>
                <p className="text-[11px] text-zinc-600 mt-0.5">
                  {statsError} · Check{" "}
                  <code className="font-mono">GET /history/summary/stats</code>
                </p>
              </div>
            </div>
          ) : (
            <div
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
              style={{ animation: "fadeUp 0.4s ease both 0.05s" }}
            >
              {/* Total Applications */}
              <KpiCard
                label="Total Applications"
                value={
                  stats
                    ? Number(stats.total_applications).toLocaleString()
                    : null
                }
                sub={stats ? `${history.length} loaded` : null}
                loading={statsLoading}
              />

              {/* Approval Rate */}
              <KpiCard
                label="Approval Rate"
                value={approvalPct != null ? fmtPct(approvalPct) : null}
                sub={
                  approvalPct != null
                    ? `${parseFloat(approvalPct).toFixed(1)} of 100 target`
                    : null
                }
                loading={statsLoading}
              >
                <ApprovalBar pct={approvalPct} loading={statsLoading} />
              </KpiCard>

              {/* Avg Credit Score */}
              <KpiCard
                label="Avg. Credit Score"
                value={stats ? fmtScore(stats.average_credit_score) : null}
                sub={stats ? "FICO scale 300–850" : null}
                loading={statsLoading}
              >
                {!statsLoading && stats && (
                  <div className="w-full h-px bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-zinc-400 rounded-full"
                      style={{
                        width: `${Math.min(
                          ((stats.average_credit_score - 300) / 550) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                )}
              </KpiCard>
            </div>
          )}

          {/* ── HISTORY TABLE ── */}
          <div
            className="border border-zinc-800 rounded-lg overflow-hidden"
            style={{ animation: "fadeUp 0.4s ease both 0.1s" }}
          >
            {/* Table toolbar */}
            <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-zinc-800 flex-wrap">
              <div className="flex items-center gap-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500">
                  Loan Records
                </p>
                {!histLoading && (
                  <span className="text-[10px] font-mono text-zinc-700 border border-zinc-800 px-1.5 py-0.5 rounded">
                    {filtered.length}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name, city…"
                    className="bg-zinc-900 border border-zinc-800 rounded text-[12px] text-zinc-300
                      placeholder:text-zinc-700 px-3 py-2 pr-8 outline-none w-44
                      focus:border-zinc-600 transition-colors"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Status filter */}
                <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded p-0.5">
                  {["All", "Accepted", "Rejected"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilterStatus(f)}
                      className={`px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wide transition-all
                        ${
                          filterStatus === f
                            ? "bg-white text-zinc-950"
                            : "text-zinc-600 hover:text-zinc-300"
                        }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-zinc-800">
                    {[
                      "",
                      "Applicant",
                      "Location",
                      "Income",
                      "Credit Score",
                      "Requested",
                      "Status",
                    ].map((h, i) => (
                      <th
                        key={i}
                        className="px-5 py-3 text-left text-[10px] font-bold uppercase
                        tracking-[0.15em] text-zinc-600 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {/* Loading skeletons */}
                  {histLoading &&
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="border-b border-zinc-900">
                        {Array.from({ length: 7 }).map((_, j) => (
                          <td key={j} className="px-5 py-4">
                            <Skeleton
                              className="h-3 rounded"
                              style={{ width: `${50 + ((j * 11) % 40)}%` }}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}

                  {/* Error */}
                  {histError && !histLoading && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-5 py-10 text-center text-zinc-600 text-[13px]"
                      >
                        Failed to load history · {histError}
                      </td>
                    </tr>
                  )}

                  {/* Empty */}
                  {!histLoading && !histError && filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center">
                        <p className="text-zinc-600 text-[13px]">
                          {search || filterStatus !== "All"
                            ? "No records match your filters."
                            : "No applications yet."}
                        </p>
                      </td>
                    </tr>
                  )}

                  {/* Real rows */}
                  {!histLoading &&
                    filtered.map((r, idx) => {
                      const isOpen = expandedId === r.id;
                      const accepted = r.status === "Accepted";
                      const initials = fmtInitials(r.applicant_name);
                      const confPct = normalizeConf(r.confidence);

                      return (
                        <>
                          <tr
                            key={r.id}
                            onClick={() => toggleRow(r.id)}
                            className={`border-b border-zinc-900 cursor-pointer group transition-colors
                            ${isOpen ? "bg-zinc-900" : "hover:bg-zinc-900/60"}`}
                            style={{
                              animation: `fadeUp 0.35s ease both ${idx * 40}ms`,
                            }}
                          >
                            {/* Expand chevron */}
                            <td className="px-5 py-4 w-10">
                              <div
                                className={`text-zinc-600 group-hover:text-zinc-400 transition-colors
                              ${isOpen ? "text-zinc-400" : ""}`}
                              >
                                <Chevron open={isOpen} />
                              </div>
                            </td>

                            {/* Applicant */}
                            <td className="px-5 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-7 h-7 rounded-sm bg-zinc-800 border border-zinc-700
                                flex items-center justify-center text-[10px] font-bold text-zinc-400 flex-shrink-0"
                                >
                                  {initials}
                                </div>
                                <div>
                                  <p className="font-semibold text-white text-[13px] leading-tight">
                                    {fmtName(r.applicant_name)}
                                  </p>
                                  <p className="text-[10px] font-mono text-zinc-600">
                                    APP-{String(r.id).padStart(4, "0")}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Location */}
                            <td className="px-5 py-4">
                              <span className="text-zinc-400 text-[13px]">
                                {r.city ?? "—"}
                              </span>
                            </td>

                            {/* Income */}
                            <td className="px-5 py-4 whitespace-nowrap">
                              <span className="font-mono text-zinc-300">
                                {fmt$(r.income)}
                              </span>
                            </td>

                            {/* Credit score */}
                            <td className="px-5 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-white">
                                  {fmtScore(r.credit_score)}
                                </span>
                                {/* Mini score bar */}
                                <div className="w-12 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      accepted ? "bg-white" : "bg-zinc-500"
                                    }`}
                                    style={{
                                      width: `${Math.min(
                                        ((r.credit_score - 300) / 550) * 100,
                                        100
                                      )}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </td>

                            {/* Loan amount */}
                            <td className="px-5 py-4 whitespace-nowrap">
                              <span className="font-mono text-zinc-300">
                                {fmt$(r.loan_amount)}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="px-5 py-4 whitespace-nowrap">
                              <div className="flex items-center justify-between gap-3">
                                <StatusBadge status={r.status} />
                                {confPct != null && (
                                  <span className="text-[10px] font-mono text-zinc-600">
                                    {confPct}%
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>

                          {/* Expanded tray */}
                          {isOpen && (
                            <ExpandedTray key={`exp-${r.id}`} record={r} />
                          )}
                        </>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Table footer */}
            {!histLoading && filtered.length > 0 && (
              <div className="px-5 py-3 border-t border-zinc-800 flex items-center justify-between">
                <p className="text-[11px] text-zinc-700 font-mono">
                  {filtered.length} record{filtered.length !== 1 ? "s" : ""}
                  {search || filterStatus !== "All" ? " · filtered" : ""}
                </p>
                <p className="text-[11px] text-zinc-700 font-mono">
                  Click any row to expand AI analysis ↕
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
