// import { useState, useRef, useCallback } from "react";
// import { runEvaluation } from "../api/evaluate";

// /* ─────────────────────────────────────────────
//    CONSTANTS
// ───────────────────────────────────────────── */
// const INITIAL_FORM = {
//   income: "",
//   credit_score: "",
//   loan_amount: "",
//   years_employed: "",
//   points: "",
//   city: "",
// };

// const FIELDS = [
//   {
//     key: "income",
//     label: "Annual Income (USD)",
//     placeholder: "e.g. 85,000",
//     prefix: "$",
//     icon: null,
//   },
//   {
//     key: "credit_score",
//     label: "Credit Score (300–850)",
//     placeholder: "720",
//     prefix: null,
//     icon: "credit_score",
//   },
//   {
//     key: "loan_amount",
//     label: "Loan Amount (USD)",
//     placeholder: "250,000",
//     prefix: "$",
//     icon: null,
//   },
//   {
//     key: "years_employed",
//     label: "Years Employed",
//     placeholder: "5",
//     prefix: null,
//     icon: "work",
//   },
//   {
//     key: "points",
//     label: "Internal Risk Points",
//     placeholder: "102",
//     prefix: null,
//     icon: "token",
//   },
//   {
//     key: "city",
//     label: "City Name",
//     placeholder: "e.g. New York",
//     prefix: null,
//     icon: "location_on",
//   },
// ];

// const SHAP_LABELS = {
//   credit_score: "Credit Score Impact",
//   income: "Annual Income Impact",
//   loan_amount: "Loan Amount Impact",
//   years_employed: "Years Employed Impact",
//   city: "Location Volatility",
//   points: "Risk Points Impact",
// };

// /* Sample CSV content for download */
// const SAMPLE_CSV = `city,income,credit_score,loan_amount,years_employed
// New York,85000,720,250000,5
// Chicago,62000,650,150000,3
// Los Angeles,110000,780,400000,8
// Houston,48000,590,120000,2
// Phoenix,73000,700,200000,6`;

// /* ─────────────────────────────────────────────
//    SHARED UI PRIMITIVES
// ───────────────────────────────────────────── */
// function FormField({ field, value, onChange }) {
//   const { key, label, placeholder, prefix, icon } = field;
//   return (
//     <div className="flex flex-col gap-1.5">
//       <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
//         {label}
//       </label>
//       <div className="relative">
//         {prefix && (
//           <span className="absolute left-4 top-1/2 -translate-y-1/2 text-outline font-medium text-[15px] pointer-events-none">
//             {prefix}
//           </span>
//         )}
//         {icon && (
//           <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[20px]">
//             {icon}
//           </span>
//         )}
//         <input
//           type={key === "city" ? "text" : "number"}
//           value={value}
//           placeholder={placeholder}
//           onChange={(e) => onChange(key, e.target.value)}
//           className={`w-full py-3 pr-4 bg-surface border border-outline-variant rounded-lg
//             text-[14px] font-medium text-on-surface
//             focus:ring-2 focus:ring-primary focus:border-primary
//             outline-none transition-all placeholder:text-outline
//             ${prefix || icon ? "pl-8" : "pl-4"}`}
//         />
//       </div>
//     </div>
//   );
// }

// function ProcessingOverlay() {
//   return (
//     <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
//       <div className="flex flex-col items-center gap-6 text-center px-6">
//         <div className="relative w-20 h-20">
//           <div className="absolute inset-0 border-4 border-surface-container-highest rounded-full" />
//           <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
//           <div className="absolute inset-0 flex items-center justify-center">
//             <span className="material-symbols-outlined text-primary text-[28px] animate-pulse">
//               analytics
//             </span>
//           </div>
//         </div>
//         <div>
//           <h3 className="text-[20px] font-semibold text-primary">
//             Analyzing Financial Data
//           </h3>
//           <p className="text-[14px] text-on-surface-variant mt-1">
//             Running risk simulations on regional datasets…
//           </p>
//         </div>
//         <div className="grid grid-cols-2 gap-3 w-72">
//           {[1, 0.8, 0.9, 0.6].map((w, i) => (
//             <div
//               key={i}
//               className="h-3 bg-surface-container-highest rounded-full animate-pulse"
//               style={{ width: `${w * 100}%`, animationDelay: `${i * 150}ms` }}
//             />
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }

// function DecisionBanner({ approved, status, confidence }) {
//   const isApproved = approved;
//   const confPct =
//     confidence != null
//       ? Math.round(confidence > 1 ? confidence : confidence * 100)
//       : null;
//   return (
//     <div
//       className={`rounded-xl px-6 py-5 flex items-center justify-between gap-4 flex-wrap
//         ${
//           isApproved
//             ? "bg-emerald-50 border border-emerald-200"
//             : "bg-red-50 border border-red-200"
//         }`}
//       style={{ animation: "fadeUp 0.4s ease both" }}
//     >
//       <div className="flex items-center gap-5">
//         <div
//           className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg flex-shrink-0
//           ${isApproved ? "bg-emerald-600" : "bg-red-600"}`}
//         >
//           <span
//             className="material-symbols-outlined text-white text-[30px]"
//             style={{ fontVariationSettings: "'FILL' 1" }}
//           >
//             {isApproved ? "check_circle" : "cancel"}
//           </span>
//         </div>
//         <div>
//           <h4
//             className={`text-[30px] font-bold leading-none tracking-tight
//             ${isApproved ? "text-emerald-900" : "text-red-900"}`}
//           >
//             Application {status}
//           </h4>
//           <p
//             className={`text-[14px] mt-1 ${
//               isApproved ? "text-emerald-700" : "text-red-700"
//             }`}
//           >
//             {isApproved
//               ? "The candidate meets all required risk thresholds for the requested amount."
//               : "The candidate does not meet the minimum risk thresholds for this loan tier."}
//           </p>
//         </div>
//       </div>
//       {confPct != null && (
//         <div className="text-right flex-shrink-0">
//           <span
//             className={`text-[11px] font-bold uppercase tracking-widest block mb-1
//             ${isApproved ? "text-emerald-800" : "text-red-800"}`}
//           >
//             Confidence Score
//           </span>
//           <span
//             className={`text-[36px] font-bold leading-none
//             ${isApproved ? "text-emerald-600" : "text-red-600"}`}
//           >
//             {confPct}%
//           </span>
//         </div>
//       )}
//     </div>
//   );
// }

