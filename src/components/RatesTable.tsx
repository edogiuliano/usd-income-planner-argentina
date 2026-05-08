import { formatArs } from "@/lib/formatters";
import type { ExchangeRate } from "@/types";

interface RatesTableProps {
  rates: ExchangeRate[];
  totalIncomeUsd: number;
}

export function RatesTable({ rates, totalIncomeUsd }: RatesTableProps) {
  if (rates.length === 0) {
    return null;
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Cotizaciones y conversión a ARS
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">
                Tipo de dólar
              </th>
              <th className="text-right py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">
                Compra
              </th>
              <th className="text-right py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">
                Venta
              </th>
              <th className="text-right py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">
                Ingreso en ARS
              </th>
            </tr>
          </thead>
          <tbody>
            {rates.map((rate) => (
              <tr key={rate.name} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="py-2 px-3 text-gray-900 dark:text-white">{rate.name}</td>
                <td className="py-2 px-3 text-right text-gray-600 dark:text-gray-400">
                  {formatArs(rate.buy)}
                </td>
                <td className="py-2 px-3 text-right text-gray-600 dark:text-gray-400">
                  {formatArs(rate.sell)}
                </td>
                <td className="py-2 px-3 text-right font-semibold text-emerald-700 dark:text-emerald-400">
                  {formatArs(totalIncomeUsd * rate.sell)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rates[0]?.updatedAt && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
          Actualizado: {formatDate(rates[0].updatedAt)}
        </p>
      )}
    </div>
  );
}
