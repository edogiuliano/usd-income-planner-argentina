import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { WithdrawalEstimate } from "../src/components/WithdrawalEstimate";
import {
  getRouteSteps,
  withdrawalCatalog,
} from "../src/lib/withdrawals/catalog";
import { estimateWithdrawal } from "../src/lib/withdrawals/engine";
import {
  getWithdrawalPreview,
  withdrawalMoney,
} from "../src/lib/withdrawals/presentation";
import type { WithdrawalScenario } from "../src/types/withdrawals";
import { fixtureRoute, fixtureSteps } from "./fixtures/withdrawal-routes";

const reception = { "payoneer-reception": { fixed: 0 } };

function estimate(
  id: string,
  scenario: Partial<WithdrawalScenario> = {},
  grossUsd = 977.04,
  usdValues = {},
) {
  const fixture = fixtureRoute(id);
  const route =
    fixture ?? withdrawalCatalog.routes.find((item) => item.id === id)!;
  return estimateWithdrawal({
    route,
    scenario,
    grossUsd,
    usdValues,
    country: route.countries[0],
    steps: fixture ? fixtureSteps(fixture) : getRouteSteps(route),
    asOfDate: "2026-11-06",
  });
}

describe("compact withdrawal presentation", () => {
  it("shows the 0.75% example before other charges, never as the final receipt", () => {
    const result = estimate("deel-arq-instant-ar", {
      fees: { "listed-arq": { percent: 0.75 } },
    });
    expect(result.netUsd).toBeNull();
    expect(getWithdrawalPreview(result)).toEqual({
      amount: 969.71,
      currency: "USD",
      fees: { USD: 7.33 },
      destinationKnown: false,
    });
    const html = renderToStaticMarkup(
      createElement(WithdrawalEstimate, {
        receipt: {
          result,
          usdValues: { USD: 1 },
          referenceRates: {},
          nominalCurrencies: [],
        },
        grossUsd: 977.04,
        primaryRate: null,
        operation: "sell-usd",
      }),
    );
    expect(html).toContain("969,71");
    expect(html).toContain("Estimación parcial");
    expect(html).not.toContain("Saldo parcial calculado");
    expect(html).toContain('data-withdrawal="partial"');
  });
  it("does not subtract later fees expressed in a different currency from a USD subtotal", () => {
    const result = estimate("deel-arq-instant-ar");
    expect(result.steps.at(-1)?.fee).toBe(3);
    expect(getWithdrawalPreview(result).fees).toEqual({ USD: 7.33 });
  });
  it("shows a destination balance even when its USD reference is missing", () => {
    const result = estimate("deel-arq-instant-ar", {
      rates: { "usd-usds-arq": 1 },
    });
    expect(result.complete).toBe(false);
    expect(getWithdrawalPreview(result)).toEqual({
      amount: 966.71,
      currency: "USDs",
      fees: { USD: 7.33, USDs: 3 },
      destinationKnown: true,
    });
  });
  it("shows a final known amount with no extra confirmations", () => {
    const result = estimate("deel-instant-card-mx-usd");
    const preview = getWithdrawalPreview(result);
    expect(preview.destinationKnown).toBe(true);
    expect(preview.amount).toBe(result.finalAmount);
    expect(preview.fees.USD).toBe(result.totalFeeUsd);
    const html = renderToStaticMarkup(
      createElement(WithdrawalEstimate, {
        receipt: {
          result,
          usdValues: { USD: 1 },
          referenceRates: {},
          nominalCurrencies: [],
        },
        grossUsd: 977.04,
        primaryRate: null,
        operation: "sell-usd",
      }),
    );
    expect(html).toContain("Total estimado a recibir");
    expect(html).not.toContain('role="status"');
  });
  it("keeps known USD available when a local-currency quote is missing", () => {
    expect(
      getWithdrawalPreview(
        estimate("deel-payoneer-bitso-ar", { fees: reception }, 1000),
      ),
    ).toEqual({
      amount: 959.35,
      currency: "USD",
      fees: { USD: 40.65 },
      destinationKnown: false,
    });
  });
  it("shows ARS without requiring a USD valuation, while the full estimate remains incomplete", () => {
    const result = estimate(
      "deel-payoneer-bitso-ar",
      { fees: reception, rates: { "usd-ars": 1400 } },
      1000,
    );
    expect(result.complete).toBe(false);
    expect(getWithdrawalPreview(result)).toEqual({
      amount: 1343090,
      currency: "ARS",
      fees: { USD: 40.65 },
      destinationKnown: true,
    });
  });
  it("never skips an unknown intermediary or uses gross as a fake net", () => {
    const result = estimate("deel-payoneer-santander-ar", {}, 1000);
    expect(getWithdrawalPreview(result)).toEqual({
      amount: 988,
      currency: "USD",
      fees: { USD: 12 },
      destinationKnown: false,
    });
    expect(
      getWithdrawalPreview(estimate("deel-astropay-usd")).amount,
    ).toBeNull();
  });
  it("does not bypass minimum withdrawal and insufficient-balance validations", () => {
    expect(
      getWithdrawalPreview(
        estimate(
          "deel-astropay-usd",
          { fees: { "deel-astropay": { fixed: 0 } } },
          4,
        ),
      ).amount,
    ).toBeNull();
    expect(
      getWithdrawalPreview(
        estimate("deel-instant-card-mx-usd", {
          fees: { "deel-instant-card": { fixed: 1000 } },
        }),
      ).amount,
    ).toBeNull();
  });
  it("never presents a failed payout limit as a completed destination", () => {
    const result = estimate(
      "deel-breb-co",
      { rates: { "usd-cop": 20000 }, fees: { "breb-reception": { fixed: 0 } } },
      1000,
      { COP: 1 / 4000 },
    );
    expect(getWithdrawalPreview(result).destinationKnown).toBe(false);
    expect(getWithdrawalPreview(result).currency).toBe("USD");
  });
  it("updates automatically with the input salary and distinguishes digital asset tickers", () => {
    expect(
      getWithdrawalPreview(estimate("deel-instant-card-mx-usd", {}, 2000))
        .amount,
    ).toBe(1985);
    expect(withdrawalMoney(969.71, "USDC")).toBe("969,71 USDC");
    expect(withdrawalMoney(969.71, "USDc")).toBe("969,71 USDc");
    expect(withdrawalMoney(969.71, "USDs")).toBe("969,71 USDs");
  });
});
