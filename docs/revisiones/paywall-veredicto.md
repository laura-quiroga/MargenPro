# VEREDICTO revisor-visual — paywall
Fecha: 2026-11-16 00:00
Screenshot: docs/revisiones/paywall-375.png
Usabilidad: 33/40  (detalle: h1:3 h2:4 h3:3 h4:3 h5:3 h6:4 h7:3 h8:3 h9:3 h10:4)
Craft: 15/20  (detalle: jerarquía:3 profundidad:3 identidad:3 movimiento:3 encaje:3)
Copy (si vende): 15/20  (detalle: idea:3 especificidad:2 emoción:3 oferta:4 acción:3)
Fidelidad (si hubo referencia): N-A
Veredicto: NO LISTA
Top defectos:
1. [Lista stack-valor / oferta, copy eje "especificidad y prueba"] Verificado en código y captura: sigue sin existir ningún dato de prueba social (testimonio, conteo de uso, caso real) cerca de la oferta — solo precio y features. Confirmo que es una limitación real y aceptada (la app no se ha lanzado, no hay dato que mostrar sin inventarlo) y NO una evasión del defecto. Pero el eje de especificidad/prueba del copy queda en 2/4 y por regla de la rúbrica ("ningún eje ≤2") esto bloquea el gate de copy (≥16/20) aunque el resto suba — es el único defecto que de verdad impide declarar la pantalla lista por el lado de copy, y no se resuelve con más código sino con el primer dato real de uso/clientes cuando exista.
2. [Titular h2, "El Radar de Ganancia te dice si ganaste o perdiste..."] Mejora real y verificada: ahora nombra el mecanismo y conecta con la incertidumbre central del avatar (coincide con el ángulo de la landing, "¿no sabes si tu negocio ganó o perdió?"), subiendo el eje de emoción de 2→3. Pero sigue sin agitar la ESCENA sensorial concreta de la ficha (ESTADO/FICHA-AVATAR: 10pm, mesa llena de harina, libreta manchada de aceite, la pareja preguntando cuánto dejó el pedido) — se queda en el resultado abstracto ("ganaste o perdiste"), no en el momento vivido. → Si se quiere el 4/4, usar esa escena como frase de agitación antes o debajo del titular, dejando el Radar de Ganancia como la resolución.
3. [Tarjetas de plan — patrón badge "MÁS POPULAR" + check-custom + timeline de 3 pasos] Confirmado en Paywall.css: es un patrón de paywall genérico (el mismo que recomienda el propio sistema de componentes como default), sin un segundo elemento visual propio de MargenPro además del acento teal/Fraunces. No es un clon de los ejemplos vetados del 53, pero tampoco hay un dispositivo ownable adicional que lo distinga de cualquier otro paywall construido con este mismo sistema. → Agregar 1 detalle de firma (ej. el isotipo de MargenPro como marca de agua sutil en la tarjeta recomendada, o un ícono de "radar" en el badge en vez del texto plano) para subir identidad de 3→4.
4. [Selección de plan — Paywall.css líneas 14-18] El cambio de plan solo anima el borde (`transition:border-color .15s`) y la línea de texto bajo el CTA — no hay ninguna transición en el precio/badge que haga sentir la selección "viva" más allá del color. → Agregar un `scale` sutil (1→1.01, 120ms) o un leve fade del precio de la tarjeta recién seleccionada para reforzar el feedback más allá del borde.
5. [Línea "Vas a empezar con el plan..." sobre el CTA, Paywall.tsx línea 82 / Paywall.css línea 38] Confirmado que cambia en vivo al elegir plan (fix correcto del defecto #2 de la pasada anterior), pero su tratamiento visual (`font-size:12px; color:var(--text-2)`) es casi invisible comparado con el peso del CTA que tiene justo debajo — un usuario que no lea con cuidado puede no registrar el cambio de plan antes de tocar "Probar 7 días gratis". → Subir peso (600) o usar `var(--text-1)` para que la confirmación de plan se note tanto como el botón que confirma.

---

# VEREDICTO revisor-visual — paywall
Fecha: 2026-11-16 00:00
Screenshot: docs/revisiones/paywall-375.png
Usabilidad: 34/40
Craft: 15/20
Copy (si vende): 15/20
Fidelidad (si hubo referencia): N-A
Veredicto: NO LISTA
Top defectos:
1. [Titular "El Radar de Ganancia no te deja trabajar gratis otra vez" + subtítulo] El mecanismo ya está bautizado (bien), pero el dolor sigue genérico — no nombra la ESCENA exacta del avatar (ESTADO.md: "calcula sus precios a ojo, sin ver lo que de verdad le cuesta cada receta"). "Trabajar gratis otra vez" es una consecuencia abstracta, no la escena vivida. → Reescribir agitando la escena concreta antes de resolver con el mecanismo (ej. "Vendiste toda la tanda y, al final del mes, no sabes si ganaste algo"). Eje emoción de copy queda en 2/4, lo que fuerza corrección aunque el total de copy casi alcance 16.
2. [CTA "Probar 7 días gratis →" y zona de planes] Paywall.tsx confirma `planElegido` (línea 29) cambia la clase `.seleccionado` de la tarjeta, pero ni el botón CTA, ni la nota de garantía, ni el timeline leen `planElegido` — el usuario puede marcar "Mensual" y el botón sigue sin decir a cuál plan se compromete. Heurística 1 (visibilidad de estado) no cierra el loop de la selección. → Interpolar el plan elegido en el CTA o en una línea justo arriba ("Empiezas con Anual — $5.99/mes").
3. [Tarjetas `.plan` y `.plan.recomendado`, Paywall.tsx líneas 48-69] Son los únicos bloques de contenido sin la clase `entrada` — aparecen de golpe mientras el resto de la pantalla hace stagger escalonado (Paywall.css líneas 39-43 solo cubren `.pantalla-contenido > .entrada`). Rompe la consistencia de movimiento que sí lograron el resto de bloques. → Envolver ambas tarjetas en un contenedor con `entrada` y asignarles su propio `nth-child`/delay en la secuencia.
4. [stack-valor, prueba/especificidad del copy] El desglose numérico ($96+$30+$20=$146 vs $71.88) es específico y bien resuelto, pero no hay ningún testimonio, captura de uso real o dato de "personas como tú ya usan esto" cerca de la oferta — solo precio + features. → Agregar una línea de prueba social breve (ej. conteo de cotizaciones generadas) si existe el dato, o mantenerlo anotado como pendiente en ESTADO.md si no hay aún evidencia real que mostrar (no inventar la cifra).
5. [Tarjeta "Mensual"] Visualmente es mucho más plana que "Anual" (sin badge, sin inner-wrapper con gradiente, menos padding-top) — aceptable como jerarquía intencional hacia el plan recomendado, pero al no tener NINGÚN elemento propio (ni siquiera "ahorro: $0" o nota comparativa), se siente una tarjeta "de relleno" más que una opción real equivalente. → Agregar al menos una línea de nota-plan con el mismo peso visual que "2 meses gratis" del plan Anual para que ambas tarjetas compitan limpio (ej. "Ideal si prefieres pagar mes a mes").

---

# VEREDICTO revisor-visual — paywall
Fecha: 2026-11-16 00:00
Screenshot: docs/revisiones/paywall-375.png
Usabilidad: 31/40
Craft: 13/20
Copy (si vende): 10/20
Fidelidad (si hubo referencia): N-A
Veredicto: NO LISTA
Top defectos:
1. [Tarjetas "Anual"/"Mensual"] Ninguna de las dos tarjetas de plan tiene onClick ni estado de selección en el código (Paywall.tsx líneas 24-35) — el usuario no tiene forma de elegir el plan Mensual aunque la tarjeta luzca tocable (misma apariencia de card que el resto de la app). El CTA "Probar 7 días gratis" no indica a cuál plan corresponde. → Agregar estado `planElegido`, onClick en cada `.plan`, indicador visual de selección (borde/check) y pasar el plan elegido a /login.
2. [Debajo del botón CTA / pie de pantalla] La garantía propia de MargenPro de 14 días (decidida en ESTADO.md/FICHA-MERCADO) no aparece en ningún texto de la pantalla ni cerca del CTA — sub-check binario de copy de venta FALLA. → Agregar línea "Garantía MargenPro de 14 días: si no te sirve, te devolvemos tu dinero" justo bajo "Probar 7 días gratis".
3. [Titular h2 y stack de valor] El mecanismo bautizado "el Radar de Ganancia" (que ESTADO.md exige en hero/solución/oferta) no aparece en el paywall, y el dolor específico del avatar ("trabajo como esclava para terminar el mes sin un peso") no se agita — el copy vende features sueltas ($96/$30/$20) en vez de la Big Idea. → Reescribir titular/subtítulo nombrando el Radar de Ganancia y conectando con el dolor antes de listar beneficios.
4. [Toda la pantalla] El único movimiento es un fade plano de pantalla completa (`.entrada` heredado de PhoneFrame.css) — sin stagger entre value-stack/plan-cards/timeline, sin conteo animado de $5.99/$71.88, sin transición al navegar a /login. De las 7 animaciones baseline solo se cumplen tap-feedback del CTA y reduced-motion. → Escalonar la entrada por bloque (50-80ms) y animar el conteo del precio con Motion.
5. [Lista "stack-valor"] Las 3 líneas de beneficios ($96/$30/$20) son texto plano sin checkmark custom ni ícono — no usan el componente de checkmark (círculo acento 12% + SVG) que el sistema exige para listas de beneficios en superficies de conversión. → Agregar checkmark custom antes de cada línea del stack de valor.
