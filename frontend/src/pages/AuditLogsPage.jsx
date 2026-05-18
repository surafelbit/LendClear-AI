// import { useState, useEffect, useMemo } from "react";
// import { createPortal } from "react-dom";
// import axios from "axios";
// import { Animate, AnimateGroup } from "../components/ui/Animate";

// /* ─────────────────────────────────────────────
//    CONFIG
// ───────────────────────────────────────────── */
// const API_URL = "http://localhost:8000/history/";
// const PAGE_SIZE = 8;

// /* ─────────────────────────────────────────────
//    FORMATTERS
// ───────────────────────────────────────────── */
// function formatTimestamp(ts) {
//   if (!ts) return { date: "—", time: "—" };
//   const d = new Date(ts);
//   const date = d.toLocaleDateString("en-US", {
//     month: "short",
//     day: "numeric",
//     year: "numeric",
//   });
//   const time = d.toLocaleTimeString("en-US", {
//     hour: "numeric",
//     minute: "2-digit",
//     hour12: true,
//   });
//   return { date, time };
// }

// function formatCurrency(n) {
//   if (n == null) return "—";
//   return new Intl.NumberFormat("en-US", {
//     style: "currency",
//     currency: "USD",
//     maximumFractionDigits: 0,
//   }).format(n);
// }

// function getInitials(city) {
//   return (city ?? "NA").substring(0, 2).toUpperCase();
// }

// /* ─────────────────────────────────────────────
//    SHAP LABELS
// ───────────────────────────────────────────── */
// const SHAP_LABELS = {
//   city: "Location Volatility",
//   income: "Annual Income Impact",
//   credit_score: "Credit Score Impact",
//   loan_amount: "Loan Amount Impact",
//   years_employed: "Years Employed Impact",
// };

// /* ─────────────────────────────────────────────
//    CONFIDENCE GAUGE  (SVG donut)
// ───────────────────────────────────────────── */
// function ConfidenceGauge({ pct, approved }) {
//   const r = 22;
//   const circ = 2 * Math.PI * r;
//   const fill = circ - (pct / 100) * circ;
//   const color = approved ? "#10b981" : "#ba1a1a";
//   return (
//     <div className="flex flex-col items-center gap-0.5">
//       <div className="relative w-14 h-14 flex items-center justify-center">
//         <svg className="w-full h-full -rotate-90" viewBox="0 0 52 52">
//           <circle
//             cx="26"
//             cy="26"
//             r={r}
//             fill="transparent"
//             stroke={approved ? "#d1fae5" : "#ffdad6"}
//             strokeWidth="4"
//           />
//           <circle
//             cx="26"
//             cy="26"
//             r={r}
//             fill="transparent"
//             stroke={color}
//             strokeWidth="4"
//             strokeDasharray={circ}
//             strokeDashoffset={fill}
//             strokeLinecap="round"
//             style={{
//               transition:
//                 "stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1) 0.2s",
//             }}
//           />
//         </svg>
//         <div className="absolute inset-0 flex items-center justify-center">
//           <span
//             className={`text-[11px] font-bold leading-none
//             ${approved ? "text-emerald-700" : "text-red-700"}`}
//           >
//             {pct}%
//           </span>
//         </div>
//       </div>
//       <span
//         className={`text-[9px] font-bold uppercase tracking-wider whitespace-nowrap
//         ${approved ? "text-emerald-600" : "text-red-600"}`}
//       >
//         Certainty
//       </span>
//     </div>
//   );
// }

// /* ─────────────────────────────────────────────
//    DETAIL MODAL  (portal — always viewport-centered)
// ───────────────────────────────────────────── */
// function DetailModal({ record, onClose }) {
//   if (!record) return null;

//   const approved = record.status === "Accepted";
//   const { date, time } = formatTimestamp(record.timestamp);
//   const appId = "APP-" + String(record.id).padStart(4, "0");

//   const shapSource = record.raw_shap_data ?? record.raw_data ?? {};
//   const shapEntries = Object.entries(shapSource).sort(
//     (a, b) => Math.abs(b[1]) - Math.abs(a[1])
//   );
//   const maxAbs = shapEntries.length
//     ? Math.max(...shapEntries.map(([, v]) => Math.abs(v)))
//     : 1;
//   const confidence =
//     record.confidence != null ? Math.round(record.confidence * 100) : null;

//   return createPortal(
//     <div
//       className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
//       style={{ animation: "backdropIn 0.25s ease both" }}
//       onClick={onClose}
//     >
//       {/* Backdrop */}
//       <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

//       {/* Modal card */}
//       <div
//         className="relative bg-surface-container-lowest rounded-2xl border border-outline-variant
//           shadow-2xl w-full max-w-xl p-6 max-h-[85vh] overflow-y-auto"
//         style={{ animation: "modalIn 0.35s cubic-bezier(0.16,1,0.3,1) both" }}
//         onClick={(e) => e.stopPropagation()}
//       >
//         {/* ── Header ── */}
//         <div className="flex items-start justify-between mb-5">
//           <div>
//             <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
//               Application Details
//             </p>
//             <h3 className="text-[22px] font-bold text-primary tracking-tight mt-0.5">
//               {appId}
//             </h3>
//           </div>
//           <button
//             onClick={onClose}
//             className="w-8 h-8 rounded-lg flex items-center justify-center
//               hover:bg-surface-container-high transition-colors text-on-surface-variant"
//           >
//             <span className="material-symbols-outlined text-[20px]">close</span>
//           </button>
//         </div>

//         {/* ── Decision banner + Confidence ── */}
//         <div
//           className={`rounded-xl px-4 py-4 flex items-center justify-between gap-4 mb-5
//             ${
//               approved
//                 ? "bg-emerald-50 border border-emerald-200"
//                 : "bg-red-50 border border-red-200"
//             }`}
//           style={{ animation: "fadeUp 0.35s ease both 0.05s" }}
//         >
//           <div className="flex items-center gap-3">
//             <div
//               className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
//               ${approved ? "bg-emerald-600" : "bg-red-600"}`}
//             >
//               <span
//                 className="material-symbols-outlined text-white text-[20px]"
//                 style={{ fontVariationSettings: "'FILL' 1" }}
//               >
//                 {approved ? "check_circle" : "cancel"}
//               </span>
//             </div>
//             <div>
//               <p
//                 className={`text-[18px] font-bold leading-none
//                 ${approved ? "text-emerald-900" : "text-red-900"}`}
//               >
//                 {record.status}
//               </p>
//               <p
//                 className={`text-[12px] mt-0.5 ${
//                   approved ? "text-emerald-700" : "text-red-700"
//                 }`}
//               >
//                 Primary factor: {record.top_reason ?? "—"}
//               </p>
//             </div>
//           </div>
//           {/* Confidence gauge */}
//           {confidence != null && (
//             <div className="flex-shrink-0 text-right">
//               <ConfidenceGauge pct={confidence} approved={approved} />
//             </div>
//           )}
//         </div>

