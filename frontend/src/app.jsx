import { useState, useRef } from "react";

import { runEvaluation } from "./api/evaluate";
import { FORM_FIELDS } from "./constants";

import TopBar from "./components/layout/TopBar";
import Sidebar from "./components/layout/Sidebar";
import ApplicantForm from "./components/form/ApplicantForm";
import ResultsPanel from "./components/results/ResultsPanel";

/* ── Initial form values ── */
const INITIAL_FORM = {
  city: "102",
  income: "68500",
  credit_score: "582",
  loan_amount: "450000",
  years_employed: "3",
  points: "12",
};

export default function App() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const resultRef = useRef(null);

  /** Returns a setter for a single form field: onChange('credit_score')('720') */
  const onChange = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    setError(null);

    // Validate — all fields must be real numbers
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
      // Scroll results into view on mobile
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

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col font-sans">
      {/* Sticky top navigation bar */}
      <TopBar />

      <div className="flex flex-1 overflow-hidden">
        {/* Left navigation drawer (hidden on mobile) */}
        <Sidebar />

        {/* Main scrollable content area */}
        <main className="flex-1 overflow-y-auto p-6 bg-surface">
          <div className="max-w-7xl mx-auto">
            {/* Page heading */}
            <div className="mb-6">
              <h2 className="text-[36px] font-bold text-primary tracking-tight leading-tight">
                Loan Evaluation Dashboard
              </h2>
              <p className="text-[16px] text-on-surface-variant mt-1">
                Precision analytical processing for risk assessment.
              </p>
            </div>

            {/* 12-column grid — form left, results right */}
            <div className="grid grid-cols-12 gap-6">
              {/* Left column — input form */}
              <section className="col-span-12 xl:col-span-4">
                <ApplicantForm
                  form={form}
                  onChange={onChange}
                  onSubmit={handleSubmit}
                  loading={loading}
                  error={error}
                />
              </section>

              {/* Right column — results dashboard */}
              <section ref={resultRef} className="col-span-12 xl:col-span-8">
                <ResultsPanel result={result} loading={loading} />
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
