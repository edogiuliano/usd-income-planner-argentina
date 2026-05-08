"use client";

import { useEffect, useState } from "react";
import { IncomeForm } from "@/components/IncomeForm";
import { RateHistoryChart } from "@/components/RateHistoryChart";
import { RatesTable } from "@/components/RatesTable";
import { SummaryCards } from "@/components/SummaryCards";
import { calculateIncome } from "@/lib/calculator";
import { getCycleDays } from "@/lib/dates";
import { fetchExchangeRates } from "@/lib/rates";
import type { CountryCode, CycleDays, ExchangeRate, IncomeResult } from "@/types";

const COUNTRIES: Array<{ code: CountryCode; name: string; flag: string }> = [
  { code: "ar", name: "Argentina", flag: "🇦🇷" },
  { code: "cl", name: "Chile", flag: "🇨🇱" },
  { code: "uy", name: "Uruguay", flag: "🇺🇾" },
  { code: "mx", name: "México", flag: "🇲🇽" },
  { code: "bo", name: "Bolivia", flag: "🇧🇴" },
  { code: "br", name: "Brasil", flag: "🇧🇷" },
  { code: "co", name: "Colombia", flag: "🇨🇴" },
  { code: "ve", name: "Venezuela", flag: "🇻🇪" },
];

export default function Home() {
  const [cycleDays, setCycleDays] = useState<CycleDays | null>(null);
  const [incomeResult, setIncomeResult] = useState<IncomeResult | null>(null);
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [ratesError, setRatesError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>("ar");

  useEffect(() => {
    const savedTheme = localStorage.getItem("usd-planner-theme");
    const savedCountry = localStorage.getItem("usd-planner-country") as CountryCode | null;

    if (savedCountry && COUNTRIES.some((country) => country.code === savedCountry)) {
      setSelectedCountry(savedCountry);
    }

    if (savedTheme) {
      setIsDark(savedTheme === "dark");
    } else {
      setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }

    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const loadRates = async () => {
      setIsLoadingRates(true);
      setRatesError(null);

      try {
        const data = await fetchExchangeRates(selectedCountry);
        setRates(data);
      } catch (error) {
        setRates([]);
        setRatesError("No se pudieron cargar las cotizaciones en este momento.");
        console.error("Error loading rates:", error);
      } finally {
        setIsLoadingRates(false);
      }
    };

    loadRates();
  }, [isMounted, selectedCountry]);

  useEffect(() => {
    if (!isMounted) return;

    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark, isMounted]);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem("usd-planner-theme", newTheme ? "dark" : "light");
  };

  const handleCountryChange = (countryCode: CountryCode) => {
    setSelectedCountry(countryCode);
    localStorage.setItem("usd-planner-country", countryCode);
  };

  const handleCalculate = (data: {
    paymentType: "minute" | "hour" | "day" | "monthly";
    rate: number;
    hoursPerDay: number;
    freeWeekdays: number[];
    startDate: string;
    endDate: string;
  }) => {
    const days = getCycleDays(data.startDate, data.endDate, data.freeWeekdays);
    const income = calculateIncome({
      paymentType: data.paymentType,
      rate: data.rate,
      hoursPerDay: data.hoursPerDay,
      workedDays: days.workedDays,
    });

    setCycleDays(days);
    setIncomeResult(income);
  };

  const selectedCountryInfo =
    COUNTRIES.find((country) => country.code === selectedCountry) ?? COUNTRIES[0];

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 transition-colors dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 md:py-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 md:mb-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1 text-center">
            <h1 className="mb-3 text-4xl font-bold text-gray-900 dark:text-white md:text-5xl">
              Calculadora de Sueldo USD
              <span className="mt-1 block text-2xl font-semibold text-blue-600 dark:text-blue-400 md:text-3xl">
                {selectedCountryInfo.name}
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-300">
              Calculá tus ingresos en dólares y convertí tu sueldo con cotizaciones actualizadas.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 lg:justify-end">
            <label className="sr-only" htmlFor="country-selector">
              País
            </label>
            <select
              id="country-selector"
              value={selectedCountry}
              onChange={(event) => handleCountryChange(event.target.value as CountryCode)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 shadow-md transition-all hover:shadow-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-900"
            >
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.flag} {country.name}
                </option>
              ))}
            </select>

            <button
              onClick={toggleTheme}
              className="rounded-xl border border-gray-200 bg-white p-2 shadow-md transition-all hover:shadow-lg dark:border-gray-600 dark:bg-gray-700"
              aria-label="Cambiar tema"
            >
              {isDark ? (
                <svg className="h-6 w-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20" suppressHydrationWarning>
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-6 w-6 text-gray-700" fill="currentColor" viewBox="0 0 20 20" suppressHydrationWarning>
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-lg dark:border-gray-700 dark:bg-gray-800 md:p-6">
            <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" suppressHydrationWarning>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
              Configuración
            </h2>
            <IncomeForm onSubmit={handleCalculate} />
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-lg dark:border-gray-700 dark:bg-gray-800 md:p-6">
            <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" suppressHydrationWarning>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </span>
              Resultados
            </h2>
            {cycleDays && incomeResult ? (
              <>
                <SummaryCards cycleDays={cycleDays} incomeResult={incomeResult} />
                {!isLoadingRates && rates.length > 0 && (
                  <RatesTable rates={rates} totalIncomeUsd={incomeResult.totalIncomeUsd} />
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <svg className="mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" suppressHydrationWarning>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-lg text-gray-500 dark:text-gray-400">
                  Completá el formulario para ver los resultados
                </p>
              </div>
            )}
          </div>
        </div>

        <section className="mt-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-lg dark:border-gray-700 dark:bg-gray-800 md:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900">
              <svg className="h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" suppressHydrationWarning>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 17l6-6 4 4 8-8" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 7h7v7" />
              </svg>
            </span>
            Cotizaciones
          </h2>

          {isLoadingRates && (
            <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm font-medium text-gray-500 dark:border-gray-700 dark:text-gray-400">
              Cargando cotizaciones...
            </div>
          )}

          {ratesError && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/40">
              <svg className="h-5 w-5 flex-shrink-0 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" suppressHydrationWarning>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                {ratesError}
              </p>
            </div>
          )}

          {!isLoadingRates && !ratesError && rates.length > 0 && <RatesTable rates={rates} />}

          {selectedCountry === "ar" ? (
            <RateHistoryChart />
          ) : (
            <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-300">
              Historial disponible solo para Argentina por ahora
            </div>
          )}
        </section>

        <footer className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Las cotizaciones son informativas y pueden variar. Esta herramienta no es asesoría financiera.</p>
        </footer>
      </div>
    </main>
  );
}
