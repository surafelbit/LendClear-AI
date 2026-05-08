import { useState, useRef } from "react";
import { runEvaluation } from "../api/evaluate";
import { FORM_FIELDS } from "../constants";
import ApplicantForm from "../components/form/ApplicantForm";
import ResultsPanel from "../components/results/ResultsPanel";

const INITIAL_FORM = {
  city: "102",
  income: "68500",
  credit_score: "582",
  loan_amount: "450000",
  years_employed: "3",
  points: "12",
};

export default function NewApplicationPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const resultRef = useRef(null);

  const onChange = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
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

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-[36px] font-bold text-primary tracking-tight leading-tight">
          Loan Evaluation Dashboard
        </h2>
        <p className="text-[16px] text-on-surface-variant mt-1">
          Precision analytical processing for risk assessment.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <section className="col-span-12 xl:col-span-4">
          <ApplicantForm
            form={form}
            onChange={onChange}
            onSubmit={handleSubmit}
            loading={loading}
            error={error}
          />
        </section>
        <section ref={resultRef} className="col-span-12 xl:col-span-8">
          <ResultsPanel result={result} loading={loading} />
        </section>
      </div>
    </div>
  );
}
