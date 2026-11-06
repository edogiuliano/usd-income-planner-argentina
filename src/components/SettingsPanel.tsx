import type { ExchangeOperation, ExchangeRate } from "@/types";

interface SettingsPanelProps {
  hireDate: string;
  onHireDateChange: (value: string) => void;
  usedPtoDays: string;
  onUsedPtoDaysChange: (value: string) => void;
  ptoPerMonth: string;
  onPtoPerMonthChange: (value: string) => void;
  operation: ExchangeOperation;
  onOperationChange: (value: ExchangeOperation) => void;
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
  ptoPerMonth,
  onPtoPerMonthChange,
  operation,
  onOperationChange,
  rates,
  preferredRateCasa,
  onPreferredRateChange,
  onResetSavedData,
}: SettingsPanelProps) {
  return (
    <section className="settings-panel mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1fr_0.7fr]">
      <div className="workspace-section min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">
          ⚙️ Ajustes
        </p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-950 dark:text-zinc-50">
          Tus preferencias
        </h2>
        <p className="mt-2 max-w-[60ch] text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          Dejá todo listo para tus próximos cálculos.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label
              htmlFor="preferredRate"
              className="mb-2 block text-sm font-bold text-zinc-800 dark:text-zinc-200"
            >
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
                <option value={preferredRateCasa}>
                  Cargando cotizaciones...
                </option>
              ) : (
                rates.map((rate) => (
                  <option key={rate.casa} value={rate.casa}>
                    {rate.name}
                  </option>
                ))
              )}
            </select>
            <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
              Elegí el dólar para tus cálculos.
            </p>
          </div>

          <div>
            <label
              htmlFor="hireDate"
              className="mb-2 block text-sm font-bold text-zinc-800 dark:text-zinc-200"
            >
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
              Para calcular tus vacaciones.
            </p>
          </div>
          <div>
            <label
              htmlFor="ptoPerMonth"
              className="mb-2 block text-sm font-bold"
            >
              PTO acumulados por mes
            </label>
            <input
              id="ptoPerMonth"
              className="app-input w-full"
              type="text"
              inputMode="decimal"
              value={ptoPerMonth}
              onChange={(event) => {
                if (/^\d*(?:[.,]\d{0,4})?$/.test(event.target.value))
                  onPtoPerMonthChange(event.target.value);
              }}
            />
            <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
              Días de vacaciones que ganás por mes.
            </p>
          </div>
          <div className="sm:col-span-2">
            <label
              htmlFor="exchangeOperation"
              className="mb-2 block text-sm font-bold"
            >
              Operación de cambio
            </label>
            <select
              id="exchangeOperation"
              className="app-input w-full"
              value={operation}
              onChange={(event) =>
                onOperationChange(event.target.value as ExchangeOperation)
              }
            >
              <option value="sell-usd">Vender USD · recibo moneda local</option>
              <option value="buy-usd">Comprar USD · pago moneda local</option>
            </select>
            <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
              Vendés dólares para recibir moneda local; los comprás para obtener
              USD.
            </p>
          </div>

          <div>
            <label
              htmlFor="usedPtoDays"
              className="mb-2 block text-sm font-bold text-zinc-800 dark:text-zinc-200"
            >
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
              Vacaciones que ya utilizaste.
            </p>
          </div>
        </div>
      </div>

      <aside className="self-start p-5 text-zinc-800 dark:text-zinc-200 sm:p-6">
        <p className="text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-300">
          🧾 Nota importante
        </p>
        <h3 className="mt-2 text-xl font-black tracking-tight">
          Un cálculo para orientarte
        </h3>
        <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Los montos y las vacaciones son estimaciones. Confirmá las condiciones
          con tu empresa y revisá tu contrato.
        </p>
        <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Tus datos quedan en este navegador, solo para hacer tus cálculos.
        </p>
        <button
          type="button"
          onClick={onResetSavedData}
          className="secondary-button mt-6 px-4 py-3 text-sm font-semibold"
        >
          Borrar datos guardados
        </button>
      </aside>
    </section>
  );
}
