import Icon from "../ui/Icon";
import { NAV_ITEMS } from "../../constants";

export default function Sidebar() {
  return (
    <aside
      className="hidden lg:flex flex-col w-64 sticky top-[57px]
      h-[calc(100vh-57px)] p-4 gap-2 bg-surface-container-low
      border-r border-outline-variant overflow-y-auto flex-shrink-0"
    >
      {/* ── User block ── */}
      <div className="flex flex-col gap-1 mb-4 p-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
          Workspace
        </p>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg bg-primary flex items-center
            justify-center flex-shrink-0 shadow-sm"
          >
            <Icon name="shield_person" size={20} className="text-on-primary" />
          </div>
          <div>
            <p className="text-[16px] font-semibold text-primary leading-tight">
              Alex Rivers
            </p>
            <p className="text-[11px] font-semibold text-on-surface-variant tracking-wide">
              Principal Analyst
            </p>
          </div>
        </div>
      </div>

      {/* ── Navigation links ── */}
      <nav className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map(({ icon, label, active, divider }) => (
          <div key={label}>
            {divider && <div className="h-px bg-outline-variant my-2" />}
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-all
                text-[12px] font-semibold tracking-wider uppercase
                ${
                  active
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface-variant hover:bg-surface-variant hover:text-on-surface"
                }`}
            >
              <Icon name={icon} size={20} />
              <span>{label}</span>
            </a>
          </div>
        ))}
      </nav>

      {/* ── Engine status badge ── */}
      <div className="mt-auto p-3 bg-surface-container-highest rounded-xl">
        <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
          Engine Status
        </p>
        <div className="flex items-center gap-2 mt-2 text-emerald-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
          <span className="font-mono text-[13px] font-medium">
            Gemini-Pro Active
          </span>
        </div>
      </div>
    </aside>
  );
}