//         {/* ── AI voice message ── */}
//         {record.ai_voice_message && (
//           <div
//             className="bg-primary-container rounded-xl p-4 mb-5 relative overflow-hidden"
//             style={{ animation: "fadeUp 0.4s ease both 0.1s" }}
//           >
//             <div
//               className="absolute -top-6 -right-6 w-32 h-32 bg-secondary-container
//               opacity-10 rounded-full blur-3xl pointer-events-none"
//             />
//             <div className="flex items-center gap-2 mb-2 z-10 relative">
//               <span
//                 className="material-symbols-outlined text-secondary-container text-[18px]"
//                 style={{ fontVariationSettings: "'FILL' 1" }}
//               >
//                 auto_awesome
//               </span>
//               <span className="text-[10px] font-bold uppercase tracking-widest text-on-primary-container">
//                 AI Financial Analyst
//               </span>
//             </div>
//             <p className="text-[13px] text-on-primary-fixed italic leading-relaxed z-10 relative">
//               "{record.ai_voice_message}"
//             </p>
//           </div>
//         )}

//         {/* ── Details grid ── */}
//         <div
//           className="grid grid-cols-2 gap-3 mb-5"
//           style={{ animation: "fadeUp 0.4s ease both 0.15s" }}
//         >
//           {[
//             { label: "City", value: record.city ?? "—" },
//             { label: "Annual Income", value: formatCurrency(record.income) },
//             { label: "Loan Amount", value: formatCurrency(record.loan_amount) },
//             { label: "Credit Score", value: record.credit_score ?? "—" },
//             {
//               label: "Years Employed",
//               value:
//                 record.years_employed != null
//                   ? `${record.years_employed} yrs`
//                   : "—",
//             },
//             { label: "Top Reason", value: record.top_reason ?? "—" },
//             { label: "Date", value: date },
//             { label: "Time", value: time },
//           ].map(({ label, value }) => (
//             <div
//               key={label}
//               className="bg-surface-container-low rounded-lg px-3 py-2.5"
//             >
//               <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
//                 {label}
//               </p>
//               <p className="text-[14px] font-semibold text-primary mt-0.5">
//                 {value}
//               </p>
//             </div>
//           ))}
//         </div>

//         {/* ── Factor Analysis — "Why this decision was made" ── */}
//         {shapEntries.length > 0 && (
//           <div
//             className="mb-5"
//             style={{ animation: "fadeUp 0.4s ease both 0.2s" }}
//           >
//             {/* Section header */}
//             <div className="flex items-center gap-2 mb-4">
//               <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
//                 psychology
//               </span>
//               <div>
//                 <p className="text-[14px] font-semibold text-on-surface">
//                   Why this decision was made
//                 </p>
//                 <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
//                   Factor Analysis — SHAP Impact Values
//                 </p>
//               </div>
//             </div>

//             {/* Legend pills */}
//             <div className="flex gap-3 mb-4">
//               <span
//                 className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50
//                 border border-emerald-200 rounded-full text-[10px] font-bold text-emerald-700 uppercase tracking-wider"
//               >
//                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
//                 Helping
//               </span>
//               <span
//                 className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50
//                 border border-red-200 rounded-full text-[10px] font-bold text-red-700 uppercase tracking-wider"
//               >
//                 <span className="w-1.5 h-1.5 rounded-full bg-error" />
//                 Hurting
//               </span>
//             </div>

//             {/* Factor rows */}
//             <div className="flex flex-col gap-2.5">
//               {shapEntries.map(([key, value], i) => {
//                 const isPos = value >= 0;
//                 const barWidth = Math.round((Math.abs(value) / maxAbs) * 100);
//                 return (
//                   <div
//                     key={key}
//                     className={`rounded-xl p-3 border ${
//                       isPos
//                         ? "bg-emerald-50/60 border-emerald-100"
//                         : "bg-red-50/60 border-red-100"
//                     }`}
//                     style={{
//                       animation: `fadeUp 0.4s ease both ${0.22 + i * 0.07}s`,
//                     }}
//                   >
//                     {/* Top row: label + tag + value */}
//                     <div className="flex items-center justify-between mb-2">
//                       <div className="flex items-center gap-2">
//                         <span
//                           className={`w-1.5 h-1.5 rounded-full flex-shrink-0
//                           ${isPos ? "bg-emerald-500" : "bg-error"}`}
//                         />
//                         <span className="text-[12px] font-semibold text-on-surface">
//                           {SHAP_LABELS[key] ?? key}
//                         </span>
//                         <span
//                           className={`text-[9px] font-bold uppercase tracking-wider
//                           px-1.5 py-0.5 rounded-full
//                           ${
//                             isPos
//                               ? "bg-emerald-100 text-emerald-700"
//                               : "bg-red-100 text-red-700"
//                           }`}
//                         >
//                           {isPos ? "Helping" : "Hurting"}
//                         </span>
//                       </div>
//                       <span
//                         className={`text-[12px] font-bold font-mono
//                         ${isPos ? "text-emerald-600" : "text-error"}`}
//                       >
//                         {isPos ? "+" : ""}
//                         {value.toFixed(3)}
//                       </span>
//                     </div>

//                     {/* Progress bar — full width, colour coded */}
//                     <div className="w-full h-1.5 bg-white/80 rounded-full overflow-hidden border border-black/5">
//                       <div
//                         className={`h-full rounded-full ${
//                           isPos ? "bg-emerald-500" : "bg-error"
//                         }`}
//                         style={{
//                           width: `${barWidth}%`,
//                           transition: `width 0.8s cubic-bezier(0.16,1,0.3,1) ${
//                             0.3 + i * 0.07
//                           }s`,
//                         }}
//                       />
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
//         )}

//         {/* ── Footer ── */}
//         <div
//           className="flex gap-3"
//           style={{ animation: "fadeUp 0.4s ease both 0.3s" }}
//         >
//           <button
//             onClick={() => {
//               console.log(
//                 "[LendClear] raw_shap_data for " + appId + ":",
//                 record.raw_shap_data ?? record.raw_data
//               );
//             }}
//             className="flex-1 flex items-center justify-center gap-2 py-2.5
//               border border-outline-variant rounded-lg text-[12px] font-bold uppercase
//               tracking-widest text-on-surface-variant hover:bg-surface-variant transition-colors"
//           >
//             <span className="material-symbols-outlined text-[16px]">
//               bar_chart
//             </span>
//             Log SHAP Data
//           </button>
//           <button
//             onClick={onClose}
//             className="flex-1 py-2.5 bg-primary text-on-primary rounded-lg
//               text-[12px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
//           >
//             Close
//           </button>
//         </div>
//       </div>
//     </div>,
//     document.body
//   );
// }

