# ESTADO — RecetarioPro
Última actualización: 2026-11-07 | Sesión actual: 1

⏸️ CHECKPOINT — Última acción completada: revisor-visual auditó la landing (veredicto NO LISTA: 29/40 usabilidad, 11/20 craft, 16/20 copy — docs/revisiones/landing-veredicto.md) y se corrigieron 4 de los 5 hallazgos (footer con nota de desarrollo expuesta, espacio vacío en el carrusel, contradicción sobre la tarjeta del trial, faltaban animaciones baseline); el 5º hallazgo (similitud con un ejemplo "Capítulo" del banco de direcciones) se descartó por ser inexistente en los archivos del sistema (verificado con grep) / Siguiente acción exacta: re-tomar un screenshot fresco de la landing (el navegador de esta sesión tuvo fallas intermitentes de scroll/captura) y volver a pasar el revisor-visual para confirmar el puntaje ≥36/40 y ≥16/20 antes de declarar la landing 100% lista; mientras tanto, presentársela al usuario para su aprobación de contenido

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

## Dirección de Arte (Sesión 2 — NO cambiar sin justificación)
- FICHA-ARTE.md: existe y aprobada por el usuario (2026-11-07) — fusión de Opción A (tarjeta-héroe) + Opción C (claridad de pasos), color de C
- Resumen: fondo claro #FAFAF6 (oscuro #1A1D1B) · acento #3F7D6B claro / #6FB89E oscuro · Display "Fraunces" (solo precio/titulares) · Body "Manrope" · radio 14px
- Personalidad: cálida · clara · confiable
- Modo oscuro: toggle explícito (pedido por el usuario), verificado visualmente en dev/vista-previa-app.html
- REGISTRO ANTI-REPETICIÓN: paleta verde salvia (#3F7D6B) + par Fraunces/Manrope quedan vetados para el próximo proyecto del SO
- Tour de la app: dev/vista-previa-app.html (onboarding, pantalla principal, paywall, resumen mensual, cotización WhatsApp) — APROBADO por el usuario (dio luz verde a seguir a la landing)

## Avatar y venta (Sesión 1)
- FICHA-AVATAR.md: existe, APROBADA (2026-11-07)
- Resumen: María Alejandra, repostera casera, 31 años · dolor #1: "siento que trabajo como una esclava para terminar el mes sin un peso" · deseo #1: que la app le diga el precio exacto con el margen que quiere · nivel de consciencia: consciente del problema y de la solución (3/5) · sofisticación: media (2.5/5 — ya probó Excel/apps de notas, sin líder fuerte en español)
- Mecanismo bautizado: "el Radar de Ganancia" (aparece en hero, solución y oferta de la landing — 19)
- Big Idea: "María Alejandra no pierde dinero por ser mala repostera — pierde dinero porque calcula sus precios a ojo, sin ver lo que de verdad le cuesta cada receta. El Radar de Ganancia se lo muestra en segundos, para que cada postre que venda le deje una ganancia real."
- Landing (Sesión 3): código EN REVISIÓN (no lista — ver Problemas conocidos) — `dev/landing/index.html` (preview estático HTML/CSS, 10 secciones canónicas de 19) + copy marcado y trazado en `docs/copy/landing.md`. Verificada a 375px y 1440px, sin desbordes. CTAs → `/onboarding` (Modelo 2, onboarding-first anónimo). ⚠️ PENDIENTE: (a) escalar esto a los componentes reales del kit `plantillas-codigo/landing/` (React/Vite) cuando se haga el scaffold técnico del proyecto — por ahora es un preview fiel, no el código de producción; (b) confirmar el plazo exacto de garantía al configurar Hotmart (se usó 7 días, el mismo que el ejemplo del sistema); (c) páginas legales (privacidad/términos/reembolsos/aviso de IA) son placeholders, pendientes de redactar con el archivo 47; (d) email de soporte pendiente del dominio que el usuario compre; (e) carrusel "la app por dentro" con placeholders rotulados — se reemplaza por capturas reales cuando la app esté construida

## Estrategia de monetización (Sesión 1 — DECIDIDO por el agente con la matriz A-F de 02C)
- Modelo: híbrido Productividad (E) + Finanzas (F) — el gatillo emocional es de confianza/control del dinero (F), pero el mecanismo diario es organizar ingredientes/recetas (E). Onboarding-first anónimo: landing → onboarding corto → primer resultado real (costo + precio) → paywall → login
- Justificación: la avatar teme la tecnología y abandona herramientas rápido (objeción #3) — dejarla sentir el cálculo real ANTES de pedirle pago/cuenta baja la barrera de entrada y resuelve su objeción #2 ("no quiero pagar sin estar segura")
- Diseño del paywall: aparece justo después de que ve su primera receta costeada con precio sugerido — "Tu primer costeo está listo. Desbloquea recetas ilimitadas y actualización automática de precios cuando suben tus insumos."
- Espacio gratis SIN cuenta ni tarjeta: hasta 3 insumos + 1 receta completa, viendo el costo real y el precio sugerido (la primera victoria). Al intentar una 2ª receta o cualquier función Pro (escaneo, cotización WhatsApp, historial, resumen mensual) aparece la pantalla de planes
- Recorrido "así se ve tu app por dentro" (aprobado, doctrina 02B "mostrar cómo se ve la app por dentro antes del paywall" + reciprocidad): justo después de su primera receta gratis y ANTES del paywall, un carrusel corto de 4 pantallas con datos de ejemplo (no los suyos, sin gastar en IA real) mostrando: 1) un escaneo de factura pasando de foto a ingredientes cargados · 2) una cotización con su logo lista para enviar por WhatsApp · 3) el historial de cotizaciones con sus estados · 4) el resumen mensual de gasto vs. ganancia. Objetivo: que vea TODO lo que compra antes de que se lo pidamos — cero sorpresas, cero suposiciones
- Trial: 7 días CON tarjeta (vía Hotmart, flujo estándar del sistema) — acceso completo inmediato al aceptar. Mapa D1-D7 (02C): D1 primera receta/cotización ya usable · D2-D3 insight real con sus propios datos (ej. "ya llevas X recetas costeadas") · D4-D5 mostrarle lo que ya construyó (inversión acumulada) · D6 aviso honesto in-app + email con fecha y monto exactos + botón de cancelar en 1 toque · D7 bienvenida "ya eres Pro" con lo desbloqueado visible
- Pricing: $7.99/mes USD · $5.99/mes facturado anual ($71.88/año, "2 meses gratis") — subido desde la propuesta inicial ($5.99) porque ahora el plan incluye escaneo de facturas con IA (tiene un costo real por uso que hay que cubrir) — ver FICHA-MERCADO §1
- Límite del plan: 30 escaneos de factura al mes (cubre de sobra una compra semanal de supermercado) · recetas, ingredientes y cotizaciones por WhatsApp ilimitadas
- Países de venta: Colombia, México y Perú (Colombia por pedido del usuario; México y Perú por señales reales de demanda — ver FICHA-MERCADO)

