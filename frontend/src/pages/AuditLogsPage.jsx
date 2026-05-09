import { useState, useEffect, useMemo } from "react";
import axios from "axios";

/* ─────────────────────────────────────────────
   CONFIG
───────────────────────────────────────────── */
const API_URL = "http://localhost:8000/history/";
const PAGE_SIZE = 8;

/* ─────────────────────────────────────────────
   FORMATTERS
───────────────────────────────────────────── */
function formatTimestamp(ts) {
  if (!ts) return { date: "—", time: "—" };
  const d = new Date(ts);
  const date = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return { date, time };
}

function formatCurrency(n) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function getInitials(city) {
  // Use city first two letters as avatar initials since API has no name field
  return (city ?? "NA").substring(0, 2).toUpperCase();
}

/* ─────────────────────────────────────────────
   SHAP LABELS (for modal chart — wire up later)
───────────────────────────────────────────── */
const SHAP_LABELS = {
  city: "Location Volatility",
  income: "Annual Income Impact",
  credit_score: "Credit Score Impact",
  loan_amount: "Loan Amount Impact",
  years_employed: "Years Employed Impact",
};

/* ─────────────────────────────────────────────
   DETAIL MODAL
───────────────────────────────────────────── */
function DetailModal({ record, onClose }) {
  if (!record) return null;
  const approved = record.status === "Accepted";
  const { date, time } = formatTimestamp(record.timestamp);

  // SHAP entries sorted by magnitude
  const shapEntries = record.raw_data
    ? Object.entries(record.raw_data).sort(
        (a, b) => Math.abs(b[1]) - Math.abs(a[1])
      )
    : [];
  const maxAbs = shapEntries.length
    ? Math.max(...shapEntries.map(([, v]) => Math.abs(v)))
    : 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-surface-container-lowest rounded-2xl border border-outline-variant
          shadow-2xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
              Application Details
            </p>
            <h3 className="text-[22px] font-bold text-primary tracking-tight mt-0.5">
              APP-{String(record.id).padStart(4, "0")}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center
              hover:bg-surface-container-high transition-colors text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Decision banner */}
        <div
          className={`rounded-xl px-4 py-3 flex items-center justify-between mb-5
            ${
              approved
                ? "bg-emerald-50 border border-emerald-200"
                : "bg-red-50 border border-red-200"
            }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
              ${approved ? "bg-emerald-600" : "bg-red-600"}`}
            >
              <span
                className="material-symbols-outlined text-white text-[20px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {approved ? "check_circle" : "cancel"}
              </span>
            </div>
            <div>
              <p
                className={`text-[18px] font-bold leading-none
                ${approved ? "text-emerald-900" : "text-red-900"}`}
              >
                {record.status}
              </p>
              <p
                className={`text-[12px] mt-0.5 ${
                  approved ? "text-emerald-700" : "text-red-700"
                }`}
              >
                Primary factor: {record.top_reason ?? "—"}
              </p>
            </div>
          </div>
        </div>

        {/* AI voice message */}
        {record.ai_voice_message && (
          <div className="bg-primary-container rounded-xl p-4 mb-5 relative overflow-hidden">
            <div
              className="absolute -top-6 -right-6 w-32 h-32 bg-secondary-container
              opacity-10 rounded-full blur-3xl pointer-events-none"
            />
            <div className="flex items-center gap-2 mb-2 z-10 relative">
              <span
                className="material-symbols-outlined text-secondary-container text-[18px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                auto_awesome
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-primary-container">
                AI Financial Analyst
              </span>
            </div>
            <p className="text-[13px] text-on-primary-fixed italic leading-relaxed z-10 relative">
              "{record.ai_voice_message}"
            </p>
          </div>
        )}

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            { label: "City", value: record.city ?? "—" },
            { label: "Annual Income", value: formatCurrency(record.income) },
            { label: "Loan Amount", value: formatCurrency(record.loan_amount) },
            { label: "Credit Score", value: record.credit_score ?? "—" },
            {
              label: "Years Employed",
              value:
                record.years_employed != null
                  ? `${record.years_employed} yrs`
                  : "—",
            },
            { label: "Top Reason", value: record.top_reason ?? "—" },
            { label: "Date", value: date },
            { label: "Time", value: time },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="bg-surface-container-low rounded-lg px-3 py-2.5"
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                {label}
              </p>
              <p className="text-[14px] font-semibold text-primary mt-0.5">
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* SHAP preview — ready for chart wiring */}
        {shapEntries.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[13px] font-semibold text-on-surface">
                  Risk Factor Breakdown
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  SHAP Impact Values
                </p>
              </div>
              {/* ← Wire your chart here later */}
            </div>

            {/* Axis labels */}
            <div
              className="flex text-[10px] font-bold uppercase tracking-widest
              text-on-surface-variant mb-2 px-1"
            >
              <span className="flex-1 text-right pr-2 text-error">← Hurts</span>
              <span className="w-px bg-outline-variant" />
              <span className="flex-1 pl-2 text-emerald-600">Helps →</span>
            </div>

            <div className="flex flex-col gap-3">
              {shapEntries.map(([key, value]) => {
                const isPos = value >= 0;
                const barPct = Math.round((Math.abs(value) / maxAbs) * 45);
                return (
                  <div key={key}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[12px] font-medium text-on-surface">
                        {SHAP_LABELS[key] ?? key}
                      </span>
                      <span
                        className={`text-[12px] font-bold font-mono
                        ${isPos ? "text-emerald-600" : "text-error"}`}
                      >
                        {isPos ? "+" : ""}
                        {value.toFixed(3)}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden flex">
                      {isPos ? (
                        <>
                          <div className="w-1/2" />
                          <div
                            className="h-full bg-emerald-500 rounded-r-full"
                            style={{ width: `${barPct}%` }}
                          />
                        </>
                      ) : (
                        <>
                          <div className="flex-1" />
                          <div
                            className="h-full bg-error rounded-l-full"
                            style={{ width: `${barPct}%` }}
                          />
                          <div className="w-1/2" />
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              console.log(
                "[LendClear] raw_data for APP-" +
                  String(record.id).padStart(4, "0") +
                  ":",
                record.raw_data
              );
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5
              border border-outline-variant rounded-lg text-[12px] font-bold uppercase
              tracking-widest text-on-surface-variant hover:bg-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">
              bar_chart
            </span>
            Log SHAP Data
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-primary text-on-primary rounded-lg
              text-[12px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SKELETON ROW (loading placeholder)
───────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-5 py-4">
          <div className="h-3 bg-surface-container-high rounded-full w-3/4" />
          {i === 1 && (
            <div className="h-2.5 bg-surface-container-high rounded-full w-1/2 mt-2" />
          )}
        </td>
      ))}
    </tr>
  );
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function AuditLogsPage() {
  /* ── Data state ── */
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  /* ── UI state ── */
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

  /* ── Fetch from FastAPI on mount ── */
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        const { data } = await axios.get(API_URL, { timeout: 10000 });
        if (!cancelled) setHistory(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) {
          const msg =
            err?.response?.data?.detail ??
            err?.message ??
            "Could not reach the backend.";
          setFetchError(msg);
          console.error("[LendClear] History fetch error:", err);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ── Derived stats (from real data) ── */
  const totalRecords = history.length;
  const approvedCount = history.filter((r) => r.status === "Accepted").length;
  const approvalRate =
    totalRecords > 0 ? Math.round((approvedCount / totalRecords) * 100) : 0;

  /* ── Filter + search ── */
  const filtered = useMemo(() => {
    return history.filter((r) => {
      const matchesFilter =
        filter === "All"
          ? true
          : filter === "Accepted"
          ? r.status === "Accepted"
          : filter === "Rejected"
          ? r.status === "Rejected"
          : true;

      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        (r.city ?? "").toLowerCase().includes(q) ||
        String(r.id).includes(q) ||
        (r.top_reason ?? "").toLowerCase().includes(q);

      return matchesFilter && matchesSearch;
    });
  }, [history, search, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilter = (f) => {
    setFilter(f);
    setPage(1);
  };
  const handleSearch = (v) => {
    setSearch(v);
    setPage(1);
  };

  /* ── Retry ── */
  const retry = () => {
    setHistory([]);
    setFetchError(null);
    setIsLoading(true);
    axios
      .get(API_URL, { timeout: 10000 })
      .then(({ data }) => setHistory(Array.isArray(data) ? data : []))
      .catch((err) => setFetchError(err?.message ?? "Failed to fetch."))
      .finally(() => setIsLoading(false));
  };

  return (
    <>
      <DetailModal record={selected} onClose={() => setSelected(null)} />

      <div className="space-y-6">
        {/* ── Page header ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-[36px] font-bold text-primary tracking-tight leading-tight">
              Evaluation History
            </h2>
            <p className="text-[16px] text-on-surface-variant mt-1">
              Audit and track historical loan eligibility decisions.
            </p>
          </div>

          {/* Search + filter */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <span
                className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2
                text-on-surface-variant text-[20px] pointer-events-none"
              >
                person_search
              </span>
              <input
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="City, ID or reason…"
                className="pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant
                  rounded-lg w-full md:w-52 focus:border-primary focus:ring-1 focus:ring-primary
                  outline-none transition-all text-[13px] text-on-surface placeholder:text-outline"
              />
            </div>
            {["All", "Accepted", "Rejected"].map((f) => (
              <button
                key={f}
                onClick={() => handleFilter(f)}
                className={`px-4 py-2.5 rounded-lg text-[12px] font-bold uppercase tracking-wider
                  transition-all flex items-center gap-1.5
                  ${
                    filter === f
                      ? "bg-primary text-on-primary shadow-sm"
                      : "bg-surface-container-lowest border border-outline-variant text-on-surface-variant hover:bg-surface-variant"
                  }`}
              >
                {f === "Accepted" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                )}
                {f === "Rejected" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-error" />
                )}
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* ── Stats bento ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-secondary-container rounded-lg">
                <span className="material-symbols-outlined text-on-secondary-container text-[22px]">
                  description
                </span>
              </div>
              <span className="text-[11px] font-bold text-on-tertiary-container">
                {isLoading ? "—" : `${totalRecords} records`}
              </span>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                Total Evaluations
              </p>
              <h3 className="text-[36px] font-bold text-primary tracking-tight leading-tight">
                {isLoading ? (
                  <span className="inline-block w-24 h-9 bg-surface-container-high rounded animate-pulse" />
                ) : (
                  totalRecords.toLocaleString()
                )}
              </h3>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-tertiary-fixed rounded-lg">
                <span className="material-symbols-outlined text-on-tertiary-fixed-variant text-[22px]">
                  check_circle
                </span>
              </div>
              <span className="text-[11px] font-bold text-on-tertiary-container">
                Live
              </span>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                Approval Rate
              </p>
              <h3 className="text-[36px] font-bold text-primary tracking-tight leading-tight">
                {isLoading ? (
                  <span className="inline-block w-20 h-9 bg-surface-container-high rounded animate-pulse" />
                ) : (
                  `${approvalRate}%`
                )}
              </h3>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-primary-fixed rounded-lg">
                <span className="material-symbols-outlined text-on-primary-fixed-variant text-[22px]">
                  bolt
                </span>
              </div>
              <span className="text-[11px] font-bold text-on-tertiary-container">
                FastAPI
              </span>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                Data Source
              </p>
              <h3 className="text-[22px] font-bold text-primary tracking-tight leading-tight mt-1.5">
                {isLoading ? (
                  <span className="inline-block w-32 h-7 bg-surface-container-high rounded animate-pulse" />
                ) : (
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    PostgreSQL Live
                  </span>
                )}
              </h3>
            </div>
          </div>
        </div>

        {/* ── Error banner ── */}
        {fetchError && (
          <div
            className="flex items-center gap-3 bg-error-container text-on-error-container
            rounded-xl px-5 py-4 border border-error"
          >
            <span className="material-symbols-outlined text-[22px] flex-shrink-0">
              error
            </span>
            <div className="flex-1">
              <p className="text-[14px] font-semibold">
                Could not load history
              </p>
              <p className="text-[12px] mt-0.5 opacity-80">{fetchError}</p>
              <p className="text-[11px] mt-1 opacity-70">
                Make sure FastAPI is running:{" "}
                <code className="bg-error-container/50 px-1 rounded font-mono">
                  uvicorn main:app --reload
                </code>
              </p>
            </div>
            <button
              onClick={retry}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-error text-on-error
                rounded-lg text-[12px] font-bold uppercase tracking-wider flex-shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]">
                refresh
              </span>
              Retry
            </button>
          </div>
        )}

        {/* ── History table ── */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  {[
                    "Date / Time",
                    "App ID",
                    "City",
                    "Loan Amount",
                    "Income",
                    "Status",
                    "Top Reason",
                    "Action",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest
                      text-on-surface-variant whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-surface-container-high">
                {/* Loading skeletons */}
                {isLoading &&
                  Array.from({ length: PAGE_SIZE }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))}

                {/* Empty state */}
                {!isLoading && !fetchError && filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center">
                      <span className="material-symbols-outlined text-[48px] text-outline-variant block mb-3">
                        history
                      </span>
                      <p className="text-[15px] font-semibold text-on-surface-variant">
                        {search || filter !== "All"
                          ? "No results match your filters."
                          : "No evaluations yet."}
                      </p>
                      <p className="text-[13px] text-on-surface-variant mt-1 opacity-70">
                        {!search &&
                          filter === "All" &&
                          "Submit a loan application to see it appear here."}
                      </p>
                    </td>
                  </tr>
                )}

                {/* Real rows */}
                {!isLoading &&
                  paginated.map((r) => {
                    const approved = r.status === "Accepted";
                    const { date, time } = formatTimestamp(r.timestamp);
                    const appId = "APP-" + String(r.id).padStart(4, "0");
                    const initials = getInitials(r.city);

                    return (
                      <tr
                        key={r.id}
                        className="hover:bg-surface-bright transition-colors"
                      >
                        {/* Date / Time */}
                        <td className="px-5 py-3 whitespace-nowrap">
                          <p className="text-[13px] font-medium text-primary font-mono">
                            {date}
                          </p>
                          <p className="text-[11px] text-on-surface-variant">
                            {time}
                          </p>
                        </td>

                        {/* App ID + avatar */}
                        <td className="px-5 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-full bg-surface-container-highest
                            flex items-center justify-center text-[11px] font-bold text-on-surface flex-shrink-0"
                            >
                              {initials}
                            </div>
                            <div>
                              <p className="text-[13px] font-semibold text-primary">
                                {appId}
                              </p>
                              <p className="text-[11px] text-on-surface-variant">
                                CS: {r.credit_score ?? "—"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* City */}
                        <td className="px-5 py-3">
                          <span className="text-[13px] text-on-surface-variant">
                            {r.city ?? "—"}
                          </span>
                        </td>

                        {/* Loan amount */}
                        <td className="px-5 py-3 whitespace-nowrap">
                          <span className="text-[13px] font-medium text-primary font-mono">
                            {formatCurrency(r.loan_amount)}
                          </span>
                        </td>

                        {/* Income */}
                        <td className="px-5 py-3 whitespace-nowrap">
                          <span className="text-[13px] font-medium text-primary font-mono">
                            {formatCurrency(r.income)}
                          </span>
                        </td>

                        {/* Status badge */}
                        <td className="px-5 py-3 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 rounded-full text-[11px] font-bold
                          inline-flex items-center gap-1.5
                          ${
                            approved
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-error-container text-on-error-container"
                          }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full flex-shrink-0
                            ${approved ? "bg-emerald-500" : "bg-error"}`}
                            />
                            {r.status}
                          </span>
                        </td>

                        {/* Top reason */}
                        <td className="px-5 py-3">
                          <span className="text-[13px] text-on-surface-variant">
                            {r.top_reason ?? "—"}
                          </span>
                        </td>

                        {/* View Details */}
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => {
                              console.log(
                                "[LendClear] raw_data for " + appId + ":",
                                r.raw_data
                              );
                              setSelected(r);
                            }}
                            className="px-3 py-1.5 border border-outline-variant rounded-lg
                            text-primary text-[12px] font-bold uppercase tracking-wider
                            hover:bg-primary hover:text-on-primary transition-all whitespace-nowrap"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          <div
            className="px-5 py-3 bg-surface-container-low border-t border-outline-variant
            flex items-center justify-between gap-4 flex-wrap"
          >
            <span className="text-[12px] font-semibold text-on-surface-variant">
              {isLoading
                ? "Loading…"
                : filtered.length === 0
                ? "0 entries"
                : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(
                    page * PAGE_SIZE,
                    filtered.length
                  )} of ${filtered.length} entries`}
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
                className="w-8 h-8 flex items-center justify-center border border-outline-variant
                  rounded hover:bg-surface-container transition-all disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-[18px]">
                  chevron_left
                </span>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
                )
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && arr[idx - 1] !== p - 1) acc.push("…");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "…" ? (
                    <span
                      key={`el-${i}`}
                      className="w-8 h-8 flex items-center justify-center
                      text-[12px] text-on-surface-variant"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 flex items-center justify-center rounded
                        text-[12px] font-bold transition-all
                        ${
                          page === p
                            ? "bg-primary text-on-primary"
                            : "border border-outline-variant hover:bg-surface-container text-on-surface"
                        }`}
                    >
                      {p}
                    </button>
                  )
                )}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || isLoading || totalPages === 0}
                className="w-8 h-8 flex items-center justify-center border border-outline-variant
                  rounded hover:bg-surface-container transition-all disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-[18px]">
                  chevron_right
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Bottom bento CTA ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-4">
          <div
            className="relative rounded-xl overflow-hidden min-h-[180px]
            border border-outline-variant bg-primary-container"
          >
            <div
              className="absolute -top-8 -right-8 w-48 h-48 bg-secondary-container
              opacity-10 rounded-full blur-3xl pointer-events-none"
            />
            <div className="absolute inset-0 flex items-center p-8">
              <div className="max-w-xs z-10">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-on-primary-container text-[22px]">
                    summarize
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-on-primary-container">
                    Reporting
                  </span>
                </div>
                <h4 className="text-[18px] font-semibold text-on-primary leading-tight mb-2">
                  Advanced Reporting
                </h4>
                <p className="text-[13px] text-on-primary-container leading-relaxed">
                  Export detailed audit logs and compliance reports for external
                  review.
                </p>
                <button
                  className="mt-4 flex items-center gap-2 px-4 py-2 bg-surface-container-lowest
                  text-primary rounded-lg text-[12px] font-bold uppercase tracking-wider
                  hover:bg-surface-variant transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    download
                  </span>
                  Export Report
                </button>
              </div>
            </div>
          </div>

          <div className="bg-primary text-on-primary rounded-xl p-8 flex flex-col justify-between min-h-[180px]">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-[22px] opacity-70">
                  model_training
                </span>
                <span className="text-[11px] font-bold uppercase tracking-widest opacity-70">
                  AI Engine
                </span>
              </div>
              <h4 className="text-[18px] font-semibold mb-2">
                Continuous Learning
              </h4>
              <p className="text-[14px] opacity-80 leading-relaxed">
                The AI model's precision improves automatically based on
                corrected outcome data from your PostgreSQL database.
              </p>
            </div>
            <div className="flex gap-3 mt-4 flex-wrap">
              <button
                className="px-5 py-2 bg-white text-primary rounded-lg text-[12px]
                font-bold uppercase tracking-wider hover:bg-primary-fixed transition-colors"
              >
                Re-train Model
              </button>
              <button
                className="px-5 py-2 border border-white/30 rounded-lg text-[12px]
                font-bold uppercase tracking-wider hover:bg-white/10 transition-colors"
              >
                View Analytics
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