// /* ─────────────────────────────────────────────
//    SKELETON ROW
// ───────────────────────────────────────────── */
// function SkeletonRow({ index }) {
//   return (
//     <tr style={{ animation: `fadeUp 0.4s ease both ${index * 50}ms` }}>
//       {Array.from({ length: 8 }).map((_, i) => (
//         <td key={i} className="px-5 py-4">
//           <div
//             className="h-3 bg-surface-container-high rounded-full animate-pulse"
//             style={{
//               width: `${60 + ((i * 13) % 40)}%`,
//               animationDelay: `${i * 80}ms`,
//             }}
//           />
//           {i === 1 && (
//             <div
//               className="h-2.5 bg-surface-container-high rounded-full animate-pulse mt-2 w-1/2"
//               style={{ animationDelay: `${i * 80 + 40}ms` }}
//             />
//           )}
//         </td>
//       ))}
//     </tr>
//   );
// }

// /* ─────────────────────────────────────────────
//    STAT CARD
// ───────────────────────────────────────────── */
// function StatCard({
//   icon,
//   iconBg,
//   iconColor,
//   badge,
//   label,
//   value,
//   isLoading,
//   variant,
//   delay,
// }) {
//   return (
//     <Animate variant={variant} delay={delay}>
//       <div
//         className="bg-surface-container-lowest border border-outline-variant
//         rounded-xl p-5 shadow-sm flex flex-col gap-3 h-full"
//       >
//         <div className="flex justify-between items-start">
//           <div className={`p-2 ${iconBg} rounded-lg`}>
//             <span
//               className={`material-symbols-outlined ${iconColor} text-[22px]`}
//             >
//               {icon}
//             </span>
//           </div>
//           <span className="text-[11px] font-bold text-on-tertiary-container">
//             {badge}
//           </span>
//         </div>
//         <div>
//           <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
//             {label}
//           </p>
//           <div className="text-[36px] font-bold text-primary tracking-tight leading-tight mt-0.5">
//             {isLoading ? (
//               <span className="inline-block w-24 h-9 bg-surface-container-high rounded animate-pulse" />
//             ) : (
//               value
//             )}
//           </div>
//         </div>
//       </div>
//     </Animate>
//   );
// }

// /* ─────────────────────────────────────────────
//    MAIN PAGE
// ───────────────────────────────────────────── */
// export default function AuditLogsPage() {
//   const [history, setHistory] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [fetchError, setFetchError] = useState(null);
//   const [search, setSearch] = useState("");
//   const [filter, setFilter] = useState("All");
//   const [page, setPage] = useState(1);
//   const [selected, setSelected] = useState(null);

//   /* ── Fetch ── */
//   useEffect(() => {
//     let cancelled = false;
//     const load = async () => {
//       setIsLoading(true);
//       setFetchError(null);
//       try {
//         const { data } = await axios.get(API_URL, { timeout: 10000 });
//         if (!cancelled) setHistory(Array.isArray(data) ? data : []);
//       } catch (err) {
//         if (!cancelled) {
//           setFetchError(
//             err?.response?.data?.detail ?? err?.message ?? "Failed to fetch."
//           );
//           console.error("[LendClear] History fetch error:", err);
//         }
//       } finally {
//         if (!cancelled) setIsLoading(false);
//       }
//     };
//     load();
//     return () => {
//       cancelled = true;
//     };
//   }, []);

//   const totalRecords = history.length;
//   const approvedCount = history.filter((r) => r.status === "Accepted").length;
//   const approvalRate =
//     totalRecords > 0 ? Math.round((approvedCount / totalRecords) * 100) : 0;

//   const filtered = useMemo(() => {
//     return history.filter((r) => {
//       const matchesFilter =
//         filter === "All"
//           ? true
//           : filter === "Accepted"
//           ? r.status === "Accepted"
//           : filter === "Rejected"
//           ? r.status === "Rejected"
//           : true;
//       const q = search.toLowerCase();
//       const matchesSearch =
//         !q ||
//         (r.city ?? "").toLowerCase().includes(q) ||
//         String(r.id).includes(q) ||
//         (r.top_reason ?? "").toLowerCase().includes(q);
//       return matchesFilter && matchesSearch;
//     });
//   }, [history, search, filter]);

//   const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
//   const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

//   const handleFilter = (f) => {
//     setFilter(f);
//     setPage(1);
//   };
//   const handleSearch = (v) => {
//     setSearch(v);
//     setPage(1);
//   };

//   const retry = () => {
//     setHistory([]);
//     setFetchError(null);
//     setIsLoading(true);
//     axios
//       .get(API_URL, { timeout: 10000 })
//       .then(({ data }) => setHistory(Array.isArray(data) ? data : []))
//       .catch((err) => setFetchError(err?.message ?? "Failed to fetch."))
//       .finally(() => setIsLoading(false));
//   };

//   return (
//     <>
//       {/* Global keyframes */}
//       <style>{`
//         @keyframes fadeUp {
//           from { opacity: 0; transform: translateY(20px); }
//           to   { opacity: 1; transform: translateY(0);    }
//         }
//         @keyframes backdropIn {
//           from { opacity: 0; }
//           to   { opacity: 1; }
//         }
//         @keyframes modalIn {
//           from { opacity: 0; transform: translateY(32px) scale(0.97); }
//           to   { opacity: 1; transform: translateY(0)    scale(1);    }
//         }
//         @keyframes shimmer {
//           0%   { background-position: -200% 0; }
//           100% { background-position:  200% 0; }
//         }
//       `}</style>

//       <DetailModal record={selected} onClose={() => setSelected(null)} />

//       <div className="space-y-6">
//         {/* ── Page header ── */}
//         <Animate variant="fadeDown" duration={600}>
//           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
//             <div>
//               <h2 className="text-[36px] font-bold text-primary tracking-tight leading-tight">
//                 Evaluation History
//               </h2>
//               <p className="text-[16px] text-on-surface-variant mt-1">
//                 Audit and track historical loan eligibility decisions.
//               </p>
//             </div>