// function AIVoiceCard({ message, approved }) {
//   return (
//     <div
//       className="bg-primary-container rounded-xl p-6 flex flex-col gap-4 relative overflow-hidden shadow-xl h-full"
//       style={{ animation: "fadeUp 0.4s ease both", animationDelay: "80ms" }}
//     >
//       <div className="absolute -top-10 -right-10 w-48 h-48 bg-secondary-container opacity-10 rounded-full blur-3xl pointer-events-none" />
//       <div className="flex items-center gap-2 z-10">
//         <span
//           className="material-symbols-outlined text-secondary-container text-[22px]"
//           style={{ fontVariationSettings: "'FILL' 1" }}
//         >
//           auto_awesome
//         </span>
//         <span className="text-[11px] font-bold uppercase tracking-widest text-on-primary-container">
//           AI Financial Analyst
//         </span>
//       </div>
//       <blockquote className="text-[15px] text-on-primary-fixed leading-relaxed italic z-10 flex-1">
//         "{message}"
//       </blockquote>
//       <div className="flex items-center gap-2 z-10 mt-auto">
//         <div className="flex items-end gap-0.5 h-5">
//           {[3, 5, 4, 2, 4, 3, 5].map((h, i) => (
//             <div
//               key={i}
//               className={`w-1 rounded-full ${
//                 approved ? "bg-emerald-400" : "bg-red-400"
//               }`}
//               style={{
//                 height: `${h * 3}px`,
//                 animation: "pulse 1s ease-in-out infinite",
//                 animationDelay: `${i * 120}ms`,
//               }}
//             />
//           ))}
//         </div>
//         <span className="text-[10px] text-on-primary-container font-semibold tracking-wider">
//           PROCESSING VOICE SYNTH…
//         </span>
//       </div>
//     </div>
//   );
// }

// function ShapBar({ label, value, maxAbs, index }) {
//   const isPos = value >= 0;
//   const pct = Math.round((Math.abs(value) / maxAbs) * 100);
//   const barPct = Math.round(pct * 0.45);
//   return (
//     <div
//       style={{
//         animation: "fadeUp 0.4s ease both",
//         animationDelay: `${index * 70}ms`,
//       }}
//     >
//       <div className="flex justify-between items-center mb-1.5">
//         <span className="text-[13px] font-medium text-on-surface">{label}</span>
//         <span
//           className={`text-[13px] font-bold font-mono ${
//             isPos ? "text-emerald-600" : "text-error"
//           }`}
//         >
//           {isPos ? "+" : ""}
//           {value.toFixed(3)}
//         </span>
//       </div>
//       <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden flex">
//         {isPos ? (
//           <>
//             <div className="w-1/2" />
//             <div
//               className="h-full bg-emerald-500 rounded-r-full transition-all duration-700"
//               style={{ width: `${barPct}%` }}
//             />
//           </>
//         ) : (
//           <>
//             <div className="flex-1" />
//             <div
//               className="h-full bg-error rounded-l-full transition-all duration-700"
//               style={{ width: `${barPct}%` }}
//             />
//             <div className="w-1/2" />
//           </>
//         )}
//       </div>
//     </div>
//   );
// }

// function RiskAnalysisCard({ rawData }) {
//   const entries = Object.entries(rawData).sort(
//     (a, b) => Math.abs(b[1]) - Math.abs(a[1])
//   );
//   const maxAbs = Math.max(...entries.map(([, v]) => Math.abs(v)));
//   return (
//     <div
//       className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6
//       shadow-[0_4px_20px_-2px_rgba(0,0,0,0.06)] h-full"
//       style={{ animation: "fadeUp 0.4s ease both", animationDelay: "160ms" }}
//     >
//       <div className="flex items-start justify-between mb-6">
//         <div>
//           <h5 className="text-[18px] font-semibold text-on-surface">
//             Risk Factor Breakdown
//           </h5>
//           <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mt-0.5">
//             SHAP Impact Value Analysis
//           </p>
//         </div>
//         <span className="material-symbols-outlined text-outline text-[22px]">
//           info
//         </span>
//       </div>
//       <div className="flex text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3 px-1">
//         <span className="flex-1 text-right pr-2 text-error">← Hurts</span>
//         <span className="w-px bg-outline-variant" />
//         <span className="flex-1 pl-2 text-emerald-600">Helps →</span>
//       </div>
//       <div className="flex flex-col gap-4">
//         {entries.map(([key, value], i) => (
//           <ShapBar
//             key={key}
//             label={SHAP_LABELS[key] || key}
//             value={value}
//             maxAbs={maxAbs}
//             index={i}
//           />
//         ))}
//       </div>
//       <div className="mt-6 pt-4 border-t border-outline-variant flex items-center justify-center gap-8">
//         <div className="flex items-center gap-2">
//           <div className="w-3 h-3 rounded-full bg-emerald-500" />
//           <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
//             Reduces Risk
//           </span>
//         </div>
//         <div className="flex items-center gap-2">
//           <div className="w-3 h-3 rounded-full bg-error" />
//           <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
//             Increases Risk
//           </span>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ─────────────────────────────────────────────
//    BULK UPLOAD PANEL
// ───────────────────────────────────────────── */
// const BULK_URL = "http://localhost:8000/predict/bulk";

// /* Status can be: idle | uploading | success | error */

// function downloadSampleCSV() {
//   const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
//   const url = URL.createObjectURL(blob);
//   const a = document.createElement("a");
//   a.href = url;
//   a.download = "lendclear_sample.csv";
//   a.click();
//   URL.revokeObjectURL(url);
// }

// function BulkUploadPanel() {
//   const [status, setStatus] = useState("idle"); // idle | uploading | success | error
//   const [file, setFile] = useState(null);
//   const [response, setResponse] = useState(null);
//   const [errorMsg, setErrorMsg] = useState("");
//   const [isDragOver, setIsDragOver] = useState(false);
//   const inputRef = useRef(null);

//   const acceptFile = (f) => {
//     if (!f) return;
//     if (!f.name.endsWith(".csv")) {
//       setErrorMsg("Only .csv files are accepted.");
//       setStatus("error");
//       return;
//     }
//     setFile(f);
//     setStatus("idle");
//     setResponse(null);
//     setErrorMsg("");
//   };

