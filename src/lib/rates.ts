import type { ExchangeRate } from "@/types";

export async function fetchExchangeRates(): Promise<ExchangeRate[]> {
  try {
    const response = await fetch("https://dolarapi.com/v1/dolares");
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    const targetRates = ["oficial", "blue", "bolsa", "cripto"];

    const rates = data
      .filter((item: any) => targetRates.includes(item.casa))
      .map((item: any) => ({
        name: item.nombre,
        buy: item.compra,
        sell: item.venta,
        updatedAt: item.fechaActualizacion || new Date().toISOString(),
      }));

    return rates;
  } catch (error) {
    console.error("Error fetching exchange rates:", error);
    throw error;
  }
}