//             {/* Search + filters */}
//             <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
//               <div className="relative flex-1 md:flex-none">
//                 <span
//                   className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2
//                   text-on-surface-variant text-[20px] pointer-events-none"
//                 >
//                   person_search
//                 </span>
//                 <input
//                   value={search}
//                   onChange={(e) => handleSearch(e.target.value)}
//                   placeholder="City, ID or reason…"
//                   className="pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant
//                     rounded-lg w-full md:w-52 focus:border-primary focus:ring-1 focus:ring-primary
//                     outline-none transition-all text-[13px] text-on-surface placeholder:text-outline"
//                 />
//               </div>
//               {["All", "Accepted", "Rejected"].map((f) => (
//                 <button
//                   key={f}
//                   onClick={() => handleFilter(f)}
//                   className={`px-4 py-2.5 rounded-lg text-[12px] font-bold uppercase tracking-wider
//                     transition-all flex items-center gap-1.5
//                     ${
//                       filter === f
//                         ? "bg-primary text-on-primary shadow-sm"
//                         : "bg-surface-container-lowest border border-outline-variant text-on-surface-variant hover:bg-surface-variant"
//                     }`}
//                 >
//                   {f === "Accepted" && (
//                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
//                   )}
//                   {f === "Rejected" && (
//                     <span className="w-1.5 h-1.5 rounded-full bg-error" />
//                   )}
//                   {f}
//                 </button>
//               ))}
//             </div>
//           </div>
//         </Animate>

//         {/* ── Stats bento ── */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           <StatCard
//             icon="description"
//             iconBg="bg-secondary-container"
//             iconColor="text-on-secondary-container"
//             badge={isLoading ? "—" : `${totalRecords} records`}
//             label="Total Evaluations"
//             value={totalRecords.toLocaleString()}
//             isLoading={isLoading}
//             variant="slideLeft"
//             delay={0}
//           />
//           <StatCard
//             icon="check_circle"
//             iconBg="bg-tertiary-fixed"
//             iconColor="text-on-tertiary-fixed-variant"
//             badge="Live"
//             label="Approval Rate"
//             value={`${approvalRate}%`}
//             isLoading={isLoading}
//             variant="fadeUp"
//             delay={80}
//           />
//           <StatCard
//             icon="bolt"
//             iconBg="bg-primary-fixed"
//             iconColor="text-on-primary-fixed-variant"
//             badge="FastAPI"
//             label="Data Source"
//             value={
//               <span className="flex items-center gap-2 text-[22px]">
//                 <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
//                 PostgreSQL Live
//               </span>
//             }
//             isLoading={isLoading}
//             variant="slideRight"
//             delay={160}
//           />
//         </div>

//         {/* ── Error banner ── */}
//         {fetchError && (
//           <Animate variant="fadeUp">
//             <div
//               className="flex items-center gap-3 bg-error-container text-on-error-container
//               rounded-xl px-5 py-4 border border-error"
//             >
//               <span className="material-symbols-outlined text-[22px] flex-shrink-0">
//                 error
//               </span>
//               <div className="flex-1">
//                 <p className="text-[14px] font-semibold">
//                   Could not load history
//                 </p>
//                 <p className="text-[12px] mt-0.5 opacity-80">{fetchError}</p>
//                 <p className="text-[11px] mt-1 opacity-70">
//                   Make sure FastAPI is running:{" "}
//                   <code className="bg-error-container/50 px-1 rounded font-mono">
//                     uvicorn main:app --reload
//                   </code>
//                 </p>
//               </div>
//               <button
//                 onClick={retry}
//                 className="flex items-center gap-1.5 px-3 py-1.5 bg-error text-on-error
//                   rounded-lg text-[12px] font-bold uppercase tracking-wider flex-shrink-0"
//               >
//                 <span className="material-symbols-outlined text-[16px]">
//                   refresh
//                 </span>
//                 Retry
//               </button>
//             </div>
//           </Animate>
//         )}

//         {/* ── History table ── */}
//         <Animate variant="fadeUp" delay={200} threshold={0.05}>
//           <div
//             className="bg-surface-container-lowest border border-outline-variant
//             rounded-xl shadow-sm overflow-hidden"
//           >
//             <div className="overflow-x-auto">
//               <table className="w-full text-left border-collapse">
//                 <thead>
//                   <tr className="bg-surface-container-low border-b border-outline-variant">
//                     {[
//                       "Date / Time",
//                       "App ID",
//                       "City",
//                       "Loan Amount",
//                       "Income",
//                       "Status",
//                       "Confidence",
//                       "Top Reason",
//                       "Action",
//                     ].map((h) => (
//                       <th
//                         key={h}
//                         className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest
//                         text-on-surface-variant whitespace-nowrap"
//                       >
//                         {h}
//                       </th>
//                     ))}
//                   </tr>
//                 </thead>

//                 <tbody className="divide-y divide-surface-container-high">
//                   {/* Skeleton */}
//                   {isLoading &&
//                     Array.from({ length: PAGE_SIZE }).map((_, i) => (
//                       <SkeletonRow key={i} index={i} />
//                     ))}

//                   {/* Empty */}
//                   {!isLoading && !fetchError && filtered.length === 0 && (
//                     <tr>
//                       <td colSpan={9} className="px-5 py-16 text-center">
//                         <span className="material-symbols-outlined text-[48px] text-outline-variant block mb-3">
//                           history
//                         </span>
//                         <p className="text-[15px] font-semibold text-on-surface-variant">
//                           {search || filter !== "All"
//                             ? "No results match your filters."
//                             : "No evaluations yet."}
//                         </p>
//                         {!search && filter === "All" && (
//                           <p className="text-[13px] text-on-surface-variant mt-1 opacity-70">
//                             Submit a loan application to see it appear here.
//                           </p>
//                         )}
//                       </td>
//                     </tr>
//                   )}

//                   {/* Real rows — each staggered */}
//                   {!isLoading &&
//                     paginated.map((r, rowIdx) => {
//                       const approved = r.status === "Accepted";
//                       const { date, time } = formatTimestamp(r.timestamp);
//                       const appId = "APP-" + String(r.id).padStart(4, "0");
//                       const initials = getInitials(r.city);

