/**
 * FormField — a labeled numeric input for the applicant form.
 *
 * Props:
 *   label       — visible label text
 *   value       — controlled input value
 *   onChange    — (value: string) => void
 *   placeholder — input placeholder text
 */
export default function FormField({ label, value, onChange, placeholder }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
        {label}
      </label>
      <input
        type="number"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="bg-surface-container-low border border-outline-variant
            rounded-lg px-4 py-3 outline-none transition-all
            font-mono text-[14px] text-on-surface
            focus:ring-2 focus:ring-primary focus:border-primary
            placeholder:text-outline"
      />
    </div>
  );
}
