import Icon from "../ui/Icon";

export default function TopBar() {
  return (
    <header
      className="bg-surface-container-lowest border-b border-outline-variant
      flex justify-between items-center px-6 py-3 w-full sticky top-0 z-50 shadow-sm"
    >
      {/* ── Logo ── */}
      <div className="flex items-center gap-3">
        <Icon name="account_balance" size={30} className="text-primary" />
        <h1 className="text-[22px] font-bold text-primary tracking-tight leading-none">
          LendClear AI
        </h1>
      </div>

      {/* ── Search ── */}
      <div
        className="hidden md:flex items-center gap-2 px-4 py-2
        bg-surface-container-low rounded-full border border-outline-variant w-72"
      >
        <Icon name="search" size={18} className="text-on-surface-variant" />
        <input
          className="bg-transparent border-none focus:ring-0 outline-none text-[14px]
            text-on-surface placeholder:text-on-surface-variant w-full"
          placeholder="Search applications..."
        />
      </div>

      {/* ── Right actions ── */}
      <div className="flex items-center gap-3">
        <button
          className="w-9 h-9 flex items-center justify-center rounded-full
            hover:bg-surface-container-high transition-colors text-on-surface-variant"
        >
          <Icon name="notifications" size={22} />
        </button>

        <div
          className="flex items-center gap-2 cursor-pointer
          hover:bg-surface-container-high px-2 py-1 rounded-full transition-colors"
        >
          <div
            className="w-8 h-8 rounded-full bg-primary-container flex items-center
            justify-center border border-outline-variant overflow-hidden"
          >
            <span className="text-[11px] font-bold text-on-primary-container">
              AR
            </span>
          </div>
          <Icon
            name="expand_more"
            size={18}
            className="text-on-surface-variant"
          />
        </div>
      </div>
    </header>
  );
}