//   const onDrop = useCallback((e) => {
//     e.preventDefault();
//     setIsDragOver(false);
//     acceptFile(e.dataTransfer.files[0]);
//   }, []);

//   const onDragOver = (e) => {
//     e.preventDefault();
//     setIsDragOver(true);
//   };
//   const onDragLeave = () => setIsDragOver(false);

//   const handleUpload = async () => {
//     if (!file) return;
//     setStatus("uploading");
//     setResponse(null);
//     setErrorMsg("");

//     const formData = new FormData();
//     formData.append("file", file);

//     try {
//       const res = await fetch(BULK_URL, { method: "POST", body: formData });

//       if (!res.ok) {
//         const errData = await res.json().catch(() => ({}));
//         throw new Error(errData?.detail ?? `Server error ${res.status}`);
//       }

//       const data = await res.json();
//       setResponse(data);
//       setStatus("success");
//     } catch (e) {
//       setErrorMsg(e.message ?? "Upload failed. Check your FastAPI server.");
//       setStatus("error");
//     }
//   };

//   const handleReset = () => {
//     setFile(null);
//     setStatus("idle");
//     setResponse(null);
//     setErrorMsg("");
//     if (inputRef.current) inputRef.current.value = "";
//   };

//   return (
//     <div className="space-y-5" style={{ animation: "fadeUp 0.35s ease both" }}>
//       {/* ── Top action row ── */}
//       <div className="flex items-center justify-between flex-wrap gap-3">
//         <div>
//           <p className="text-[13px] text-on-surface-variant leading-relaxed max-w-lg">
//             Upload a <strong>.csv</strong> file with columns:&nbsp;
//             <code className="bg-surface-container px-1.5 py-0.5 rounded text-[12px] font-mono">
//               city, income, credit_score, loan_amount, years_employed
//             </code>
//           </p>
//         </div>
//         <button
//           onClick={downloadSampleCSV}
//           className="flex items-center gap-2 px-4 py-2.5 border border-outline-variant
//             rounded-lg text-[12px] font-bold uppercase tracking-widest
//             text-on-surface-variant hover:bg-surface-variant transition-all flex-shrink-0"
//         >
//           <span className="material-symbols-outlined text-[17px]">
//             download
//           </span>
//           Download Template
//         </button>
//       </div>

//       {/* ── Drop zone ── */}
//       <div
//         onClick={() => inputRef.current?.click()}
//         onDrop={onDrop}
//         onDragOver={onDragOver}
//         onDragLeave={onDragLeave}
//         className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer
//           transition-all duration-200
//           ${
//             isDragOver
//               ? "border-primary bg-surface-container-low scale-[1.01]"
//               : file
//               ? "border-emerald-400 bg-emerald-50/50"
//               : "border-outline-variant bg-surface-container-low hover:border-primary hover:bg-surface-container"
//           }`}
//       >
//         <input
//           ref={inputRef}
//           type="file"
//           accept=".csv"
//           className="hidden"
//           onChange={(e) => acceptFile(e.target.files[0])}
//         />

//         {/* Icon */}
//         <div
//           className={`w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center
//           ${file ? "bg-emerald-100" : "bg-surface-container-high"}`}
//         >
//           <span
//             className={`material-symbols-outlined text-[28px]
//             ${
//               file
//                 ? "text-emerald-600"
//                 : isDragOver
//                 ? "text-primary"
//                 : "text-on-surface-variant"
//             }`}
//           >
//             {file ? "task" : isDragOver ? "file_open" : "upload_file"}
//           </span>
//         </div>

//         {file ? (
//           <>
//             <p className="text-[15px] font-semibold text-emerald-700">
//               {file.name}
//             </p>
//             <p className="text-[13px] text-emerald-600 mt-1">
//               {(file.size / 1024).toFixed(1)} KB — Ready to upload
//             </p>
//           </>
//         ) : (
//           <>
//             <p className="text-[15px] font-semibold text-on-surface">
//               {isDragOver ? "Drop your CSV here" : "Drag & drop your CSV file"}
//             </p>
//             <p className="text-[13px] text-on-surface-variant mt-1">
//               or{" "}
//               <span className="text-primary font-semibold underline underline-offset-2">
//                 click to browse
//               </span>
//             </p>
//             <p className="text-[11px] text-outline mt-3 font-medium uppercase tracking-widest">
//               .csv files only
//             </p>
//           </>
//         )}
//       </div>

//       {/* ── Status: uploading ── */}
//       {status === "uploading" && (
//         <div
//           className="flex items-center gap-4 bg-surface-container-low border border-outline-variant
//           rounded-xl px-5 py-4"
//           style={{ animation: "fadeUp 0.3s ease both" }}
//         >
//           <div className="w-8 h-8 border-2 border-outline-variant border-t-primary rounded-full animate-spin flex-shrink-0" />
//           <div>
//             <p className="text-[14px] font-semibold text-on-surface">
//               Uploading and processing…
//             </p>
//             <p className="text-[12px] text-on-surface-variant mt-0.5">
//               Sending <strong>{file?.name}</strong> to the prediction engine
//             </p>
//           </div>
//         </div>
//       )}

//       {/* ── Status: success ── */}
//       {status === "success" && response && (
//         <div
//           className="space-y-4"
//           style={{ animation: "fadeUp 0.4s ease both" }}
//         >
//           {/* Success header */}
//           <div className="flex items-start gap-4 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4">
//             <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
//               <span
//                 className="material-symbols-outlined text-white text-[20px]"
//                 style={{ fontVariationSettings: "'FILL' 1" }}
//               >
//                 check_circle
//               </span>
//             </div>
//             <div className="flex-1">
//               <p className="text-[16px] font-bold text-emerald-900">
//                 Batch Processed Successfully
//               </p>
//               <p className="text-[13px] text-emerald-700 mt-0.5">
//                 {response.message ??
//                   `Processed ${response.processed ?? "—"} records`}
//               </p>
//             </div>
//             <button
//               onClick={handleReset}
//               className="flex items-center gap-1.5 px-3 py-1.5 border border-emerald-300
//                 rounded-lg text-[11px] font-bold uppercase tracking-wider text-emerald-700
//                 hover:bg-emerald-100 transition-colors flex-shrink-0"
//             >
//               <span className="material-symbols-outlined text-[15px]">
//                 refresh
//               </span>
//               New Upload
//             </button>
//           </div>

