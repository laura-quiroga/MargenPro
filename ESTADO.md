# ESTADO — RecetarioPro
Última actualización: 2026-11-07 | Sesión actual: 1

⏸️ CHECKPOINT — Última acción completada: países de venta decididos (Colombia, México, Perú) y precio propuesto / Siguiente acción exacta: hacer la PREGUNTA DE REFERENCIA visual (B4) y presentar el Plan Maestro (B5)

## Qué es esta app (3 líneas máximo)
Calculadora de costeo de recetas para reposteras/gastronomía casera: registra ingredientes con su precio, arma recetas, y calcula el costo real + el precio de venta sugerido con el margen de ganancia que la usuaria defina. Vendida por suscripción mensual vía Hotmart.

## Promesa central
"Esta app ayuda a reposteras caseras de LATAM a saber exactamente cuánto cobrar por cada postre para asegurar una ganancia real, sin pelear con Excel ni hacer matemática compleja, mediante una calculadora de costeo pensada para usarse con una mano desde el celular."

## Reporte de validación (Sesión 1)
- Veredicto: Viable, con diferencial claro (⚠️ FICHA-MODELO queda en BORRADOR: solo un tipo de señal de revenue encontrada, sin acceso a Sensor Tower/Ads Library en esta sesión)
- Apps de referencia: Recipe Cost Calculator (Google Play, 4.08★/954 reseñas, ~16.1K instalaciones) · CakeCost (4.17★/121 reseñas) · KitchenCost (nueva, Flutter+Supabase)
- Lo que los usuarios odian de la competencia (nuestra oportunidad): no separan bien ingrediente de empaque/consumible · no avisan ni actualizan rápido cuando sube el precio de un insumo · "le faltan funciones de manejo de ingredientes"
- Brecha LATAM confirmada: SÍ — las apps en español encontradas (Control Receta, Cost Recipes) tienen calificaciones bajas (~3.0), ningún líder fuerte en español
- Precio de referencia del mercado: la mayoría freemium con compra dentro de la app; un competidor web cobra $29/mes (apunta a negocios grandes, no es nuestra referencia) — precio final PENDIENTE de saber el país del usuario

## Avatar y venta (Sesión 1)
- FICHA-AVATAR.md: existe, BORRADOR (el usuario ya trajo una investigación completa de avatar en su documento — falta solo confirmar país/moneda)
- Resumen: María Alejandra, repostera casera, 31 años · dolor #1: "siento que trabajo como una esclava para terminar el mes sin un peso" · deseo #1: que la app le diga el precio exacto con el margen que quiere · nivel de consciencia: consciente del problema y de la solución (3/5) · sofisticación: media (2.5/5 — ya probó Excel/apps de notas, sin líder fuerte en español)
- Landing: pendiente de construir (Sesión 3) — sigue la estructura canónica de 10 secciones

## Estrategia de monetización (Sesión 1 — DECIDIDO por el agente con la matriz A-F de 02C)
- Modelo: híbrido Productividad (E) + Finanzas (F) — el gatillo emocional es de confianza/control del dinero (F), pero el mecanismo diario es organizar ingredientes/recetas (E). Onboarding-first anónimo: landing → onboarding corto → primer resultado real (costo + precio) → paywall → login
- Justificación: la avatar teme la tecnología y abandona herramientas rápido (objeción #3) — dejarla sentir el cálculo real ANTES de pedirle pago/cuenta baja la barrera de entrada y resuelve su objeción #2 ("no quiero pagar sin estar segura")
- Diseño del paywall: aparece justo después de que ve su primera receta costeada con precio sugerido — "Tu primer costeo está listo. Desbloquea recetas ilimitadas y actualización automática de precios cuando suben tus insumos."
- Trial: 7 días (el aha es inmediato — en minutos ya ve el precio calculado)
- Pricing: $5.99/mes USD · $3.99/mes facturado anual ($47.88/año, "2 meses gratis") — ver FICHA-MERCADO §1
- Países de venta: Colombia, México y Perú (Colombia por pedido del usuario; México y Perú por señales reales de demanda — ver FICHA-MERCADO)

## Secuencia maestra de construcción
- Estado de la secuencia: ninguna etapa construida aún — estamos en Sesión 1 (validación + fichas)
- Ruta aprobada: `/` → `/onboarding` → `/paywall` → `/login` → `/app`
- Landing / Onboarding / Paywall / Login / App interna: todos pendientes
- Servicios externos: bloqueados hasta aprobar las etapas anteriores

## Decisiones técnicas (NO re-discutir sin pedirlo el usuario)
- Framework: Vite (la app en sí es una herramienta tras login, sin necesidad de SEO) — la landing se construye con el kit de `plantillas-codigo/landing`
- Idioma de UI: español LATAM, mono-idioma
- Features del MVP (del documento del usuario, en orden de prioridad):
  1. Base de insumos personalizada (nombre, unidad de compra, precio de compra)
  2. Constructor de recetas (seleccionar ingredientes, cantidades, costo total)
  3. Calculadora de margen de ganancia (% deseado → precio de venta sugerido)
  4. Conversor de unidades (kilos → gramos, etc.)
- Fuera de la v1 (ya definido por el usuario): inventario en tiempo real con descuento de stock · facturación electrónica/contabilidad fiscal · punto de venta (POS) o pasarelas de cobro a clientes finales
- Primera victoria (derivada del propio deseo del avatar): registrar su primer ingrediente y su primera receta, y ver aparecer al instante "esto te cuesta $X, cóbralo a $Y para ganar el [margen]% que elegiste"

## Pendientes del usuario (acciones que el usuario debe hacer)
- [ ] Responder la pregunta de referencia visual cuando se la haga

## Notas para la próxima sesión
- FICHA-MODELO y FICHA-MERCADO quedaron en BORRADOR por falta de herramientas de esta sesión (Sensor Tower, Ads Library, datos de pago verificados) — no bloquea avanzar, pero revisar si se consigue más evidencia antes de fijar precio final
- Falta hacer la PREGUNTA DE REFERENCIA visual (54, PASO 0) antes de proponer cualquier diseño
