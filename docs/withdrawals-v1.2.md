# Simulador de retiros v1.2

Revisión: **06/11/2026**. El catálogo es una referencia documentada, no una cotización en vivo. No se ejecutan pagos ni se conectan cuentas.

## Alcance verificado

- **Deel / Argentina:** Payoneer y rutas posteriores a Santander, Bitso o Prex; ARQ instantáneo o estándar. Cada movimiento tiene su propio costo. La recepción de Payoneer depende del convenio y queda pendiente si no hay un cargo confirmado guardado.
- **Deel / AstroPay:** Argentina, México, Colombia y Brasil, únicamente cuando la cuenta ofrece saldo de destino en USD. La [guía del método](https://help.letsdeel.com/hc/en-gb/articles/26188901005969-AstroPay-Withdrawal-Method-for-Contractors) y el [listado actualizado](https://help.letsdeel.com/hc/en-gb/articles/14391381019537-About-Withdrawal-Fees-and-Withdrawal-Minimums) difieren en el cargo. No se elige una tarifa silenciosamente: el usuario confirma la de su cuenta.
- **Deel / Brasil:** Pix. **Colombia:** Bre-B, incluyendo sus cargos, límite publicado y eventual costo del receptor. Se puede estimar con la referencia seleccionada o cargar el cambio real de la plataforma. [Pix](https://help.letsdeel.com/hc/en-gb/articles/27113300171921-Pix-Withdrawal-Method-for-Contractors-in-Brazil), [Bre-B](https://help.letsdeel.com/hc/en-gb/articles/43892925141905-Instant-Withdrawals-in-Colombia-with-Bre-B).
- **Payoneer / Argentina:** Santander en USD; Bitso y Prex en ARS. Las tarifas de [la página argentina](https://pages.payoneer.com/es/withdrawal-of-funds/) cubren esa etapa completa; no se suman otra vez los cargos incluidos. [Las condiciones de la cuenta](https://www.payoneer.com/pricing/) pueden cambiar el precio.
- **Papaya:** el [producto Banco](https://www.papayaglobal.com/banco-mobile-wallet/) informa variación por país, cuenta y producto. No pudimos verificar una matriz pública de retiros concretos por país ni las tarifas del beneficiario. Está en el selector, con destinos pendientes de verificación. No se confunden precios empresariales con cargos al trabajador.

No se extrapolan rutas a Chile, Uruguay, Bolivia, Venezuela ni al perfil genérico Otro/USD. Sus cálculos de sueldo y cotizaciones siguen disponibles. Agregar un país exige evidencia para la combinación proveedor, método y moneda; una lista genérica de monedas no es suficiente.

**ARQ:** los escenarios existentes conservan su identificador y saldo USDc para no perder preferencias. La [actualización del 29/10/2026](https://www.arqfinance.com/en-AR/help/articles/your-usdc-is-changing-to-usds-starting-from-29th-october-2026) informa una migración a USDs y retiros cripto todavía en proceso de habilitación. No se renombra ese saldo a USDC ni se ofrece una salida externa sin verificar disponibilidad y costos. La interfaz usa una valoración nominal orientativa 1:1 de dólares digitales cuando no existe una valoración guardada, sin garantizar paridad. Los planes o promociones pueden modificar la tarifa estándar de [ARQ](https://www.arqfinance.com/es-MX/help/articles/deel-instant-withdrawal).

## Interfaz compacta

Un único «Total estimado a recibir» encabeza los resultados, seguido de su equivalente aproximado y las filas de VTO y comisiones ya incluidas, cuando correspondan. Las estadísticas conservan sus valores originales. Al final, Desde y Hacia incluyen las variantes de cada ruta. «Ver detalle» muestra bruto antes del retiro, ruta, cargos, neto y fuentes, sin campos de edición. Se conservan todas las rutas y la misma clave de preferencias.

La presentación reutiliza el motor sin cambiar sus reglas. `estimateReceipt` aporta referencias exclusivamente orientativas cuando no hay un cambio manual: compra o venta de la cotización elegida y valoración nominal 1:1 de USDC/USDc/USDs, aclarada en pantalla. No se guardan estas referencias como cotizaciones de la plataforma. Un cambio manual tiene prioridad. Los cargos desconocidos siguen sin asumirse como cero: el total se rotula parcial y solo avanza hasta la última etapa calculable. Sin ruta seleccionada no se descuentan comisiones. Se restauran también las ediciones antiguas de rutas predeterminadas.

Sobre USD 977,04, un cargo del 0,75% deja USD 969,71 **antes** de otros cargos; no se elimina el cargo adicional de ARQ salvo modificación explícita del usuario. Con la tarifa estándar adicional de 3 USDc y equivalencia nominal, el neto orientativo es USD 966,71. La conversión local parte siempre del neto o subtotal rotulado, nunca del bruto original.

## Modelo de cálculo

`src/data/withdrawals.json` contiene fuentes, revisión, condiciones, tarifas, mínimos de retiro y límites. `src/lib/withdrawals/engine.ts` calcula cada etapa sobre el saldo restante: porcentaje más fijo, con mínimo/máximo de comisión. Se redondea por etapa a centavos (USDc conserva seis decimales). Las plataformas pueden usar otro redondeo final.

Una comisión vacía, conflictiva o inválida bloquea el neto; nunca se interpreta como cero. Una conversión sin cambio guardado ni referencia válida también deja una estimación parcial. El motor sigue respetando los cargos confirmados previamente, incluso cero, y marca como pendientes las tarifas vencidas que no tengan un valor guardado. Se bloquean saldos insuficientes y límites de retiro. No incluye impuestos, mantenimiento ni cargos anteriores al saldo disponible.

Los cambios de plataforma guardados deben incluir el spread sin duplicar las comisiones ya desglosadas. La conversión de DolarAPI permite estimar el resultado pero **no sustituye ni garantiza el precio de ejecución de una ruta**. La fila de comisiones del resumen muestra solo los cargos ya aplicados; el total descontado del detalle también refleja el efecto de la conversión cuando se puede calcular.

La recomendación compara rutas del mismo país sobre el mismo sueldo después de VTO. Valora los saldos finales con una referencia común en USD. Excluye costos pendientes, tarifas antiguas y conversiones cuyo cambio de ejecución solo es una aproximación del mercado. No aparece sin una ruta actual comparable y al menos una alternativa comparable.

## Acceso a APIs

No hay APIs anónimas de cotización verificadas que podamos utilizar aquí:

- **Deel:** [tokens y OAuth](https://developer.deel.com/api/authentication) requieren cuenta y permisos. No se verificó un endpoint público para estimar el retiro individual. Falta confirmar alcance con Deel y obtener acceso adecuado.
- **Payoneer:** [la API de retiros](https://www.payoneer.com/developers-docs/withdrawal/withdraw-to-bank/) devuelve costos y FX dentro de un flujo autenticado con cuenta, banco elegible y consentimiento. Requiere acceso partner y backend. No se llaman sus pasos de preparación ni confirmación de pagos desde el simulador.
- **Papaya:** [Integration Support entrega credenciales privadas](https://docs.papayaglobal.com/api-reference/authentication-api). Faltan acceso comercial, cobertura y tarifas aplicables al beneficiario, y verificación de las capacidades de cotización.

`WithdrawalQuoteAdapter` define el contrato de una futura implementación de servidor; `integrations.ts` registra capacidades revisadas y requisitos. No hay adaptadores ficticios ni endpoints que aparenten funcionar. No se solicitan, almacenan ni exponen claves en el frontend.

## Persistencia y recursos

Las preferencias usan `usd-planner-withdrawals-v1`, con escenarios separados por país y ruta. Se siguen leyendo los ajustes manuales guardados en versiones previas, pero la interfaz ya no los edita. Abrir la sección o conectar cuentas no es obligatorio. El importe antes del retiro siempre proviene del sueldo vigente después de VTO.

El logo de Deel proviene de su kit oficial con permiso público. Las otras marcas usan el fallback genérico porque no se verificó licencia suficiente o requieren permiso. Detalle y procedencia en `public/providers/README.md`. No hay afiliación comercial.

La etapa v1.1 se publicó primero en `main`, commit `4a8320f`. La v1.2 se desarrolla después de ese punto, de forma separada.
