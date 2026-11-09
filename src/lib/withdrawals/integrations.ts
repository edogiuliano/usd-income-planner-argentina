import type { WithdrawalProvider } from "@/types/withdrawals";

// Capability registry only. No credential input, quote endpoint, or payment execution is exposed.
export const withdrawalIntegrations: Record<
  WithdrawalProvider,
  {
    publicAnonymousQuotes: false;
    accountQuotesVerified: boolean;
    requirements: string[];
    documentation: string[];
    verifiedAt: string;
  }
> = {
  deel: {
    publicAnonymousQuotes: false,
    accountQuotesVerified: false,
    requirements: [
      "API token u OAuth con permisos adecuados",
      "Verificar un endpoint de estimación para el método del contratista con Deel",
      "Backend para proteger credenciales",
    ],
    documentation: [
      "https://developer.deel.com/api/authentication",
      "https://developer.deel.com/api/oauth",
    ],
    verifiedAt: "2026-11-06",
  },
  payoneer: {
    publicAnonymousQuotes: false,
    accountQuotesVerified: true,
    requirements: [
      "Acceso de partner y consentimiento del titular",
      "Bearer token y account_id",
      "Cuenta bancaria registrada y elegible",
      "Backend; nunca confirmar ni ejecutar retiros en este simulador",
    ],
    documentation: [
      "https://www.payoneer.com/developers-docs/withdrawal/withdraw-to-bank/",
    ],
    verifiedAt: "2026-11-06",
  },
  papaya: {
    publicAnonymousQuotes: false,
    accountQuotesVerified: false,
    requirements: [
      "Credenciales entregadas por Integration Support",
      "API key, client secret y bearer token en backend",
      "Confirmar cobertura por país, cuenta, moneda y tarifas del beneficiario",
      "No usar precios empresariales como comisiones del trabajador",
    ],
    documentation: [
      "https://docs.papayaglobal.com/api-reference/authentication-api",
      "https://www.papayaglobal.com/banco-mobile-wallet/",
    ],
    verifiedAt: "2026-11-06",
  },
};
