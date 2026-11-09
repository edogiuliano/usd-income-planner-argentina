import type { CountryCode } from "@/types";

export type WithdrawalProvider = "deel" | "payoneer" | "papaya";
export type FeeRule = {
  percent?: number;
  fixed?: number;
  min?: number;
  max?: number;
};
export type FeeStatus =
  "official" | "pending" | "conflicting" | "included-in-rate";
export type TariffSource = {
  id: string;
  title: string;
  url: string;
  verifiedAt: string;
  publishedAt?: string;
};
export type WithdrawalStep = {
  id: string;
  label: string;
  inputCurrency: string;
  outputCurrency: string;
  fee: FeeRule | null;
  feeStatus: FeeStatus;
  sourceIds: string[];
  conditions: string;
  minimumAmount?: number;
  maximumOutput?: number;
};
export type WithdrawalRoute = {
  id: string;
  provider: WithdrawalProvider;
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
  helpUrl?: string;
  availabilityNote?: string;
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
  readonly provider: WithdrawalProvider;
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
