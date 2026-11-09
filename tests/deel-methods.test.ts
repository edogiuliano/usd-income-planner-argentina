import { describe, expect, it } from "vitest";
import {
  getRouteSteps,
  getWithdrawalRoutes,
  withdrawalCatalog,
} from "../src/lib/withdrawals/catalog";
import {
  estimateReceipt,
  getReceiptDiscountLabel,
  getReceiptOutcomes,
  recommendWithdrawal,
  withdrawalTariffLabel,
} from "../src/lib/withdrawals/presentation";
import { restoreWithdrawalPreferences } from "../src/lib/withdrawals/preferences";
import type { CountryCode, ExchangeRate } from "../src/types";

function estimate(
  country: CountryCode,
  id: string,
  primaryRate: ExchangeRate | null = null,
  grossUsd = 1000,
) {
  const route = getWithdrawalRoutes(country).find((item) => item.id === id)!;
  return estimateReceipt({
    route,
    country,
    grossUsd,
    primaryRate,
    operation: "sell-usd",
    asOfDate: "2026-11-09",
  });
}

const pesos: ExchangeRate = {
  casa: "referencia",
  name: "Referencia",
  currencyCode: "MXN",
  locale: "es-MX",
  buy: 20,
  sell: 22,
  updatedAt: "2026-11-09",
};
const baseUsd = [
  "Revolut · US$0",
  "Wise Wallet · US$0",
  "ARQ · 0,75%",
  "Payoneer · 1%",
  "PayPal · 2,5%",
];
const localBank = "Banco local · US$5";
const astro = "AstroPay · 0,75%";
const swiftRange = "SWIFT · US$5–50";

