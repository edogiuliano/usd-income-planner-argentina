import { formatUsd, formatNumber } from "@/lib/formatters";
import type { CycleDays, IncomeResult } from "@/types";

interface SummaryCardsProps {
  cycleDays: CycleDays;
  incomeResult: IncomeResult;
}

export function SummaryCards({
  cycleDays,
  incomeResult,
}: SummaryCardsProps) {
  const cards = [
    {
      label: "Días totales",
      value: formatNumber(cycleDays.totalDays),
    },
    {
      label: "Días trabajados",
      value: formatNumber(cycleDays.workedDays),
    },
    {
      label: "Días libres",
      value: formatNumber(cycleDays.freeDays),
    },
    {
      label: "Horas totales",
      value: formatNumber(incomeResult.totalHours),
    },
    {
      label: "Ingreso total USD",
      value: formatUsd(incomeResult.totalIncomeUsd),
      highlight: true,
    },
    {
      label: "Promedio diario USD",
      value: formatUsd(incomeResult.averageDailyIncomeUsd),
    },
    {
      label: "Promedio horario USD",
      value: formatUsd(incomeResult.averageHourlyIncomeUsd),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`p-4 rounded-lg border ${
            card.highlight
              ? "bg-blue-50 border-blue-200"
              : "bg-white border-gray-200"
          }`}
        >
          <p className="text-sm text-gray-600">{card.label}</p>
          <p className="text-2xl font-bold">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
