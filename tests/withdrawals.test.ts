import { describe, expect, it } from "vitest";
import {
  calculateFee,
  estimateWithdrawal,
  isValidFee,
  rankWithdrawals,
} from "../src/lib/withdrawals/engine";
import {
  getRouteSteps,
  getWithdrawalRoutes,
  withdrawalCatalog,
} from "../src/lib/withdrawals/catalog";
import {
  restoreWithdrawalPreferences,
  scenarioKey,
} from "../src/lib/withdrawals/preferences";
import type {
  FeeRule,
  WithdrawalRoute,
  WithdrawalStep,
} from "../src/types/withdrawals";

const route = withdrawalCatalog.routes.find(
  (route) => route.id === "deel-payoneer-santander-ar",
)!;
const estimate = (id: string, scenario = {}, usdValues = {}) => {
  const route = withdrawalCatalog.routes.find((item) => item.id === id)!;
  return estimateWithdrawal({
    route,
    country: route.countries[0],
    grossUsd: 1000,
    steps: getRouteSteps(route),
    scenario,
    usdValues,
    asOfDate: "2026-11-06",
  });
};

describe("withdrawal fees", () => {
  it.each<[number, FeeRule, number]>([
    [1000, { percent: 1 }, 10],
    [1000, { fixed: 5 }, 5],
    [1000, { percent: 1.5, fixed: 3 }, 18],
    [1000, { percent: 1, min: 12 }, 12],
    [5000, { percent: 2, max: 15 }, 15],
    [1000, { percent: 1, fixed: 3, min: 12, max: 20 }, 13],
    [0, { percent: 0, fixed: 0 }, 0],
  ])("charges %s with %o", (amount, rule, fee) =>
    expect(calculateFee(amount, rule)).toBe(fee),
  );
  it.each([
    {},
    { percent: -1 },
    { percent: 101 },
    { fixed: Infinity },
    { min: 20, max: 10, fixed: 2 },
    { fixed: NaN },
  ])("rejects invalid rules %o", (rule) =>
    expect(isValidFee(rule)).toBe(false),
  );
  it("uses per-stage, not additive, percentages and rounds each charge", () => {
    const result = estimate(route.id, {
      fees: { "payoneer-reception": { fixed: 0 } },
    });
    expect(result.complete).toBe(true);
    expect(result.steps.map((item) => item.fee)).toEqual([12, 0, 32.6]);
    expect(result.netUsd).toBe(955.4);
    expect(result.totalDiscountUsd).toBe(44.6);
    expect(result.totalFeeUsd).toBe(44.6);
  });
  it("does not treat missing account costs as zero", () => {
    const result = estimate(route.id);
    expect(result.complete).toBe(false);
    expect(result.finalAmount).toBeNull();
    expect(result.netUsd).toBeNull();
    expect(result.totalDiscountUsd).toBeNull();
    expect(result.knownFeesUsd).toBe(12);
    expect(result.issues.some((item) => item.includes("costo pendiente"))).toBe(
      true,
    );
  });
  it("overrides a published fee without charging it twice", () => {
    const result = estimate("payoneer-santander-ar", {
      fees: { "payoneer-santander": { percent: 2, fixed: 5 } },
    });
    expect(result.netUsd).toBe(975);
    expect(result.totalFeeUsd).toBe(25);
  });
  it("never resolves a conflicting tariff without user input", () => {
    expect(estimate("deel-astropay-usd").complete).toBe(false);
    expect(
      estimate("deel-astropay-usd", {
        fees: { "deel-astropay": { percent: 0.75 } },
      }).netUsd,
    ).toBe(992.5);
  });
});

