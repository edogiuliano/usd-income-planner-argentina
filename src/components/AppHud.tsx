import { formatCurrency, formatUsd } from "@/lib/formatters";
import type { CountryCode, ExchangeRate, IncomeResult } from "@/types";

type CountryOption = {
  code: CountryCode;
  name: string;
};

interface AppHudProps {
  countries: CountryOption[];
  selectedCountry: CountryCode;
  selectedCountryName: string;
  onCountryChange: (countryCode: CountryCode) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  incomeResult: IncomeResult | null;
  primaryRate: ExchangeRate | null;
}

export function AppHud({
  countries,
  selectedCountry,
  selectedCountryName,
  onCountryChange,
  isDark,
  onToggleTheme,
  incomeResult,
  primaryRate,
}: AppHudProps) {
  const convertedIncome =
    incomeResult && primaryRate
      ? formatCurrency(
          incomeResult.totalIncomeUsd * primaryRate.sell,
          primaryRate.currencyCode,
          primaryRate.locale,
        )
      : null;

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200/80 bg-zinc-50/90 backdrop-blur-xl dark:border-white/10 dark:bg-[#0f1117]/90">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[1.15rem] font-black leading-[1.05] tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-2xl sm:leading-none">
              <span className="block sm:inline">Calculadora</span>
              <span className="hidden sm:inline"> de </span>
              <span className="block sm:inline">Sueldo USD</span>
            </h1>
            <p className="mt-0.5 truncate text-sm font-black text-blue-600 dark:text-blue-400">
              {selectedCountryName}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2 lg:hidden">
            <select
              value={selectedCountry}
              onChange={(event) => onCountryChange(event.target.value as CountryCode)}
              aria-label="Pais"
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-800 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-emerald-900"
            >
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onToggleTheme}
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-bold text-zinc-800 shadow-sm transition hover:-translate-y-0.5 active:translate-y-0 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              {isDark ? "☀️" : "🌙"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 lg:min-w-[520px] lg:grid-cols-[1fr_1fr_auto_auto]">
          <div className="rounded-2xl bg-white px-4 py-3 shadow-[0_16px_36px_-24px_rgba(15,23,42,0.45)] ring-1 ring-zinc-200/70 dark:bg-zinc-900 dark:ring-zinc-800">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Resultado USD</p>
            <p className="mt-1 font-mono text-lg font-black tabular-nums text-zinc-950 dark:text-zinc-50">
              {incomeResult ? formatUsd(incomeResult.totalIncomeUsd) : "--"}
            </p>
          </div>

          <div className="rounded-2xl bg-white px-4 py-3 shadow-[0_16px_36px_-24px_rgba(15,23,42,0.45)] ring-1 ring-zinc-200/70 dark:bg-zinc-900 dark:ring-zinc-800">
            <p className="truncate text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {primaryRate ? `💱 ${primaryRate.name}` : selectedCountryName}
            </p>
            <p className="mt-1 truncate font-mono text-lg font-black tabular-nums text-emerald-700 dark:text-emerald-400">
              {convertedIncome ?? "--"}
            </p>
          </div>

          <select
            value={selectedCountry}
            onChange={(event) => onCountryChange(event.target.value as CountryCode)}
            aria-label="Pais"
            className="hidden h-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-emerald-900 lg:block"
          >
            {countries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onToggleTheme}
            className="hidden h-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-800 shadow-sm transition hover:-translate-y-0.5 active:translate-y-0 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 lg:block"
          >
            {isDark ? "☀️ Claro" : "🌙 Oscuro"}
          </button>
        </div>
      </div>
    </header>
  );
}