//                       return (
//                         <tr
//                           key={r.id}
//                           className="hover:bg-surface-bright transition-colors"
//                           style={{
//                             animation: `fadeUp 0.45s cubic-bezier(0.16,1,0.3,1) both`,
//                             animationDelay: `${rowIdx * 55}ms`,
//                           }}
//                         >
//                           <td className="px-5 py-3 whitespace-nowrap">
//                             <p className="text-[13px] font-medium text-primary font-mono">
//                               {date}
//                             </p>
//                             <p className="text-[11px] text-on-surface-variant">
//                               {time}
//                             </p>
//                           </td>
//                           <td className="px-5 py-3 whitespace-nowrap">
//                             <div className="flex items-center gap-2.5">
//                               <div
//                                 className="w-8 h-8 rounded-full bg-surface-container-highest
//                               flex items-center justify-center text-[11px] font-bold text-on-surface flex-shrink-0"
//                               >
//                                 {initials}
//                               </div>
//                               <div>
//                                 <p className="text-[13px] font-semibold text-primary">
//                                   {appId}
//                                 </p>
//                                 <p className="text-[11px] text-on-surface-variant">
//                                   CS: {r.credit_score ?? "—"}
//                                 </p>
//                               </div>
//                             </div>
//                           </td>
//                           <td className="px-5 py-3">
//                             <span className="text-[13px] text-on-surface-variant">
//                               {r.city ?? "—"}
//                             </span>
//                           </td>
//                           <td className="px-5 py-3 whitespace-nowrap">
//                             <span className="text-[13px] font-medium text-primary font-mono">
//                               {formatCurrency(r.loan_amount)}
//                             </span>
//                           </td>
//                           <td className="px-5 py-3 whitespace-nowrap">
//                             <span className="text-[13px] font-medium text-primary font-mono">
//                               {formatCurrency(r.income)}
//                             </span>
//                           </td>
//                           <td className="px-5 py-3 whitespace-nowrap">
//                             <span
//                               className={`px-3 py-1 rounded-full text-[11px] font-bold
//                             inline-flex items-center gap-1.5
//                             ${
//                               approved
//                                 ? "bg-emerald-100 text-emerald-800"
//                                 : "bg-error-container text-on-error-container"
//                             }`}
//                             >
//                               <span
//                                 className={`w-1.5 h-1.5 rounded-full flex-shrink-0
//                               ${approved ? "bg-emerald-500" : "bg-error"}`}
//                               />
//                               {r.status}
//                             </span>
//                           </td>
//                           {/* Confidence column */}
//                           <td className="px-5 py-3 whitespace-nowrap">
//                             {r.confidence != null ? (
//                               <div className="flex items-center gap-2">
//                                 <div className="w-16 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
//                                   <div
//                                     className={`h-full rounded-full ${
//                                       approved ? "bg-emerald-500" : "bg-error"
//                                     }`}
//                                     style={{
//                                       width: `${Math.round(
//                                         r.confidence * 100
//                                       )}%`,
//                                     }}
//                                   />
//                                 </div>
//                                 <span className="text-[12px] font-bold font-mono text-primary">
//                                   {Math.round(r.confidence * 100)}%
//                                 </span>
//                               </div>
//                             ) : (
//                               <span className="text-[12px] text-on-surface-variant">
//                                 —
//                               </span>
//                             )}
//                           </td>
//                           <td className="px-5 py-3">
//                             <span className="text-[13px] text-on-surface-variant">
//                               {r.top_reason ?? "—"}
//                             </span>
//                           </td>
//                           <td className="px-5 py-3 text-right">
//                             <button
//                               onClick={() => {
//                                 console.log(
//                                   "[LendClear] raw_shap_data for " +
//                                     appId +
//                                     ":",
//                                   r.raw_shap_data ?? r.raw_data
//                                 );
//                                 setSelected(r);
//                               }}
//                               className="px-3 py-1.5 border border-outline-variant rounded-lg
//                               text-primary text-[12px] font-bold uppercase tracking-wider
//                               hover:bg-primary hover:text-on-primary transition-all whitespace-nowrap"
//                             >
//                               View Details
//                             </button>
//                           </td>
//                         </tr>
//                       );
//                     })}
//                 </tbody>
//               </table>
//             </div>

//             {/* Pagination */}
//             <div
//               className="px-5 py-3 bg-surface-container-low border-t border-outline-variant
//               flex items-center justify-between gap-4 flex-wrap"
//             >
//               <span className="text-[12px] font-semibold text-on-surface-variant">
//                 {isLoading
//                   ? "Loading…"
//                   : filtered.length === 0
//                   ? "0 entries"
//                   : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(
//                       page * PAGE_SIZE,
//                       filtered.length
//                     )} of ${filtered.length} entries`}
//               </span>
//               <div className="flex items-center gap-1">
//                 <button
//                   onClick={() => setPage((p) => Math.max(1, p - 1))}
//                   disabled={page === 1 || isLoading}
//                   className="w-8 h-8 flex items-center justify-center border border-outline-variant
//                     rounded hover:bg-surface-container transition-all disabled:opacity-40"
//                 >
//                   <span className="material-symbols-outlined text-[18px]">
//                     chevron_left
//                   </span>
//                 </button>
//                 {Array.from({ length: totalPages }, (_, i) => i + 1)
//                   .filter(
//                     (p) =>
//                       p === 1 || p === totalPages || Math.abs(p - page) <= 1
//                   )
//                   .reduce((acc, p, idx, arr) => {
//                     if (idx > 0 && arr[idx - 1] !== p - 1) acc.push("…");
//                     acc.push(p);
//                     return acc;
//                   }, [])
//                   .map((p, i) =>
//                     p === "…" ? (
//                       <span
//                         key={`el-${i}`}
//                         className="w-8 h-8 flex items-center justify-center text-[12px] text-on-surface-variant"
//                       >
//                         …
//                       </span>
//                     ) : (
//                       <button
//                         key={p}
//                         onClick={() => setPage(p)}
//                         className={`w-8 h-8 flex items-center justify-center rounded text-[12px] font-bold transition-all
//                             ${
//                               page === p
//                                 ? "bg-primary text-on-primary"
//                                 : "border border-outline-variant hover:bg-surface-container text-on-surface"
//                             }`}
//                       >
//                         {p}
//                       </button>
//                     )
//                   )}
//                 <button
//                   onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
//                   disabled={
//                     page === totalPages || isLoading || totalPages === 0
//                   }
//                   className="w-8 h-8 flex items-center justify-center border border-outline-variant
//                     rounded hover:bg-surface-container transition-all disabled:opacity-40"
//                 >
//                   <span className="material-symbols-outlined text-[18px]">
//                     chevron_right
//                   </span>
//                 </button>
//               </div>
//             </div>
//           </div>
//         </Animate>

