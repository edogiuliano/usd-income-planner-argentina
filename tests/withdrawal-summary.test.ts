import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WithdrawalEstimate } from "../src/components/WithdrawalEstimate";
import { SummaryCards } from "../src/components/SummaryCards";
import { WithdrawalDetails } from "../src/components/WithdrawalDetails";
import { calculateIncome } from "../src/lib/calculator";
import * as catalog from "../src/lib/withdrawals/catalog";
import { convertUsd } from "../src/lib/conversion";
import {
  estimateReceipt,
  getReceiptTotal,
  getAppliedWithdrawalFeesUsd,
  recommendWithdrawal,
} from "../src/lib/withdrawals/presentation";
import {
  emptyWithdrawalPreferences,
  restoreWithdrawalPreferences,
  scenarioKey,
  selectedWithdrawalRoute,
} from "../src/lib/withdrawals/preferences";
import type { ExchangeOperation, ExchangeRate } from "../src/types";
import type { WithdrawalScenario } from "../src/types/withdrawals";
import { fixtureRoute, fixtureSteps } from "./fixtures/withdrawal-routes";

const rate: ExchangeRate = {
  casa: "cripto",
  name: "Cripto",
  buy: 1500,
  sell: 1600,
  currencyCode: "ARS",
  locale: "es-AR",
  updatedAt: "2026-11-06",
};
const getRoute = (id: string) =>
  catalog.withdrawalCatalog.routes.find((item) => item.id === id)!;
const estimate = (
  id: string,
  scenario: Partial<WithdrawalScenario> = {},
  grossUsd = 977.04,
  primaryRate: ExchangeRate | null = rate,
  operation: ExchangeOperation = "sell-usd",
) => {
  const fixture = fixtureRoute(id);
  const route = fixture ?? getRoute(id);
  if (fixture)
    vi.spyOn(catalog, "getRouteSteps").mockReturnValueOnce(
      fixtureSteps(fixture),
    );
  return estimateReceipt({
    grossUsd,
    route,
    scenario,
    primaryRate,
    operation,
    country: route.countries[0],
    asOfDate: "2026-11-06",
  });
};
const confirmedReception = { "payoneer-reception": { fixed: 0 } };
const estimateBitso = (
  scenario: Partial<WithdrawalScenario> = {},
  grossUsd = 1000,
  primaryRate: ExchangeRate | null = rate,
  operation: ExchangeOperation = "sell-usd",
) =>
  estimate(
    "deel-payoneer-bitso-ar",
    {
      ...scenario,
      fees: { ...confirmedReception, ...scenario.fees },
    },
    grossUsd,
    primaryRate,
    operation,
  );
afterEach(() => vi.restoreAllMocks());

