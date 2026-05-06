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
    <main className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            USD Income Planner Argentina
          </h1>
          <p className="text-gray-600">
            Planificador de ingresos USD para freelancers en Argentina
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Configuración</h2>
            <IncomeForm onSubmit={handleCalculate} />
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Resultados</h2>
            {cycleDays && incomeResult ? (
              <SummaryCards cycleDays={cycleDays} incomeResult={incomeResult} />
            ) : (
              <p className="text-gray-500 text-center py-8">
                Completa el formulario para ver los resultados
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
