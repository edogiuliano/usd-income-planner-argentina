"use client";

import { useState } from "react";
import { IncomeForm } from "@/components/IncomeForm";
import { SummaryCards } from "@/components/SummaryCards";
import { getCycleDays } from "@/lib/dates";
import { calculateIncome } from "@/lib/calculator";
import type { CycleDays, IncomeResult } from "@/types";

export default function Home() {
  const [cycleDays, setCycleDays] = useState<CycleDays | null>(null);
  const [incomeResult, setIncomeResult] = useState<IncomeResult | null>(null);

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <header className="text-center mb-10 md:mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            USD Income Planner
            <span className="block text-2xl md:text-3xl font-semibold text-blue-600 mt-1">
              Argentina
            </span>
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Planificador de ingresos USD para freelancers, contractors y remote workers
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
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

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </span>
              Resultados
            </h2>
            {cycleDays && incomeResult ? (
              <SummaryCards cycleDays={cycleDays} incomeResult={incomeResult} />
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

        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>Las cotizaciones son informativas y pueden variar. Esta herramienta no es asesoría financiera.</p>
        </footer>
      </div>
    </main>
  );
}
