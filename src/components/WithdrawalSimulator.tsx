"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ProviderIdentity } from "@/components/ProviderIdentity";
import { WithdrawalDetails } from "@/components/WithdrawalDetails";
import { todayIso } from "@/lib/formState";
import { getWithdrawalRoutes } from "@/lib/withdrawals/catalog";
import {
  estimateReceipt,
  recommendWithdrawal,
  withdrawalMoney,
  withdrawalTariffLabel,
  type ReceiptEstimate,
} from "@/lib/withdrawals/presentation";
import {
  emptyWithdrawalPreferences,
  restoreWithdrawalPreferences,
  scenarioKey,
  WITHDRAWAL_STORAGE_KEY,
  selectedWithdrawalRoute,
} from "@/lib/withdrawals/preferences";
import type { CountryCode, ExchangeOperation, ExchangeRate } from "@/types";
import type { WithdrawalRoute } from "@/types/withdrawals";

export function WithdrawalSimulator({
  grossUsd,
  country,
  countryName,
  primaryRate,
  operation,
  renderSummary,
}: {
  grossUsd: number;
  country: CountryCode;
  countryName: string;
  primaryRate: ExchangeRate | null;
  operation: ExchangeOperation;
  renderSummary: (
    receipt: ReceiptEstimate | null,
    ready: boolean,
    unavailable: boolean,
  ) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [preferences, setPreferences] = useState(emptyWithdrawalPreferences);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      setPreferences(
        restoreWithdrawalPreferences(
          localStorage.getItem(WITHDRAWAL_STORAGE_KEY),
        ),
      );
    } catch {
      /* Storage is optional. */
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(WITHDRAWAL_STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      /* Keep the in-memory scenario if storage is unavailable. */
    }
  }, [loaded, preferences]);

  const routes = getWithdrawalRoutes(country);
  const route = selectedWithdrawalRoute(routes, preferences, country);
  const selectRoute = (id: string) =>
    setPreferences((previous) => ({
      ...previous,
      selections: { ...previous.selections, [country]: id },
    }));
  const asOfDate = todayIso();
  const calculateReceipt = (item: WithdrawalRoute) =>
    estimateReceipt({
      grossUsd,
      country,
      route: item,
      scenario: preferences.scenarios[scenarioKey(country, item.id)],
      primaryRate,
      operation,
      asOfDate,
    });
  const receipt = route ? calculateReceipt(route) : null;
  const recommendation =
    open && loaded && receipt
      ? recommendWithdrawal(
          receipt,
          routes.filter((item) => item.id !== route?.id).map(calculateReceipt),
          primaryRate,
          operation,
        )
      : null;

  return (
    <>
      {renderSummary(receipt, loaded, routes.length === 0)}
      <details
        className="mt-6 min-w-0 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/[0.02]"
        open={open}
        onToggle={(event) => setOpen(event.currentTarget.open)}
      >
        <summary className="cursor-pointer text-base font-semibold">
          ¿Cómo recibís tu sueldo?
        </summary>
        {open && loaded && (
          <div className="mt-4 min-w-0 space-y-4">
            <div className="grid min-w-0 gap-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-end">
              <span className="sm:pb-2">
                <ProviderIdentity id="deel" compact />
              </span>
              <label className="block min-w-0 text-xs font-medium">
                ¿A dónde querés retirar?
                <select
                  className="app-input mt-1.5 w-full"
                  disabled={!routes.length}
                  value={route?.id ?? ""}
                  onChange={(event) => selectRoute(event.target.value)}
                >
                  <option value="">
                    {routes.length ? "Sin retiro" : "Sin destinos confirmados"}
                  </option>
                  {(
                    [
                      ["local", "Moneda local"],
                      ["usd", "USD"],
                    ] as const
                  ).map(([status, label]) => {
                    const items = routes.filter(
                      (item) => item.group === status,
                    );
                    return (
                      items.length > 0 && (
                        <optgroup key={status} label={label}>
                          {items.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name} · {withdrawalTariffLabel(item)}
                            </option>
                          ))}
                        </optgroup>
                      )
                    );
                  })}
                </select>
              </label>
            </div>
            {route && receipt ? (
              <>
                {recommendation && (
                  <p
                    className="text-xs leading-5 text-emerald-800 dark:text-emerald-300"
                    role="status"
                  >
                    {recommendation.kind === "best" ? (
                      "Buena elección: tu ruta ofrece el mayor neto entre las que pudimos comparar."
                    ) : (
                      <>
                        Podrías ahorrar{" "}
                        <strong>
                          {withdrawalMoney(recommendation.savingsUsd, "USD")}
                        </strong>{" "}
                        retirando por {recommendation.route.name}, si lo tenés
                        habilitado.
                      </>
                    )}
                  </p>
                )}
                <WithdrawalDetails receipt={receipt} grossUsd={grossUsd} />
              </>
            ) : routes.length === 0 ? (
              <p className="py-3 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                No hay métodos de Deel confirmados para {countryName}. Tu sueldo
                no cambia.
              </p>
            ) : (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Sin comisiones de retiro aplicadas.
              </p>
            )}
          </div>
        )}
      </details>
    </>
  );
}