describe("read-only withdrawal detail and recommendations", () => {
  it("shows the VTO and platform deductions without subtracting them again", () => {
    const incomeResult = calculateIncome({
      paymentType: "hour",
      rate: 25,
      hoursPerDay: 8,
      workedDays: 4,
      scheduledWorkDays: 5,
      unpaidLeaveDays: 1,
    });
    const receipt = estimate(
      "deel-arq-instant-ar",
      {},
      incomeResult.totalIncomeUsd,
    );
    expect(incomeResult.baseIncomeUsd).toBe(1000);
    expect(incomeResult.unpaidLeaveDeductionUsd).toBe(200);
    expect(incomeResult.totalIncomeUsd).toBe(800);
    expect(getAppliedWithdrawalFeesUsd(receipt.result)).toBe(9);
    expect(getReceiptTotal(incomeResult.totalIncomeUsd, receipt).amount).toBe(
      791,
    );
    const html = renderToStaticMarkup(
      createElement(SummaryCards, {
        cycleDays: {
          totalDays: 7,
          workedDays: 4,
          freeDays: 2,
          payableDays: 4,
          scheduledWorkDays: 5,
          vtoDays: 1,
          ptoDays: 0,
        },
        incomeResult,
        paymentType: "hour",
        receipt,
        ready: true,
        unavailable: false,
        primaryRate: rate,
        operation: "sell-usd",
        isLoadingRates: false,
        ratesError: null,
      }),
    );
    expect(html).toContain("Descuento VTO incluido");
    expect(html).toContain("Comisiones de retiro incluidas");
    expect(html).toMatch(/−US\$\s200/);
    expect(html).toMatch(/−US\$\s9/);
    expect(html).toMatch(/US\$\s791/);
  });
  it("shows only the charges already applied to an incomplete subtotal", () => {
    const receipt = estimate("deel-payoneer-santander-ar", {}, 1000);
    expect(getAppliedWithdrawalFeesUsd(receipt.result)).toBe(12);
    expect(getReceiptTotal(1000, receipt).amount).toBe(988);
    expect(
      getAppliedWithdrawalFeesUsd(estimate("deel-astropay-usd").result),
    ).toBe(0);
  });
  it("renders only a compact ledger and official sources, without editing controls", () => {
    const html = renderToStaticMarkup(
      createElement(WithdrawalDetails, {
        receipt: estimate("deel-arq-instant-ar"),
        grossUsd: 977.04,
      }),
    );
    for (const label of [
      "Ver detalle",
      "Sueldo bruto",
      "Deel → ARQ",
      "0,75%",
      "7,33",
      "Total descontado",
      "10,33",
      "Neto estimado",
      "966,71",
      "Fuentes:",
    ])
      expect(html).toContain(label);
    expect(html).not.toMatch(
      /<input|<select|<button|Modificar comisión|Comparar formas/,
    );
    expect(html).not.toContain("equivalencia nominal");
  });
  it("compares like-for-like Deel routes after all fixed and percentage charges", () => {
    const current = estimate("deel-arq-instant-ar", {}, 1000);
    current.result.route = {
      ...current.result.route,
      comparisonGroup: "arq-usds",
    };
    const standard = estimate("deel-arq-standard-ar", {}, 1000);
    standard.result.route = { ...standard.result.route, group: "usd" };
    expect(recommendWithdrawal(current, [standard], rate, "sell-usd")).toEqual({
      kind: "saving",
      route: standard.result.route,
      savingsUsd: 2.5,
    });
    expect(recommendWithdrawal(standard, [current], rate, "sell-usd")).toEqual({
      kind: "best",
    });
  });
  it("uses one valuation basis for final balances in different currencies", () => {
    const current = estimate(
      "deel-payoneer-santander-ar",
      { fees: confirmedReception },
      1000,
    );
    const bank = estimate(
      "deel-local-bank-ar",
      {
        fees: { "bank-provider": { fixed: 0 } },
        rates: { "bank-local-ars": 1500 },
        usdValues: { ARS: 1 / 2000 },
      },
      1000,
    );
    expect(bank.result.netUsd).toBe(750);
    expect(recommendWithdrawal(current, [bank], rate, "sell-usd")).toEqual({
      kind: "saving",
      route: bank.result.route,
      savingsUsd: 44.6,
    });
    expect(recommendWithdrawal(current, [bank], rate, "buy-usd")).toEqual({
      kind: "best",
    });
    expect(recommendWithdrawal(current, [bank], null, "sell-usd")).toBeNull();
  });
  it("stays silent for unknown costs, reference-only FX, stale routes, or a lone comparable option", () => {
    const current = estimate("deel-arq-instant-ar", {}, 1000);
    const pending = estimate("deel-astropay-usd", {}, 1000);
    const approximate = estimate("deel-direct-usdc", {}, 1000);
    const standard = estimate("deel-arq-standard-ar", {}, 1000);
    expect(
      recommendWithdrawal(
        current,
        [
          current,
          pending,
          approximate,
          { ...standard, result: { ...standard.result, stale: true } },
        ],
        rate,
        "sell-usd",
      ),
    ).toBeNull();
    expect(
      recommendWithdrawal(pending, [current, standard], rate, "sell-usd"),
    ).toBeNull();
    expect(
      recommendWithdrawal(approximate, [current, standard], rate, "sell-usd"),
    ).toBeNull();
  });
});

