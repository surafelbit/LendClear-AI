/**
 * Icon — thin wrapper around Google Material Symbols.
 * Usage: <Icon name="dashboard" size={20} className="text-primary" />
 */
export default function Icon({ name, size = 24, className = "" }) {
  return (
    <span
      className={`material-symbols-outlined select-none leading-none ${className}`}
      style={{ fontSize: size }}
    >
      {name}
    </span>
  );
}
