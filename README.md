# Calculadora de Sueldo USD

Calculadora web para freelancers, contractors y trabajadores remotos en Argentina que cobran en USD y quieren estimar ingresos, convertirlos a ARS y comparar cotizaciones.

## Demo

https://calculadora-ingresos-usd.vercel.app/

## Features

- Cálculo por minuto, hora, día o sueldo mensual fijo
- Selección de ciclo por fechas
- Días libres semanales
- Resumen de días, horas e ingreso USD
- Cotizaciones ARS con dolarapi.com
- Conversión por dólar oficial, blue, MEP/bolsa y cripto
- Gráfico comparativo
- Tests de lógica con Vitest

## Stack

- Next.js
- TypeScript
- Tailwind CSS
- date-fns
- Recharts
- Vitest
- DolarAPI

## Cómo correr localmente

```bash
npm install
npm run dev
```

## Tests

```bash
npm test
```

## Build

```bash
npm run build
```

## Disclaimer

Las cotizaciones son informativas y pueden variar. Esta herramienta no constituye asesoramiento financiero.

## Roadmap

- Historial local con localStorage
- Comparación de ciclos
- Gastos mensuales
- Ingreso neto y porcentaje de ahorro
- Deploy / mejoras UI
