"use client";

import { useEffect, useState } from "react";
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
import { parseDayCountInput } from "@/lib/inputNumbers";
import type { CountryCode, CycleDays, ExchangeRate, IncomeResult, PaymentType, TimeOffDays } from "@/types";

const COUNTRIES: Array<{ code: CountryCode; name: string }> = [
  { code: "ar", name: "Argentina" },
  { code: "cl", name: "Chile" },
  { code: "uy", name: "Uruguay" },
  { code: "mx", name: "Mexico" },
  { code: "bo", name: "Bolivia" },
  { code: "br", name: "Brasil" },
  { code: "co", name: "Colombia" },
  { code: "ve", name: "Venezuela" },
];

type CalculationData = {
  paymentType: PaymentType;
  rate: number;
  hoursPerDay: number;
  freeWeekdays: number[];
  timeOffDays: TimeOffDays;
  startDate: string;
  endDate: string;
};

const getTodayIsoDate = () => new Date().toISOString().split("T")[0];
const PTO_ONBOARDING_STORAGE_KEY = "usd-planner-pto-onboarding-v1-complete";

const isValidTab = (value: unknown): value is AppTab =>
  value === "calculate" || value === "project" || value === "rates" || value === "settings";

function WelcomeModal({
  productionDate,
  onProductionDateChange,
  onSave,
  onSkip,
}: {
  productionDate: string;
  onProductionDateChange: (value: string) => void;
  onSave: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex min-h-[100dvh] items-end justify-center overflow-y-auto bg-zinc-950/65 px-3 py-3 backdrop-blur-sm sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-modal-title"
        className="w-full max-w-lg overflow-hidden rounded-[1.5rem] bg-white shadow-[0_30px_100px_-40px_rgba(0,0,0,0.85)] ring-1 ring-zinc-200 dark:bg-[#15171d] dark:ring-white/10"
      >
        <div className="p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">
            👋 Bienvenida
          </p>
          <h2 id="welcome-modal-title" className="mt-2 text-2xl font-black tracking-tight text-zinc-950 dark:text-zinc-50">
            Configuremos tus PTO
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            Para calcular vacaciones, necesito saber que dia entraste a produccion. Con eso la app estima 1 PTO por cada mes completo.
          </p>

          <label htmlFor="productionDate" className="mt-5 block text-sm font-bold text-zinc-800 dark:text-zinc-200">
            Dia de entrada a produccion
          </label>
          <input
            id="productionDate"
            type="date"
            value={productionDate}
            onChange={(event) => onProductionDateChange(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-zinc-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-white/10 dark:bg-[#101218] dark:text-zinc-50 dark:focus:ring-emerald-900"
          />

          <div className="mt-4 rounded-2xl bg-blue-50 p-4 text-sm leading-6 text-blue-950 dark:bg-blue-950/35 dark:text-blue-100">
            🔒 Estos datos quedan guardados en este navegador. No se usan para nada mas: solo sirven para hacer tus calculos de sueldo, PTO y vacaciones.
          </div>
        </div>

        <div className="grid gap-2 border-t border-zinc-200 bg-zinc-50 px-5 py-4 dark:border-white/10 dark:bg-[#101218] sm:grid-cols-[1fr_auto]">
          <button
            type="button"
            onClick={onSkip}
            className="rounded-2xl px-4 py-3 text-sm font-black text-zinc-600 transition hover:bg-zinc-100 active:scale-[0.98] dark:text-zinc-300 dark:hover:bg-[#1b1f28]"
          >
            Despues
          </button>
          <button
            type="button"
            onClick={onSave}
            className="rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 active:scale-[0.98] dark:bg-zinc-50 dark:text-zinc-950"
          >
            Guardar y empezar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<AppTab>("calculate");
  const [cycleDays, setCycleDays] = useState<CycleDays | null>(null);
  const [incomeResult, setIncomeResult] = useState<IncomeResult | null>(null);
  const [calculationData, setCalculationData] = useState<CalculationData | null>(null);
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [ratesError, setRatesError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>("ar");
  const [preferredRateCasa, setPreferredRateCasa] = useState("cripto");
  const [hireDate, setHireDate] = useState(getTodayIsoDate());
  const [usedPtoDays, setUsedPtoDays] = useState("0");
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [welcomeProductionDate, setWelcomeProductionDate] = useState(getTodayIsoDate());

  useEffect(() => {
    const savedTheme = localStorage.getItem("usd-planner-theme");
    const savedCountry = localStorage.getItem("usd-planner-country") as CountryCode | null;
    const savedPreferredRateCasa = localStorage.getItem("usd-planner-preferred-rate-casa");
    const savedTab = localStorage.getItem("usd-planner-active-tab");
    const savedHireDate = localStorage.getItem("usd-planner-hire-date");
    const savedUsedPtoDays = localStorage.getItem("usd-planner-used-pto-days");
    const savedOnboarding = localStorage.getItem(PTO_ONBOARDING_STORAGE_KEY);

    if (savedCountry && COUNTRIES.some((country) => country.code === savedCountry)) {
      setSelectedCountry(savedCountry);
    }

    if (savedPreferredRateCasa) {
      setPreferredRateCasa(savedPreferredRateCasa);
    }

    if (isValidTab(savedTab)) {
      setActiveTab(savedTab);
    }

    if (savedHireDate) {
      setHireDate(savedHireDate);
      setWelcomeProductionDate(savedHireDate);
    }

    if (savedUsedPtoDays) {
      setUsedPtoDays(savedUsedPtoDays);
    }

    if (savedTheme) {
      setIsDark(savedTheme === "dark");
    } else {
      setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }

    setShowWelcomeModal(savedOnboarding !== "true");
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

    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark, isMounted]);

  useEffect(() => {
    if (!isMounted) return;

    localStorage.setItem("usd-planner-active-tab", activeTab);
  }, [activeTab, isMounted]);

  useEffect(() => {
    if (!isMounted) return;

    localStorage.setItem("usd-planner-hire-date", hireDate);
    localStorage.setItem("usd-planner-used-pto-days", usedPtoDays);
  }, [hireDate, usedPtoDays, isMounted]);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem("usd-planner-theme", newTheme ? "dark" : "light");
  };

  const handleCountryChange = (countryCode: CountryCode) => {
    setSelectedCountry(countryCode);
    localStorage.setItem("usd-planner-country", countryCode);
  };

  const handlePreferredRateChange = (rateCasa: string) => {
    setPreferredRateCasa(rateCasa);
    localStorage.setItem("usd-planner-preferred-rate-casa", rateCasa);
  };

  const handleCalculate = (data: CalculationData) => {
    const days = getCycleDays(data.startDate, data.endDate, data.freeWeekdays, data.timeOffDays);
    const income = calculateIncome({
      paymentType: data.paymentType,
      rate: data.rate,
      hoursPerDay: data.hoursPerDay,
      workedDays: days.workedDays,
      scheduledWorkDays: days.scheduledWorkDays,
      paidLeaveDays: days.ptoDays,
      unpaidLeaveDays: days.vtoDays,
    });

    setCycleDays(days);
    setIncomeResult(income);
    setCalculationData(data);
  };

  const handleResetSavedData = () => {
    localStorage.removeItem("usd-planner-form-state");
    localStorage.removeItem("usd-planner-projection-state");
    localStorage.removeItem("usd-planner-hire-date");
    localStorage.removeItem("usd-planner-used-pto-days");
    localStorage.removeItem(PTO_ONBOARDING_STORAGE_KEY);
    setHireDate(getTodayIsoDate());
    setUsedPtoDays("0");
  };

  const handleWelcomeSave = () => {
    const dateToSave = welcomeProductionDate || getTodayIsoDate();
    setHireDate(dateToSave);
    localStorage.setItem("usd-planner-hire-date", dateToSave);
    localStorage.setItem(PTO_ONBOARDING_STORAGE_KEY, "true");
    setShowWelcomeModal(false);
  };

  const handleWelcomeSkip = () => {
    localStorage.setItem(PTO_ONBOARDING_STORAGE_KEY, "true");
    setShowWelcomeModal(false);
  };

  const selectedCountryInfo =
    COUNTRIES.find((country) => country.code === selectedCountry) ?? COUNTRIES[0];
  const primaryRate = rates.find((rate) => rate.casa === preferredRateCasa) ?? rates[0] ?? null;
  const parsedUsedPtoDays = parseDayCountInput(usedPtoDays);

  return (
    <main className="min-h-[100dvh] bg-zinc-50 pb-32 text-zinc-950 transition-colors dark:bg-[#0f1117] dark:text-zinc-50">
      <AppHud
        countries={COUNTRIES}
        selectedCountry={selectedCountry}
        selectedCountryName={selectedCountryInfo.name}
        onCountryChange={handleCountryChange}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        incomeResult={incomeResult}
        primaryRate={primaryRate}
      />

      <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:py-7">
        {activeTab === "calculate" && (
          <section className="mx-auto grid w-full max-w-6xl gap-5 xl:grid-cols-[minmax(360px,460px)_minmax(0,1fr)] xl:items-start">
            <div className="rounded-[1.75rem] bg-white p-5 shadow-[0_24px_60px_-38px_rgba(15,23,42,0.55)] ring-1 ring-zinc-200/70 dark:bg-[#15171d] dark:ring-white/10 sm:p-6 xl:sticky xl:top-32 xl:self-start">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">
                Calcular
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-950 dark:text-zinc-50">
                Configuración del ciclo
              </h2>
              <div className="mt-5">
                <IncomeForm onSubmit={handleCalculate} />
              </div>
            </div>

            <div className="rounded-[1.75rem] bg-white p-5 shadow-[0_24px_60px_-38px_rgba(15,23,42,0.55)] ring-1 ring-zinc-200/70 dark:bg-[#15171d] dark:ring-white/10 sm:p-6 xl:self-start">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">
                    Resultado
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-950 dark:text-zinc-50">
                    Sueldo estimado
                  </h2>
                </div>
                {incomeResult && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("project")}
                    className="rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 active:translate-y-0 dark:bg-zinc-50 dark:text-zinc-950"
                  >
                    Ver proyección
                  </button>
                )}
              </div>

              <div className="mt-5">
                {cycleDays && incomeResult ? (
                  <SummaryCards
                    cycleDays={cycleDays}
                    incomeResult={incomeResult}
                    paymentType={calculationData?.paymentType}
                  />
                ) : (
                  <div className="flex min-h-72 flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center dark:border-white/10 dark:bg-[#101218]">
                    <p className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                      Cargá tu ciclo y calculá ingresos
                    </p>
                    <p className="mt-2 max-w-[46ch] text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                      Después podés proyectar meses futuros, vacaciones, PTO y VTO con la misma fórmula.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {activeTab === "project" && (
          <ProjectionPanel
            calculationData={calculationData}
            hireDate={hireDate}
            usedPtoDays={parsedUsedPtoDays}
            primaryRate={primaryRate}
          />
        )}

        {activeTab === "rates" && (
          <section className="mx-auto w-full max-w-5xl rounded-[1.75rem] bg-white p-5 shadow-[0_24px_60px_-38px_rgba(15,23,42,0.55)] ring-1 ring-zinc-200/70 dark:bg-zinc-900 dark:ring-zinc-800 sm:p-6">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">
                Cotizaciones
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-950 dark:text-zinc-50">
                Dólar y moneda local
              </h2>
            </div>

            {isLoadingRates && (
              <div className="rounded-[1.5rem] border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center text-sm font-bold text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
                Cargando cotizaciones...
              </div>
            )}

            {ratesError && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                {ratesError}
              </div>
            )}

            {!isLoadingRates && !ratesError && rates.length > 0 && (
              <>
                <RatesTable rates={rates} totalIncomeUsd={incomeResult?.totalIncomeUsd} />
                {selectedCountry === "ar" ? (
                  <RateHistoryChart />
                ) : (
                  <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm font-bold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                    Historial disponible solo para Argentina por ahora.
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {activeTab === "settings" && (
          <SettingsPanel
            hireDate={hireDate}
            onHireDateChange={setHireDate}
            usedPtoDays={usedPtoDays}
            onUsedPtoDaysChange={setUsedPtoDays}
            rates={rates}
            preferredRateCasa={primaryRate?.casa ?? preferredRateCasa}
            onPreferredRateChange={handlePreferredRateChange}
            onResetSavedData={handleResetSavedData}
          />
        )}

        <footer className="mx-auto mt-8 max-w-3xl text-center text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          Las cotizaciones son informativas y pueden variar. Esta herramienta es una estimación
          orientativa y no reemplaza políticas internas, contratos ni asesoría financiera.
        </footer>
      </div>

      <BottomTabs activeTab={activeTab} onTabChange={setActiveTab} />
      <FeedbackShareDock />
      {isMounted && showWelcomeModal && (
        <WelcomeModal
          productionDate={welcomeProductionDate}
          onProductionDateChange={setWelcomeProductionDate}
          onSave={handleWelcomeSave}
          onSkip={handleWelcomeSkip}
        />
      )}
    </main>
  );
}