describe("withdrawal conversions", () => {
  it("keeps destination amount and USD valuation distinct, including FX spread", () => {
    const result = estimate(
      "payoneer-bitso-ar",
      { rates: { "usd-ars": 1400 } },
      { ARS: 1 / 1500 },
    );
    expect(result.finalAmount).toBe(1359400);
    expect(result.netUsd).toBe(906.27);
    expect(result.totalFeeUsd).toBe(29);
    expect(result.fxDifferenceUsd).toBe(64.73);
    expect(result.totalDiscountUsd).toBe(93.73);
  });
  it("requires the route's own quote, not a market reference alone", () => {
    expect(
      estimate("payoneer-bitso-ar", {}, { ARS: 1 / 1500 }).netUsd,
    ).toBeNull();
    expect(
      estimate("payoneer-bitso-ar", { rates: { "usd-ars": 1400 } }).netUsd,
    ).toBeNull();
  });
  it("does not confuse ARQ USDc, USD cash, or USDC", () => {
    const result = estimate("deel-arq-instant-ar", {
      rates: { "usd-usdc-arq": 1 },
      usdValues: { USDc: 1 },
    });
    expect(result.route.currency).toBe("USDc");
    expect(result.finalAmount).toBe(989.5);
    expect(result.totalFeeUsd).toBe(10.5);
    expect(
      estimate("deel-arq-instant-ar", { rates: { "usd-usdc-arq": 1 } })
        .complete,
    ).toBe(false);
  });
  it("supports fees in the intermediate currency", () => {
    const result = estimate("deel-arq-standard-ar", {
      rates: { "usd-usdc-arq": 0.99 },
      usdValues: { USDc: 1 },
    });
    expect(result.finalAmount).toBe(982.05);
    expect(result.totalFeeUsd).toBe(8);
    expect(result.fxDifferenceUsd).toBe(9.95);
  });
  it("cannot replace the USD base valuation", () => {
    const result = estimate(
      "payoneer-santander-ar",
      { usdValues: { USD: 50 } },
      { USD: 30 },
    );
    expect(result.netUsd).toBe(967);
  });
  it("supports multiple conversions in sequence", () => {
    const steps: WithdrawalStep[] = [
      {
        id: "a",
        label: "USD a EUR",
        inputCurrency: "USD",
        outputCurrency: "EUR",
        fee: { percent: 1 },
        feeStatus: "official",
        sourceIds: [],
        conditions: "",
      },
      {
        id: "b",
        label: "EUR a ARS",
        inputCurrency: "EUR",
        outputCurrency: "ARS",
        fee: { fixed: 5 },
        feeStatus: "official",
        sourceIds: [],
        conditions: "",
      },
    ];
    const testRoute: WithdrawalRoute = {
      ...route,
      id: "test",
      steps: ["a", "b"],
      currency: "ARS",
    };
    const result = estimateWithdrawal({
      route: testRoute,
      country: "ar",
      grossUsd: 1000,
      steps,
      scenario: { rates: { a: 0.9, b: 1600 } },
      usdValues: { EUR: 1.1, ARS: 1 / 1500 },
      asOfDate: "2026-11-06",
    });
    expect(result.finalAmount).toBe(1417600);
    expect(result.totalFeeUsd).toBe(15.5);
  });
});

