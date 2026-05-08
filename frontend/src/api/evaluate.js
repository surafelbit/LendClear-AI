import axios from "axios";

const API_URL = "http://127.0.0.1:8000/predict";

/**
 * runEvaluation — POSTs applicant data to FastAPI and returns the prediction.
 *
 * To switch between mock and real:
 *   - Real API:  set USE_MOCK = false
 *   - Mock data: set USE_MOCK = true  (safe for development without backend)
 */
const USE_MOCK = true; // ← flip to false when your FastAPI server is running

export async function runEvaluation(payload) {
  if (!USE_MOCK) {
    const { data } = await axios.post(API_URL, payload);
    return data;
  }

  /* ── Mock (mirrors real FastAPI response shape exactly) ── */
  await new Promise((r) => setTimeout(r, 2200));
  const approved = payload.credit_score >= 650;

  return {
    approved,
    status: approved ? "Accepted" : "Rejected",
    confidence: approved ? 0.87 : 0.94,
    top_reason: approved ? "Annual Income" : "Credit Score",
    ai_voice_message: approved
      ? "This profile shows exceptional stability. The high credit score and consistent employment history significantly mitigate potential default risks. I recommend proceeding with the current terms and requested loan amount."
      : "This application has been flagged for secondary review. The primary deciding factor is an insufficient credit score. Income stability alone is not enough to offset the perceived risk at the requested loan amount. Recommend revisiting after credit rehabilitation.",
    raw_data: {
      credit_score: approved ? 0.223 : -0.682,
      income: approved ? 0.412 : 0.154,
      loan_amount: approved ? 0.087 : -0.112,
      years_employed: approved ? 0.198 : 0.043,
      city: approved ? 0.034 : -0.021,
      points: approved ? 0.056 : 0.012,
    },
  };
}
