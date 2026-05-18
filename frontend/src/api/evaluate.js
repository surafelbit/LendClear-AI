// import axios from "axios";

// const API_URL = "http://127.0.0.1:8000/predict";

// /**
//  * runEvaluation — sends applicant data to your FastAPI backend.
//  *
//  * Behaviour:
//  *   1. Tries the real FastAPI endpoint first.
//  *   2. If the server is offline / unreachable, falls back to mock data
//  *      so the UI still works during development.
//  *
//  * When your FastAPI server IS running you will see real results.
//  * When it is NOT running you will see mock results with a console warning.
//  *
//  * FastAPI endpoint expected:   POST http://127.0.0.1:8000/predict
//  * FastAPI request body shape:
//  *   { income, credit_score, loan_amount, years_employed, points, city }
//  *
//  * FastAPI response shape:
//  *   {
//  *     approved: boolean,
//  *     status: string,
//  *     confidence: float,
//  *     top_reason: string,
//  *     ai_voice_message: string,
//  *     raw_data: { city, income, credit_score, loan_amount, years_employed, points }
//  *   }
//  */
// export async function runEvaluation(payload) {
//   try {
//     console.log("[LendClear] Sending to FastAPI:", API_URL, payload);

//     const { data } = await axios.post(API_URL, payload, {
//       headers: { "Content-Type": "application/json" },
//       timeout: 10000, // 10 second timeout
//     });

//     console.log("[LendClear] FastAPI response:", data);
//     return data;
//   } catch (err) {
//     // If it's a real API error (4xx/5xx) — rethrow so the UI shows it
//     if (err.response) {
//       const msg =
//         err.response.data?.detail ??
//         err.response.data?.message ??
//         `Server error ${err.response.status}`;
//       console.error("[LendClear] FastAPI error:", err.response.status, msg);
//       throw new Error(msg);
//     }

//     // If server is just offline / CORS / network error — use mock fallback
//     console.warn(
//       "[LendClear] FastAPI unreachable — using mock data.",
//       "Start your FastAPI server with: uvicorn main:app --reload",
//       "\nError was:",
//       err.message
//     );

//     return getMockResult(payload);
//   }
// }

// /* ─── Mock result (matches real FastAPI response shape exactly) ─── */
// function getMockResult(payload) {
//   const approved = payload.credit_score >= 650;

//   return {
//     approved,
//     status: approved ? "Accepted" : "Rejected",
//     confidence: approved ? 0.87 : 0.94,
//     top_reason: approved ? "Annual Income" : "Credit Score",
//     ai_voice_message: approved
//       ? "This profile shows exceptional stability. The high credit score and consistent employment history significantly mitigate potential default risks. I recommend proceeding with the current terms and requested loan amount."
//       : "This application has been flagged for secondary review. The primary deciding factor is an insufficient credit score. Income stability alone is not enough to offset the perceived risk at the requested loan amount. Recommend revisiting after credit rehabilitation.",
//     raw_data: {
//       credit_score: approved ? 0.223 : -0.682,
//       income: approved ? 0.412 : 0.154,
//       loan_amount: approved ? 0.087 : -0.112,
//       years_employed: approved ? 0.198 : 0.043,
//       city: approved ? 0.034 : -0.021,
//       points: approved ? 0.056 : 0.012,
//     },
//     _mock: true, // flag so you can see in the UI that this was mock data
//   };
// }
import axios from "axios";

const API_URL = "http://127.0.0.1:8000/predict";

/**
 * runEvaluation — sends applicant data to your FastAPI backend.
 *
 * Behaviour:
 *   1. Tries the real FastAPI endpoint first.
 *   2. If the server is offline / unreachable, falls back to mock data
 *      so the UI still works during development.
 *
 * When your FastAPI server IS running you will see real results.
 * When it is NOT running you will see mock results with a console warning.
 *
 * FastAPI endpoint expected:   POST http://127.0.0.1:8000/predict
 * FastAPI request body shape:
 *   { applicant_name, city, income, credit_score, loan_amount, years_employed, points }
 *
 * FastAPI response shape:
 *   {
 *     approved: boolean,
 *     status: string,
 *     confidence: float,
 *     top_reason: string,
 *     ai_voice_message: string,
 *     raw_data: { city, income, credit_score, loan_amount, years_employed, points }
 *   }
 */
export async function runEvaluation(payload) {
  try {
    console.log("[LendClear] Sending to FastAPI:", API_URL, payload);

    const { data } = await axios.post(API_URL, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 10000, // 10 second timeout
    });

    console.log("[LendClear] FastAPI response:", data);
    return data;
  } catch (err) {
    // If it's a real API error (4xx/5xx) — rethrow so the UI shows it
    if (err.response) {
      const msg =
        err.response.data?.detail ??
        err.response.data?.message ??
        `Server error ${err.response.status}`;
      console.error("[LendClear] FastAPI error:", err.response.status, msg);
      throw new Error(msg);
    }

    // If server is just offline / CORS / network error — use mock fallback
    console.warn(
      "[LendClear] FastAPI unreachable — using mock data.",
      "Start your FastAPI server with: uvicorn main:app --reload",
      "\nError was:",
      err.message
    );

    return getMockResult(payload);
  }
}

/* ─── Mock result (matches real FastAPI response shape exactly) ─── */
function getMockResult(payload) {
  const approved = payload.credit_score >= 650;

  return {
    approved,
    status: approved ? "Accepted" : "Rejected",
    confidence: approved ? 0.87 : 0.94,
    top_reason: approved ? "Annual Income" : "Credit Score",
    applicant_name: payload.applicant_name ?? null,
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
    _mock: true, // flag so you can see in the UI that this was mock data
  };
}
