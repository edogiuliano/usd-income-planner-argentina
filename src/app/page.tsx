"use client";

import { useState, useEffect } from "react";
import { IncomeForm } from "@/components/IncomeForm";
import { SummaryCards } from "@/components/SummaryCards";
import { RatesTable } from "@/components/RatesTable";
import { IncomeChart } from "@/components/IncomeChart";
import { getCycleDays } from "@/lib/dates";
import { calculateIncome } from "@/lib/calculator";
import { fetchExchangeRates } from "@/lib/rates";
import type { CycleDays, IncomeResult, ExchangeRate } from "@/types";

export default function Home() {
  const [cycleDays, setCycleDays] = useState<CycleDays | null>(null);
  const [incomeResult, setIncomeResult] = useState<IncomeResult | null>(null);
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [ratesError, setRatesError] = useState<string | null>(null);

  useEffect(() => {
    const loadRates = async () => {
      setIsLoadingRates(true);
      setRatesError(null);
      try {
        const data = await fetchExchangeRates();
        setRates(data);
      } catch (error) {
        setRatesError("No se pudieron cargar las cotizaciones en este momento.");
        console.error("Error loading rates:", error);
      } finally {
        setIsLoadingRates(false);
      }
    };

    loadRates();
  }, []);

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

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
        <header className="text-center mb-6 md:mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            Calculadora de Sueldo USD
            <span className="block text-2xl md:text-3xl font-semibold text-blue-600 mt-1">
              Argentina
            </span>
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Calculá tus ingresos en dólares y convertí tu sueldo a pesos argentinos con cotizaciones actualizadas.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 md:p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
              Configuración
            </h2>
            <IncomeForm onSubmit={handleCalculate} />
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 md:p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </span>
              Resultados
            </h2>
            {cycleDays && incomeResult ? (
              <>
                <SummaryCards cycleDays={cycleDays} incomeResult={incomeResult} />
                {isLoadingRates && (
                  <div className="mt-4 text-center text-gray-500 text-sm">
                    Cargando cotizaciones...
                  </div>
                )}
                {ratesError && (
                  <div className="mt-4 flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-amber-700 text-sm font-medium">{ratesError}</p>
                  </div>
                )}
                {!isLoadingRates && rates.length > 0 && (
                  <>
                    <RatesTable rates={rates} totalIncomeUsd={incomeResult.totalIncomeUsd} />
                    <IncomeChart rates={rates} totalIncomeUsd={incomeResult.totalIncomeUsd} />
                  </>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-500 text-lg">
                  Completa el formulario para ver los resultados
                </p>
              </div>
            )}
          </div>
        </div>

        <footer className="mt-8 text-center text-gray-500 text-sm">
          <p>Las cotizaciones son informativas y pueden variar. Esta herramienta no es asesoría financiera.</p>
        </footer>
      </div>
    </main>
  );
}
