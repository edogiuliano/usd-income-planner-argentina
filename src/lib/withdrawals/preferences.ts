import type { CountryCode } from "@/types";
import type {
  FeeRule,
  WithdrawalProvider,
  WithdrawalScenario,
  WithdrawalRoute,
} from "@/types/withdrawals";
import {
  withdrawalCatalog,
  withdrawalProviders,
} from "@/lib/withdrawals/catalog";
import { isValidFee } from "@/lib/withdrawals/engine";

export const WITHDRAWAL_STORAGE_KEY = "usd-planner-withdrawals-v1";
export type WithdrawalPreferences = {
  provider: WithdrawalProvider;
  selections: Record<string, string>;
  scenarios: Record<string, WithdrawalScenario>;
};
export const emptyWithdrawalPreferences = (): WithdrawalPreferences => ({
  provider: "deel",
  selections: {},
  scenarios: {},
});
export const scenarioKey = (country: CountryCode, routeId: string) =>
  `${country}:${routeId}`;

export function selectedWithdrawalRoute(
  routes: WithdrawalRoute[],
  preferences: WithdrawalPreferences,
  country: CountryCode,
) {
  const selected = preferences.selections[`${country}:${preferences.provider}`];
  if (selected !== undefined)
    return routes.find((route) => route.id === selected) ?? null;
  // Older versions saved edits to the default route without an explicit selection.
  return (
    routes.find(
      (route) => preferences.scenarios[scenarioKey(country, route.id)],
    ) ?? null
  );
}

export function restoreWithdrawalPreferences(
  raw: string | null,
): WithdrawalPreferences {
  const result = emptyWithdrawalPreferences();
  try {
    const value = JSON.parse(raw ?? "null");
    if (!value || typeof value !== "object") return result;
    if (withdrawalProviders.includes(value.provider))
      result.provider = value.provider;
    for (const route of withdrawalCatalog.routes) {
      for (const country of route.countries) {
        const key = scenarioKey(country, route.id);
        const stored = value.scenarios?.[key];
        if (stored && typeof stored === "object") {
          const fees: Record<string, FeeRule | null> = {},
            rates: Record<string, number> = {},
            usdValues: Record<string, number> = {};
          for (const id of route.steps) {
            if (stored.fees?.[id] === null) fees[id] = null;
            else if (isValidFee(stored.fees?.[id])) {
              const { percent, fixed, min, max } = stored.fees[id];
              fees[id] = { percent, fixed, min, max };
            }
            if (
              typeof stored.rates?.[id] === "number" &&
              Number.isFinite(stored.rates[id]) &&
              stored.rates[id] > 0
            )
              rates[id] = stored.rates[id];
          }
          for (const currency of new Set(
            withdrawalCatalog.steps
              .filter((step) => route.steps.includes(step.id))
              .flatMap((step) => [step.inputCurrency, step.outputCurrency]),
          )) {
            const rate = stored.usdValues?.[currency];
            if (
              currency !== "USD" &&
              typeof rate === "number" &&
              Number.isFinite(rate) &&
              rate > 0
            )
              usdValues[currency] = rate;
          }
          result.scenarios[key] = { fees, rates, usdValues };
        }
        const selectionKey = `${country}:${route.provider}`;
        if (value.selections?.[selectionKey] === "")
          result.selections[selectionKey] = "";
        if (value.selections?.[selectionKey] === route.id)
          result.selections[selectionKey] = route.id;
      }
    }
  } catch {
    return result;
  }
  return result;
}
