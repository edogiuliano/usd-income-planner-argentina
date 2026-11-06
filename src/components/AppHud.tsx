import type { CountryCode } from "@/types";

interface AppHudProps {
  countries: Array<{ code: CountryCode; name: string }>;
  selectedCountry: CountryCode;
  selectedCountryName: string;
  onCountryChange: (countryCode: CountryCode) => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export function AppHud({
  countries,
  selectedCountry,
  selectedCountryName,
  onCountryChange,
  isDark,
  onToggleTheme,
}: AppHudProps) {
  return (
    <header className="border-b border-zinc-200 bg-white dark:border-white/10 dark:bg-[#15171d]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <h1 className="text-base font-bold leading-tight sm:text-xl">
            <span className="block sm:inline">Calculadora</span>
            <span className="hidden sm:inline"> de </span>
            <span className="block sm:inline">Sueldo USD</span>
          </h1>
          <p className="mt-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            {selectedCountryName}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <select
            value={selectedCountry}
            onChange={(event) =>
              onCountryChange(event.target.value as CountryCode)
            }
            aria-label="País"
            className="app-input max-w-32 text-sm sm:max-w-40"
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
            className="secondary-button grid size-10 shrink-0 place-items-center"
            aria-label={isDark ? "Activar tema claro" : "Activar tema oscuro"}
            title={isDark ? "Tema claro" : "Tema oscuro"}
          >
            {isDark ? "☀️" : "🌙"}
          </button>
        </div>
      </div>
    </header>
  );
}
