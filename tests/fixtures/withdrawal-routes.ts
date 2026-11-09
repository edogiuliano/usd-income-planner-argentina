import type { CountryCode } from "../../src/types";
import type {
  FeeRule,
  FeeStatus,
  WithdrawalRoute,
  WithdrawalStep,
} from "../../src/types/withdrawals";

// Fixed scenarios for generic engine regressions, independent of the active country listing.
const steps: [
  string,
  string,
  string,
  FeeRule | null,
  FeeStatus,
  Pick<WithdrawalStep, "minimumAmount" | "maximumOutput" | "requiresQuote">?,
][] = [
  [
    "deel-payoneer",
    "USD",
    "USD",
    { percent: 1, min: 12 },
    "official",
    { minimumAmount: 50 },
  ],
  ["payoneer-reception", "USD", "USD", null, "pending"],
  ["payoneer-santander", "USD", "USD", { percent: 3.3 }, "official"],
  ["payoneer-bitso", "USD", "USD", { percent: 2.9 }, "official"],
  ["usd-ars", "USD", "ARS", { fixed: 0 }, "included-in-rate"],
  ["deel-astropay", "USD", "USD", null, "conflicting", { minimumAmount: 5 }],
  ["deel-arq-standard", "USD", "USD", { fixed: 5 }, "official"],
  ["usd-usds-arq", "USD", "USDs", { fixed: 0 }, "included-in-rate"],
  ["arq-usds-reception", "USDs", "USDs", { fixed: 3 }, "official"],
  [
    "deel-breb-fee",
    "USD",
    "USD",
    { percent: 1.5, fixed: 3 },
    "official",
    { minimumAmount: 5 },
  ],
  [
    "usd-cop",
    "USD",
    "COP",
    { fixed: 0 },
    "included-in-rate",
    { maximumOutput: 11500000 },
  ],
  ["breb-reception", "COP", "COP", null, "pending"],
  [
    "deel-local-bank",
    "USD",
    "USD",
    { fixed: 0 },
    "official",
    { minimumAmount: 10 },
  ],
  ["bank-provider", "USD", "USD", null, "pending"],
  [
    "bank-local-ars",
    "USD",
    "ARS",
    { fixed: 0 },
    "included-in-rate",
    { requiresQuote: true },
  ],
  [
    "deel-direct-usdc",
    "USD",
    "USDC",
    { percent: 2, fixed: 1 },
    "official",
    { minimumAmount: 5 },
  ],
  [
    "deel-instant-card",
    "USD",
    "USD",
    { percent: 2, max: 15 },
    "official",
    { minimumAmount: 5 },
  ],
];
const routes: [
  string,
  CountryCode,
  string,
  WithdrawalRoute["delivery"],
  string[],
][] = [
  [
    "deel-payoneer-santander-ar",
    "ar",
    "USD",
    "bank",
    ["deel-payoneer", "payoneer-reception", "payoneer-santander"],
  ],
  [
    "deel-payoneer-bitso-ar",
    "ar",
    "ARS",
    "wallet",
    ["deel-payoneer", "payoneer-reception", "payoneer-bitso", "usd-ars"],
  ],
  ["deel-astropay-usd", "ar", "USD", "wallet", ["deel-astropay"]],
  [
    "deel-arq-standard-ar",
    "ar",
    "USDs",
    "crypto",
    ["deel-arq-standard", "usd-usds-arq", "arq-usds-reception"],
  ],
  [
    "deel-breb-co",
    "co",
    "COP",
    "bank",
    ["deel-breb-fee", "usd-cop", "breb-reception"],
  ],
  [
    "deel-local-bank-ar",
    "ar",
    "ARS",
    "bank",
    ["deel-local-bank", "bank-provider", "bank-local-ars"],
  ],
  ["deel-direct-usdc", "ar", "USDC", "crypto", ["deel-direct-usdc"]],
  ["deel-instant-card-mx-usd", "mx", "USD", "bank", ["deel-instant-card"]],
];

export function fixtureRoute(id: string): WithdrawalRoute | undefined {
  const entry = routes.find(([key]) => key === id);
  if (!entry) return undefined;
  const [, country, currency, delivery, steps] = entry;
  return {
    id,
    currency,
    delivery,
    steps,
    countries: [country],
    comparisonGroup: id === "deel-arq-standard-ar" ? "arq-usds" : undefined,
    name: id,
    availability: "eligible",
    destination: "test",
    path: ["deel", "test"],
    verifiedAt: "2026-11-09",
    sourceIds: [],
    conditions: "",
  };
}

export function fixtureSteps(route: WithdrawalRoute): WithdrawalStep[] {
  return route.steps.map((id) => {
    const [, inputCurrency, outputCurrency, fee, feeStatus, limits] =
      steps.find(([key]) => key === id)!;
    return {
      id,
      label: id,
      inputCurrency,
      outputCurrency,
      fee,
      feeStatus,
      sourceIds: [],
      conditions: "",
      ...limits,
    };
  });
}
