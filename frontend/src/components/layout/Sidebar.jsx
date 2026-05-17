import { useNavigate, useLocation } from "react-router-dom";
import Icon from "../ui/Icon";
import { NAV_ITEMS } from "../../constants";

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNav = (id) => {
    navigate(`/${id}`);
    // Only close on mobile (screen < lg). On desktop we never auto-close.
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* ── Mobile backdrop ── */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 z-30 lg:hidden transition-opacity duration-300
          ${
            isOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
      />

      {/* ── Sidebar panel ── */}
      <aside
        style={{ width: isOpen ? "256px" : "68px" }}
        className={`
          fixed top-0 left-0 z-40
          lg:sticky lg:top-[57px] lg:z-auto
          h-screen lg:h-[calc(100vh-57px)]
          bg-surface-container-low border-r border-outline-variant
          flex flex-col flex-shrink-0 overflow-hidden
          transition-all duration-300 ease-in-out
          ${
            isOpen
              ? "translate-x-0 shadow-2xl lg:shadow-none"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        {/* ── User block ── */}
        <div
          className={`flex items-center border-b border-outline-variant flex-shrink-0
            transition-all duration-300 overflow-hidden
            ${isOpen ? "gap-3 p-4" : "justify-center p-3"}`}
        >
          <div
            className="w-10 h-10 rounded-lg bg-primary flex items-center
            justify-center flex-shrink-0 shadow-sm"
          >
            <Icon name="shield_person" size={20} className="text-on-primary" />
          </div>
          <div
            className={`overflow-hidden transition-all duration-300 whitespace-nowrap
              ${isOpen ? "opacity-100 w-auto" : "opacity-0 w-0"}`}
          >
            <p className="text-[15px] font-semibold text-primary leading-tight">
              Alex Rivers
            </p>
            <p className="text-[11px] font-semibold text-on-surface-variant tracking-wide">
              Principal Analyst
            </p>
          </div>
        </div>

        {/* ── Nav items ── */}
        <nav
          className={`flex flex-col gap-0.5 flex-1 overflow-y-auto overflow-x-hidden py-3
            ${isOpen ? "px-3" : "px-2"}`}
        >
          {NAV_ITEMS.map(({ id, icon, label, divider }) => {
            const active = location.pathname === `/${id}`;

            return (
              <div key={id}>
                {divider && (
                  <div className="h-px bg-outline-variant my-2 mx-1" />
                )}

                {/* Wrapper for tooltip */}
                <div className="relative group">
                  <button
                    onClick={() => handleNav(id)}
                    className={`
                      w-full flex items-center rounded-lg py-2.5
                      transition-all duration-150 text-left
                      ${isOpen ? "gap-3 px-3" : "justify-center px-0"}
                      ${
                        active
                          ? "bg-primary text-on-primary shadow-sm"
                          : "text-on-surface-variant hover:bg-surface-variant hover:text-on-surface"
                      }
                    `}
                  >
                    <Icon name={icon} size={20} className="flex-shrink-0" />
                    <span
                      className={`text-[12px] font-semibold tracking-wider uppercase
                        whitespace-nowrap transition-all duration-300 overflow-hidden
                        ${
                          isOpen ? "opacity-100 w-auto ml-0" : "opacity-0 w-0"
                        }`}
                    >
                      {label}
                    </span>
                  </button>

                  {/* Tooltip on rail mode */}
                  {!isOpen && (
                    <div
                      className="
                      hidden lg:block
                      absolute left-full top-1/2 -translate-y-1/2 ml-3
                      px-2.5 py-1.5 rounded-lg shadow-lg
                      bg-inverse-surface text-inverse-on-surface
                      text-[12px] font-semibold whitespace-nowrap
                      opacity-0 pointer-events-none group-hover:opacity-100
                      transition-opacity duration-150 z-50
                    "
                    >
                      {label}
                      <div
                        className="absolute right-full top-1/2 -translate-y-1/2
                        border-4 border-transparent border-r-inverse-surface"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </nav>

        {/* ── Engine status ── */}
        <div className="border-t border-outline-variant flex-shrink-0 p-3">
          <div
            className={`bg-surface-container-highest rounded-xl transition-all duration-300
              ${isOpen ? "p-3" : "p-2 flex justify-center"}`}
          >
            {isOpen ? (
              <>
                <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Engine Status
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                  <span className="font-mono text-[12px] font-medium text-emerald-600 whitespace-nowrap">
                    Gemini-Pro Active
                  </span>
                </div>
              </>
            ) : (
              <div className="relative group">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse block" />
                <div
                  className="
                  hidden lg:block
                  absolute left-full top-1/2 -translate-y-1/2 ml-3
                  px-2.5 py-1.5 rounded-lg shadow-lg
                  bg-inverse-surface text-inverse-on-surface
                  text-[12px] font-semibold whitespace-nowrap
                  opacity-0 pointer-events-none group-hover:opacity-100
                  transition-opacity duration-150 z-50
                "
                >
                  Gemini-Pro Active
                  <div
                    className="absolute right-full top-1/2 -translate-y-1/2
                    border-4 border-transparent border-r-inverse-surface"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
