import { useLocation } from "react-router-dom";
import Icon from "../ui/Icon";
import { NAV_ITEMS } from "../../constants";

export default function TopBar({ sidebarOpen, onToggleSidebar }) {
  const location = useLocation();
  const current =
    NAV_ITEMS.find((n) => `/${n.id}` === location.pathname) ?? NAV_ITEMS[0];

  return (
    <header
      className="bg-surface-container-lowest border-b border-outline-variant
      flex items-center gap-4 px-4 h-[57px] w-full sticky top-0 z-50 shadow-sm flex-shrink-0"
    >
      {/* Hamburger */}
      <button
        onClick={onToggleSidebar}
        className="w-9 h-9 flex items-center justify-center rounded-lg
          hover:bg-surface-container-high transition-colors text-on-surface-variant flex-shrink-0"
        aria-label="Toggle sidebar"
      >
        <Icon name={sidebarOpen ? "menu_open" : "menu"} size={22} />
      </button>

      {/* Logo */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Icon name="account_balance" size={26} className="text-primary" />
        <h1 className="text-[20px] font-bold text-primary tracking-tight leading-none hidden sm:block">
          LendClear AI
        </h1>
      </div>

      {/* Breadcrumb */}
      <div className="hidden md:flex items-center gap-1.5 text-[13px] text-on-surface-variant ml-2">
        <Icon name="chevron_right" size={16} className="text-outline-variant" />
        <span className="font-semibold text-on-surface">{current.label}</span>
      </div>

      {/* Search */}
      <div
        className="hidden lg:flex items-center gap-2 px-4 py-2 ml-4
        bg-surface-container-low rounded-full border border-outline-variant w-64"
      >
        <Icon
          name="search"
          size={16}
          className="text-on-surface-variant flex-shrink-0"
        />
        <input
          className="bg-transparent border-none focus:ring-0 outline-none text-[13px]
            text-on-surface placeholder:text-on-surface-variant w-full"
          placeholder="Search applications…"
        />
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 ml-auto">
        <button
          className="w-9 h-9 flex items-center justify-center rounded-full
          hover:bg-surface-container-high transition-colors text-on-surface-variant relative"
        >
          <Icon name="notifications" size={20} />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full
            border-2 border-surface-container-lowest"
          />
        </button>

        <div
          className="flex items-center gap-2 cursor-pointer
          hover:bg-surface-container-high px-2 py-1 rounded-full transition-colors"
        >
          <div
            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center
            border-2 border-outline-variant"
          >
            <span className="text-[11px] font-bold text-on-primary">AR</span>
          </div>
          <span className="text-[13px] font-semibold text-on-surface hidden sm:block">
            Alex Rivers
          </span>
          <Icon
            name="expand_more"
            size={16}
            className="text-on-surface-variant hidden sm:block"
          />
        </div>
      </div>
    </header>
  );
}
