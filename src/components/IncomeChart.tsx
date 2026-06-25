"use client";

import { useEffect, useRef, useState } from "react";
import { formatArs } from "@/lib/formatters";
import type { ExchangeRate } from "@/types";
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
}

export function IncomeChart({ rates, totalIncomeUsd }: IncomeChartProps) {
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
    value: totalIncomeUsd * rate.sell,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
            {payload[0].payload.name}
          </p>
          <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
            {formatArs(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
        Comparación de ingresos en ARS
      </h3>
      <div ref={chartContainerRef} className="h-56 min-h-56 w-full min-w-0">
        {isChartReady && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
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
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="value"
                fill="#3b82f6"
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