//           {/* Response details */}
//           <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
//             <div className="flex items-center gap-2 px-5 py-3 border-b border-outline-variant bg-surface-container-low">
//               <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
//                 data_object
//               </span>
//               <span className="text-[12px] font-bold uppercase tracking-widest text-on-surface-variant">
//                 Backend Response
//               </span>
//             </div>

//             {/* Summary stats if available */}
//             {(response.total != null ||
//               response.accepted != null ||
//               response.rejected != null) && (
//               <div className="grid grid-cols-3 divide-x divide-outline-variant border-b border-outline-variant">
//                 {[
//                   {
//                     label: "Total",
//                     value: response.total ?? "—",
//                     color: "text-primary",
//                   },
//                   {
//                     label: "Accepted",
//                     value: response.accepted ?? "—",
//                     color: "text-emerald-600",
//                   },
//                   {
//                     label: "Rejected",
//                     value: response.rejected ?? "—",
//                     color: "text-error",
//                   },
//                 ].map(({ label, value, color }) => (
//                   <div key={label} className="px-5 py-4 text-center">
//                     <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
//                       {label}
//                     </p>
//                     <p
//                       className={`text-[28px] font-bold leading-tight mt-0.5 ${color}`}
//                     >
//                       {value}
//                     </p>
//                   </div>
//                 ))}
//               </div>
//             )}

//             {/* Raw JSON */}
//             <div className="p-4">
//               <pre
//                 className="text-[12px] font-mono text-on-surface-variant bg-surface-container
//                 rounded-lg p-4 overflow-x-auto leading-relaxed whitespace-pre-wrap"
//               >
//                 {JSON.stringify(response, null, 2)}
//               </pre>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ── Status: error ── */}
//       {status === "error" && (
//         <div
//           className="flex items-start gap-3 bg-error-container text-on-error-container
//           rounded-xl px-5 py-4 border border-error"
//           style={{ animation: "fadeUp 0.3s ease both" }}
//         >
//           <span className="material-symbols-outlined text-[20px] flex-shrink-0 mt-0.5">
//             error
//           </span>
//           <div className="flex-1">
//             <p className="text-[14px] font-semibold">Upload Failed</p>
//             <p className="text-[12px] mt-0.5 opacity-80">{errorMsg}</p>
//             <p className="text-[11px] mt-1.5 opacity-70">
//               Make sure FastAPI is running:{" "}
//               <code className="bg-error-container/50 px-1 rounded font-mono">
//                 uvicorn main:app --reload
//               </code>
//             </p>
//           </div>
//           <button
//             onClick={handleReset}
//             className="flex items-center gap-1 px-3 py-1.5 bg-error text-on-error
//               rounded-lg text-[11px] font-bold uppercase tracking-wider flex-shrink-0"
//           >
//             <span className="material-symbols-outlined text-[15px]">
//               refresh
//             </span>
//             Retry
//           </button>
//         </div>
//       )}

//       {/* ── Upload button ── */}
//       {file && status !== "uploading" && status !== "success" && (
//         <div
//           className="flex justify-end"
//           style={{ animation: "fadeUp 0.3s ease both" }}
//         >
//           <button
//             onClick={handleUpload}
//             className="flex items-center gap-2 bg-primary text-on-primary
//               px-7 py-3 rounded-lg text-[13px] font-bold uppercase tracking-widest
//               hover:opacity-90 active:scale-[0.98] transition-all shadow-md"
//           >
//             <span className="material-symbols-outlined text-[18px]">
//               rocket_launch
//             </span>
//             Upload &amp; Process Batch
//           </button>
//         </div>
//       )}

//       {/* ── CSV format reference ── */}
//       <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5">
//         <div className="flex items-center gap-2 mb-3">
//           <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
//             table_chart
//           </span>
//           <p className="text-[12px] font-bold uppercase tracking-widest text-on-surface-variant">
//             Required CSV Format
//           </p>
//         </div>
//         <div className="overflow-x-auto">
//           <table className="w-full text-[12px] border-collapse">
//             <thead>
//               <tr className="border-b border-outline-variant">
//                 {[
//                   "city",
//                   "income",
//                   "credit_score",
//                   "loan_amount",
//                   "years_employed",
//                 ].map((h) => (
//                   <th
//                     key={h}
//                     className="text-left py-2 pr-4 font-mono font-bold text-primary pb-3"
//                   >
//                     {h}
//                   </th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {[
//                 ["New York", "85000", "720", "250000", "5"],
//                 ["Chicago", "62000", "650", "150000", "3"],
//                 ["Los Angeles", "110000", "780", "400000", "8"],
//               ].map((row, i) => (
//                 <tr
//                   key={i}
//                   className="border-b border-outline-variant/50 last:border-0"
//                 >
//                   {row.map((cell, j) => (
//                     <td
//                       key={j}
//                       className="py-2 pr-4 font-mono text-on-surface-variant"
//                     >
//                       {cell}
//                     </td>
//                   ))}
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ─────────────────────────────────────────────
//    MAIN PAGE
// ───────────────────────────────────────────── */
// export default function NewApplicationPage() {
//   const [activeTab, setActiveTab] = useState("single"); // 'single' | 'bulk'

//   // Single form state
//   const [form, setForm] = useState(INITIAL_FORM);
//   const [loading, setLoading] = useState(false);
//   const [result, setResult] = useState(null);
//   const [error, setError] = useState(null);

//   const handleChange = (key, val) => setForm((f) => ({ ...f, [key]: val }));

//   const handleSubmit = async () => {
//     setError(null);
//     const parsed = {};
//     for (const { key, label } of FIELDS) {
//       if (key === "city") {
//         if (!form[key].toString().trim()) {
//           setError(`"${label}" cannot be empty.`);
//           return;
//         }
//         parsed[key] = form[key].toString().trim();
//       } else {
//         const n = parseFloat(form[key]);
//         if (isNaN(n)) {
//           setError(`"${label}" must be a valid number.`);
//           return;
//         }
//         parsed[key] = n;
//       }
//     }
//     setLoading(true);
//     try {
//       const data = await runEvaluation(parsed);
//       setResult(data);
//       setTimeout(() => {
//         document
//           .getElementById("lc-results")
//           ?.scrollIntoView({ behavior: "smooth", block: "start" });
//       }, 100);
//     } catch (e) {
//       setError(e?.message ?? "Something went wrong. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleReset = () => {
//     setResult(null);
//     setError(null);
//     setForm(INITIAL_FORM);
//     window.scrollTo({ top: 0, behavior: "smooth" });
//   };

