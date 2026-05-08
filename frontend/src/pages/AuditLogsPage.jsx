import { useState, useMemo } from "react";

/* ─── FAKE HISTORY DATA ─── */
const ALL_HISTORY = [
  {
    id: "APP-1041",
    date: "Nov 12, 2024",
    time: "14:32 PM",
    name: "Alex Rivers",
    initials: "AR",
    city: "New York",
    amount: "$250,000",
    status: "Rejected",
    confidence: 94,
    factor: "Debt-to-Income",
    income: 68500,
    credit: 582,
    years: 3,
  },
  {
    id: "APP-1040",
    date: "Nov 12, 2024",
    time: "12:15 PM",
    name: "Sarah Miller",
    initials: "SM",
    city: "Chicago",
    amount: "$45,000",
    status: "Accepted",
    confidence: 87,
    factor: "Credit History",
    income: 92000,
    credit: 740,
    years: 7,
  },
  {
    id: "APP-1039",
    date: "Nov 11, 2024",
    time: "09:10 AM",
    name: "James Hannon",
    initials: "JH",
    city: "Los Angeles",
    amount: "$1,200,000",
    status: "Rejected",
    confidence: 98,
    factor: "Collateral Value",
    income: 120000,
    credit: 610,
    years: 2,
  },
  {
    id: "APP-1038",
    date: "Nov 11, 2024",
    time: "11:45 AM",
    name: "Priya Sharma",
    initials: "PS",
    city: "Austin",
    amount: "$320,000",
    status: "Rejected",
    confidence: 91,
    factor: "Credit Score",
    income: 54000,
    credit: 598,
    years: 4,
  },
  {
    id: "APP-1037",
    date: "Nov 10, 2024",
    time: "16:22 PM",
    name: "Derek Huang",
    initials: "DH",
    city: "Seattle",
    amount: "$95,000",
    status: "Accepted",
    confidence: 92,
    factor: "Annual Income",
    income: 145000,
    credit: 755,
    years: 9,
  },
  {
    id: "APP-1036",
    date: "Nov 10, 2024",
    time: "10:05 AM",
    name: "Maria Santos",
    initials: "MS",
    city: "Miami",
    amount: "$180,000",
    status: "Accepted",
    confidence: 79,
    factor: "Employment Tenure",
    income: 87000,
    credit: 695,
    years: 6,
  },
  {
    id: "APP-1035",
    date: "Nov 09, 2024",
    time: "13:48 PM",
    name: "Kevin O'Brien",
    initials: "KO",
    city: "Boston",
    amount: "$500,000",
    status: "Rejected",
    confidence: 96,
    factor: "Loan-to-Income",
    income: 73000,
    credit: 620,
    years: 5,
  },
  {
    id: "APP-1034",
    date: "Nov 09, 2024",
    time: "08:30 AM",
    name: "Linda Zhao",
    initials: "LZ",
    city: "San Jose",
    amount: "$75,000",
    status: "Accepted",
    confidence: 84,
    factor: "Credit History",
    income: 110000,
    credit: 720,
    years: 8,
  },
  {
    id: "APP-1033",
    date: "Nov 08, 2024",
    time: "15:17 PM",
    name: "Omar Hassan",
    initials: "OH",
    city: "Houston",
    amount: "$230,000",
    status: "Accepted",
    confidence: 88,
    factor: "Annual Income",
    income: 98000,
    credit: 710,
    years: 11,
  },
  {
    id: "APP-1032",
    date: "Nov 08, 2024",
    time: "11:02 AM",
    name: "Tanya Briggs",
    initials: "TB",
    city: "Phoenix",
    amount: "$410,000",
    status: "Rejected",
    confidence: 93,
    factor: "Credit Score",
    income: 61000,
    credit: 575,
    years: 2,
  },
  {
    id: "APP-1031",
    date: "Nov 07, 2024",
    time: "14:55 PM",
    name: "Samuel Okafor",
    initials: "SO",
    city: "Atlanta",
    amount: "$155,000",
    status: "Accepted",
    confidence: 81,
    factor: "Employment Tenure",
    income: 83000,
    credit: 688,
    years: 6,
  },
  {
    id: "APP-1030",
    date: "Nov 07, 2024",
    time: "09:40 AM",
    name: "Rachel Kim",
    initials: "RK",
    city: "Denver",
    amount: "$620,000",
    status: "Rejected",
    confidence: 97,
    factor: "Collateral Value",
    income: 95000,
    credit: 640,
    years: 4,
  },
  {
    id: "APP-1029",
    date: "Nov 06, 2024",
    time: "16:10 PM",
    name: "Ethan Brooks",
    initials: "EB",
    city: "Portland",
    amount: "$88,000",
    status: "Accepted",
    confidence: 90,
    factor: "Credit History",
    income: 125000,
    credit: 762,
    years: 13,
  },
  {
    id: "APP-1028",
    date: "Nov 06, 2024",
    time: "10:28 AM",
    name: "Fatima Al-Rashid",
    initials: "FA",
    city: "Dallas",
    amount: "$275,000",
    status: "Accepted",
    confidence: 76,
    factor: "Annual Income",
    income: 102000,
    credit: 700,
    years: 7,
  },
  {
    id: "APP-1027",
    date: "Nov 05, 2024",
    time: "13:33 PM",
    name: "Carlos Mendez",
    initials: "CM",
    city: "San Diego",
    amount: "$390,000",
    status: "Rejected",
    confidence: 89,
    factor: "Debt-to-Income",
    income: 58000,
    credit: 603,
    years: 3,
  },
];

