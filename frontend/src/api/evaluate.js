/**
 * runEvaluation — sends applicant data to the ML backend.
 *
 * To connect to your real FastAPI, replace the body of this function with:
 *
 *   const res = await fetch('http://127.0.0.1:8000/predict', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify(payload),
 *   })
 *   if (!res.ok) throw new Error('Backend error')
 *   return res.json()
 */
export async function runEvaluation(payload) {
  // Simulated 2-second network delay
  await new Promise((r) => setTimeout(r, 2000));

  const approved = payload.credit_score >= 650;

  return {
    approved,
    status: approved ? "Accepted" : "Rejected",
    confidence: approved ? 0.87 : 0.94,
    top_reason: approved ? "Annual Income" : "Credit Score",
    ai_voice_message: approved
      ? "Decision Logic Path: Application cleared for funding. Primary accelerating factor: Annual Income. Strong employment tenure offsets the moderate loan-to-income ratio at the requested amount."
      : "Decision Logic Path: Application flagged for secondary review. Primary deciding factor: Credit Score. Income stability is insufficient to offset the perceived risk at the requested loan amount.",
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