## Secuencia maestra de construcción
- Estado de la secuencia: Landing EN REVISIÓN (código listo, veredicto del revisor-visual todavía NO LISTA — ver Problemas conocidos) — Onboarding/Paywall/Login/App interna pendientes
- Ruta aprobada: `/` → `/onboarding` → `/paywall` → `/login` → `/app`
- Landing: código construido y corregido (dev/landing/index.html) — se aplicaron las reglas de escaneabilidad mobile (bloques ≤4 líneas, íconos en Problema/Agitación/Solución, FAQ en acordeón, oferta/garantía en cajas, ritmo visual alternado, CTA repetido en hero/mecanismo/carrusel/garantía/final + sticky), headline a 9 palabras, y los 4 defectos del veredicto NO LISTA del revisor-visual ya corregidos en el código. Verificado sin desborde horizontal a 375px y ~600px (pane). ⚠️ NO está "lista": falta la segunda pasada del `revisor-visual` con screenshot fresco que confirme ≥36/40 y ≥16/20 — ver docs/revisiones/landing-veredicto.md y Problemas conocidos
- Onboarding / Paywall / Login / App interna: pendientes (Sesión 4-5)
- Servicios externos: bloqueados hasta aprobar las etapas anteriores

## Decisiones técnicas (NO re-discutir sin pedirlo el usuario)
- Framework: Vite (la app en sí es una herramienta tras login, sin necesidad de SEO) — la landing se construye con el kit de `plantillas-codigo/landing`
- Idioma de UI: español LATAM, mono-idioma
- Features del MVP (en orden de prioridad; 1-4 del documento del usuario, 5-6 aprobadas en Sesión 1 tras pasar el filtro de feature de 01-IDEACION):
  1. Base de insumos personalizada (nombre, unidad de compra, precio de compra)
  2. Constructor de recetas (seleccionar ingredientes, cantidades, costo total)
  3. Calculadora de margen de ganancia (% deseado → precio de venta sugerido)
  4. Conversor de unidades (kilos → gramos, etc.)
  5. Escaneo de factura/recibo de compra (IA): foto del recibo del super → extrae ingredientes y precios → la usuaria confirma antes de guardar → actualiza el costo de las recetas que usan ese insumo. Procesamiento asíncrono (subir foto → procesar en segundo plano → avisar cuando esté listo), con tope de 30 escaneos/mes para controlar el costo variable de la IA (circuit-breaker de costo, 48)
  6. Cotización profesional por WhatsApp: genera una imagen/PDF de la cotización con el logo del negocio y el precio ya calculado; la usuaria la revisa antes de enviar y la comparte por WhatsApp (sin integración con WhatsApp Business API — es un botón de compartir, no envío automático)
  7. Historial de cotizaciones con estado (vendida / pendiente / rechazada) — lista filtrable (regla UX de filtros en listas largas), editable en cualquier momento
  8. Resumen mensual: gasto total en insumos (de facturas escaneadas + registros manuales) + ganancia real de los pedidos marcados "vendida" menos su costo — con navegación entre meses por fecha real (no solo "este mes"), esta es LA pantalla que resuelve el dolor #1 del avatar ("no sé si hoy gané o perdí")
  9. (idea adicional del agente, aprobada) Aviso cuando un insumo escaneado o editado sube de precio frente al que tenía guardado, con acceso directo a actualizar el precio de venta de las recetas que lo usan — cierra el loop entre escanear, costear y cobrar