const PAGE_SIZE = 8;

/* ─── DETAIL MODAL ─── */
function DetailModal({ record, onClose }) {
  if (!record) return null;
  const approved = record.status === "Accepted";
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-surface-container-lowest rounded-2xl border border-outline-variant
          shadow-2xl w-full max-w-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
              Application Details
            </p>
            <h3 className="text-[22px] font-bold text-primary tracking-tight mt-0.5">
              {record.id}
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

        {/* Decision badge */}
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
              className={`w-10 h-10 rounded-full flex items-center justify-center
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
                Primary factor: {record.factor}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p
              className={`text-[11px] font-bold uppercase tracking-widest
              ${approved ? "text-emerald-800" : "text-red-800"}`}
            >
              Confidence
            </p>
            <p
              className={`text-[28px] font-bold leading-none
              ${approved ? "text-emerald-600" : "text-red-600"}`}
            >
              {record.confidence}%
            </p>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Applicant", value: record.name },
            { label: "City", value: record.city },
            { label: "Loan Amount", value: record.amount },
            {
              label: "Annual Income",
              value: `$${record.income.toLocaleString()}`,
            },
            { label: "Credit Score", value: record.credit },
            { label: "Years Employed", value: `${record.years} yrs` },
            { label: "Date", value: record.date },
            { label: "Time", value: record.time },
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

        {/* Footer */}
        <div className="flex gap-3 mt-5">
          <button
            className="flex-1 flex items-center justify-center gap-2 py-2.5
            border border-outline-variant rounded-lg text-[12px] font-bold uppercase
            tracking-widest text-on-surface-variant hover:bg-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">
              download
            </span>
            Export PDF
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

/* ─── MAIN PAGE ─── */
export default function AuditLogsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

  /* Derived filtered + searched list */
  const filtered = useMemo(() => {
    return ALL_HISTORY.filter((r) => {
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
        r.name.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q);

      return matchesFilter && matchesSearch;
    });
  }, [search, filter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const approvedCount = ALL_HISTORY.filter(
    (r) => r.status === "Accepted"
  ).length;
  const approvalRate = Math.round((approvedCount / ALL_HISTORY.length) * 100);
  const avgConfidence = Math.round(
    ALL_HISTORY.reduce((s, r) => s + r.confidence, 0) / ALL_HISTORY.length
  );

  const handleFilter = (f) => {
    setFilter(f);
    setPage(1);
  };
  const handleSearch = (v) => {
    setSearch(v);
    setPage(1);
  };

  return (
    <>
      {/* Detail modal */}
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

          {/* Search + filter controls */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search */}
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
                placeholder="Name, ID or city…"
                className="pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant
                  rounded-lg w-full md:w-56 focus:border-primary focus:ring-1 focus:ring-primary
                  outline-none transition-all text-[13px] text-on-surface placeholder:text-outline"
              />
            </div>

            {/* Status filter */}
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
          {/* Total evaluations */}
          <div
            className="bg-surface-container-lowest border border-outline-variant
            rounded-xl p-5 shadow-sm flex flex-col gap-3"
          >
            <div className="flex justify-between items-start">
              <div className="p-2 bg-secondary-container rounded-lg">
                <span className="material-symbols-outlined text-on-secondary-container text-[22px]">
                  description
                </span>
              </div>
              <span className="text-[11px] font-bold text-on-tertiary-container">
                +12% vs LY
              </span>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                Total Evaluations
              </p>
              <h3 className="text-[36px] font-bold text-primary tracking-tight leading-tight">
                14,292
              </h3>
            </div>
          </div>

          {/* Approval rate */}
          <div
            className="bg-surface-container-lowest border border-outline-variant
            rounded-xl p-5 shadow-sm flex flex-col gap-3"
          >
            <div className="flex justify-between items-start">
              <div className="p-2 bg-tertiary-fixed rounded-lg">
                <span className="material-symbols-outlined text-on-tertiary-fixed-variant text-[22px]">
                  check_circle
                </span>
              </div>
              <span className="text-[11px] font-bold text-on-tertiary-container">
                Stable
              </span>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                Approval Rate
              </p>
              <h3 className="text-[36px] font-bold text-primary tracking-tight leading-tight">
                {approvalRate}%
              </h3>
            </div>
          </div>

          {/* Avg confidence */}
          <div
            className="bg-surface-container-lowest border border-outline-variant
            rounded-xl p-5 shadow-sm flex flex-col gap-3"
          >
            <div className="flex justify-between items-start">
              <div className="p-2 bg-primary-fixed rounded-lg">
                <span className="material-symbols-outlined text-on-primary-fixed-variant text-[22px]">
                  bolt
                </span>
              </div>
              <span className="text-[11px] font-bold text-on-tertiary-container">
                +4.2%
              </span>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                Avg. Confidence Score
              </p>
              <h3 className="text-[36px] font-bold text-primary tracking-tight leading-tight">
                {avgConfidence}%
              </h3>
            </div>
          </div>
        </div>

        {/* ── History table ── */}
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
                    "Applicant",
                    "City",
                    "Requested",
                    "Status",
                    "Confidence",
                    "Risk Factor",
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
                {paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-12 text-center text-[14px] text-on-surface-variant"
                    >
                      No results match your search.
                    </td>
                  </tr>
                ) : (
                  paginated.map((r) => {
                    const approved = r.status === "Accepted";
                    return (
                      <tr
                        key={r.id}
                        className="hover:bg-surface-bright transition-colors"
                      >
                        {/* Date */}
                        <td className="px-5 py-3 whitespace-nowrap">
                          <p className="text-[13px] font-medium text-primary font-mono">
                            {r.date}
                          </p>
                          <p className="text-[11px] text-on-surface-variant">
                            {r.time}
                          </p>
                        </td>

                        {/* Applicant */}
                        <td className="px-5 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-full bg-surface-container-highest
                            flex items-center justify-center text-[11px] font-bold text-on-surface flex-shrink-0"
                            >
                              {r.initials}
                            </div>
                            <div>
                              <p className="text-[13px] font-semibold text-primary">
                                {r.name}
                              </p>
                              <p className="text-[11px] text-on-surface-variant">
                                {r.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* City */}
                        <td className="px-5 py-3">
                          <span className="text-[13px] text-on-surface-variant">
                            {r.city}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="px-5 py-3 whitespace-nowrap">
                          <span className="text-[13px] font-medium text-primary font-mono">
                            {r.amount}
                          </span>
                        </td>

                        {/* Status */}
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

                        {/* Confidence bar */}
                        <td className="px-5 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  approved ? "bg-emerald-500" : "bg-error"
                                }`}
                                style={{ width: `${r.confidence}%` }}
                              />
                            </div>
                            <span className="text-[13px] font-mono font-medium text-primary">
                              {r.confidence}%
                            </span>
                          </div>
                        </td>

                        {/* Risk factor */}
                        <td className="px-5 py-3">
                          <span className="text-[13px] text-on-surface-variant">
                            {r.factor}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => setSelected(r)}
                            className="px-3 py-1.5 border border-outline-variant rounded-lg
                            text-primary text-[12px] font-bold uppercase tracking-wider
                            hover:bg-primary hover:text-on-primary transition-all whitespace-nowrap"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          <div
            className="px-5 py-3 bg-surface-container-low border-t border-outline-variant
            flex items-center justify-between gap-4 flex-wrap"
          >
            <span className="text-[12px] font-semibold text-on-surface-variant">
              Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}{" "}
              entries
            </span>

            <div className="flex items-center gap-1">
              {/* Prev */}
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center border border-outline-variant
                  rounded hover:bg-surface-container transition-all disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-[18px]">
                  chevron_left
                </span>
              </button>

              {/* Page numbers */}
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
                      key={`ellipsis-${i}`}
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

              {/* Next */}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || totalPages === 0}
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
          {/* Advanced reporting card */}
          <div
            className="relative rounded-xl overflow-hidden min-h-[180px]
            border border-outline-variant bg-primary-container"
          >
            {/* Decorative orb */}
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

          {/* AI improvement card */}
          <div
            className="bg-primary text-on-primary rounded-xl p-8 flex flex-col justify-between
            min-h-[180px]"
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
                The AI model's precision score has improved by 0.8% this week
                based on corrected outcome data.
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
