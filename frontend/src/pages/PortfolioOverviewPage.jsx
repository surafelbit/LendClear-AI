import { useState, useEffect } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { Animate } from "../components/ui/Animate";

/* ─── API ─── */
const STATS_URL = "http://localhost:8000/history/summary/stats";
const HISTORY_URL = "http://localhost:8000/history/";

/* ─── FORMATTERS ─── */
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
const fmtTS = (ts) =>
  !ts
    ? "—"
    : new Date(ts).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
const normConf = (raw) => {
  const n = parseFloat(raw);
  return isNaN(n) ? null : Math.round(n > 1 ? n : n * 100);
};
const initials = (name) => {
  if (!name?.trim()) return "??";
  const p = name.trim().split(" ");
  return p.length >= 2
    ? (p[0][0] + p[p.length - 1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase();
};
const toTitle = (key) =>
  key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

/* ─── SKELETON ─── */
function Sk({ className = "" }) {
  return (
    <div
      className={`bg-surface-container-high rounded animate-pulse ${className}`}
    />
  );
}

/* ─── STAT CARD ─── */
function StatCard({ label, value, sub, loading, badge, children, delay = 0 }) {
  return (
    <Animate variant="fadeUp" delay={delay}>
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex flex-col gap-3 h-full">
        <div className="flex items-start justify-between">
          <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
            {label}
          </p>
          {badge && (
            <span className="text-[11px] font-bold text-on-tertiary-container">
              {badge}
            </span>
          )}
        </div>
        {loading ? (
          <Sk className="h-9 w-28" />
        ) : (
          <p className="text-[34px] font-bold text-primary tracking-tight leading-none">
            {value}
          </p>
        )}
        {sub && !loading && (
          <p className="text-[11px] text-on-surface-variant">{sub}</p>
        )}
        {children}
      </div>
    </Animate>
  );
}

/* ─── APPROVAL BAR ─── */
function ApprovalBar({ pct, loading }) {
  const p = Math.min(parseFloat(pct) || 0, 100);
  if (loading) return <Sk className="h-1.5 w-full" />;
  return (
    <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
      <div
        className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
        style={{ width: `${p}%` }}
      />
    </div>
  );
}

/* ─── STATUS BADGE ─── */
function StatusBadge({ status }) {
  const ok = status === "Accepted";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold
      ${
        ok
          ? "bg-emerald-100 text-emerald-800"
          : "bg-error-container text-on-error-container"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          ok ? "bg-emerald-500" : "bg-error"
        }`}
      />
      {status ?? "—"}
    </span>
  );
}

/* ─── CHEVRON ─── */
function Chevron({ open }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
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

/* ─── RECHARTS CUSTOM TOOLTIP ─── */
function ShapTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 shadow-lg">
      <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
        {d.label}
      </p>
      <p
        className={`text-[14px] font-bold font-mono ${
          d.value >= 0 ? "text-emerald-600" : "text-error"
        }`}
      >
        {d.value >= 0 ? "+" : ""}
        {d.value.toFixed(4)}
      </p>
      <p className="text-[10px] text-on-surface-variant mt-0.5">
        {d.value >= 0
          ? "↑ Pushed toward approval"
          : "↓ Pulled toward rejection"}
      </p>
    </div>
  );
}

/* ─── SHAP RECHARTS FORCE PLOT ─── */
function ShapForcePlot({ rawShapData }) {
  if (!rawShapData || Object.keys(rawShapData).length === 0) {
    return (
      <div className="flex items-center justify-center h-20 border border-outline-variant rounded-lg">
        <p className="text-[12px] text-on-surface-variant italic">
          No SHAP data available
        </p>
      </div>
    );
  }

  const chartData = Object.entries(rawShapData)
    .map(([key, value]) => ({
      label: toTitle(key),
      key,
      value: parseFloat(value),
    }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  const maxAbs = Math.max(...chartData.map((d) => Math.abs(d.value)), 0.01);
  const domain = [-maxAbs * 1.25, maxAbs * 1.25];
  const height = chartData.length * 42 + 50;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <p className="text-[13px] font-semibold text-on-surface">
            Risk Factor Attribution
          </p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-0.5">
            SHAP Impact Value Analysis
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-2 rounded-sm bg-emerald-500" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">
              Toward Approval
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-2 rounded-sm bg-error" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">
              Toward Rejection
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 4, right: 52, left: 8, bottom: 4 }}
            barSize={13}
          >
            <CartesianGrid
              horizontal={false}
              vertical
              strokeDasharray="3 3"
              stroke="#c6c6cd"
              opacity={0.4}
            />
            <XAxis
              type="number"
              domain={domain}
              tickCount={7}
              tick={{ fill: "#45464d", fontSize: 10, fontFamily: "monospace" }}
              axisLine={{ stroke: "#c6c6cd" }}
              tickLine={{ stroke: "#c6c6cd" }}
              tickFormatter={(v) =>
                v === 0 ? "0.00" : `${v >= 0 ? "+" : ""}${v.toFixed(2)}`
              }
            />
            <YAxis
              type="category"
              dataKey="label"
              width={110}
              tick={{ fill: "#45464d", fontSize: 11, fontFamily: "system-ui" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<ShapTooltip />}
              cursor={{ fill: "rgba(0,0,0,0.04)" }}
            />
            <ReferenceLine x={0} stroke="#76777d" strokeWidth={1.5} />
            <Bar dataKey="value" radius={[0, 3, 3, 0]}>
              {chartData.map((entry, i) => (
                <Cell
                  key={`cell-${i}`}
                  fill={entry.value >= 0 ? "#10b981" : "#ba1a1a"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ─── EXPANDED TRAY ─── */
function ExpandedTray({ record }) {
  const shapSrc = record.raw_shap_data ?? record.raw_data ?? {};
  const confPct = normConf(record.confidence);

  return (
    <tr>
      <td colSpan={8} className="p-0 border-b border-outline-variant">
        <div
          className="bg-surface-container-low border-t border-outline-variant px-6 py-6"
          style={{ animation: "expandDown 0.22s ease both" }}
        >
          {/* Meta strip */}
          <div className="flex items-center gap-6 mb-5 pb-4 border-b border-outline-variant flex-wrap">
            {[
              {
                label: "App ID",
                val: `APP-${String(record.id).padStart(4, "0")}`,
              },
              { label: "Date", val: fmtTS(record.timestamp) },
              { label: "City", val: record.city ?? "—" },
              {
                label: "Confidence",
                val: confPct != null ? `${confPct}%` : "—",
              },
              { label: "Top Factor", val: record.top_reason ?? "—" },
              { label: "Credit Score", val: fmtScore(record.credit_score) },
              { label: "Income", val: fmt$(record.income) },
              { label: "Loan Amount", val: fmt$(record.loan_amount) },
            ].map(({ label, val }) => (
              <div key={label}>
                <p className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">
                  {label}
                </p>
                <p className="text-[12px] font-semibold text-primary mt-0.5 font-mono">
                  {val}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            {/* AI Statement */}
            <div className="xl:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                  auto_awesome
                </span>
                <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                  AI Evaluation Statement
                </p>
              </div>

              {/* AI card */}
              <div className="bg-primary-container rounded-xl p-4 relative overflow-hidden">
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-secondary-container opacity-10 rounded-full blur-3xl pointer-events-none" />
                {record.ai_voice_message ? (
                  <blockquote className="text-[13px] text-on-primary-fixed italic leading-relaxed z-10 relative border-l-2 border-on-primary-container/30 pl-3">
                    "{record.ai_voice_message}"
                  </blockquote>
                ) : (
                  <p className="text-[12px] text-on-primary-container italic">
                    No statement recorded.
                  </p>
                )}
              </div>

              {/* Status + confidence */}
              <div className="flex items-center gap-3 mt-4">
                <StatusBadge status={record.status} />
                {confPct != null && (
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex-1 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          record.status === "Accepted"
                            ? "bg-emerald-500"
                            : "bg-error"
                        }`}
                        style={{ width: `${confPct}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-mono text-on-surface-variant">
                      {confPct}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* SHAP Chart */}
            <div className="xl:col-span-3 bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
              <ShapForcePlot rawShapData={shapSrc} />
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

/* ─── MAIN PAGE ─── */
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

  useEffect(() => {
    let dead = false;
    axios
      .get(STATS_URL, { timeout: 8000 })
      .then(({ data }) => {
        if (!dead) setStats(data);
      })
      .catch((e) => {
        if (!dead) setStatsError(e?.message ?? "Failed");
      })
      .finally(() => {
        if (!dead) setStatsLoading(false);
      });
    return () => {
      dead = true;
    };
  }, []);

  useEffect(() => {
    let dead = false;
    axios
      .get(HISTORY_URL, { timeout: 8000 })
      .then(({ data }) => {
        if (!dead) setHistory(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        if (!dead) setHistError(e?.message ?? "Failed");
      })
      .finally(() => {
        if (!dead) setHistLoading(false);
      });
    return () => {
      dead = true;
    };
  }, []);

  const filtered = history.filter((r) => {
    const q = search.toLowerCase();
    const ms =
      !q ||
      (r.applicant_name ?? "").toLowerCase().includes(q) ||
      (r.city ?? "").toLowerCase().includes(q) ||
      String(r.id).includes(q);
    const mf = filterStatus === "All" || r.status === filterStatus;
    return ms && mf;
  });

  const toggleRow = (id) => setExpandedId((p) => (p === id ? null : id));

  return (
    <>
      <style>{`
        @keyframes fadeUp    { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes expandDown{ from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div className="space-y-6">
        {/* PAGE HEADER */}
        <Animate variant="fadeDown" duration={500}>
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-[36px] font-bold text-primary tracking-tight leading-tight">
                Portfolio Overview
              </h2>
              <p className="text-[16px] text-on-surface-variant mt-1">
                Live risk analytics and loan eligibility decision feed.
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 border border-outline-variant rounded-full bg-surface-container-lowest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                Live
              </span>
            </div>
          </div>
        </Animate>

        {/* KPI CARDS */}
        {statsError ? (
          <Animate variant="fadeUp">
            <div
              className="flex items-center gap-3 bg-error-container text-on-error-container
              rounded-xl px-5 py-4 border border-error"
            >
              <span className="material-symbols-outlined text-[22px]">
                error
              </span>
              <div>
                <p className="text-[14px] font-semibold">Stats unavailable</p>
                <p className="text-[12px] opacity-80 font-mono mt-0.5">
                  {statsError} · GET /history/summary/stats
                </p>
              </div>
            </div>
          </Animate>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              label="Total Applications"
              value={
                stats ? Number(stats.total_applications).toLocaleString() : null
              }
              sub={!statsLoading ? `${history.length} records loaded` : null}
              badge={!statsLoading ? "+12% vs LY" : null}
              loading={statsLoading}
              delay={0}
            />
            <StatCard
              label="Approval Rate"
              value={stats ? fmtPct(stats.approval_rate_percentage) : null}
              sub={!statsLoading ? "of all processed applications" : null}
              badge={!statsLoading ? "Stable" : null}
              loading={statsLoading}
              delay={80}
            >
              <ApprovalBar
                pct={stats?.approval_rate_percentage}
                loading={statsLoading}
              />
            </StatCard>
            <StatCard
              label="Avg. Credit Score"
              value={stats ? fmtScore(stats.average_credit_score) : null}
              sub={!statsLoading ? "FICO scale 300–850" : null}
              badge={!statsLoading ? "+4.2%" : null}
              loading={statsLoading}
              delay={160}
            >
              {!statsLoading && stats && (
                <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{
                      width: `${Math.min(
                        ((stats.average_credit_score - 300) / 550) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              )}
            </StatCard>
          </div>
        )}

        {/* HISTORY TABLE */}
        <Animate variant="fadeUp" delay={200} threshold={0.05}>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-outline-variant flex-wrap">
              <div className="flex items-center gap-3">
                <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Loan Records
                </p>
                {!histLoading && (
                  <span className="text-[10px] font-mono text-on-surface-variant border border-outline-variant px-1.5 py-0.5 rounded">
                    {filtered.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] pointer-events-none">
                    person_search
                  </span>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name, city…"
                    className="pl-9 pr-4 py-2 bg-surface-container-low border border-outline-variant
                      rounded-lg text-[12px] text-on-surface placeholder:text-outline outline-none
                      focus:border-primary focus:ring-1 focus:ring-primary transition-all w-44"
                  />
                </div>
                <div className="flex items-center gap-1 bg-surface-container-low border border-outline-variant rounded-lg p-0.5">
                  {["All", "Accepted", "Rejected"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilterStatus(f)}
                      className={`px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wide transition-all
                        ${
                          filterStatus === f
                            ? "bg-primary text-on-primary shadow-sm"
                            : "text-on-surface-variant hover:text-on-surface"
                        }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant">
                    {[
                      "",
                      "Applicant",
                      "Location",
                      "Income",
                      "Credit Score",
                      "Requested",
                      "Status",
                      "Conf.",
                    ].map((h, i) => (
                      <th
                        key={i}
                        className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-on-surface-variant whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high">
                  {/* Skeletons */}
                  {histLoading &&
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 8 }).map((_, j) => (
                          <td key={j} className="px-5 py-4">
                            <Sk
                              className={`h-3 ${
                                [
                                  "w-6",
                                  "w-32",
                                  "w-20",
                                  "w-20",
                                  "w-16",
                                  "w-20",
                                  "w-16",
                                  "w-12",
                                ][j]
                              }`}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}

                  {/* Error */}
                  {histError && !histLoading && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-5 py-10 text-center text-[13px] text-on-surface-variant"
                      >
                        {histError}
                      </td>
                    </tr>
                  )}

                  {/* Empty */}
                  {!histLoading && !histError && filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-5 py-14 text-center">
                        <span className="material-symbols-outlined text-[44px] text-outline-variant block mb-3">
                          history
                        </span>
                        <p className="text-[14px] font-semibold text-on-surface-variant">
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
                      const ok = r.status === "Accepted";
                      const inits = initials(r.applicant_name);
                      const confPct = normConf(r.confidence);

                      return (
                        <>
                          <tr
                            key={r.id}
                            onClick={() => toggleRow(r.id)}
                            className={`cursor-pointer group transition-colors hover:bg-surface-bright
                            ${isOpen ? "bg-surface-container-low" : ""}`}
                            style={{
                              animation: `fadeUp .35s ease both ${idx * 40}ms`,
                            }}
                          >
                            {/* Chevron */}
                            <td className="px-5 py-3 w-10">
                              <span
                                className={`transition-colors ${
                                  isOpen
                                    ? "text-primary"
                                    : "text-outline group-hover:text-on-surface-variant"
                                }`}
                              >
                                <Chevron open={isOpen} />
                              </span>
                            </td>

                            {/* Applicant */}
                            <td className="px-5 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center
                                justify-center text-[11px] font-bold text-on-surface flex-shrink-0"
                                >
                                  {inits}
                                </div>
                                <div>
                                  <p className="font-semibold text-primary text-[13px] leading-tight">
                                    {r.applicant_name?.trim() || "—"}
                                  </p>
                                  <p className="text-[11px] text-on-surface-variant font-mono">
                                    APP-{String(r.id).padStart(4, "0")}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-3 text-on-surface-variant whitespace-nowrap">
                              {r.city ?? "—"}
                            </td>
                            <td className="px-5 py-3 whitespace-nowrap">
                              <span className="font-mono text-primary">
                                {fmt$(r.income)}
                              </span>
                            </td>
                            <td className="px-5 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-primary">
                                  {fmtScore(r.credit_score)}
                                </span>
                                <div className="w-10 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      ok ? "bg-emerald-500" : "bg-error"
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
                            <td className="px-5 py-3 whitespace-nowrap">
                              <span className="font-mono text-primary">
                                {fmt$(r.loan_amount)}
                              </span>
                            </td>
                            <td className="px-5 py-3 whitespace-nowrap">
                              <StatusBadge status={r.status} />
                            </td>
                            <td className="px-5 py-3 whitespace-nowrap">
                              {confPct != null ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-14 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        ok ? "bg-emerald-500" : "bg-error"
                                      }`}
                                      style={{ width: `${confPct}%` }}
                                    />
                                  </div>
                                  <span className="text-[11px] font-mono text-on-surface-variant">
                                    {confPct}%
                                  </span>
                                </div>
                              ) : (
                                <span className="text-on-surface-variant">
                                  —
                                </span>
                              )}
                            </td>
                          </tr>

                          {isOpen && (
                            <ExpandedTray key={`tray-${r.id}`} record={r} />
                          )}
                        </>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            {!histLoading && (
              <div className="px-5 py-3 border-t border-outline-variant bg-surface-container-low flex items-center justify-between">
                <span className="text-[11px] font-semibold text-on-surface-variant">
                  {filtered.length} record{filtered.length !== 1 ? "s" : ""}
                  {search || filterStatus !== "All" ? " · filtered" : ""}
                </span>
                <span className="text-[11px] text-on-surface-variant opacity-60">
                  Click any row to expand SHAP analysis ↕
                </span>
              </div>
            )}
          </div>
        </Animate>
      </div>
    </>
  );
}
