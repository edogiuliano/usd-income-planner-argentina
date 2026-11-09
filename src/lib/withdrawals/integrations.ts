// No credential input, quote endpoint, or payment execution is exposed.
export const deelWithdrawalIntegration = {
  publicAnonymousQuotes: false,
  accountQuotesVerified: false,
  requirements: [
    "API token u OAuth con permisos adecuados",
    "Verificar con Deel un endpoint de cotizacion de retiros del contratista",
    "Backend para proteger credenciales",
  ],
  documentation: [
    "https://developer.deel.com/api/authentication",
    "https://developer.deel.com/api/oauth",
  ],
  verifiedAt: "2026-11-06",
} as const;
