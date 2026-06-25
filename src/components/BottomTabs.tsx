export type AppTab = "calculate" | "project" | "rates" | "settings";

interface BottomTabsProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

const TABS: Array<{ id: AppTab; label: string; shortLabel: string; description: string; icon: string }> = [
  { id: "calculate", label: "Calcular", shortLabel: "Calc", description: "Sueldo actual", icon: "🧮" },
  { id: "project", label: "Proyectar", shortLabel: "Plan", description: "Meses y PTO", icon: "📈" },
  { id: "rates", label: "Cotizaciones", shortLabel: "USD", description: "Dólar local", icon: "💱" },
  { id: "settings", label: "Ajustes", shortLabel: "Ajustes", description: "Ingreso y PTO", icon: "⚙️" },
];

export function BottomTabs({ activeTab, onTabChange }: BottomTabsProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200/80 bg-white/92 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-2 shadow-[0_-18px_40px_-28px_rgba(15,23,42,0.55)] backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/92">
      <div className="mx-auto grid max-w-2xl grid-cols-4 gap-2">
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`rounded-2xl px-2 py-2.5 text-center transition active:scale-[0.98] ${
                isActive
                  ? "bg-zinc-950 text-white shadow-[0_12px_30px_-18px_rgba(15,23,42,0.8)] dark:bg-zinc-50 dark:text-zinc-950"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="block text-base leading-none">{tab.icon}</span>
              <span className="mt-1 block text-xs font-black sm:hidden">{tab.shortLabel}</span>
              <span className="mt-1 hidden text-sm font-black sm:block">{tab.label}</span>
              <span className="mt-0.5 hidden text-[11px] font-medium opacity-70 sm:block">
                {tab.description}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