describe("withdrawal safeguards", () => {
  it("blocks below-minimum and unsupported-country requests", () => {
    const input = {
      route,
      grossUsd: 49,
      country: "ar" as const,
      steps: getRouteSteps(route),
      asOfDate: "2026-11-06",
    };
    expect(estimateWithdrawal(input).complete).toBe(false);
    expect(
      estimateWithdrawal({ ...input, grossUsd: 1000, country: "cl" }).complete,
    ).toBe(false);
  });
  it("blocks a charge larger than the balance rather than clamping it to zero", () => {
    const result = estimate("payoneer-santander-ar", {
      fees: { "payoneer-santander": { fixed: 1001 } },
    });
    expect(result.finalAmount).toBeNull();
    expect(result.issues.join()).toContain("saldo no alcanza");
  });
  it("enforces the documented Bre-B ceiling and receiving charge", () => {
    const scenario = {
      rates: { "usd-cop": 20000 },
      fees: { "breb-reception": { fixed: 0 } },
    };
    expect(estimate("deel-breb-co", scenario, { COP: 1 / 4000 }).complete).toBe(
      false,
    );
    expect(
      estimate(
        "deel-breb-co",
        { rates: { "usd-cop": 4000 } },
        { COP: 1 / 4000 },
      ).complete,
    ).toBe(false);
  });
  it("stops using older catalog fees until the user confirms current costs", () => {
    const currentRoute = withdrawalCatalog.routes.find(
      (item) => item.id === "payoneer-santander-ar",
    )!;
    const base = {
      route: currentRoute,
      grossUsd: 1000,
      country: "ar" as const,
      steps: getRouteSteps(currentRoute),
      asOfDate: "2027-03-01",
    };
    expect(estimateWithdrawal(base).complete).toBe(false);
    expect(
      estimateWithdrawal({
        ...base,
        scenario: { fees: { "payoneer-santander": { percent: 3.3 } } },
      }).netUsd,
    ).toBe(967);
  });
  it("does not rank missing costs or different payout currencies", () => {
    const pending = estimate(route.id);
    const complete = estimate("payoneer-santander-ar");
    const ars = estimate(
      "payoneer-bitso-ar",
      { rates: { "usd-ars": 1400 } },
      { ARS: 1 / 1500 },
    );
    expect(
      rankWithdrawals([pending, complete, ars], "USD").map(
        (item) => item.route.id,
      ),
    ).toEqual(["payoneer-santander-ar"]);
  });
  it("includes only explicitly catalogued country/provider combinations", () => {
    expect(getWithdrawalRoutes("cl", "deel")).toEqual([]);
    expect(getWithdrawalRoutes("ar", "papaya")).toEqual([]);
    expect(getWithdrawalRoutes("other", "payoneer")).toEqual([]);
    expect(
      getWithdrawalRoutes("br", "deel").map((item) => item.destination),
    ).toContain("pix");
  });
  it("catalog steps and sources are internally consistent", () => {
    expect(new Set(withdrawalCatalog.routes.map((item) => item.id)).size).toBe(
      withdrawalCatalog.routes.length,
    );
    for (const route of withdrawalCatalog.routes) {
      let currency = "USD";
      for (const step of getRouteSteps(route)) {
        expect(step.inputCurrency).toBe(currency);
        currency = step.outputCurrency;
        for (const id of step.sourceIds)
          expect(
            withdrawalCatalog.sources.some(
              (item) => item.id === id && item.url.startsWith("https://"),
            ),
          ).toBe(true);
        if (step.feeStatus === "official")
          expect(isValidFee(step.fee)).toBe(true);
      }
      expect(currency).toBe(route.currency);
    }
  });
  it("restores per-country scenarios and ignores invalid or stale route IDs", () => {
    const key = scenarioKey("ar", route.id);
    const saved = restoreWithdrawalPreferences(
      JSON.stringify({
        provider: "payoneer",
        selections: { "ar:deel": route.id, "cl:deel": route.id },
        scenarios: {
          [key]: {
            fees: {
              "deel-payoneer": { fixed: -5 },
              "payoneer-reception": { fixed: 0 },
            },
            rates: { x: 1 },
            usdValues: { USD: 20, EUR: 1.1 },
          },
        },
      }),
    );
    expect(saved.provider).toBe("payoneer");
    expect(saved.selections["ar:deel"]).toBe(route.id);
    expect(saved.selections["cl:deel"]).toBeUndefined();
    expect(saved.scenarios[key].fees["deel-payoneer"]).toBeUndefined();
    expect(saved.scenarios[key].fees["payoneer-reception"]).toEqual({
      fixed: 0,
    });
    expect(saved.scenarios[key].usdValues.USD).toBeUndefined();
    expect(restoreWithdrawalPreferences("broken").provider).toBe("deel");
  });
  it("persists an explicitly unconfirmed override instead of silently restoring the official fee", () => {
    const id = "payoneer-santander-ar";
    const key = scenarioKey("ar", id);
    const saved = restoreWithdrawalPreferences(
      JSON.stringify({
        scenarios: { [key]: { fees: { "payoneer-santander": null } } },
      }),
    );
    expect(saved.scenarios[key].fees["payoneer-santander"]).toBeNull();
    expect(estimate(id, saved.scenarios[key]).complete).toBe(false);
  });
});