describe("Deel's country listing", () => {
  it.each<[CountryCode, string[], string[]]>([
    ["ar", [], [astro, "SWIFT · US$25 o US$45"]],
    ["cl", [localBank], ["SWIFT · US$25 o US$35"]],
    ["uy", [astro, localBank], [localBank, "SWIFT · US$25 o US$31"]],
    ["mx", [astro, localBank, swiftRange], ["SWIFT · A confirmar"]],
    ["bo", [localBank, swiftRange], ["SWIFT · ≈ US$64,90"]],
    ["br", [astro, localBank, "Pix · US$0"], [swiftRange]],
    ["co", [astro, localBank, "Bre-B · US$0"], [swiftRange]],
    ["ve", [swiftRange], [swiftRange]],
  ])(
    "exposes only the listed local and USD options for %s",
    (country, local, usd) => {
      const routes = getWithdrawalRoutes(country);
      expect(routes.every((route) => route.path[0] === "deel")).toBe(true);
      const labels = (group: "local" | "usd") =>
        routes
          .filter((route) => route.group === group)
          .map((route) => `${route.name} · ${withdrawalTariffLabel(route)}`)
          .sort();
      expect(labels("local")).toEqual([...local].sort());
      expect(labels("usd")).toEqual([...baseUsd, ...usd].sort());
    },
  );

  it("keeps the catalog unambiguous and the generic USD profile free of country routes", () => {
    expect(getWithdrawalRoutes("other")).toEqual([]);
    for (const list of [
      withdrawalCatalog.routes,
      withdrawalCatalog.steps,
      withdrawalCatalog.sources,
    ])
      expect(new Set(list.map(({ id }) => id)).size).toBe(list.length);
    for (const route of withdrawalCatalog.routes) {
      const steps = getRouteSteps(route);
      expect(steps.filter((step) => step.variableFee)).toHaveLength(
        steps[0].variableFee ? 1 : 0,
      );
      expect(steps[0].inputCurrency).toBe("USD");
      expect(steps.at(-1)?.outputCurrency).toBe(route.currency);
    }
  });

  it.each<[string, number, number]>([
    ["deel-payoneer-ar", 10, 990],
    ["deel-paypal-usd", 25, 975],
    ["deel-astropay-usd", 7.5, 992.5],
    ["deel-wise-usd", 0, 1000],
    ["deel-revolut-usd", 0, 1000],
  ])("deducts only the listed Deel tariff for %s", (id, fee, net) => {
    const receipt = estimate("ar", id);
    expect(receipt.result.netUsd).toBe(net);
    expect(receipt.result.totalFeeUsd).toBe(fee);
    expect(receipt.result.route.receiverCostsUnverified).toBe(true);
    expect(receipt.result.issues).toEqual([]);
  });

  it("does not use the former Payoneer or PayPal minimums", () => {
    expect(estimate("ar", "deel-payoneer-ar", null, 10).result.netUsd).toBe(
      9.9,
    );
    expect(estimate("ar", "deel-paypal-usd", null, 4).result.netUsd).toBe(3.9);
  });

  it("subtracts the fixed local charge before the preferred exchange rate", () => {
    const bank = estimate("mx", "deel-local-bank-mx", pesos);
    expect(bank.result.netUsd).toBe(995);
    expect(bank.result.finalAmount).toBe(19900);
    const astroPay = estimate("mx", "deel-astropay-mx", pesos);
    expect(astroPay.result.finalAmount).toBe(19850);
  });

  it.each<[CountryCode, number]>([
    ["ar", 45],
    ["cl", 35],
    ["uy", 31],
  ])(
    "calculates separate USD SWIFT possibilities for %s",
    (country, second) => {
      const receipt = estimate(country, `deel-swift-usd-${country}`);
      expect(receipt.result.netUsd).toBeNull();
      expect(receipt.feeCases?.kind).toBe("alternatives");
      expect(
        getReceiptOutcomes(1000, receipt).map(({ amount }) => amount),
      ).toEqual([975, 1000 - second]);
      expect(
        receipt.feeCases?.cases.map(({ result }) => result.totalFeeUsd),
      ).toEqual([25, second]);
      expect(getReceiptDiscountLabel(receipt)).toMatch(/25 o .+/);
    },
  );

  it("keeps both ends of SWIFT ranges and converts each local balance separately", () => {
    const usd = estimate("br", "deel-swift-usd-range");
    expect(getReceiptOutcomes(1000, usd).map(({ amount }) => amount)).toEqual([
      995, 950,
    ]);
    const local = estimate("mx", "deel-swift-local-mx", pesos);
    expect(
      local.feeCases?.cases.map(({ result }) => result.finalAmount),
    ).toEqual([19900, 19000]);
    expect(getReceiptDiscountLabel(local)).toMatch(/5.+–.+50/);
  });

  it("does not present a gross or negative amount for an unaffordable scenario", () => {
    const receipt = estimate("mx", "deel-swift-local-mx", pesos, 20);
    expect(getReceiptOutcomes(20, receipt).map(({ amount }) => amount)).toEqual(
      [15, null],
    );
  });

  it("distinguishes the Bolivian USD average from the missing Mexican USD tariff", () => {
    const average = estimate("bo", "deel-swift-usd-bo");
    expect(average.feeCases?.kind).toBe("average");
    expect(average.result.netUsd).toBe(935.1);
    expect(average.result.totalFeeUsd).toBe(64.9);
    const unknown = estimate("mx", "deel-swift-usd-mx");
    expect(unknown.result.netUsd).toBeNull();
    expect(unknown.feeCases).toBeUndefined();
    expect(getReceiptDiscountLabel(unknown)).toBeNull();
  });

  it("does not recommend based on estimated ranges or unverified receiver costs", () => {
    const swift = estimate("uy", "deel-swift-usd-uy");
    const bank = estimate("uy", "deel-local-bank-uy-usd");
    expect(recommendWithdrawal(swift, [bank], null, "sell-usd")).toBeNull();
    expect(recommendWithdrawal(bank, [swift], null, "sell-usd")).toBeNull();
    expect(
      recommendWithdrawal(
        estimate("ar", "deel-paypal-usd"),
        [estimate("ar", "deel-wise-usd")],
        null,
        "sell-usd",
      ),
    ).toBeNull();
  });

  it("restores stable route choices, migrates SWIFT and Revolut, and drops previous fees", () => {
    const preferences = restoreWithdrawalPreferences(
      JSON.stringify({
        selections: {
          "ar:deel": "deel-astropay-usd",
          cl: "deel-swift-usd",
          br: "deel-revolut-br",
          co: "",
          ve: "deel-card-usd",
        },
        scenarios: {
          "ar:deel-astropay-usd": { fees: { "deel-astropay": null } },
        },
      }),
    );
    expect(preferences).toEqual({
      selections: {
        ar: "deel-astropay-usd",
        cl: "deel-swift-usd-cl",
        br: "deel-revolut-usd",
        co: "",
        ve: "",
      },
      scenarios: {},
    });
    expect(restoreWithdrawalPreferences(JSON.stringify(preferences))).toEqual(
      preferences,
    );
  });
});
