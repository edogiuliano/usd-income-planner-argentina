import type { CountryCode } from "@/types";
import type {
  FeeRule,
  WithdrawalScenario,
  WithdrawalRoute,
} from "@/types/withdrawals";
import { getRouteSteps, withdrawalCatalog } from "@/lib/withdrawals/catalog";
import { isValidFee } from "@/lib/withdrawals/engine";

export const WITHDRAWAL_STORAGE_KEY = "usd-planner-withdrawals-v1";
export type WithdrawalPreferences = {
  selections: Record<string, string>;
  scenarios: Record<string, WithdrawalScenario>;
};
export const emptyWithdrawalPreferences = (): WithdrawalPreferences => ({
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
  const selected = preferences.selections[country];
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
    const countries = new Set(
      withdrawalCatalog.routes.flatMap((route) => route.countries),
    );
    for (const country of countries) {
      const selected =
        value.selections?.[country] ?? value.selections?.[`${country}:deel`];
      if (typeof selected !== "string") continue;
      const route = withdrawalCatalog.routes.find(
        (item) =>
          item.availability !== "unconfirmed" &&
          item.countries.includes(country) &&
          (item.id === selected ||
            (selected === "deel-revolut-br" &&
              item.id === "deel-revolut-usd" &&
              country === "br") ||
            (selected === "deel-swift-usd" &&
              item.destination === "swift" &&
              item.group === "usd")),
      );
      result.selections[country] = route?.id ?? "";
    }
    for (const route of withdrawalCatalog.routes) {
      if (route.availability === "unconfirmed") continue;
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
            getRouteSteps(route).flatMap((step) => [
              step.inputCurrency,
              step.outputCurrency,
            ]),
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
          if (
            Object.keys(fees).length ||
            Object.keys(rates).length ||
            Object.keys(usdValues).length
          )
            result.scenarios[key] = { fees, rates, usdValues };
        }
      }
    }
  } catch {
    return result;
  }
  return result;
}
