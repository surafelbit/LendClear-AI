import Icon from "../ui/Icon";
import Spinner from "../ui/Spinner";
import FormField from "./FormField";
import { FORM_FIELDS } from "../../constants";

/**
 * ApplicantForm — the left-column card containing all input fields
 * and the submit button.
 *
 * Props:
 *   form      — { [key]: string } controlled form state
 *   onChange  — (key: string) => (value: string) => void
 *   onSubmit  — () => void
 *   loading   — boolean
 *   error     — string | null
 */
export default function ApplicantForm({
  form,
  onChange,
  onSubmit,
  loading,
  error,
}) {
  return (
    <div
      className="bg-surface-container-lowest border border-outline-variant
      rounded-xl p-6 shadow-sm"
    >
      {/* Card header */}
      <div className="flex items-center gap-3 mb-6">
        <Icon name="edit_note" size={24} className="text-primary" />
        <h3 className="text-[20px] font-semibold text-primary">
          Applicant Metrics
        </h3>
      </div>

      {/* Input fields */}
      <div className="flex flex-col gap-4">
        {FORM_FIELDS.map(({ key, label, placeholder }) => (
          <FormField
            key={key}
            label={label}
            placeholder={placeholder}
            value={form[key]}
            onChange={onChange(key)}
          />
        ))}
      </div>

      {/* Inline error message */}
      {error && (
        <div
          className="mt-4 flex items-center gap-2 bg-error-container
          text-on-error-container rounded-lg px-4 py-3 text-[14px]"
        >
          <Icon name="error" size={18} />
          {error}
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={onSubmit}
        disabled={loading}
        className="mt-6 w-full bg-primary text-on-primary
          text-[18px] font-semibold py-4 rounded-lg shadow-md
          hover:opacity-90 active:scale-95 transition-all
          flex items-center justify-center gap-2
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Spinner size={20} />
            Evaluating…
          </>
        ) : (
          <>
            <Icon name="rocket_launch" size={20} />
            Evaluate Application
          </>
        )}
      </button>
    </div>
  );
}
