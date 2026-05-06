\# USD Income Planner Argentina - spec.md



\## Objetivo



Web app pública para freelancers, contractors y remote workers en Argentina que cobran en USD y quieren estimar sus ingresos por ciclo laboral, convertirlos a ARS con cotizaciones reales y visualizar un resumen simple.



Debe permitir calcular ingresos según:



\- pago por minuto

\- pago por hora

\- pago por día

\- pago mensual fijo



El usuario define:



\- monto

\- horas por día

\- días libres semanales

\- fecha de inicio del ciclo

\- fecha de fin del ciclo



La app muestra:



\- días totales

\- días trabajados

\- días libres

\- horas totales

\- ingreso total USD

\- equivalente ARS por tipo de dólar

\- mini dashboard con cards y gráfico simple



\---



\## Stack



\- Next.js

\- TypeScript

\- Tailwind CSS

\- date-fns

\- Recharts

\- Vitest para tests de lógica

\- Deploy: Vercel



\---



\## MVP



Una sola página, sin login y sin base de datos.



NO hacer en MVP:



\- login

\- historial persistente

\- gastos

\- IA

\- Telegram

\- n8n

\- export PDF

\- backend complejo

\- usuarios

\- auth

\- pagos



Prioridad:



```text

calcular bien → mostrar claro → deployar

Usuarios objetivo

Freelancers en Argentina que cobran en USD

Contractors remotos

Remote workers

Personas que cobran por minuto, hora, día o mensual fijo

Personas que quieren planificar ingresos USD/ARS por ciclo laboral

Inputs del formulario

Tipo de pago

Valores internos:



ts

"minute" | "hour" | "day" | "monthly"

Labels visibles:



Por minuto

Por hora

Por día

Mensual fijo

Monto

Campo:



ts

rate: number

Ejemplos:



0.35 USD/min

25 USD/hora

120 USD/día

2500 USD/mes

Validación:



debe ser mayor a 0

Horas por día

Campo:



ts

hoursPerDay: number

Aplica principalmente a:



pago por minuto

pago por hora

Para pago por día o mensual fijo puede usarse para calcular horas totales estimadas.



Validación:



no puede ser menor a 0

no puede ser mayor a 24

Días libres semanales

Campo:



ts

freeWeekdays: number\[]

Convención:



ts

0 = domingo

1 = lunes

2 = martes

3 = miércoles

4 = jueves

5 = viernes

6 = sábado

El usuario debe poder seleccionar visualmente:



Lunes

Martes

Miércoles

Jueves

Viernes

Sábado

Domingo

Fechas del ciclo

Campos:



ts

startDate: string

endDate: string

Reglas:



startDate es obligatorio

endDate es obligatorio

endDate no puede ser anterior a startDate

el rango incluye fecha de inicio y fecha de fin

Cálculos

Días del ciclo

Función esperada:



ts

getCycleDays(startDate, endDate, freeWeekdays)

Debe devolver:



ts

{

&#x20; totalDays: number

&#x20; workedDays: number

&#x20; freeDays: number

}

Reglas:



Contar todos los días entre startDate y endDate inclusive.

Si el weekday está en freeWeekdays, cuenta como día libre.

Si no está en freeWeekdays, cuenta como día trabajado.

Ingreso USD

Función esperada:



ts

calculateIncome({

&#x20; paymentType,

&#x20; rate,

&#x20; hoursPerDay,

&#x20; workedDays

})

Debe devolver:



ts

{

&#x20; totalIncomeUsd: number

&#x20; totalHours: number

&#x20; averageDailyIncomeUsd: number

&#x20; averageHourlyIncomeUsd: number

}

Pago por minuto

text

minutesPerDay = hoursPerDay \* 60

dailyIncome = rate \* minutesPerDay

totalIncomeUsd = dailyIncome \* workedDays

Pago por hora

text

dailyIncome = rate \* hoursPerDay

totalIncomeUsd = dailyIncome \* workedDays

Pago por día

text

dailyIncome = rate

totalIncomeUsd = rate \* workedDays

Pago mensual fijo

text

totalIncomeUsd = rate

Para pago mensual fijo:



text

totalHours = workedDays \* hoursPerDay

averageDailyIncomeUsd = totalIncomeUsd / workedDays si workedDays > 0

averageHourlyIncomeUsd = totalIncomeUsd / totalHours si totalHours > 0

Cotizaciones USD/ARS

Usar:



text

dolarapi.com

Intentar obtener:



oficial

blue

MEP

cripto

Formato interno:



ts

type ExchangeRate = {

&#x20; name: string

&#x20; buy: number

&#x20; sell: number

&#x20; updatedAt: string

}

Función esperada:



ts

fetchExchangeRates(): Promise<ExchangeRate\[]>

Para conversión usar:



text

sell

Cálculo:



text

incomeArs = totalIncomeUsd \* rate.sell

Si la API falla:



la calculadora USD debe seguir funcionando

mostrar error claro

no romper la app

Mensaje sugerido:



text

No se pudieron cargar cotizaciones en este momento.

UI

Una sola página.



Secciones:



Header

Formulario

Resultado principal

Cards resumen

Tabla de cotizaciones / conversiones

Gráfico de barras

Disclaimer

Cards resumen

Mostrar:



Ingreso estimado USD

Equivalente ARS blue

Días trabajados

Días libres

Horas totales

Promedio por día

Promedio por hora

Gráfico

Usar Recharts.



Tipo:



text

Bar chart

Mostrar:



text

Ingreso ARS por tipo de dólar

Eje X:



oficial

blue

MEP

cripto

Eje Y:



ingreso equivalente en ARS

Disclaimer

Mostrar texto corto:



text

Las cotizaciones son informativas y pueden variar. Esta herramienta no es asesoría financiera.

Estructura sugerida

text

usd-income-planner/

&#x20; ├── README.md

&#x20; ├── spec.md

&#x20; ├── tasks.md

&#x20; ├── .gitignore

&#x20; ├── .env.example

&#x20; ├── package.json

&#x20; ├── next.config.ts

&#x20; ├── tsconfig.json

&#x20; ├── src/

&#x20; │   ├── app/

&#x20; │   │   ├── page.tsx

&#x20; │   │   ├── layout.tsx

&#x20; │   │   └── globals.css

&#x20; │   ├── components/

&#x20; │   │   ├── IncomeForm.tsx

&#x20; │   │   ├── SummaryCards.tsx

&#x20; │   │   ├── RatesTable.tsx

&#x20; │   │   └── IncomeChart.tsx

&#x20; │   ├── lib/

&#x20; │   │   ├── calculator.ts

&#x20; │   │   ├── dates.ts

&#x20; │   │   ├── rates.ts

&#x20; │   │   └── formatters.ts

&#x20; │   └── types/

&#x20; │       └── index.ts

&#x20; └── tests/

&#x20;     ├── calculator.test.ts

&#x20;     └── dates.test.ts

Funciones esperadas

src/lib/dates.ts

ts

export function getCycleDays(

&#x20; startDate: string,

&#x20; endDate: string,

&#x20; freeWeekdays: number\[]

): {

&#x20; totalDays: number

&#x20; workedDays: number

&#x20; freeDays: number

}

src/lib/calculator.ts

ts

export type PaymentType = "minute" | "hour" | "day" | "monthly"



export function calculateIncome(input: {

&#x20; paymentType: PaymentType

&#x20; rate: number

&#x20; hoursPerDay: number

&#x20; workedDays: number

}): {

&#x20; totalIncomeUsd: number

&#x20; totalHours: number

&#x20; averageDailyIncomeUsd: number

&#x20; averageHourlyIncomeUsd: number

}

src/lib/rates.ts

ts

export async function fetchExchangeRates(): Promise<ExchangeRate\[]>

src/lib/formatters.ts

ts

export function formatUsd(value: number): string

export function formatArs(value: number): string

export function formatPercent(value: number): string

Validaciones

Mostrar errores claros si:



rate <= 0

hoursPerDay < 0

hoursPerDay > 24

falta startDate

falta endDate

endDate < startDate

workedDays = 0

Para workedDays = 0 mostrar:



text

No hay días trabajados en este ciclo según los días libres seleccionados.

Tests mínimos

dates.test.ts

Casos:



rango de 1 día

rango con fin de semana

inicio y fin inclusivos

todos los días libres

endDate anterior a startDate

calculator.test.ts

Casos:



pago por minuto

pago por hora

pago por día

mensual fijo

workedDays = 0

hoursPerDay = 0

Criterios de éxito MVP

&#x20;La app carga sin errores.

&#x20;El formulario permite elegir tipo de pago.

&#x20;El cálculo de días trabajados funciona.

&#x20;El cálculo de ingreso USD funciona.

&#x20;Se muestran cotizaciones reales si la API responde.

&#x20;Si la API falla, la app no se rompe.

&#x20;Se muestra mini dashboard.

&#x20;Se muestra gráfico simple.

&#x20;UI responsive básica.

&#x20;Se puede deployar en Vercel.

&#x20;README tiene instrucciones claras.

&#x20;No hay login ni features fuera del MVP.

Roadmap post-MVP

v2: Historial local

Guardar cálculos en localStorage.

Mostrar últimos cálculos.

Comparar ciclos.

v3: Gastos mensuales

Agregar gastos manuales:



alquiler

comida

servicios

transporte

suscripciones

otros

Calcular:



ingreso neto después de gastos

porcentaje de ahorro

gastos en USD/ARS

v4: Google Sheets / n8n

Exportar cálculo a Google Sheets.

Workflow n8n diario para actualizar cotizaciones.

Telegram alert con resumen.

v5: Backend y usuarios

login

base de datos

histórico real por usuario

reportes mensuales

Restricciones

No implementar login en MVP.

No implementar base de datos en MVP.

No implementar gastos en MVP.

No implementar IA en MVP.

No implementar Telegram/n8n en MVP.

No agregar complejidad innecesaria.

Mantener funciones de cálculo separadas de componentes React.

Priorizar claridad y demo funcional.

Comandos esperados

Instalación:



bash

npm install

Desarrollo:



bash

npm run dev

Tests:



bash

npm test

Build:



bash

npm run build

