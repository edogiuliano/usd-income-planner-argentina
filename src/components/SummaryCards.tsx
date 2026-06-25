import { formatNumber, formatUsd } from "@/lib/formatters";
import type { CycleDays, IncomeResult, PaymentType } from "@/types";

interface SummaryCardsProps {
  cycleDays: CycleDays;
  incomeResult: IncomeResult;
  paymentType?: PaymentType;
}

type CardColor = "zinc" | "emerald" | "amber";

export function SummaryCards({ cycleDays, incomeResult, paymentType }: SummaryCardsProps) {
  const cards: Array<{
    label: string;
    value: string;
    icon: string;
    color: CardColor;
    highlight?: boolean;
  }> = [
    {
      label: "Dias totales",
      value: formatNumber(cycleDays.totalDays),
      icon: "📅",
      color: "zinc",
    },
    {
      label: "Dias libres",
      value: formatNumber(cycleDays.freeDays),
      icon: "🏖️",
      color: "zinc",
    },
    ...(cycleDays.vtoDays > 0
      ? [
          {
            label: "VTO",
            value: formatNumber(cycleDays.vtoDays),
            icon: "⏸️",
            color: "amber" as const,
          },
        ]
      : []),
    ...(cycleDays.ptoDays > 0
      ? [
          {
            label: "PTO",
            value: formatNumber(cycleDays.ptoDays),
            icon: "🌴",
            color: "emerald" as const,
          },
        ]
      : []),
    {
      label: "Horas totales",
      value: formatNumber(incomeResult.totalHours),
      icon: "⏱️",
      color: "zinc",
    },
    {
      label: "Ingreso total USD",
      value: formatUsd(incomeResult.totalIncomeUsd),
      icon: "💵",
      color: "emerald",
      highlight: true,
    },
    {
      label: "Promedio diario USD",
      value: formatUsd(incomeResult.averageDailyIncomeUsd),
      icon: "📆",
      color: "zinc",
    },
    ...(paymentType === "hour"
      ? []
      : [
          {
            label: "Promedio horario USD",
            value: formatUsd(incomeResult.averageHourlyIncomeUsd),
            icon: "⚡",
            color: "amber" as const,
          },
        ]),
  ];

  const getColorClasses = (color: CardColor) => {
    const colors = {
      zinc: {
        bg: "bg-zinc-50 dark:bg-[#101218]",
        border: "border-zinc-200 dark:border-white/10",
        text: "text-zinc-950 dark:text-zinc-50",
      },
      emerald: {
        bg: "bg-emerald-50 dark:bg-emerald-950/30",
        border: "border-emerald-200 dark:border-emerald-800/70",
        text: "text-emerald-800 dark:text-emerald-300",
      },
      amber: {
        bg: "bg-amber-50 dark:bg-amber-950/30",
        border: "border-amber-200 dark:border-amber-800/70",
        text: "text-amber-800 dark:text-amber-300",
      },
    };

    return colors[color];
  };

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
      {cards.map((card) => {
        const colorClasses = getColorClasses(card.color);

        return (
          <div
            key={card.label}
            className={`rounded-2xl border p-4 transition-all hover:-translate-y-0.5 ${colorClasses.bg} ${colorClasses.border} ${
              card.highlight ? "shadow-[0_18px_42px_-28px_rgba(16,185,129,0.55)]" : ""
            }`}
          >
            <div className="mb-2 flex items-start gap-2">
              <p className="text-sm font-bold text-zinc-600 dark:text-zinc-300">
                <span className="mr-2" aria-hidden="true">
                  {card.icon}
                </span>
                {card.label}
              </p>
            </div>
            <p className={`font-mono text-2xl font-black tabular-nums ${colorClasses.text}`}>
              {card.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
