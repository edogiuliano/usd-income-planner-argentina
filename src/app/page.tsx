"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppHud } from "@/components/AppHud";
import { BottomTabs, type AppTab } from "@/components/BottomTabs";
import { FeedbackShareDock } from "@/components/FeedbackShareDock";
import { IncomeForm } from "@/components/IncomeForm";
import { ProjectionPanel } from "@/components/ProjectionPanel";
import { RateHistoryChart } from "@/components/RateHistoryChart";
import { RatesTable } from "@/components/RatesTable";
import { SettingsPanel } from "@/components/SettingsPanel";
import { SummaryCards } from "@/components/SummaryCards";
import { calculateIncome } from "@/lib/calculator";
import { getCycleDays } from "@/lib/dates";
import { fetchExchangeRates } from "@/lib/rates";
import { normalizeRateId, selectPreferredRate } from "@/lib/conversion";
import {
  isDateOnly,
  parseSavedCalculation,
  restoreSavedForm,
} from "@/lib/formState";
import { parseDayCountInput, parseNumberInput } from "@/lib/inputNumbers";
import { MONTHLY_CYCLE_STORAGE_KEY } from "@/lib/monthlyCycles";
import type {
  CalculationData,
  CountryCode,
  ExchangeOperation,
  ExchangeRate,
} from "@/types";

const COUNTRIES: Array<{ code: CountryCode; name: string }> = [
  { code: "ar", name: "Argentina" },
  { code: "cl", name: "Chile" },
  { code: "uy", name: "Uruguay" },
  { code: "mx", name: "México" },
  { code: "bo", name: "Bolivia" },
  { code: "br", name: "Brasil" },
  { code: "co", name: "Colombia" },
  { code: "ve", name: "Venezuela" },
  { code: "other", name: "Otro / USD" },
];
const isValidTab = (value: unknown): value is AppTab =>
  value === "calculate" ||
  value === "project" ||
  value === "rates" ||
  value === "settings";