//         {/* ── Bottom CTA bento ── */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-4">
//           <Animate variant="slideLeft" delay={100} threshold={0.1}>
//             <div
//               className="relative rounded-xl overflow-hidden min-h-[180px]
//               border border-outline-variant bg-primary-container h-full"
//             >
//               <div
//                 className="absolute -top-8 -right-8 w-48 h-48 bg-secondary-container
//                 opacity-10 rounded-full blur-3xl pointer-events-none"
//               />
//               <div className="absolute inset-0 flex items-center p-8">
//                 <div className="max-w-xs z-10">
//                   <div className="flex items-center gap-2 mb-3">
//                     <span className="material-symbols-outlined text-on-primary-container text-[22px]">
//                       summarize
//                     </span>
//                     <span className="text-[11px] font-bold uppercase tracking-widest text-on-primary-container">
//                       Reporting
//                     </span>
//                   </div>
//                   <h4 className="text-[18px] font-semibold text-on-primary leading-tight mb-2">
//                     Advanced Reporting
//                   </h4>
//                   <p className="text-[13px] text-on-primary-container leading-relaxed">
//                     Export detailed audit logs and compliance reports for
//                     external review.
//                   </p>
//                   <button
//                     className="mt-4 flex items-center gap-2 px-4 py-2 bg-surface-container-lowest
//                     text-primary rounded-lg text-[12px] font-bold uppercase tracking-wider
//                     hover:bg-surface-variant transition-colors"
//                   >
//                     <span className="material-symbols-outlined text-[16px]">
//                       download
//                     </span>
//                     Export Report
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </Animate>

//           <Animate variant="slideRight" delay={180} threshold={0.1}>
//             <div
//               className="bg-primary text-on-primary rounded-xl p-8 flex flex-col
//               justify-between min-h-[180px] h-full"
//             >
//               <div>
//                 <div className="flex items-center gap-2 mb-3">
//                   <span className="material-symbols-outlined text-[22px] opacity-70">
//                     model_training
//                   </span>
//                   <span className="text-[11px] font-bold uppercase tracking-widest opacity-70">
//                     AI Engine
//                   </span>
//                 </div>
//                 <h4 className="text-[18px] font-semibold mb-2">
//                   Continuous Learning
//                 </h4>
//                 <p className="text-[14px] opacity-80 leading-relaxed">
//                   The AI model's precision improves automatically based on
//                   corrected outcome data from your PostgreSQL database.
//                 </p>
//               </div>
//               <div className="flex gap-3 mt-4 flex-wrap">
//                 <button
//                   className="px-5 py-2 bg-white text-primary rounded-lg text-[12px]
//                   font-bold uppercase tracking-wider hover:bg-primary-fixed transition-colors"
//                 >
//                   Re-train Model
//                 </button>
//                 <button
//                   className="px-5 py-2 border border-white/30 rounded-lg text-[12px]
//                   font-bold uppercase tracking-wider hover:bg-white/10 transition-colors"
//                 >
//                   View Analytics
//                 </button>
//               </div>
//             </div>
//           </Animate>
//         </div>
//       </div>
//     </>
//   );
// }
import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { Animate, AnimateGroup } from "../components/ui/Animate";

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

function getInitials(name, city) {
  if (name && name.trim()) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (city ?? "NA").substring(0, 2).toUpperCase();
}

/**
 * normalizeConfidence — handles both API formats:
 *   0.988  -> 99  (decimal probability)
 *   98.8   -> 99  (already a percentage)
 *   "0.988"-> 99  (string)
 * Returns integer 0-100, or null if missing/invalid.
 */
function normalizeConfidence(raw) {
  if (raw == null || raw === "") return null;
  const n = parseFloat(raw);
  if (isNaN(n)) return null;
  return Math.round(n > 1 ? n : n * 100);
}

/* ─────────────────────────────────────────────
   SHAP LABELS
───────────────────────────────────────────── */
const SHAP_LABELS = {
  city: "Location Volatility",
  income: "Annual Income Impact",
  credit_score: "Credit Score Impact",
  loan_amount: "Loan Amount Impact",
  years_employed: "Years Employed Impact",
};

