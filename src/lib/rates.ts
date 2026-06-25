import type { CountryCode, ExchangeRate } from "@/types";

type RateApiItem = {
  casa?: string;
  fuente?: string;
  nombre?: string;
  nome?: string;
  moneda?: string;
  moeda?: string;
  compra?: number;
  venta?: number;
  venda?: number;
  promedio?: number;
  fechaActualizacion?: string;
  dataAtualizacao?: string;
};

type CountryRatesConfig = {
  endpoints: string[];
  currencyCode: string;
  locale: string;
};

const COUNTRY_RATES_CONFIG: Record<CountryCode, CountryRatesConfig> = {
  ar: {
    endpoints: ["https://dolarapi.com/v1/dolares"],
    currencyCode: "ARS",
    locale: "es-AR",
  },
  cl: {
    endpoints: ["https://cl.dolarapi.com/v1/cotizaciones/usd"],
    currencyCode: "CLP",
    locale: "es-CL",
  },
  uy: {
    endpoints: ["https://uy.dolarapi.com/v1/cotizaciones/usd"],
    currencyCode: "UYU",
    locale: "es-UY",
  },
  mx: {
    endpoints: ["https://mx.dolarapi.com/v1/cotizaciones/usd"],
    currencyCode: "MXN",
    locale: "es-MX",
  },
  bo: {
    endpoints: [
      "https://bo.dolarapi.com/v1/dolares/oficial",
      "https://bo.dolarapi.com/v1/dolares/binance",
    ],
    currencyCode: "BOB",
    locale: "es-BO",
  },
  br: {
    endpoints: ["https://br.dolarapi.com/v1/cotacoes/usd"],
    currencyCode: "BRL",
    locale: "pt-BR",
  },
  co: {
    endpoints: ["https://co.dolarapi.com/v1/cotizaciones/usd"],
    currencyCode: "COP",
    locale: "es-CO",
  },
  ve: {
    endpoints: ["https://ve.dolarapi.com/v1/dolares"],
    currencyCode: "VES",
    locale: "es-VE",
  },
  other: {
    endpoints: [],
    currencyCode: "USD",
    locale: "en-US",
  },
};

async function fetchEndpoint(url: string): Promise<RateApiItem[]> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status} (${url})`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [data];
}

function normalizeRate(
  item: RateApiItem,
  index: number,
  config: CountryRatesConfig,
): ExchangeRate {
  const name = item.nombre ?? item.nome ?? item.casa ?? item.fuente ?? "Dólar";
  const casa = item.casa ?? item.fuente ?? item.moneda ?? item.moeda ?? name;
  const sell = item.venta ?? item.venda ?? item.promedio ?? 0;

  return {
    casa: `${casa}-${index}`,
    name,
    buy: item.compra ?? sell,
    sell,
    currencyCode: config.currencyCode,
    locale: config.locale,
    updatedAt: item.fechaActualizacion ?? item.dataAtualizacao ?? new Date().toISOString(),
  };
}

export async function fetchExchangeRates(countryCode: CountryCode = "ar"): Promise<ExchangeRate[]> {
  try {
    const config = COUNTRY_RATES_CONFIG[countryCode];

    if (countryCode === "other") {
      return [
        {
          casa: "usd-1",
          name: "USD",
          buy: 1,
          sell: 1,
          currencyCode: config.currencyCode,
          locale: config.locale,
          updatedAt: new Date().toISOString(),
        },
      ];
    }

    const responses = await Promise.all(config.endpoints.map((endpoint) => fetchEndpoint(endpoint)));
    const data = responses.flat();

    return data.map((item, index) => normalizeRate(item, index, config));
  } catch (error) {
    console.error("Error fetching exchange rates:", error);
    throw error;
  }
}
