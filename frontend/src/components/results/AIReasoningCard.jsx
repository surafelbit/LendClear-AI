import Icon from "../ui/Icon";

/**
 * AIReasoningCard — displays the AI-generated reasoning message with the
 * key deciding factor highlighted via bold + underline.
 *
 * Props:
 *   approved         — boolean (drives border / decoration color)
 *   ai_voice_message — string
 *   top_reason       — string (the word/phrase to highlight inside the message)
 */
export default function AIReasoningCard({
  approved,
  ai_voice_message,
  top_reason,
}) {
  // Split the message around the key reason so we can bold it inline
  const parts = ai_voice_message.split(top_reason);

  return (
    <div
      className={`rounded-xl p-6 shadow-md border-l-4
        ${
          approved
            ? "bg-primary-container border-emerald-600"
            : "bg-primary-container border-error"
        }`}
      style={{ animation: "fadeUp 0.4s ease both", animationDelay: "100ms" }}
    >
      <div className="flex items-start gap-4">
        <Icon
          name="psychology"
          size={32}
          className="text-tertiary-fixed-dim flex-shrink-0 mt-0.5"
        />

        <div className="flex-1">
          <h3 className="text-[20px] font-semibold text-on-primary mb-2">
            AI Evaluation Reasoning
          </h3>

          {/* Message with highlighted key factor */}
          <p className="text-[16px] text-on-primary-container leading-relaxed">
            {parts.map((part, i) => (
              <span key={i}>
                {part}
                {i < parts.length - 1 && (
                  <span
                    className={`font-bold text-on-primary underline decoration-2 underline-offset-4
                      ${
                        approved ? "decoration-emerald-500" : "decoration-error"
                      }`}
                  >
                    {top_reason}
                  </span>
                )}
              </span>
            ))}
          </p>

          {/* Voice standby notice */}
          <div className="mt-3 flex items-center gap-2 opacity-60">
            <Icon
              name="settings_voice"
              size={16}
              className="text-on-primary-container"
            />
            <span className="text-[12px] italic text-on-primary-container">
              Gemini Voice engine is currently on standby
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
