import rawCatalog from "@/data/withdrawals.json";
import type { CountryCode } from "@/types";
import type { WithdrawalCatalog, WithdrawalRoute } from "@/types/withdrawals";

export const withdrawalCatalog = rawCatalog as WithdrawalCatalog;
export function getWithdrawalRoutes(country: CountryCode) {
  return withdrawalCatalog.routes.filter(
    (route) =>
      route.availability !== "unconfirmed" && route.countries.includes(country),
  );
}

export function getRouteSteps(route: WithdrawalRoute) {
  return route.steps.map((id) => {
    const step = withdrawalCatalog.steps.find((item) => item.id === id);
    if (!step) throw new Error(`Unknown withdrawal step: ${id}`);
    return step;
  });
}

export function getProvider(id: string) {
  return (
    withdrawalCatalog.providers.find((item) => item.id === id) ?? {
      id,
      name: id,
    }
  );
}

export function getRouteSources(route: WithdrawalRoute) {
  const ids = new Set([
    ...route.sourceIds,
    ...getRouteSteps(route).flatMap((step) => step.sourceIds),
  ]);
  return withdrawalCatalog.sources.filter((source) => ids.has(source.id));
}