export default function Home() {
  const [activeTab, setActiveTab] = useState<AppTab>("calculate");
  const [calculationData, setCalculationData] =
    useState<CalculationData | null>(null);
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [ratesError, setRatesError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>("ar");
  const [preferredRates, setPreferredRates] = useState<
    Partial<Record<CountryCode, string>>
  >({});
  const [operation, setOperation] = useState<ExchangeOperation>("sell-usd");
  const [hireDate, setHireDate] = useState("");
  const [usedPtoDays, setUsedPtoDays] = useState("0");
  const [ptoPerMonth, setPtoPerMonth] = useState("1");
  const [resetVersion, setResetVersion] = useState(0);
  const [ratesRequest, setRatesRequest] = useState(0);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const countryValue = localStorage.getItem("usd-planner-country");
    const country =
      COUNTRIES.find((item) => item.code === countryValue)?.code ?? "ar";
    setSelectedCountry(country);
    try {
      const saved = JSON.parse(
        localStorage.getItem("usd-planner-preferred-rates") ?? "{}",
      );
      const preferences: Partial<Record<CountryCode, string>> = {};
      for (const item of COUNTRIES) {
        if (typeof saved?.[item.code] === "string")
          preferences[item.code] = normalizeRateId(saved[item.code]);
      }
      const legacy = localStorage.getItem("usd-planner-preferred-rate-casa");
      if (legacy && !preferences[country])
        preferences[country] = normalizeRateId(legacy);
      setPreferredRates(preferences);
    } catch {
      /* Ignore malformed preferences without discarding the saved form. */
    }
    const tab = localStorage.getItem("usd-planner-active-tab");
    if (isValidTab(tab)) setActiveTab(tab);
    const hire = localStorage.getItem("usd-planner-hire-date");
    if (isDateOnly(hire)) setHireDate(hire);
    setUsedPtoDays(
      String(
        parseDayCountInput(
          localStorage.getItem("usd-planner-used-pto-days") ?? "0",
        ),
      ),
    );
    const monthly = localStorage.getItem("usd-planner-pto-per-month");
    if (monthly !== null && /^\d+(?:[.,]\d+)?$/.test(monthly))
      setPtoPerMonth(monthly);
    if (localStorage.getItem("usd-planner-exchange-operation") === "buy-usd")
      setOperation("buy-usd");
    const theme = localStorage.getItem("usd-planner-theme");
    setIsDark(
      theme
        ? theme === "dark"
        : window.matchMedia("(prefers-color-scheme: dark)").matches,
    );
    try {
      setCalculationData(
        parseSavedCalculation(
          restoreSavedForm(
            localStorage.getItem("usd-planner-form-state"),
            localStorage.getItem("usd-planner-last-valid-form-state"),
            localStorage.getItem(MONTHLY_CYCLE_STORAGE_KEY),
          ),
        ),
      );
    } catch {
      setCalculationData(null);
    }
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    let cancelled = false;
    setRates([]);
    setIsLoadingRates(true);
    setRatesError(null);
    fetchExchangeRates(selectedCountry)
      .then((data) => {
        if (!cancelled) setRates(data);
      })
      .catch(() => {
        if (!cancelled)
          setRatesError(
            "No se pudieron cargar las cotizaciones. Probá actualizar nuevamente.",
          );
      })
      .finally(() => {
        if (!cancelled) setIsLoadingRates(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isMounted, selectedCountry, ratesRequest]);

  useEffect(() => {
    if (!isMounted) return;
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("usd-planner-theme", isDark ? "dark" : "light");
    localStorage.setItem("usd-planner-country", selectedCountry);
    localStorage.setItem("usd-planner-active-tab", activeTab);
    localStorage.setItem("usd-planner-hire-date", hireDate);
    localStorage.setItem("usd-planner-used-pto-days", usedPtoDays);
    localStorage.setItem(
      "usd-planner-pto-per-month",
      String(Math.max(0, parseNumberInput(ptoPerMonth))),
    );
    localStorage.setItem(
      "usd-planner-preferred-rates",
      JSON.stringify(preferredRates),
    );
    localStorage.setItem("usd-planner-exchange-operation", operation);
  }, [
    isMounted,
    isDark,
    selectedCountry,
    activeTab,
    hireDate,
    usedPtoDays,
    ptoPerMonth,
    preferredRates,
    operation,
  ]);

  const handleCalculate = useCallback(
    (data: CalculationData) => setCalculationData(data),
    [],
  );
  const handleInvalid = useCallback(() => setCalculationData(null), []);
  const handleCountryChange = (country: CountryCode) => {
    setRates([]);
    setRatesError(null);
    setIsLoadingRates(true);
    setSelectedCountry(country);
  };
  const handleResetSavedData = () => {
    for (const key of [
      "form-state",
      "last-valid-form-state",
      "monthly-cycle",
      "projection-state",
      "hire-date",
      "used-pto-days",
      "pto-per-month",
      "preferred-rates",
      "preferred-rate-casa",
      "exchange-operation",
      "pto-onboarding-v1-complete",
    ]) {
      localStorage.removeItem(`usd-planner-${key}`);
    }
    setHireDate("");
    setUsedPtoDays("0");
    setPtoPerMonth("1");
    setPreferredRates({});
    setOperation("sell-usd");
    setCalculationData(null);
    setResetVersion((version) => version + 1);
  };
  const countryName =
    COUNTRIES.find((country) => country.code === selectedCountry)?.name ??
    "Argentina";
  const primaryRate = selectPreferredRate(
    rates,
    preferredRates[selectedCountry] ??
      (selectedCountry === "ar" ? "cripto" : ""),
  );
  const cycleDays = calculationData
    ? getCycleDays(
        calculationData.startDate,
        calculationData.endDate,
        calculationData.freeWeekdays,
        calculationData.timeOffDays,
      )
    : null;
  const incomeResult =
    calculationData && cycleDays
      ? calculateIncome({
          ...calculationData,
          workedDays: cycleDays.workedDays,
          scheduledWorkDays: cycleDays.scheduledWorkDays,
          paidLeaveDays: cycleDays.ptoDays,
          unpaidLeaveDays: cycleDays.vtoDays,
        })
      : null;
  const parsedMonthlyPto = Math.max(0, parseNumberInput(ptoPerMonth));

  return (
    <main id="main-content" className="app-shell min-h-[100dvh] pb-28 lg:pb-12">
      <AppHud
        countries={COUNTRIES}
        selectedCountry={selectedCountry}
        selectedCountryName={countryName}
        onCountryChange={handleCountryChange}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
      />
      <BottomTabs activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:py-7">
        {activeTab === "calculate" && (
          <section className="grid min-w-0 gap-6 lg:grid-cols-[minmax(320px,390px)_minmax(0,1fr)] lg:items-start">
            <div className="workspace-section min-w-0">
              <h2 className="text-xl font-semibold">Configuración del ciclo</h2>
              <div className="mt-5">
                {isMounted ? (
                  <IncomeForm
                    key={resetVersion}
                    onSubmit={handleCalculate}
                    onInvalid={handleInvalid}
                    onShowResults={() => {
                      if (!window.matchMedia("(min-width: 1024px)").matches) {
                        resultsRef.current?.scrollIntoView({
                          behavior: window.matchMedia(
                            "(prefers-reduced-motion: reduce)",
                          ).matches
                            ? "instant"
                            : "smooth",
                          block: "start",
                        });
                      }
                    }}
                  />
                ) : (
                  <p role="status" className="py-12 text-sm text-zinc-500">
                    Cargando configuración...
                  </p>
                )}
              </div>
            </div>
            <div
              ref={resultsRef}
              className="workspace-section min-w-0 scroll-mt-4"
              aria-live="polite"
            >
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">Sueldo estimado</h2>
                {incomeResult && (
                  <button
                    type="button"
                    className="secondary-button px-3 py-2 text-sm"
                    onClick={() => setActiveTab("project")}
                  >
                    Ver proyección ↗
                  </button>
                )}
              </div>
              {cycleDays && incomeResult ? (
                <SummaryCards
                  cycleDays={cycleDays}
                  incomeResult={incomeResult}
                  paymentType={calculationData?.paymentType}
                  primaryRate={primaryRate}
                  operation={operation}
                  isLoadingRates={isLoadingRates}
                  ratesError={ratesError}
                />
              ) : (
                <div className="empty-state py-16 text-center">
                  <p className="font-semibold">Tu próximo cálculo, acá</p>
                  <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                    Completá un monto y un período válidos para ver tu sueldo.
                  </p>
                </div>
              )}
            </div>
          </section>
        )}
        {activeTab === "project" && (
          <ProjectionPanel
            key={resetVersion}
            calculationData={calculationData}
            hireDate={hireDate}
            usedPtoDays={parseDayCountInput(usedPtoDays)}
            ptoPerMonth={parsedMonthlyPto}
            primaryRate={primaryRate}
            operation={operation}
            onConfigurePto={() => setActiveTab("settings")}
          />
        )}
        {activeTab === "rates" && (
          <section className="workspace-section mx-auto max-w-5xl min-w-0">
            <h2 className="text-xl font-semibold">Cotizaciones e historial</h2>
            {selectedCountry !== "other" && (
              <label className="mt-5 block max-w-md text-sm font-medium">
                Operación de cambio
                <select
                  className="app-input mt-2 w-full"
                  value={operation}
                  onChange={(event) =>
                    setOperation(event.target.value as ExchangeOperation)
                  }
                >
                  <option value="sell-usd">
                    Vender USD · recibo moneda local
                  </option>
                  <option value="buy-usd">
                    Comprar USD · costo en moneda local
                  </option>
                </select>
              </label>
            )}
            {isLoadingRates && (
              <p role="status" className="empty-state mt-5 p-8">
                Cargando cotizaciones...
              </p>
            )}
            {ratesError && (
              <div className="mt-5 text-sm text-amber-700 dark:text-amber-300">
                <p role="alert">{ratesError}</p>
                <button
                  type="button"
                  className="secondary-button mt-3 px-3 py-2"
                  onClick={() => setRatesRequest((value) => value + 1)}
                >
                  Reintentar
                </button>
              </div>
            )}
            {!isLoadingRates &&
              !ratesError &&
              (selectedCountry === "other" ? (
                <p className="empty-state mt-5 p-6 text-sm">
                  Este perfil usa USD. No hace falta convertir a otra moneda.
                </p>
              ) : rates.length > 0 ? (
                <>
                  <RatesTable
                    rates={rates}
                    totalIncomeUsd={incomeResult?.totalIncomeUsd}
                    operation={operation}
                  />
                  {selectedCountry === "ar" ? (
                    <RateHistoryChart />
                  ) : (
                    <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
                      Historial disponible solo para Argentina por ahora.
                    </p>
                  )}
                </>
              ) : (
                <p className="empty-state mt-5 p-6">
                  No hay cotizaciones disponibles.
                </p>
              ))}
          </section>
        )}
        {activeTab === "settings" && (
          <SettingsPanel
            hireDate={hireDate}
            onHireDateChange={setHireDate}
            usedPtoDays={usedPtoDays}
            onUsedPtoDaysChange={setUsedPtoDays}
            ptoPerMonth={ptoPerMonth}
            onPtoPerMonthChange={setPtoPerMonth}
            operation={operation}
            onOperationChange={setOperation}
            rates={rates}
            preferredRateCasa={primaryRate?.casa ?? ""}
            onPreferredRateChange={(id) =>
              setPreferredRates((previous) => ({
                ...previous,
                [selectedCountry]: normalizeRateId(id),
              }))
            }
            onResetSavedData={handleResetSavedData}
          />
        )}
        <footer className="mx-auto mt-8 max-w-3xl text-center text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          v1.1 · Estimación orientativa. Las cotizaciones pueden variar. No
          reemplaza políticas internas, contratos ni asesoría financiera.
        </footer>
      </div>
      <FeedbackShareDock />
    </main>
  );
}
