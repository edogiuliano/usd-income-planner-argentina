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
      icon: "📅",
      color: "blue",
    },
    {
      label: "Días trabajados",
      value: formatNumber(cycleDays.workedDays),
      icon: "💼",
      color: "green",
    },
    {
      label: "Días libres",
      value: formatNumber(cycleDays.freeDays),
      icon: "🏖️",
      color: "purple",
    },
    {
      label: "Horas totales",
      value: formatNumber(incomeResult.totalHours),
      icon: "⏱️",
      color: "orange",
    },
    {
      label: "Ingreso total USD",
      value: formatUsd(incomeResult.totalIncomeUsd),
      icon: "💰",
      color: "emerald",
      highlight: true,
    },
    {
      label: "Promedio diario USD",
      value: formatUsd(incomeResult.averageDailyIncomeUsd),
      icon: "📊",
      color: "cyan",
    },
    {
      label: "Promedio horario USD",
      value: formatUsd(incomeResult.averageHourlyIncomeUsd),
      icon: "⚡",
      color: "amber",
    },
  ];

  const getColorClasses = (color: string, highlight: boolean = false) => {
    const colors: Record<string, { bg: string; border: string; text: string }> = {
      blue: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" },
      green: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700" },
      purple: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700" },
      orange: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700" },
      emerald: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700" },
      cyan: { bg: "bg-cyan-50", border: "border-cyan-200", text: "text-cyan-700" },
      amber: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700" },
    };

    if (highlight) {
      return {
        bg: "bg-gradient-to-br from-emerald-50 to-green-50",
        border: "border-emerald-300",
        text: "text-emerald-800",
      };
    }

    return colors[color] || colors.blue;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {cards.map((card) => {
        const colorClasses = getColorClasses(card.color, card.highlight);
        return (
          <div
            key={card.label}
            className={`p-4 rounded-xl border-2 ${colorClasses.bg} ${colorClasses.border} transition-all hover:shadow-md ${
              card.highlight ? "shadow-lg" : ""
            }`}
          >
            <div className="flex items-start justify-between mb-1.5">
              <p className="text-sm font-medium text-gray-600">{card.label}</p>
              <span className="text-xl">{card.icon}</span>
            </div>
            <p className={`text-2xl md:text-3xl font-bold ${colorClasses.text}`}>
              {card.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
