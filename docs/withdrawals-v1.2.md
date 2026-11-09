# Simulador de retiros de Deel

El catálogo usa el relevamiento de las opciones de Deel por país aportado para la actualización del **09/11/2026**. No es una cotización en vivo ni garantiza que el método esté habilitado en todas las cuentas. La [tabla pública general de Deel](https://help.letsdeel.com/hc/en-gb/articles/14391381019537-About-Withdrawal-Fees-and-Withdrawal-Minimums) puede diferir de esos importes: no se combinan las dos tablas ni se agregan sus mínimos.

## Métodos por país

En los ocho países, el grupo USD incluye Revolut y Wise Wallet sin comisión de Deel, ARQ al 0,75%, Payoneer al 1% y PayPal al 2,5%. Las opciones adicionales son:

| País      | Moneda local                                    | USD: opciones adicionales             |
| --------- | ----------------------------------------------- | ------------------------------------- |
| Argentina | —                                               | AstroPay 0,75%; SWIFT US$25 o US$45   |
| Chile     | Banco local US$5                                | SWIFT US$25 o US$35                   |
| Uruguay   | AstroPay 0,75%; banco local US$5                | Banco local US$5; SWIFT US$25 o US$31 |
| México    | AstroPay 0,75%; banco local US$5; SWIFT US$5–50 | SWIFT a confirmar                     |
| Bolivia   | Banco local US$5; SWIFT US$5–50                 | SWIFT US$64,90 de promedio            |
| Brasil    | AstroPay 0,75%; banco local US$5; Pix US$0      | SWIFT US$5–50                         |
| Colombia  | AstroPay 0,75%; banco local US$5; Bre-B US$0    | SWIFT US$5–50                         |
| Venezuela | SWIFT US$5–50                                   | SWIFT US$5–50                         |

Los importes fijos se descuentan en USD antes de aplicar, si corresponde, la cotización preferida de la app. Los rangos muestran los dos extremos; los dos valores de SWIFT en Argentina, Chile y Uruguay son alternativas sin condición documentada en el relevamiento, no cargos acumulables. El promedio boliviano no es una tarifa fija. Bre-B usa el importe del relevamiento; su [guía pública](https://help.letsdeel.com/hc/en-gb/articles/43892925141905-Instant-Withdrawals-in-Colombia-with-Bre-B) describe otras condiciones para convertir USD a COP.

**ARQ en Argentina:** se muestra el 0,75% de Deel en el selector y se descuentan por separado los 3 USDs que [ARQ documenta](https://www.arqfinance.com/es-AR/help/articles/deel-instant-withdrawal) para el retiro instantáneo. La equivalencia nominal 1:1 no garantiza un cambio efectivo. No se extrapolan el cargo argentino ni el mecanismo ARQtag a otros países.

## Resultados y preferencias

El bruto después de VTO alimenta el simulador sin volver a descontar ausencias. «Comisiones de retiro incluidas» muestra solo los cargos usados en el cálculo. El saldo local es orientativo; el proveedor o banco puede aplicar su propio tipo de cambio o cargos adicionales. Las recomendaciones excluyen tarifas variables, cargos de destino no verificados y conversiones no comparables.

La clave local `usd-planner-withdrawals-v1` conserva las selecciones válidas por país. La selección anterior de SWIFT en USD se asigna a su variante por país; Revolut conserva su selección en Brasil. Los destinos ausentes del relevamiento dejan de mostrarse y las tarifas obsoletas no se reutilizan. No se conectan cuentas, no se ejecutan retiros y no hay APIs nuevas.
