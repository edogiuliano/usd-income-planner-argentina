import { formatCurrency } from "@/lib/formatters";
import type { ExchangeRate } from "@/types";

interface RatesTableProps {
  rates: ExchangeRate[];
  totalIncomeUsd?: number;
}

export function RatesTable({ rates, totalIncomeUsd }: RatesTableProps) {
  if (rates.length === 0) {
    return null;
  }

  const shouldShowConvertedIncome = typeof totalIncomeUsd === "number";

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString(rates[0]?.locale ?? "es-AR", {
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
    <div className="mt-6 first:mt-0">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        Cotizaciones y conversión
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">
                Tipo de dólar
              </th>
              <th className="px-3 py-2 text-right font-semibold text-gray-700 dark:text-gray-300">
                Compra
              </th>
              <th className="px-3 py-2 text-right font-semibold text-gray-700 dark:text-gray-300">
                Venta
              </th>
              {shouldShowConvertedIncome && (
                <th className="px-3 py-2 text-right font-semibold text-gray-700 dark:text-gray-300">
                  Ingreso convertido
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rates.map((rate) => (
              <tr
                key={rate.casa}
                className="border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
              >
                <td className="px-3 py-2 text-gray-900 dark:text-white">{rate.name}</td>
                <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">
                  {formatCurrency(rate.buy, rate.currencyCode, rate.locale)}
                </td>
                <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">
                  {formatCurrency(rate.sell, rate.currencyCode, rate.locale)}
                </td>
                {shouldShowConvertedIncome && (
                  <td className="px-3 py-2 text-right font-semibold text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(totalIncomeUsd * rate.sell, rate.currencyCode, rate.locale)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rates[0]?.updatedAt && (
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          Actualizado: {formatDate(rates[0].updatedAt)}
        </p>
      )}
    </div>
  );
}
