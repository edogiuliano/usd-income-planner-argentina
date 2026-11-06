"use client";

import { useEffect, useRef, useState } from "react";
import { formatArs } from "@/lib/formatters";
import { convertUsd } from "@/lib/conversion";
import type { ExchangeOperation, ExchangeRate } from "@/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface IncomeChartProps {
  rates: ExchangeRate[];
  totalIncomeUsd: number;
  operation?: ExchangeOperation;
}

function IncomeTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; payload?: { name: string } }>;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-[#191c22]">
      <p className="mb-1 text-sm font-semibold">{payload[0].payload?.name}</p>
      <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
        {formatArs(payload[0].value ?? 0)}
      </p>
    </div>
  );
}

export function IncomeChart({
  rates,
  totalIncomeUsd,
  operation = "sell-usd",
}: IncomeChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [isChartReady, setIsChartReady] = useState(false);

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const updateReadyState = () => {
      setIsChartReady(container.getBoundingClientRect().width > 0);
    };
    const resizeObserver = new ResizeObserver(updateReadyState);

    updateReadyState();
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  if (rates.length === 0) {
    return null;
  }

  const data = rates.map((rate) => ({
    name: rate.name,
    value: convertUsd(totalIncomeUsd, rate, operation),
  }));

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
        Comparación de ingresos en ARS
      </h3>
      <div ref={chartContainerRef} className="h-56 min-h-56 w-full min-w-0">
        {isChartReady && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e5e7eb"
              />
              <XAxis
                dataKey="name"
                tick={{ fill: "#6a7282", fontSize: 12 }}
                axisLine={{ stroke: "#e5e7eb" }}
                tickLine={{ stroke: "#e5e7eb" }}
              />
              <YAxis
                tick={{ fill: "#6a7282", fontSize: 12 }}
                axisLine={{ stroke: "#e5e7eb" }}
                tickLine={{ stroke: "#e5e7eb" }}
                tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
              />
              <Tooltip content={<IncomeTooltip />} />
              <Bar
                dataKey="value"
                fill="#059669"
                radius={[4, 4, 0, 0]}
                className="hover:opacity-80 transition-opacity"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