//   return (
//     <>
//       {loading && <ProcessingOverlay />}

//       <div className="space-y-6">
//         {/* ── Page header ── */}
//         <div>
//           <h3 className="text-[24px] font-semibold text-on-surface tracking-tight">
//             New Application
//           </h3>
//           <p className="text-[14px] text-on-surface-variant mt-0.5">
//             Run a single AI eligibility check or process a bulk CSV batch.
//           </p>
//         </div>

//         {/* ── Tab switcher ── */}
//         <div
//           className="flex items-center gap-1 bg-surface-container-low border border-outline-variant
//           rounded-xl p-1 w-fit"
//         >
//           {[
//             { id: "single", icon: "person", label: "Single Application" },
//             { id: "bulk", icon: "upload_file", label: "Bulk CSV Upload" },
//           ].map((tab) => (
//             <button
//               key={tab.id}
//               onClick={() => setActiveTab(tab.id)}
//               className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-bold
//                 uppercase tracking-wider transition-all
//                 ${
//                   activeTab === tab.id
//                     ? "bg-primary text-on-primary shadow-sm"
//                     : "text-on-surface-variant hover:text-on-surface hover:bg-surface-variant"
//                 }`}
//             >
//               <span className="material-symbols-outlined text-[18px]">
//                 {tab.icon}
//               </span>
//               {tab.label}
//             </button>
//           ))}
//         </div>

//         {/* ══════════════════════════════
//             SINGLE APPLICATION TAB
//         ══════════════════════════════ */}
//         {activeTab === "single" && (
//           <div
//             className="space-y-6"
//             style={{ animation: "fadeUp 0.3s ease both" }}
//           >
//             {/* Clear button */}
//             {result && (
//               <div className="flex justify-end">
//                 <button
//                   onClick={handleReset}
//                   className="flex items-center gap-2 px-5 py-2.5 border border-outline
//                     text-on-surface-variant rounded-lg hover:bg-surface-variant
//                     transition-all text-[12px] font-bold uppercase tracking-widest"
//                 >
//                   <span className="material-symbols-outlined text-[18px]">
//                     restart_alt
//                   </span>
//                   Clear Results
//                 </button>
//               </div>
//             )}

//             {/* Form card */}
//             <div
//               className="bg-surface-container-lowest rounded-xl border border-outline-variant
//               shadow-[0_4px_20px_-2px_rgba(0,0,0,0.06)] p-6"
//             >
//               {result && (
//                 <p
//                   className="text-[11px] font-bold uppercase tracking-widest
//                   text-on-surface-variant mb-4 flex items-center gap-2"
//                 >
//                   <span className="material-symbols-outlined text-[16px]">
//                     edit
//                   </span>
//                   Adjust Parameters &amp; Re-run
//                 </p>
//               )}
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
//                 {FIELDS.map((field) => (
//                   <FormField
//                     key={field.key}
//                     field={field}
//                     value={form[field.key]}
//                     onChange={handleChange}
//                   />
//                 ))}
//               </div>
//               {error && (
//                 <div
//                   className="mt-5 flex items-center gap-2 bg-error-container
//                   text-on-error-container rounded-lg px-4 py-3 text-[13px]"
//                 >
//                   <span className="material-symbols-outlined text-[18px]">
//                     error
//                   </span>
//                   {error}
//                 </div>
//               )}
//               <div className="mt-6 flex justify-end">
//                 <button
//                   onClick={handleSubmit}
//                   disabled={loading}
//                   className="bg-primary text-on-primary px-7 py-3 rounded-lg
//                     text-[13px] font-bold uppercase tracking-widest
//                     hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2
//                     disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   {result ? "Re-run Evaluation" : "Check Eligibility"}
//                   <span className="material-symbols-outlined text-[18px]">
//                     {result ? "refresh" : "bolt"}
//                   </span>
//                 </button>
//               </div>
//             </div>

//             {/* Results */}
//             {result && (
//               <div
//                 id="lc-results"
//                 className="space-y-5"
//                 style={{ animation: "fadeUp 0.4s ease both" }}
//               >
//                 <div className="flex items-center gap-3">
//                   <div className="flex-1 h-px bg-outline-variant" />
//                   <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant px-2">
//                     Assessment Results
//                   </span>
//                   <div className="flex-1 h-px bg-outline-variant" />
//                 </div>

//                 {result._mock && (
//                   <div
//                     className="flex items-center gap-3 bg-amber-50 border border-amber-200
//                     rounded-lg px-4 py-3 text-[13px] text-amber-800"
//                   >
//                     <span className="material-symbols-outlined text-[18px] text-amber-600">
//                       info
//                     </span>
//                     <span>
//                       <strong>Mock data</strong> — FastAPI not detected on port
//                       8000. Run{" "}
//                       <code className="bg-amber-100 px-1 rounded font-mono text-[12px]">
//                         uvicorn main:app --reload
//                       </code>{" "}
//                       to use real predictions.
//                     </span>
//                   </div>
//                 )}

//                 <DecisionBanner
//                   approved={result.approved}
//                   status={result.status}
//                   confidence={result.confidence}
//                 />

//                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
//                   <div className="lg:col-span-1">
//                     <AIVoiceCard
//                       message={result.ai_voice_message}
//                       approved={result.approved}
//                     />
//                   </div>
//                   <div className="lg:col-span-2">
//                     <RiskAnalysisCard rawData={result.raw_data} />
//                   </div>
//                 </div>

//                 <div
//                   className="flex items-center gap-3 bg-surface-container-lowest
//                   border border-outline-variant rounded-xl px-5 py-4
//                   shadow-[0_4px_20px_-2px_rgba(0,0,0,0.04)]"
//                   style={{
//                     animation: "fadeUp 0.4s ease both",
//                     animationDelay: "240ms",
//                   }}
//                 >
//                   <span className="material-symbols-outlined text-outline text-[22px]">
//                     flag
//                   </span>
//                   <div>
//                     <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
//                       Primary Deciding Factor
//                     </span>
//                     <p className="text-[15px] font-semibold text-on-surface mt-0.5">
//                       {result.top_reason}
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>
//         )}