/* ─────────────────────────────────────────────
   CONFIDENCE GAUGE  (SVG donut)
───────────────────────────────────────────── */
function ConfidenceGauge({ pct, approved }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const fill = circ - (pct / 100) * circ;
  const color = approved ? "#10b981" : "#ba1a1a";
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="relative w-14 h-14 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 52 52">
          <circle
            cx="26"
            cy="26"
            r={r}
            fill="transparent"
            stroke={approved ? "#d1fae5" : "#ffdad6"}
            strokeWidth="4"
          />
          <circle
            cx="26"
            cy="26"
            r={r}
            fill="transparent"
            stroke={color}
            strokeWidth="4"
            strokeDasharray={circ}
            strokeDashoffset={fill}
            strokeLinecap="round"
            style={{
              transition:
                "stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1) 0.2s",
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`text-[11px] font-bold leading-none
            ${approved ? "text-emerald-700" : "text-red-700"}`}
          >
            {pct}%
          </span>
        </div>
      </div>
      <span
        className={`text-[9px] font-bold uppercase tracking-wider whitespace-nowrap
        ${approved ? "text-emerald-600" : "text-red-600"}`}
      >
        Certainty
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   DETAIL MODAL  (portal — always viewport-centered)
───────────────────────────────────────────── */
function DetailModal({ record, onClose }) {
  if (!record) return null;

  const approved = record.status === "Accepted";
  const { date, time } = formatTimestamp(record.timestamp);
  const appId = "APP-" + String(record.id).padStart(4, "0");

  const shapSource = record.raw_shap_data ?? record.raw_data ?? {};
  const shapEntries = Object.entries(shapSource).sort(
    (a, b) => Math.abs(b[1]) - Math.abs(a[1])
  );
  const maxAbs = shapEntries.length
    ? Math.max(...shapEntries.map(([, v]) => Math.abs(v)))
    : 1;
  const confidence = normalizeConfidence(record.confidence);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ animation: "backdropIn 0.25s ease both" }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal card */}
      <div
        className="relative bg-surface-container-lowest rounded-2xl border border-outline-variant
          shadow-2xl w-full max-w-xl p-6 max-h-[85vh] overflow-y-auto"
        style={{ animation: "modalIn 0.35s cubic-bezier(0.16,1,0.3,1) both" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
              Application Details · {appId}
            </p>
            <h3 className="text-[22px] font-bold text-primary tracking-tight mt-0.5">
              {record.applicant_name ?? "Unknown Applicant"}
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

        {/* ── Decision banner + Confidence ── */}
        <div
          className={`rounded-xl px-4 py-4 flex items-center justify-between gap-4 mb-5
            ${
              approved
                ? "bg-emerald-50 border border-emerald-200"
                : "bg-red-50 border border-red-200"
            }`}
          style={{ animation: "fadeUp 0.35s ease both 0.05s" }}
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
          {/* Confidence gauge */}
          {confidence != null && (
            <div className="flex-shrink-0 text-right">
              <ConfidenceGauge pct={confidence} approved={approved} />
            </div>
          )}
        </div>

        {/* ── AI voice message ── */}
        {record.ai_voice_message && (
          <div
            className="bg-primary-container rounded-xl p-4 mb-5 relative overflow-hidden"
            style={{ animation: "fadeUp 0.4s ease both 0.1s" }}
          >
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

        {/* ── Details grid ── */}
        <div
          className="grid grid-cols-2 gap-3 mb-5"
          style={{ animation: "fadeUp 0.4s ease both 0.15s" }}
        >
          {[
            { label: "Applicant", value: record.applicant_name ?? "—" },
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

        {/* ── Factor Analysis — "Why this decision was made" ── */}
        {shapEntries.length > 0 && (
          <div
            className="mb-5"
            style={{ animation: "fadeUp 0.4s ease both 0.2s" }}
          >
            {/* Section header */}
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                psychology
              </span>
              <div>
                <p className="text-[14px] font-semibold text-on-surface">
                  Why this decision was made
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Factor Analysis — SHAP Impact Values
                </p>
              </div>
            </div>

            {/* Legend pills */}
            <div className="flex gap-3 mb-4">
              <span
                className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50
                border border-emerald-200 rounded-full text-[10px] font-bold text-emerald-700 uppercase tracking-wider"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Helping
              </span>
              <span
                className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50
                border border-red-200 rounded-full text-[10px] font-bold text-red-700 uppercase tracking-wider"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-error" />
                Hurting
              </span>
            </div>

            {/* Factor rows */}
            <div className="flex flex-col gap-2.5">
              {shapEntries.map(([key, value], i) => {
                const isPos = value >= 0;
                const barWidth = Math.round((Math.abs(value) / maxAbs) * 100);
                return (
                  <div
                    key={key}
                    className={`rounded-xl p-3 border ${
                      isPos
                        ? "bg-emerald-50/60 border-emerald-100"
                        : "bg-red-50/60 border-red-100"
                    }`}
                    style={{
                      animation: `fadeUp 0.4s ease both ${0.22 + i * 0.07}s`,
                    }}
                  >
                    {/* Top row: label + tag + value */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-1.5 h-1.5 rounded-full flex-shrink-0
                          ${isPos ? "bg-emerald-500" : "bg-error"}`}
                        />
                        <span className="text-[12px] font-semibold text-on-surface">
                          {SHAP_LABELS[key] ?? key}
                        </span>
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider
                          px-1.5 py-0.5 rounded-full
                          ${
                            isPos
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {isPos ? "Helping" : "Hurting"}
                        </span>
                      </div>
                      <span
                        className={`text-[12px] font-bold font-mono
                        ${isPos ? "text-emerald-600" : "text-error"}`}
                      >
                        {isPos ? "+" : ""}
                        {value.toFixed(3)}
                      </span>
                    </div>

                    {/* Progress bar — full width, colour coded */}
                    <div className="w-full h-1.5 bg-white/80 rounded-full overflow-hidden border border-black/5">
                      <div
                        className={`h-full rounded-full ${
                          isPos ? "bg-emerald-500" : "bg-error"
                        }`}
                        style={{
                          width: `${barWidth}%`,
                          transition: `width 0.8s cubic-bezier(0.16,1,0.3,1) ${
                            0.3 + i * 0.07
                          }s`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div
          className="flex gap-3"
          style={{ animation: "fadeUp 0.4s ease both 0.3s" }}
        >
          <button
            onClick={() => {
              console.log(
                "[LendClear] raw_shap_data for " + appId + ":",
                record.raw_shap_data ?? record.raw_data
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
    </div>,
    document.body
  );
}

/* ─────────────────────────────────────────────
   SKELETON ROW
───────────────────────────────────────────── */
function SkeletonRow({ index }) {
  return (
    <tr style={{ animation: `fadeUp 0.4s ease both ${index * 50}ms` }}>
      {Array.from({ length: 10 }).map((_, i) => (
        <td key={i} className="px-5 py-4">
          <div
            className="h-3 bg-surface-container-high rounded-full animate-pulse"
            style={{
              width: `${60 + ((i * 13) % 40)}%`,
              animationDelay: `${i * 80}ms`,
            }}
          />
          {i === 1 && (
            <div
              className="h-2.5 bg-surface-container-high rounded-full animate-pulse mt-2 w-1/2"
              style={{ animationDelay: `${i * 80 + 40}ms` }}
            />
          )}
        </td>
      ))}
    </tr>
  );
}

/* ─────────────────────────────────────────────
   STAT CARD
───────────────────────────────────────────── */
function StatCard({
  icon,
  iconBg,
  iconColor,
  badge,
  label,
  value,
  isLoading,
  variant,
  delay,
}) {
  return (
    <Animate variant={variant} delay={delay}>
      <div
        className="bg-surface-container-lowest border border-outline-variant
        rounded-xl p-5 shadow-sm flex flex-col gap-3 h-full"
      >
        <div className="flex justify-between items-start">
          <div className={`p-2 ${iconBg} rounded-lg`}>
            <span
              className={`material-symbols-outlined ${iconColor} text-[22px]`}
            >
              {icon}
            </span>
          </div>
          <span className="text-[11px] font-bold text-on-tertiary-container">
            {badge}
          </span>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
            {label}
          </p>
          <div className="text-[36px] font-bold text-primary tracking-tight leading-tight mt-0.5">
            {isLoading ? (
              <span className="inline-block w-24 h-9 bg-surface-container-high rounded animate-pulse" />
            ) : (
              value
            )}
          </div>
        </div>
      </div>
    </Animate>
  );
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function AuditLogsPage() {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

  /* ── Fetch ── */
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        const { data } = await axios.get(API_URL, { timeout: 10000 });
        if (!cancelled) {
          console.log("[LendClear] API first record:", data?.[0]);
          console.log(
            "[LendClear] confidence type:",
            typeof data?.[0]?.confidence,
            "| value:",
            data?.[0]?.confidence
          );
          setHistory(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setFetchError(
            err?.response?.data?.detail ?? err?.message ?? "Failed to fetch."
          );
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

  const totalRecords = history.length;
  const approvedCount = history.filter((r) => r.status === "Accepted").length;
  const approvalRate =
    totalRecords > 0 ? Math.round((approvedCount / totalRecords) * 100) : 0;

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
      {/* Global keyframes */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes backdropIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(32px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>

      <DetailModal record={selected} onClose={() => setSelected(null)} />

      <div className="space-y-6">
        {/* ── Page header ── */}
        <Animate variant="fadeDown" duration={600}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-[36px] font-bold text-primary tracking-tight leading-tight">
                Evaluation History
              </h2>
              <p className="text-[16px] text-on-surface-variant mt-1">
                Audit and track historical loan eligibility decisions.
              </p>
            </div>

            {/* Search + filters */}
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
        </Animate>

        {/* ── Stats bento ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            icon="description"
            iconBg="bg-secondary-container"
            iconColor="text-on-secondary-container"
            badge={isLoading ? "—" : `${totalRecords} records`}
            label="Total Evaluations"
            value={totalRecords.toLocaleString()}
            isLoading={isLoading}
            variant="slideLeft"
            delay={0}
          />
          <StatCard
            icon="check_circle"
            iconBg="bg-tertiary-fixed"
            iconColor="text-on-tertiary-fixed-variant"
            badge="Live"
            label="Approval Rate"
            value={`${approvalRate}%`}
            isLoading={isLoading}
            variant="fadeUp"
            delay={80}
          />
          <StatCard
            icon="bolt"
            iconBg="bg-primary-fixed"
            iconColor="text-on-primary-fixed-variant"
            badge="FastAPI"
            label="Data Source"
            value={
              <span className="flex items-center gap-2 text-[22px]">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                PostgreSQL Live
              </span>
            }
            isLoading={isLoading}
            variant="slideRight"
            delay={160}
          />
        </div>

        {/* ── Error banner ── */}
        {fetchError && (
          <Animate variant="fadeUp">
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
          </Animate>
        )}

        {/* ── History table ── */}
        <Animate variant="fadeUp" delay={200} threshold={0.05}>
          <div
            className="bg-surface-container-lowest border border-outline-variant
            rounded-xl shadow-sm overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant">
                    {[
                      "Date / Time",
                      "App ID",
                      "Applicant",
                      "City",
                      "Loan Amount",
                      "Income",
                      "Status",
                      "Confidence",
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
                  {/* Skeleton */}
                  {isLoading &&
                    Array.from({ length: PAGE_SIZE }).map((_, i) => (
                      <SkeletonRow key={i} index={i} />
                    ))}

                  {/* Empty */}
                  {!isLoading && !fetchError && filtered.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-5 py-16 text-center">
                        <span className="material-symbols-outlined text-[48px] text-outline-variant block mb-3">
                          history
                        </span>
                        <p className="text-[15px] font-semibold text-on-surface-variant">
                          {search || filter !== "All"
                            ? "No results match your filters."
                            : "No evaluations yet."}
                        </p>
                        {!search && filter === "All" && (
                          <p className="text-[13px] text-on-surface-variant mt-1 opacity-70">
                            Submit a loan application to see it appear here.
                          </p>
                        )}
                      </td>
                    </tr>
                  )}

                  {/* Real rows — each staggered */}
                  {!isLoading &&
                    paginated.map((r, rowIdx) => {
                      const approved = r.status === "Accepted";
                      const { date, time } = formatTimestamp(r.timestamp);
                      const appId = "APP-" + String(r.id).padStart(4, "0");
                      const initials = getInitials(r.applicant_name, r.city);

                      return (
                        <tr
                          key={r.id}
                          className="hover:bg-surface-bright transition-colors"
                          style={{
                            animation: `fadeUp 0.45s cubic-bezier(0.16,1,0.3,1) both`,
                            animationDelay: `${rowIdx * 55}ms`,
                          }}
                        >
                          <td className="px-5 py-3 whitespace-nowrap">
                            <p className="text-[13px] font-medium text-primary font-mono">
                              {date}
                            </p>
                            <p className="text-[11px] text-on-surface-variant">
                              {time}
                            </p>
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            <span className="text-[12px] font-mono text-on-surface-variant">
                              {appId}
                            </span>
                          </td>
                          {/* Applicant name + avatar */}
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
                                  {r.applicant_name ?? "—"}
                                </p>
                                <p className="text-[11px] text-on-surface-variant">
                                  CS: {r.credit_score ?? "—"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <span className="text-[13px] text-on-surface-variant">
                              {r.city ?? "—"}
                            </span>
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            <span className="text-[13px] font-medium text-primary font-mono">
                              {formatCurrency(r.loan_amount)}
                            </span>
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            <span className="text-[13px] font-medium text-primary font-mono">
                              {formatCurrency(r.income)}
                            </span>
                          </td>
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
                          {/* Confidence column */}
                          <td className="px-5 py-3 whitespace-nowrap">
                            {(() => {
                              const confPct = normalizeConfidence(r.confidence);
                              if (confPct === null)
                                return (
                                  <span className="text-[12px] text-on-surface-variant">
                                    —
                                  </span>
                                );
                              return (
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all duration-700 ${
                                        approved ? "bg-emerald-500" : "bg-error"
                                      }`}
                                      style={{
                                        width: `${Math.min(confPct, 100)}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="text-[12px] font-bold font-mono text-primary">
                                    {confPct}%
                                  </span>
                                </div>
                              );
                            })()}
                          </td>{" "}
                          <td className="px-5 py-3">
                            <span className="text-[13px] text-on-surface-variant">
                              {r.top_reason ?? "—"}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <button
                              onClick={() => {
                                console.log(
                                  "[LendClear] raw_shap_data for " +
                                    appId +
                                    ":",
                                  r.raw_shap_data ?? r.raw_data
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

            {/* Pagination */}
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
                    (p) =>
                      p === 1 || p === totalPages || Math.abs(p - page) <= 1
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
                        className="w-8 h-8 flex items-center justify-center text-[12px] text-on-surface-variant"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 flex items-center justify-center rounded text-[12px] font-bold transition-all
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
                  disabled={
                    page === totalPages || isLoading || totalPages === 0
                  }
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
        </Animate>

        {/* ── Bottom CTA bento ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-4">
          <Animate variant="slideLeft" delay={100} threshold={0.1}>
            <div
              className="relative rounded-xl overflow-hidden min-h-[180px]
              border border-outline-variant bg-primary-container h-full"
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
                    Export detailed audit logs and compliance reports for
                    external review.
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
          </Animate>

          <Animate variant="slideRight" delay={180} threshold={0.1}>
            <div
              className="bg-primary text-on-primary rounded-xl p-8 flex flex-col
              justify-between min-h-[180px] h-full"
            >
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
          </Animate>
        </div>
      </div>
    </>
  );
}
