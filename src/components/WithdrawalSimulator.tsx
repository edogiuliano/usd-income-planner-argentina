"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ProviderIdentity } from "@/components/ProviderIdentity";
import { WithdrawalDetails } from "@/components/WithdrawalDetails";
import { todayIso } from "@/lib/formState";
import {
  getProvider,
  getWithdrawalRoutes,
  withdrawalProviders,
} from "@/lib/withdrawals/catalog";
import {
  estimateReceipt,
  recommendWithdrawal,
  withdrawalMoney,
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
import type { WithdrawalProvider, WithdrawalRoute } from "@/types/withdrawals";

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

  const routes = getWithdrawalRoutes(country, preferences.provider);
  const selectionKey = `${country}:${preferences.provider}`;
  const route = selectedWithdrawalRoute(routes, preferences, country);
  const selectRoute = (next: WithdrawalRoute) =>
    setPreferences((previous) => ({
      ...previous,
      selections: { ...previous.selections, [selectionKey]: next.id },
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
          withdrawalProviders
            .flatMap((provider) => getWithdrawalRoutes(country, provider))
            .filter((item) => item.id !== route?.id)
            .map(calculateReceipt),
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
            <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="min-w-0 text-xs font-medium">
                Desde
                <span className="mt-1.5 flex min-w-0 items-center gap-2">
                  <ProviderIdentity
                    key={preferences.provider}
                    id={preferences.provider}
                    compact
                    iconOnly
                  />
                  <select
                    aria-label="Desde"
                    className="app-input w-full"
                    value={preferences.provider}
                    onChange={(event) => {
                      const provider = event.target.value as WithdrawalProvider;
                      setPreferences((previous) => {
                        const nextRoutes = getWithdrawalRoutes(
                          country,
                          provider,
                        );
                        const previousRoute = selectedWithdrawalRoute(
                          nextRoutes,
                          { ...previous, provider },
                          country,
                        );
                        const nextKey = `${country}:${provider}`;
                        return {
                          ...previous,
                          provider,
                          selections: {
                            ...previous.selections,
                            [nextKey]:
                              previous.selections[nextKey] ??
                              previousRoute?.id ??
                              nextRoutes[0]?.id ??
                              "",
                          },
                        };
                      });
                    }}
                  >
                    {withdrawalProviders.map((id) => (
                      <option key={id} value={id}>
                        {getProvider(id).name}
                      </option>
                    ))}
                  </select>
                </span>
              </label>
              <label className="min-w-0 text-xs font-medium">
                Hacia
                <span className="mt-1.5 flex min-w-0 items-center gap-2">
                  <ProviderIdentity
                    key={route?.destination ?? "bank"}
                    id={route?.destination ?? "bank"}
                    compact
                    iconOnly
                  />
                  <select
                    aria-label="Hacia"
                    className="app-input w-full"
                    disabled={!routes.length}
                    value={route?.id ?? ""}
                    onChange={(event) => {
                      if (!event.target.value) {
                        setPreferences((previous) => ({
                          ...previous,
                          selections: {
                            ...previous.selections,
                            [selectionKey]: "",
                          },
                        }));
                        return;
                      }
                      const next = routes.find(
                        (item) => item.id === event.target.value,
                      );
                      if (next) selectRoute(next);
                    }}
                  >
                    <option value="">
                      {routes.length
                        ? "Sin retiro"
                        : "Sin destinos disponibles"}
                    </option>
                    {routes.map((item) => (
                      <option key={item.id} value={item.id}>
                        {routes.some(
                          (other) =>
                            other.destination === item.destination &&
                            other.id !== item.id,
                        )
                          ? item.name
                          : getProvider(item.destination).name}
                      </option>
                    ))}
                  </select>
                </span>
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
                        con {getProvider(recommendation.route.provider).name} →{" "}
                        {recommendation.route.name}, si podés cobrar por esa
                        ruta.
                      </>
                    )}
                  </p>
                )}
                <WithdrawalDetails
                  receipt={receipt}
                  grossUsd={grossUsd}
                  fees={
                    preferences.scenarios[scenarioKey(country, route.id)]?.fees
                  }
                />
              </>
            ) : routes.length === 0 ? (
              <p className="py-3 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                Todavía no hay retiros verificados de{" "}
                {getProvider(preferences.provider).name} para {countryName}. Tu
                cálculo de sueldo no cambia.
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