//         {/* ══════════════════════════════
//             BULK CSV TAB
//         ══════════════════════════════ */}
//         {activeTab === "bulk" && (
//           <div
//             className="bg-surface-container-lowest rounded-xl border border-outline-variant
//             shadow-[0_4px_20px_-2px_rgba(0,0,0,0.06)] p-6"
//           >
//             <BulkUploadPanel />
//           </div>
//         )}
//       </div>

//       <style>{`
//         @keyframes fadeUp {
//           from { opacity: 0; transform: translateY(10px); }
//           to   { opacity: 1; transform: translateY(0); }
//         }
//       `}</style>
//     </>
//   );
// }
import { useState, useRef, useCallback } from "react";
import { runEvaluation } from "../api/evaluate";

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const INITIAL_FORM = {
  first_name: "",
  last_name: "",
  income: "",
  credit_score: "",
  loan_amount: "",
  years_employed: "",
  points: "",
  city: "",
};

const FIELDS = [
  {
    key: "first_name",
    label: "First Name",
    placeholder: "e.g. James",
    prefix: null,
    icon: "person",
  },
  {
    key: "last_name",
    label: "Last Name",
    placeholder: "e.g. Okafor",
    prefix: null,
    icon: "person",
  },
  {
    key: "income",
    label: "Annual Income (USD)",
    placeholder: "e.g. 85,000",
    prefix: "$",
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
    label: "City Name",
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

/* Sample CSV content for download */
const SAMPLE_CSV = `city,income,credit_score,loan_amount,years_employed
New York,85000,720,250000,5
Chicago,62000,650,150000,3
Los Angeles,110000,780,400000,8
Houston,48000,590,120000,2
Phoenix,73000,700,200000,6`;

/* ─────────────────────────────────────────────
   SHARED UI PRIMITIVES
───────────────────────────────────────────── */
function FormField({ field, value, onChange }) {
  const { key, label, placeholder, prefix, icon } = field;
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-outline font-medium text-[15px] pointer-events-none">
            {prefix}
          </span>
        )}
        {icon && (
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[20px]">
            {icon}
          </span>
        )}
        <input
          type={
            key === "city" || key === "first_name" || key === "last_name"
              ? "text"
              : "number"
          }
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(key, e.target.value)}
          className={`w-full py-3 pr-4 bg-surface border border-outline-variant rounded-lg
            text-[14px] font-medium text-on-surface
            focus:ring-2 focus:ring-primary focus:border-primary
            outline-none transition-all placeholder:text-outline
            ${prefix || icon ? "pl-8" : "pl-4"}`}
        />
      </div>
    </div>
  );
}

function ProcessingOverlay() {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-6 text-center px-6">
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

function DecisionBanner({ approved, status, confidence, applicantName }) {
  const isApproved = approved;
  const confPct =
    confidence != null
      ? Math.round(confidence > 1 ? confidence : confidence * 100)
      : null;
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
          {applicantName && (
            <p
              className={`text-[11px] font-bold uppercase tracking-widest mb-1
              ${isApproved ? "text-emerald-700" : "text-red-700"}`}
            >
              {applicantName}
            </p>
          )}
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
      {confPct != null && (
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
            {confPct}%
          </span>
        </div>
      )}
    </div>
  );
}

