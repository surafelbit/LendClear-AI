import Icon from "../ui/Icon";
import DecisionCard from "./DecisionCard";
import ConfidenceRing from "./ConfidenceRing";
import AIReasoningCard from "./AIReasoningCard";
import ShapChart from "./ShapChart";

/**
 * ResultsPanel — the right column that switches between three states:
 *   1. Empty  — prompt to fill the form
 *   2. Loading — spinner while the ML model runs
 *   3. Results — Decision, Confidence, AI Reasoning, and SHAP chart
 *
 * Props:
 *   result  — backend response object | null
 *   loading — boolean
 */
export default function ResultsPanel({ result, loading }) {
  const confPct = result ? Math.round(result.confidence * 100) : 0;

  /* ── Empty state ── */
  if (!result && !loading) {
    return (
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
          Fill in the applicant metrics on the left and click "Evaluate
          Application" to run the AI risk engine.
        </p>
      </div>
    );
  }

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[420px] gap-4">
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
    );
  }

  /* ── Results state ── */
  return (
    <div className="flex flex-col gap-6">
      {/* Row 1 — Decision badge + Confidence donut */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
        style={{ animation: "fadeUp 0.4s ease both" }}
      >
        <DecisionCard approved={result.approved} status={result.status} />
        <ConfidenceRing pct={confPct} isRejected={!result.approved} />
      </div>

      {/* Row 2 — AI reasoning */}
      <AIReasoningCard
        approved={result.approved}
        ai_voice_message={result.ai_voice_message}
        top_reason={result.top_reason}
      />

      {/* Row 3 — SHAP attribution chart */}
      <ShapChart raw_data={result.raw_data} />
    </div>
  );
}
