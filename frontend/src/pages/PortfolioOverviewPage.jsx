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

/* ─────────────────────────────────────────────
   API
───────────────────────────────────────────── */
const STATS_URL = "http://localhost:8000/history/summary/stats";
const HISTORY_URL = "http://localhost:8000/history/";

/* ─────────────────────────────────────────────
   HELPERS
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

const fmtInitials = (name) => {
  if (!name?.trim()) return "??";
  const p = name.trim().split(" ");
  return p.length >= 2
    ? (p[0][0] + p[p.length - 1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase();
};

// snake_case → Title Case
const toTitle = (key) =>
  key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

/* ─────────────────────────────────────────────
   SKELETON PULSE
───────────────────────────────────────────── */
function Sk({ w = "w-24", h = "h-4", className = "" }) {
  return (
    <div
      className={`bg-zinc-800 rounded animate-pulse ${w} ${h} ${className}`}
    />
  );
}

/* ─────────────────────────────────────────────
   CUSTOM RECHARTS TOOLTIP
───────────────────────────────────────────── */
function ShapTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 shadow-xl">
      <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
        {d.label}
      </p>
      <p
        className={`text-[14px] font-bold font-mono ${
          d.value >= 0 ? "text-white" : "text-zinc-400"
        }`}
      >
        {d.value >= 0 ? "+" : ""}
        {d.value.toFixed(4)}
      </p>
      <p className="text-[10px] text-zinc-600 mt-0.5">
        {d.value >= 0
          ? "↑ Pushed toward approval"
          : "↓ Pulled toward rejection"}
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SHAP FORCE PLOT  (Recharts horizontal diverging bar)
───────────────────────────────────────────── */
function ShapForcePlot({ rawShapData }) {
  if (!rawShapData || Object.keys(rawShapData).length === 0) {
    return (
      <div className="flex items-center justify-center h-24 border border-zinc-800 rounded-lg">
        <p className="text-[12px] text-zinc-600 italic">
          No SHAP data available
        </p>
      </div>
    );
  }

  // Build chart data sorted by absolute value descending
  const chartData = Object.entries(rawShapData)
    .map(([key, value]) => ({
      label: toTitle(key),
      key,
      value: parseFloat(value),
    }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  const maxAbs = Math.max(...chartData.map((d) => Math.abs(d.value)), 0.01);
  const domain = [-maxAbs * 1.2, maxAbs * 1.2];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500">
            SHAP Impact Analysis
          </p>
          <p className="text-[10px] text-zinc-700 mt-0.5">
            Force plot — bars show each feature's contribution to the decision
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-2 bg-white rounded-sm" />
            <span className="text-[9px] text-zinc-600 uppercase tracking-wider font-bold">
              Toward Approval
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-2 bg-zinc-600 border border-zinc-500 rounded-sm" />
            <span className="text-[9px] text-zinc-600 uppercase tracking-wider font-bold">
              Toward Rejection
            </span>
          </div>
        </div>
      </div>

      {/* Recharts horizontal bar chart */}
      <ResponsiveContainer width="100%" height={chartData.length * 38 + 40}>
        <BarChart
          layout="vertical"
          data={chartData}
          margin={{ top: 0, right: 48, left: 8, bottom: 0 }}
          barSize={14}
        >
          <CartesianGrid
            horizontal={false}
            vertical={true}
            strokeDasharray="3 3"
            stroke="#27272a"
          />

          <XAxis
            type="number"
            domain={domain}
            tickCount={7}
            tick={{ fill: "#52525b", fontSize: 10, fontFamily: "monospace" }}
            axisLine={{ stroke: "#3f3f46" }}
            tickLine={{ stroke: "#3f3f46" }}
            tickFormatter={(v) =>
              v === 0 ? "0" : `${v >= 0 ? "+" : ""}${v.toFixed(2)}`
            }
          />

          <YAxis
            type="category"
            dataKey="label"
            width={100}
            tick={{ fill: "#a1a1aa", fontSize: 11, fontFamily: "system-ui" }}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip
            content={<ShapTooltip />}
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
          />

          {/* Zero reference line */}
          <ReferenceLine
            x={0}
            stroke="#52525b"
            strokeWidth={1.5}
            strokeDasharray="0"
          />

          <Bar dataKey="value" radius={[0, 3, 3, 0]}>
            {chartData.map((entry, i) => (
              <Cell
                key={`cell-${i}`}
                fill={entry.value >= 0 ? "#ffffff" : "#52525b"}
                stroke={entry.value >= 0 ? "transparent" : "#71717a"}
                strokeWidth={entry.value < 0 ? 1 : 0}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─────────────────────────────────────────────
   KPI CARD
───────────────────────────────────────────── */
function KpiCard({ label, value, sub, loading, children }) {
  return (
    <div
      className="border border-zinc-800 rounded-lg p-5 flex flex-col gap-3 bg-zinc-950"
      style={{ animation: "fadeUp 0.4s ease both" }}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600">
        {label}
      </p>
      {loading ? (
        <Sk w="w-32" h="h-9" />
      ) : (
        <p className="text-[34px] font-bold text-white leading-none tracking-tight">
          {value}
        </p>
      )}
      {sub && !loading && <p className="text-[11px] text-zinc-600">{sub}</p>}
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
   APPROVAL PROGRESS BAR
───────────────────────────────────────────── */
function ApprovalBar({ pct, loading }) {
  const p = Math.min(parseFloat(pct) || 0, 100);
  if (loading) return <Sk w="w-full" h="h-1" />;
  return (
    <div className="w-full h-px bg-zinc-800 rounded-full overflow-hidden mt-1">
      <div
        className="h-full bg-white rounded-full transition-all duration-1000 ease-out"
        style={{ width: `${p}%` }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────
   STATUS BADGE  (outlined monochrome)
───────────────────────────────────────────── */
function StatusBadge({ status }) {
  const ok = status === "Accepted";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px]
      font-bold uppercase tracking-wider border
      ${
        ok ? "border-zinc-500 text-zinc-200" : "border-zinc-700 text-zinc-500"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          ok ? "bg-white" : "bg-zinc-600"
        }`}
      />
      {status ?? "—"}
    </span>
  );
}

/* ─────────────────────────────────────────────
   CHEVRON SVG
───────────────────────────────────────────── */
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
      className={`transition-transform duration-250 ${
        open ? "rotate-180" : ""
      }`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   EXPANDED DETAIL TRAY
───────────────────────────────────────────── */
function ExpandedTray({ record }) {
  const shapSrc = record.raw_shap_data ?? record.raw_data ?? {};

  return (
    <tr>
      <td colSpan={8} className="p-0 border-b border-zinc-900">
        <div
          className="bg-zinc-950 border-t border-zinc-800 px-8 py-6"
          style={{ animation: "expandDown 0.2s ease both" }}
        >
          {/* Meta strip */}
          <div className="flex items-center gap-6 mb-6 pb-4 border-b border-zinc-900">
            {[
              {
                label: "App ID",
                val: `APP-${String(record.id).padStart(4, "0")}`,
              },
              { label: "Date", val: fmtTS(record.timestamp) },
              { label: "City", val: record.city ?? "—" },
              {
                label: "Confidence",
                val: `${normalizeConf(record.confidence) ?? "—"}%`,
              },
              { label: "Top Factor", val: record.top_reason ?? "—" },
              { label: "Credit Score", val: fmtScore(record.credit_score) },
            ].map(({ label, val }) => (
              <div key={label} className="flex flex-col gap-0.5">
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-700">
                  {label}
                </p>
                <p className="text-[12px] font-semibold text-zinc-300 font-mono">
                  {val}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
            {/* LEFT — AI Voice Message */}
            <div className="xl:col-span-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600 mb-3 flex items-center gap-2">
                <span className="w-4 h-px bg-zinc-700 inline-block" />
                AI Evaluation Statement
              </p>
              {record.ai_voice_message ? (
                <blockquote
                  className="text-[13px] text-zinc-400 italic leading-[1.8]
                  border-l border-zinc-700 pl-4"
                >
                  "{record.ai_voice_message}"
                </blockquote>
              ) : (
                <p className="text-[12px] text-zinc-700 italic">
                  No statement recorded.
                </p>
              )}

              {/* Status + confidence summary */}
              <div className="mt-5 flex items-center gap-3">
                <StatusBadge status={record.status} />
                {normalizeConf(record.confidence) != null && (
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-px bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-zinc-400 rounded-full"
                        style={{
                          width: `${normalizeConf(record.confidence)}%`,
                        }}
                      />
                    </div>
                    <span className="text-[11px] font-mono text-zinc-500">
                      {normalizeConf(record.confidence)}% certainty
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT — SHAP Force Plot */}
            <div className="xl:col-span-3">
              <ShapForcePlot rawShapData={shapSrc} />
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

/* ─────────────────────────────────────────────
   MAIN PAGE
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

  /* ── Fetch history ── */
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
    const matchSearch =
      !q ||
      (r.applicant_name ?? "").toLowerCase().includes(q) ||
      (r.city ?? "").toLowerCase().includes(q) ||
      String(r.id).includes(q);
    const matchStatus = filterStatus === "All" || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const toggleRow = (id) => setExpandedId((p) => (p === id ? null : id));

  return (
    <>
      <style>{`
        @keyframes fadeUp    { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes expandDown{ from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* ── DARK SHELL ── */}
      <div
        className="min-h-screen bg-zinc-950 text-white -m-6 p-6"
        style={{ fontFamily: "'DM Mono', 'JetBrains Mono', monospace" }}
      >
        {/* PAGE HEADER */}
        <div
          className="border-b border-zinc-800 pb-6 mb-8"
          style={{ animation: "fadeUp .35s ease both" }}
        >
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-zinc-600 mb-1">
                LendClear AI · Portfolio
              </p>
              <h1
                className="text-[28px] font-bold text-white tracking-tight leading-none"
                style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
              >
                Risk Overview
              </h1>
              <p className="text-[13px] text-zinc-600 mt-1.5">
                Live eligibility analytics and decision feed
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 border border-zinc-800 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Live
              </span>
            </div>
          </div>
        </div>

        {/* KPI CARDS */}
        {statsError ? (
          <div
            className="border border-zinc-800 rounded-lg px-5 py-4 flex items-center gap-3 mb-8 bg-zinc-900"
            style={{ animation: "fadeUp .4s ease both" }}
          >
            <span className="text-zinc-500 text-xl">⚠</span>
            <div>
              <p className="text-[13px] font-semibold text-zinc-300">
                Stats unavailable
              </p>
              <p className="text-[11px] text-zinc-600 mt-0.5 font-mono">
                {statsError} · GET /history/summary/stats
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <KpiCard
              label="Total Applications"
              value={
                stats ? Number(stats.total_applications).toLocaleString() : null
              }
              sub={!statsLoading ? `${history.length} records loaded` : null}
              loading={statsLoading}
            />

            <KpiCard
              label="Approval Rate"
              value={stats ? fmtPct(stats.approval_rate_percentage) : null}
              sub={!statsLoading ? "of all processed applications" : null}
              loading={statsLoading}
            >
              <ApprovalBar
                pct={stats?.approval_rate_percentage}
                loading={statsLoading}
              />
            </KpiCard>

            <KpiCard
              label="Avg. Credit Score"
              value={stats ? fmtScore(stats.average_credit_score) : null}
              sub={!statsLoading ? "FICO scale 300–850" : null}
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

        {/* HISTORY TABLE */}
        <div
          className="border border-zinc-800 rounded-lg overflow-hidden"
          style={{ animation: "fadeUp .4s ease both .1s" }}
        >
          {/* Toolbar */}
          <div
            className="flex items-center justify-between gap-4 px-5 py-3.5
            border-b border-zinc-800 flex-wrap bg-zinc-950"
          >
            <div className="flex items-center gap-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600">
                Loan Records
              </p>
              {!histLoading && (
                <span
                  className="text-[10px] font-mono text-zinc-700 border border-zinc-800
                  px-1.5 py-0.5 rounded"
                >
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
                  className="bg-zinc-900 border border-zinc-800 rounded text-[11px]
                    text-zinc-300 placeholder:text-zinc-700 px-3 py-2 outline-none w-44
                    focus:border-zinc-600 transition-colors font-mono"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-700
                      hover:text-zinc-400 text-[12px]"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Filter pills */}
              <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded p-0.5 gap-0.5">
                {["All", "Accepted", "Rejected"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilterStatus(f)}
                    className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wide
                      transition-all
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

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950">
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
                      className="px-5 py-3 text-left text-[9px] font-bold uppercase
                      tracking-[0.18em] text-zinc-700 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {/* Skeletons */}
                {histLoading &&
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-zinc-900">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-5 py-4">
                          <Sk
                            w={`w-${[8, 24, 16, 16, 12, 16, 14, 10][j] || 16}`}
                            h="h-3"
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
                      className="px-5 py-10 text-center text-zinc-700 text-[12px] font-mono"
                    >
                      {histError}
                    </td>
                  </tr>
                )}

                {/* Empty */}
                {!histLoading && !histError && filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-12 text-center text-zinc-700 text-[12px]"
                    >
                      {search || filterStatus !== "All"
                        ? "No records match your filters."
                        : "No applications recorded yet."}
                    </td>
                  </tr>
                )}

                {/* Data rows */}
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
                          className={`border-b cursor-pointer group transition-colors duration-150
                          ${
                            isOpen
                              ? "bg-zinc-900 border-zinc-800"
                              : "border-zinc-900 hover:bg-zinc-900/50"
                          }`}
                          style={{
                            animation: `fadeUp .35s ease both ${idx * 35}ms`,
                          }}
                        >
                          {/* Expand toggle */}
                          <td className="px-5 py-4 w-10">
                            <span
                              className={`transition-colors ${
                                isOpen
                                  ? "text-zinc-400"
                                  : "text-zinc-700 group-hover:text-zinc-500"
                              }`}
                            >
                              <Chevron open={isOpen} />
                            </span>
                          </td>

                          {/* Applicant */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-7 h-7 rounded bg-zinc-800 border border-zinc-700
                              flex items-center justify-center text-[10px] font-bold text-zinc-400 flex-shrink-0"
                                style={{ fontFamily: "system-ui" }}
                              >
                                {initials}
                              </div>
                              <div>
                                <p
                                  className="font-semibold text-zinc-200 leading-tight"
                                  style={{
                                    fontFamily: "system-ui",
                                    fontSize: "13px",
                                  }}
                                >
                                  {r.applicant_name?.trim() || "—"}
                                </p>
                                <p
                                  className="text-zinc-700 font-mono"
                                  style={{ fontSize: "10px" }}
                                >
                                  APP-{String(r.id).padStart(4, "0")}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Location */}
                          <td className="px-5 py-4 text-zinc-500 whitespace-nowrap">
                            {r.city ?? "—"}
                          </td>

                          {/* Income */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="font-mono text-zinc-300">
                              {fmt$(r.income)}
                            </span>
                          </td>

                          {/* Credit score */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              <span className="font-mono font-bold text-white">
                                {fmtScore(r.credit_score)}
                              </span>
                              <div className="w-10 h-px bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    accepted ? "bg-zinc-300" : "bg-zinc-600"
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
                            <StatusBadge status={r.status} />
                          </td>

                          {/* Confidence */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            {confPct != null ? (
                              <span className="font-mono text-zinc-600 text-[11px]">
                                {confPct}%
                              </span>
                            ) : (
                              <span className="text-zinc-800">—</span>
                            )}
                          </td>
                        </tr>

                        {/* Expanded tray */}
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
            <div className="px-5 py-3 border-t border-zinc-900 flex items-center justify-between bg-zinc-950">
              <p className="text-[10px] font-mono text-zinc-700">
                {filtered.length} record{filtered.length !== 1 ? "s" : ""}
                {search || filterStatus !== "All" ? " · filtered" : ""}
              </p>
              <p className="text-[10px] font-mono text-zinc-800">
                ↕ click any row to expand SHAP analysis
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