- Fuera de la v1 (ya definido por el usuario): inventario en tiempo real con descuento de stock · facturación electrónica/contabilidad fiscal · punto de venta (POS) o pasarelas de cobro a clientes finales · envío automático de cotizaciones sin revisión de la usuaria
- Primera victoria (derivada del propio deseo del avatar): registrar su primer ingrediente y su primera receta, y ver aparecer al instante "esto te cuesta $X, cóbralo a $Y para ganar el [margen]% que elegiste"
- Segunda victoria (loop de retención): generar y enviar su primera cotización profesional por WhatsApp — refuerza el deseo de identidad ("esto es un negocio de verdad")
- Loop mensual de retención (gatillo→acción→recompensa): fin de mes (gatillo) → abre el resumen mensual (acción) → ve en números si ganó o perdió, y cuánto (recompensa) → eso decide sus precios del mes siguiente (inversión) — es el mecanismo que responde directo a su ansiedad nocturna

## Problemas conocidos ⚠️
- [veredicto:landing] El revisor-visual puntuó la landing NO LISTA (29/40 · 11/20 · 16/20 — docs/revisiones/landing-veredicto.md). Se corrigieron 4 de 5 defectos reales directamente en el código; falta re-tomar un screenshot fresco (el navegador de esta sesión falló al hacer scroll/capturar de forma consistente) y correr una segunda pasada del revisor-visual para confirmar ≥36/40 y ≥16/20 antes de declarar la landing lista para vender.

## Pendientes del usuario (acciones que el usuario debe hacer)
- Ninguno pendiente de su parte por ahora — esperando la revisión final de la landing

## Notas para la próxima sesión
- FICHA-MODELO y FICHA-MERCADO quedaron en BORRADOR por falta de herramientas de esta sesión (Sensor Tower, Ads Library, datos de pago verificados) — no bloquea avanzar, pero revisar si se consigue más evidencia antes de fijar precio final
- Confirmar plazo real de garantía con Hotmart al configurar la pasarela (se usó 7 días como supuesto razonable)