describe("unified receipt summary", () => {
  it("converts the net, not gross, and retains all mandatory ARQ charges", () => {
    const receipt = estimate("deel-arq-instant-ar");
    expect(receipt.result.steps.map((step) => step.fee)).toEqual([7.33, 0, 3]);
    expect(getReceiptTotal(977.04, receipt)).toEqual({
      amount: 966.71,
      currency: "USD",
      partial: false,
    });
    expect(convertUsd(receipt.result.netUsd!, rate)).toBe(1450065);
    expect(receipt.result.totalFeeUsd).toBe(10.33);
    expect(receipt.nominalCurrencies).toEqual(["USDs"]);
  });
  it("matches the requested 0.75% example when the other charge is explicitly waived", () => {
    const receipt = estimate("deel-arq-instant-ar", {
      fees: { "arq-usds-fee": { fixed: 0 } },
    });
    expect(receipt.result.netUsd).toBe(969.71);
    expect(receipt.result.totalFeeUsd).toBe(7.33);
    expect(convertUsd(receipt.result.netUsd!, rate)).toBe(1454565);
  });
  it("uses the configured sell/buy operation and reference-only rates", () => {
    const sell = estimateBitso();
    const buy = estimateBitso({}, 1000, rate, "buy-usd");
    expect(sell.result.netUsd).toBe(959.35);
    expect(sell.result.finalAmount).toBe(1439025);
    expect(buy.result.finalAmount).toBe(1534960);
    const reference = estimateBitso({}, 1000, {
      ...rate,
      buy: 1200,
      sell: 1200,
      isReference: true,
    });
    expect(reference.result.finalAmount).toBe(1151220);
  });
  it("updates with the preferred rate without persisting a fictitious provider quote", () => {
    const scenario = { fees: {}, rates: {}, usdValues: {} };
    const first = estimateBitso(scenario);
    const next = estimateBitso(scenario, 1000, {
      ...rate,
      buy: 2000,
    });
    expect(first.referenceRates["usd-ars"]).toBe(1500);
    expect(next.referenceRates["usd-ars"]).toBe(2000);
    expect(next.result.netUsd).toBe(959.35);
    expect(scenario).toEqual({ fees: {}, rates: {}, usdValues: {} });
    expect(next.result.issues).toEqual([]);
  });
  it("keeps a manually entered provider quote and prevents double commission deductions", () => {
    const receipt = estimateBitso({ rates: { "usd-ars": 1400 } });
    expect(receipt.result.finalAmount).toBe(1343090);
    expect(receipt.result.netUsd).toBe(895.39);
    expect(receipt.result.totalFeeUsd).toBe(40.65);
    expect(receipt.referenceRates).toEqual({});
  });
  it("shows a known USD subtotal and converted subtotal without skipping an unknown intermediary", () => {
    const receipt = estimate("deel-payoneer-santander-ar", {}, 1000);
    const total = getReceiptTotal(1000, receipt);
    expect(total).toEqual({ amount: 988, currency: "USD", partial: true });
    expect(convertUsd(total.amount!, rate)).toBe(1482000);
    expect(receipt.result.netUsd).toBeNull();
  });
  it("does not turn an unconfirmed first commission or invalid charge into a complete net", () => {
    const pending = estimate("deel-astropay-usd");
    expect(getReceiptTotal(977.04, pending)).toEqual({
      amount: 977.04,
      currency: "USD",
      partial: true,
    });
    expect(
      estimate("deel-instant-card-mx-usd", {
        fees: { "deel-instant-card": null },
      }).result.complete,
    ).toBe(false);
    expect(
      estimate("deel-instant-card-mx-usd", {
        fees: { "deel-instant-card": { fixed: 1000 } },
      }).result.complete,
    ).toBe(false);
  });
  it("does not invent local FX without a reference and preserves a valid USD net", () => {
    const receipt = estimateBitso({}, 1000, null);
    expect(getReceiptTotal(1000, receipt)).toEqual({
      amount: 959.35,
      currency: "USD",
      partial: true,
    });
    expect(receipt.result.finalAmount).toBeNull();
    expect(
      estimate("deel-instant-card-mx-usd", {}, 1000, null).result.netUsd,
    ).toBe(985);
    expect(estimateBitso({}, 1000, { ...rate, buy: 0 }).result.complete).toBe(
      false,
    );
  });
  it("supports other local currencies without changing countries or tariff coverage", () => {
    const brl = {
      ...rate,
      name: "Dólar",
      buy: 5,
      sell: 6,
      currencyCode: "BRL",
      locale: "pt-BR",
      isReference: true,
    };
    const receipt = estimate("deel-pix-br", {}, 1000, brl);
    expect(receipt.result.finalAmount).toBe(5000);
    expect(receipt.referenceRates["listed-pix"]).toBe(5);
    expect(receipt.result.netUsd).toBe(1000);
  });
  it("supports nominal USDC estimates without renaming existing catalog assets or guaranteeing parity", () => {
    const base = getRoute("deel-arq-instant-ar");
    const steps = catalog
      .getRouteSteps(base)
      .slice(0, 2)
      .map((step, index) =>
        index === 1 ? { ...step, outputCurrency: "USDC" } : step,
      );
    vi.spyOn(catalog, "getRouteSteps").mockReturnValue(steps);
    const receipt = estimateReceipt({
      grossUsd: 977.04,
      route: { ...base, steps: steps.map((step) => step.id), currency: "USDC" },
      country: "ar",
      primaryRate: rate,
      operation: "sell-usd",
      asOfDate: "2026-11-06",
    });
    expect(receipt.result.netUsd).toBe(969.71);
    expect(receipt.nominalCurrencies).toEqual(["USDC"]);
    const html = renderToStaticMarkup(
      createElement(WithdrawalEstimate, {
        grossUsd: 977.04,
        receipt,
        primaryRate: rate,
        operation: "sell-usd",
      }),
    );
    expect(html).toContain("USDC");
    expect(html).toContain("equivalencia nominal 1:1 con USD, no garantizada");
    expect(base.currency).toBe("USDs");
  });
  it("updates route and gross independently while keeping the original input unchanged", () => {
    const input = { salary: 1000 };
    expect(
      estimate("deel-instant-card-mx-usd", {}, input.salary).result.netUsd,
    ).toBe(985);
    expect(estimate("deel-payoneer-ar", {}, input.salary).result.netUsd).toBe(
      990,
    );
    expect(estimate("deel-instant-card-mx-usd", {}, 2000).result.netUsd).toBe(
      1985,
    );
    expect(input.salary).toBe(1000);
  });
  it("restores selected routes, explicit no-retirement, and legacy default-route edits", () => {
    const id = "deel-payoneer-ar";
    const routes = catalog.getWithdrawalRoutes("ar");
    const key = scenarioKey("ar", id);
    const legacy = restoreWithdrawalPreferences(
      JSON.stringify({
        scenarios: { [key]: { fees: { "listed-payoneer": { percent: 1 } } } },
      }),
    );
    expect(selectedWithdrawalRoute(routes, legacy, "ar")?.id).toBe(id);
    const none = restoreWithdrawalPreferences(
      JSON.stringify({ ...legacy, selections: { "ar:deel": "" } }),
    );
    expect(selectedWithdrawalRoute(routes, none, "ar")).toBeNull();
    const selected = restoreWithdrawalPreferences(
      JSON.stringify({ ...legacy, selections: { "ar:deel": id } }),
    );
    expect(selectedWithdrawalRoute(routes, selected, "ar")?.id).toBe(id);
    expect(
      selectedWithdrawalRoute(routes, emptyWithdrawalPreferences(), "ar"),
    ).toBeNull();
  });
  it("renders a single net/local total, and keeps labor statistics unchanged", () => {
    const receipt = estimate("deel-arq-instant-ar");
    const html = renderToStaticMarkup(
      createElement(SummaryCards, {
        receipt,
        ready: true,
        unavailable: false,
        primaryRate: rate,
        operation: "sell-usd",
        isLoadingRates: false,
        ratesError: null,
        paymentType: "hour",
        cycleDays: {
          totalDays: 30,
          workedDays: 21,
          freeDays: 9,
          payableDays: 21,
          scheduledWorkDays: 21,
          vtoDays: 0,
          ptoDays: 0,
        },
        incomeResult: {
          baseIncomeUsd: 977.04,
          totalIncomeUsd: 977.04,
          totalHours: 168,
          averageDailyIncomeUsd: 46.53,
          averageHourlyIncomeUsd: 5.81,
          unpaidLeaveDeductionUsd: 0,
          paidDays: 21,
          paidLeaveDays: 0,
          unpaidLeaveDays: 0,
        },
      }),
    );
    expect(html.match(/data-income="total-usd"/g)).toHaveLength(1);
    expect(html.match(/data-income="converted"/g)).toHaveLength(1);
    expect(html).toContain("≈");
    for (const label of [
      "Días trabajados",
      "Francos",
      "Horas trabajadas",
      "Días del ciclo",
      "VTO sin pago",
      "Promedio diario USD",
    ])
      expect(html).toContain(label);
    expect(html).not.toContain("Saldo parcial calculado");
    expect(html).not.toContain("Ingreso total USD");
    expect(html).not.toContain("977,04");
  });
  it("does not flash a gross or stale net before stored preferences finish loading", () => {
    const html = renderToStaticMarkup(
      createElement(WithdrawalEstimate, {
        grossUsd: 977.04,
        receipt: null,
        primaryRate: rate,
        operation: "sell-usd",
        ready: false,
      }),
    );
    expect(html).not.toContain("977,04");
    expect(html).not.toContain('data-withdrawal="final"');
    expect(html).toContain("Recuperando tu retiro");
  });
});
