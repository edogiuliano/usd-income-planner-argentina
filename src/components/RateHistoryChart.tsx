"use client";

import { format, isAfter, parseISO, subDays } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type DollarHouse = "oficial" | "blue" | "bolsa" | "contadoconliqui" | "cripto" | "mayorista";
type Period = "7" | "30" | "365";

type RateHistoryPoint = {
  fecha: string;
  compra: number;
  venta: number;
};

const DOLLAR_HOUSES: Array<{ value: DollarHouse; label: string }> = [
  { value: "oficial", label: "Oficial" },
  { value: "blue", label: "Blue" },
  { value: "bolsa", label: "Bolsa" },
  { value: "contadoconliqui", label: "CCL" },
  { value: "cripto", label: "Cripto" },
  { value: "mayorista", label: "Mayorista" },
];

const PERIODS: Array<{ value: Period; label: string }> = [
  { value: "7", label: "7 dias" },
  { value: "30", label: "30 dias" },
  { value: "365", label: "1 año" },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(value);

export function RateHistoryChart() {
  const [selectedHouse, setSelectedHouse] = useState<DollarHouse>("cripto");
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("30");
  const [history, setHistory] = useState<RateHistoryPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `https://api.argentinadatos.com/v1/cotizaciones/dolares/${selectedHouse}`,
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = (await response.json()) as RateHistoryPoint[];

        if (!Array.isArray(data) || data.length === 0) {
          throw new Error("Empty history response");
        }

        setHistory(data);
      } catch (loadError) {
        console.error("Error loading rate history:", loadError);
        setHistory([]);
        setError("No se pudo cargar el historial de cotizaciones");
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [selectedHouse]);

  const chartData = useMemo(() => {
    const cutoff = subDays(new Date(), Number(selectedPeriod));

    return history
      .map((point) => {
        const parsedDate = parseISO(point.fecha);

        return {
          date: parsedDate,
          label: format(parsedDate, "dd/MM"),
          venta: point.venta,
        };
      })
      .filter((point) => isAfter(point.date, cutoff))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [history, selectedPeriod]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <p className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">{label}</p>
          <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="mt-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Historial de cotizacion
        </h3>
        <div className="flex flex-wrap gap-2">
          <select
            value={selectedHouse}
            onChange={(event) => setSelectedHouse(event.target.value as DollarHouse)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-900"
          >
            {DOLLAR_HOUSES.map((house) => (
              <option key={house.value} value={house.value}>
                {house.label}
              </option>
            ))}
          </select>

          <select
            value={selectedPeriod}
            onChange={(event) => setSelectedPeriod(event.target.value as Period)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-900"
          >
            {PERIODS.map((period) => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading && (
        <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-gray-300 text-sm font-medium text-gray-500 dark:border-gray-700 dark:text-gray-400">
          Cargando historial...
        </div>
      )}

      {!isLoading && error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
          {error}
        </div>
      )}

      {!isLoading && !error && chartData.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
          No se pudo cargar el historial de cotizaciones
        </div>
      )}

      {!isLoading && !error && chartData.length > 0 && (
        <div className="h-64 w-full 2xl:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 18, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis
                dataKey="label"
                tick={{ fill: "#6a7282", fontSize: 12 }}
                axisLine={{ stroke: "#e5e7eb" }}
                tickLine={{ stroke: "#e5e7eb" }}
                minTickGap={18}
              />
              <YAxis
                tick={{ fill: "#6a7282", fontSize: 12 }}
                axisLine={{ stroke: "#e5e7eb" }}
                tickLine={{ stroke: "#e5e7eb" }}
                tickFormatter={(value) => `$${Number(value).toLocaleString("es-AR")}`}
                width={72}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="venta"
                stroke="#2563eb"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