function AIVoiceCard({ message, approved }) {
  return (
    <div
      className="bg-primary-container rounded-xl p-6 flex flex-col gap-4 relative overflow-hidden shadow-xl h-full"
      style={{ animation: "fadeUp 0.4s ease both", animationDelay: "80ms" }}
    >
      <div className="absolute -top-10 -right-10 w-48 h-48 bg-secondary-container opacity-10 rounded-full blur-3xl pointer-events-none" />
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
                animation: "pulse 1s ease-in-out infinite",
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

function ShapBar({ label, value, maxAbs, index }) {
  const isPos = value >= 0;
  const pct = Math.round((Math.abs(value) / maxAbs) * 100);
  const barPct = Math.round(pct * 0.45);
  return (
    <div
      style={{
        animation: "fadeUp 0.4s ease both",
        animationDelay: `${index * 70}ms`,
      }}
    >
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
      <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden flex">
        {isPos ? (
          <>
            <div className="w-1/2" />
            <div
              className="h-full bg-emerald-500 rounded-r-full transition-all duration-700"
              style={{ width: `${barPct}%` }}
            />
          </>
        ) : (
          <>
            <div className="flex-1" />
            <div
              className="h-full bg-error rounded-l-full transition-all duration-700"
              style={{ width: `${barPct}%` }}
            />
            <div className="w-1/2" />
          </>
        )}
      </div>
    </div>
  );
}

function RiskAnalysisCard({ rawData }) {
  const entries = Object.entries(rawData).sort(
    (a, b) => Math.abs(b[1]) - Math.abs(a[1])
  );
  const maxAbs = Math.max(...entries.map(([, v]) => Math.abs(v)));
  return (
    <div
      className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6
      shadow-[0_4px_20px_-2px_rgba(0,0,0,0.06)] h-full"
      style={{ animation: "fadeUp 0.4s ease both", animationDelay: "160ms" }}
    >
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
      <div className="flex text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3 px-1">
        <span className="flex-1 text-right pr-2 text-error">← Hurts</span>
        <span className="w-px bg-outline-variant" />
        <span className="flex-1 pl-2 text-emerald-600">Helps →</span>
      </div>
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
   BULK UPLOAD PANEL
───────────────────────────────────────────── */
const BULK_URL = "http://localhost:8000/predict/bulk";

/* Status can be: idle | uploading | success | error */

function downloadSampleCSV() {
  const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "lendclear_sample.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function BulkUploadPanel() {
  const [status, setStatus] = useState("idle"); // idle | uploading | success | error
  const [file, setFile] = useState(null);
  const [response, setResponse] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef(null);

  const acceptFile = (f) => {
    if (!f) return;
    if (!f.name.endsWith(".csv")) {
      setErrorMsg("Only .csv files are accepted.");
      setStatus("error");
      return;
    }
    setFile(f);
    setStatus("idle");
    setResponse(null);
    setErrorMsg("");
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    acceptFile(e.dataTransfer.files[0]);
  }, []);

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const onDragLeave = () => setIsDragOver(false);

  const handleUpload = async () => {
    if (!file) return;
    setStatus("uploading");
    setResponse(null);
    setErrorMsg("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(BULK_URL, { method: "POST", body: formData });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.detail ?? `Server error ${res.status}`);
      }

      const data = await res.json();
      setResponse(data);
      setStatus("success");
    } catch (e) {
      setErrorMsg(e.message ?? "Upload failed. Check your FastAPI server.");
      setStatus("error");
    }
  };

  const handleReset = () => {
    setFile(null);
    setStatus("idle");
    setResponse(null);
    setErrorMsg("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-5" style={{ animation: "fadeUp 0.35s ease both" }}>
      {/* ── Top action row ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-[13px] text-on-surface-variant leading-relaxed max-w-lg">
            Upload a <strong>.csv</strong> file with columns:&nbsp;
            <code className="bg-surface-container px-1.5 py-0.5 rounded text-[12px] font-mono">
              city, income, credit_score, loan_amount, years_employed
            </code>
          </p>
        </div>
        <button
          onClick={downloadSampleCSV}
          className="flex items-center gap-2 px-4 py-2.5 border border-outline-variant
            rounded-lg text-[12px] font-bold uppercase tracking-widest
            text-on-surface-variant hover:bg-surface-variant transition-all flex-shrink-0"
        >
          <span className="material-symbols-outlined text-[17px]">
            download
          </span>
          Download Template
        </button>
      </div>

      {/* ── Drop zone ── */}
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer
          transition-all duration-200
          ${
            isDragOver
              ? "border-primary bg-surface-container-low scale-[1.01]"
              : file
              ? "border-emerald-400 bg-emerald-50/50"
              : "border-outline-variant bg-surface-container-low hover:border-primary hover:bg-surface-container"
          }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => acceptFile(e.target.files[0])}
        />

        {/* Icon */}
        <div
          className={`w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center
          ${file ? "bg-emerald-100" : "bg-surface-container-high"}`}
        >
          <span
            className={`material-symbols-outlined text-[28px]
            ${
              file
                ? "text-emerald-600"
                : isDragOver
                ? "text-primary"
                : "text-on-surface-variant"
            }`}
          >
            {file ? "task" : isDragOver ? "file_open" : "upload_file"}
          </span>
        </div>

        {file ? (
          <>
            <p className="text-[15px] font-semibold text-emerald-700">
              {file.name}
            </p>
            <p className="text-[13px] text-emerald-600 mt-1">
              {(file.size / 1024).toFixed(1)} KB — Ready to upload
            </p>
          </>
        ) : (
          <>
            <p className="text-[15px] font-semibold text-on-surface">
              {isDragOver ? "Drop your CSV here" : "Drag & drop your CSV file"}
            </p>
            <p className="text-[13px] text-on-surface-variant mt-1">
              or{" "}
              <span className="text-primary font-semibold underline underline-offset-2">
                click to browse
              </span>
            </p>
            <p className="text-[11px] text-outline mt-3 font-medium uppercase tracking-widest">
              .csv files only
            </p>
          </>
        )}
      </div>

      {/* ── Status: uploading ── */}
      {status === "uploading" && (
        <div
          className="flex items-center gap-4 bg-surface-container-low border border-outline-variant
          rounded-xl px-5 py-4"
          style={{ animation: "fadeUp 0.3s ease both" }}
        >
          <div className="w-8 h-8 border-2 border-outline-variant border-t-primary rounded-full animate-spin flex-shrink-0" />
          <div>
            <p className="text-[14px] font-semibold text-on-surface">
              Uploading and processing…
            </p>
            <p className="text-[12px] text-on-surface-variant mt-0.5">
              Sending <strong>{file?.name}</strong> to the prediction engine
            </p>
          </div>
        </div>
      )}

      {/* ── Status: success ── */}
      {status === "success" && response && (
        <div
          className="space-y-4"
          style={{ animation: "fadeUp 0.4s ease both" }}
        >
          {/* Success header */}
          <div className="flex items-start gap-4 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4">
            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
              <span
                className="material-symbols-outlined text-white text-[20px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
            </div>
            <div className="flex-1">
              <p className="text-[16px] font-bold text-emerald-900">
                Batch Processed Successfully
              </p>
              <p className="text-[13px] text-emerald-700 mt-0.5">
                {response.message ??
                  `Processed ${response.processed ?? "—"} records`}
              </p>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-emerald-300
                rounded-lg text-[11px] font-bold uppercase tracking-wider text-emerald-700
                hover:bg-emerald-100 transition-colors flex-shrink-0"
            >
              <span className="material-symbols-outlined text-[15px]">
                refresh
              </span>
              New Upload
            </button>
          </div>

          {/* Response details */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-outline-variant bg-surface-container-low">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                data_object
              </span>
              <span className="text-[12px] font-bold uppercase tracking-widest text-on-surface-variant">
                Backend Response
              </span>
            </div>

            {/* Summary stats if available */}
            {(response.total != null ||
              response.accepted != null ||
              response.rejected != null) && (
              <div className="grid grid-cols-3 divide-x divide-outline-variant border-b border-outline-variant">
                {[
                  {
                    label: "Total",
                    value: response.total ?? "—",
                    color: "text-primary",
                  },
                  {
                    label: "Accepted",
                    value: response.accepted ?? "—",
                    color: "text-emerald-600",
                  },
                  {
                    label: "Rejected",
                    value: response.rejected ?? "—",
                    color: "text-error",
                  },
                ].map(({ label, value, color }) => (
                  <div key={label} className="px-5 py-4 text-center">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                      {label}
                    </p>
                    <p
                      className={`text-[28px] font-bold leading-tight mt-0.5 ${color}`}
                    >
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Raw JSON */}
            <div className="p-4">
              <pre
                className="text-[12px] font-mono text-on-surface-variant bg-surface-container
                rounded-lg p-4 overflow-x-auto leading-relaxed whitespace-pre-wrap"
              >
                {JSON.stringify(response, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ── Status: error ── */}
      {status === "error" && (
        <div
          className="flex items-start gap-3 bg-error-container text-on-error-container
          rounded-xl px-5 py-4 border border-error"
          style={{ animation: "fadeUp 0.3s ease both" }}
        >
          <span className="material-symbols-outlined text-[20px] flex-shrink-0 mt-0.5">
            error
          </span>
          <div className="flex-1">
            <p className="text-[14px] font-semibold">Upload Failed</p>
            <p className="text-[12px] mt-0.5 opacity-80">{errorMsg}</p>
            <p className="text-[11px] mt-1.5 opacity-70">
              Make sure FastAPI is running:{" "}
              <code className="bg-error-container/50 px-1 rounded font-mono">
                uvicorn main:app --reload
              </code>
            </p>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-3 py-1.5 bg-error text-on-error
              rounded-lg text-[11px] font-bold uppercase tracking-wider flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[15px]">
              refresh
            </span>
            Retry
          </button>
        </div>
      )}

      {/* ── Upload button ── */}
      {file && status !== "uploading" && status !== "success" && (
        <div
          className="flex justify-end"
          style={{ animation: "fadeUp 0.3s ease both" }}
        >
          <button
            onClick={handleUpload}
            className="flex items-center gap-2 bg-primary text-on-primary
              px-7 py-3 rounded-lg text-[13px] font-bold uppercase tracking-widest
              hover:opacity-90 active:scale-[0.98] transition-all shadow-md"
          >
            <span className="material-symbols-outlined text-[18px]">
              rocket_launch
            </span>
            Upload &amp; Process Batch
          </button>
        </div>
      )}

      {/* ── CSV format reference ── */}
      <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
            table_chart
          </span>
          <p className="text-[12px] font-bold uppercase tracking-widest text-on-surface-variant">
            Required CSV Format
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] border-collapse">
            <thead>
              <tr className="border-b border-outline-variant">
                {[
                  "city",
                  "income",
                  "credit_score",
                  "loan_amount",
                  "years_employed",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left py-2 pr-4 font-mono font-bold text-primary pb-3"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["New York", "85000", "720", "250000", "5"],
                ["Chicago", "62000", "650", "150000", "3"],
                ["Los Angeles", "110000", "780", "400000", "8"],
              ].map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-outline-variant/50 last:border-0"
                >
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      className="py-2 pr-4 font-mono text-on-surface-variant"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function NewApplicationPage() {
  const [activeTab, setActiveTab] = useState("single"); // 'single' | 'bulk'

  // Single form state
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    setError(null);
    const parsed = {};
    for (const { key, label } of FIELDS) {
      if (key === "city" || key === "first_name" || key === "last_name") {
        if (!form[key].toString().trim()) {
          setError(`"${label}" cannot be empty.`);
          return;
        }
        parsed[key] = form[key].toString().trim();
      } else {
        const n = parseFloat(form[key]);
        if (isNaN(n)) {
          setError(`"${label}" must be a valid number.`);
          return;
        }
        parsed[key] = n;
      }
    }
    // Combine first + last into applicant_name for the backend
    parsed.applicant_name = `${parsed.first_name} ${parsed.last_name}`.trim();
    delete parsed.first_name;
    delete parsed.last_name;
    setLoading(true);
    try {
      const data = await runEvaluation(parsed);
      setResult(data);
      setTimeout(() => {
        document
          .getElementById("lc-results")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (e) {
      setError(e?.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setForm({ ...INITIAL_FORM });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {loading && <ProcessingOverlay />}

      <div className="space-y-6">
        {/* ── Page header ── */}
        <div>
          <h3 className="text-[24px] font-semibold text-on-surface tracking-tight">
            New Application
          </h3>
          <p className="text-[14px] text-on-surface-variant mt-0.5">
            Run a single AI eligibility check or process a bulk CSV batch.
          </p>
        </div>

        {/* ── Tab switcher ── */}
        <div
          className="flex items-center gap-1 bg-surface-container-low border border-outline-variant
          rounded-xl p-1 w-fit"
        >
          {[
            { id: "single", icon: "person", label: "Single Application" },
            { id: "bulk", icon: "upload_file", label: "Bulk CSV Upload" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-bold
                uppercase tracking-wider transition-all
                ${
                  activeTab === tab.id
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-variant"
                }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════
            SINGLE APPLICATION TAB
        ══════════════════════════════ */}
        {activeTab === "single" && (
          <div
            className="space-y-6"
            style={{ animation: "fadeUp 0.3s ease both" }}
          >
            {/* Clear button */}
            {result && (
              <div className="flex justify-end">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-5 py-2.5 border border-outline
                    text-on-surface-variant rounded-lg hover:bg-surface-variant
                    transition-all text-[12px] font-bold uppercase tracking-widest"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    restart_alt
                  </span>
                  Clear Results
                </button>
              </div>
            )}

            {/* Form card */}
            <div
              className="bg-surface-container-lowest rounded-xl border border-outline-variant
              shadow-[0_4px_20px_-2px_rgba(0,0,0,0.06)] p-6"
            >
              {result && (
                <p
                  className="text-[11px] font-bold uppercase tracking-widest
                  text-on-surface-variant mb-4 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    edit
                  </span>
                  Adjust Parameters &amp; Re-run
                </p>
              )}
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
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-primary text-on-primary px-7 py-3 rounded-lg
                    text-[13px] font-bold uppercase tracking-widest
                    hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {result ? "Re-run Evaluation" : "Check Eligibility"}
                  <span className="material-symbols-outlined text-[18px]">
                    {result ? "refresh" : "bolt"}
                  </span>
                </button>
              </div>
            </div>

            {/* Results */}
            {result && (
              <div
                id="lc-results"
                className="space-y-5"
                style={{ animation: "fadeUp 0.4s ease both" }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-outline-variant" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant px-2">
                    Assessment Results
                  </span>
                  <div className="flex-1 h-px bg-outline-variant" />
                </div>

                {result._mock && (
                  <div
                    className="flex items-center gap-3 bg-amber-50 border border-amber-200
                    rounded-lg px-4 py-3 text-[13px] text-amber-800"
                  >
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

                <DecisionBanner
                  approved={result.approved}
                  status={result.status}
                  confidence={result.confidence}
                  applicantName={result.applicant_name}
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  <div className="lg:col-span-1">
                    <AIVoiceCard
                      message={result.ai_voice_message}
                      approved={result.approved}
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <RiskAnalysisCard rawData={result.raw_data} />
                  </div>
                </div>

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
                    <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
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
        )}

        {/* ══════════════════════════════
            BULK CSV TAB
        ══════════════════════════════ */}
        {activeTab === "bulk" && (
          <div
            className="bg-surface-container-lowest rounded-xl border border-outline-variant
            shadow-[0_4px_20px_-2px_rgba(0,0,0,0.06)] p-6"
          >
            <BulkUploadPanel />
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
