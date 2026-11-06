export type AppTab = "calculate" | "project" | "rates" | "settings";

const TABS: Array<{ id: AppTab; label: string; icon: string }> = [
  { id: "calculate", label: "Calcular", icon: "🧮" },
  { id: "project", label: "Proyectar", icon: "📈" },
  { id: "rates", label: "Cotizaciones", icon: "💱" },
  { id: "settings", label: "Ajustes", icon: "⚙️" },
];

export function BottomTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}) {
  return (
    <nav
      aria-label="Secciones principales"
      className="app-navigation fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur-xl dark:border-white/10 dark:bg-[#15171d]/95 lg:static lg:border-t-0 lg:border-b lg:px-6 lg:py-2"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-4 gap-1 lg:flex lg:gap-2 lg:px-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            aria-current={activeTab === tab.id ? "page" : undefined}
            onClick={() => onTabChange(tab.id)}
            className={`flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-[11px] font-semibold transition lg:min-h-10 lg:flex-row lg:gap-2 lg:px-4 lg:text-sm ${activeTab === tab.id ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300" : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/5"}`}
          >
            <span aria-hidden="true" className="text-base">
              {tab.icon}
            </span>
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
