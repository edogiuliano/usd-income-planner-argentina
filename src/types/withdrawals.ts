import type { CountryCode } from "@/types";

export type FeeRule = {
  percent?: number;
  fixed?: number;
  min?: number;
  max?: number;
};
export type FeeStatus =
  "official" | "listed" | "pending" | "conflicting" | "included-in-rate";
export type VariableWithdrawalFee =
  | { kind: "range"; min: number; max: number }
  | { kind: "alternatives"; amounts: [number, number] }
  | { kind: "average"; amount: number };
export type TariffSource = {
  id: string;
  title: string;
  url?: string;
  verifiedAt: string;
  publishedAt?: string;
};
export type WithdrawalStep = {
  id: string;
  label: string;
  inputCurrency: string;
  outputCurrency: string;
  fee: FeeRule | null;
  variableFee?: VariableWithdrawalFee;
  feeTiers?: { below?: number; above?: number; fee: FeeRule }[];
  feeStatus: FeeStatus;
  sourceIds: string[];
  conditions: string;
  minimumAmount?: number;
  maximumOutput?: number;
  requiresQuote?: boolean;
};
export type WithdrawalRoute = {
  id: string;
  availability: "documented" | "eligible" | "unconfirmed";
  group?: "local" | "usd";
  receiverCostsUnverified?: boolean;
  delivery: "bank" | "wallet" | "crypto" | "card";
  comparisonGroup?: string;
  countries: CountryCode[];
  destination: string;
  currency: string;
  name: string;
  path: string[];
  steps: string[];
  sourceIds: string[];
  conditions: string;
  verifiedAt: string;
};
export type ProviderDefinition = {
  id: string;
  name: string;
  logo?: string;
};
export type WithdrawalCatalog = {
  version: number;
  providers: ProviderDefinition[];
  sources: TariffSource[];
  steps: WithdrawalStep[];
  routes: WithdrawalRoute[];
};
export type WithdrawalScenario = {
  fees: Record<string, FeeRule | null>;
  rates: Record<string, number>;
  usdValues: Record<string, number>;
};
export type WithdrawalStepResult = {
  step: WithdrawalStep;
  input: number | null;
  fee: number | null;
  feeRule: FeeRule | null;
  feeUsd: number | null;
  output: number | null;
  rate: number | null;
  manual: boolean;
  pending: boolean;
};
export type WithdrawalResult = {
  route: WithdrawalRoute;
  steps: WithdrawalStepResult[];
  complete: boolean;
  issues: string[];
  finalAmount: number | null;
  netUsd: number | null;
  totalFeeUsd: number | null;
  knownFeesUsd: number;
  totalDiscountUsd: number | null;
  fxDifferenceUsd: number | null;
  stale: boolean;
};

// Implementations belong on a server after partner approval and consent, never in the browser.
export interface WithdrawalQuoteAdapter {
  quote(input: {
    routeId: string;
    country: CountryCode;
    amountUsd: number;
    currency: string;
  }): Promise<{
    fees: Record<string, FeeRule>;
    rates: Record<string, number>;
    expiresAt: string;
    source: string;
  }>;
}
