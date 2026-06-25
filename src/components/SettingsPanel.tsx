import type { ExchangeRate } from "@/types";

interface SettingsPanelProps {
  hireDate: string;
  onHireDateChange: (value: string) => void;
  usedPtoDays: string;
  onUsedPtoDaysChange: (value: string) => void;
  rates: ExchangeRate[];
  preferredRateCasa: string;
  onPreferredRateChange: (value: string) => void;
  onResetSavedData: () => void;
}

export function SettingsPanel({
  hireDate,
  onHireDateChange,
  usedPtoDays,
  onUsedPtoDaysChange,
  rates,
  preferredRateCasa,
  onPreferredRateChange,
  onResetSavedData,
}: SettingsPanelProps) {
  return (
    <section className="mx-auto grid w-full max-w-5xl gap-5 lg:grid-cols-[1fr_0.9fr]">
      <div className="rounded-[1.75rem] bg-white p-5 shadow-[0_24px_60px_-38px_rgba(15,23,42,0.55)] ring-1 ring-zinc-200/70 dark:bg-zinc-900 dark:ring-zinc-800 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">
          ⚙️ Ajustes
        </p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-950 dark:text-zinc-50">
          Preferencias guardadas
        </h2>
        <p className="mt-2 max-w-[60ch] text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          Estos datos se guardan en este navegador: tipo de dólar, fecha de ingreso y PTO usados.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="preferredRate" className="mb-2 block text-sm font-bold text-zinc-800 dark:text-zinc-200">
              💱 Dólar preferido
            </label>
            <select
              id="preferredRate"
              value={preferredRateCasa}
              onChange={(event) => onPreferredRateChange(event.target.value)}
              disabled={rates.length === 0}
              className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-zinc-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:ring-emerald-900"
            >
              {rates.length === 0 ? (
                <option value={preferredRateCasa}>Cargando cotizaciones...</option>
              ) : (
                rates.map((rate) => (
                  <option key={rate.casa} value={rate.casa}>
                    {rate.name}
                  </option>
                ))
              )}
            </select>
            <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
              Se usa para el HUD, la proyección y el resumen principal.
            </p>
          </div>

          <div>
            <label htmlFor="hireDate" className="mb-2 block text-sm font-bold text-zinc-800 dark:text-zinc-200">
              📅 Fecha de ingreso
            </label>
            <input
              id="hireDate"
              type="date"
              value={hireDate}
              onChange={(event) => onHireDateChange(event.target.value)}
              className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-zinc-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:ring-emerald-900"
            />
            <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
              Cada mes completo trabajado suma 1 PTO disponible.
            </p>
          </div>

          <div>
            <label htmlFor="usedPtoDays" className="mb-2 block text-sm font-bold text-zinc-800 dark:text-zinc-200">
              🌴 PTO ya usados
            </label>
            <input
              id="usedPtoDays"
              type="number"
              min="0"
              step="1"
              value={usedPtoDays}
              onChange={(event) => onUsedPtoDaysChange(event.target.value)}
              className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-zinc-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:ring-emerald-900"
            />
            <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
              Se resta del total acumulado para calcular tu saldo estimado.
            </p>
          </div>
        </div>
      </div>

      <aside className="rounded-[1.75rem] bg-zinc-950 p-5 text-zinc-50 shadow-[0_24px_60px_-38px_rgba(15,23,42,0.75)] dark:bg-zinc-100 dark:text-zinc-950 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300 dark:text-emerald-700">
          🧾 Nota importante
        </p>
        <h3 className="mt-2 text-xl font-black tracking-tight">Estimación orientativa</h3>
        <p className="mt-3 text-sm leading-6 text-zinc-300 dark:text-zinc-700">
          Esta herramienta muestra un ejemplo de cálculo para planificar ingresos. No reemplaza las
          políticas internas de tu empresa, contrato, manager, payroll ni reglas legales aplicables.
        </p>
        <button
          type="button"
          onClick={onResetSavedData}
          className="mt-6 rounded-2xl bg-white px-4 py-3 text-sm font-black text-zinc-950 transition hover:-translate-y-0.5 active:translate-y-0 dark:bg-zinc-950 dark:text-zinc-50"
        >
          Borrar datos guardados
        </button>
      </aside>
    </section>
  );
}
