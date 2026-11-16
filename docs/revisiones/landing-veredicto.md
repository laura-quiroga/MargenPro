# VEREDICTO revisor-visual — landing
Fecha: 2026-11-16 00:00
Screenshot: docs/revisiones/landing-375-hero.png (+ landing-375-problema.png, landing-375-agitacion.png, landing-375-solucion.png, landing-375-app-por-dentro.png, landing-375-oferta.png, landing-375-garantia.png, landing-375-faq.png, landing-375-cta-final.png — las 9 secciones de scroll)
Usabilidad: 34/40
Craft: 17/20
Copy (si vende): 18/20
Fidelidad (si hubo referencia): N-A
Veredicto: NO LISTA

Nota de verificación de los 2 fixes reportados para esta pasada (confirmados en código y screenshot, no asumidos):
- Defecto #1 (mockups planos + frase que admite que la app no está terminada): CONFIRMADO corregido. `landing-375-app-por-dentro.png` muestra las 4 tarjetas del carrusel con fondo sólido + sombra (`.frame .placeholder` en Landing.css línea 123: `background:var(--surface); box-shadow:var(--shadow-1)`, ya no `border-dashed`) y cada una con un dato de ejemplo real debajo del ícono ("$8.100 · 40% ganancia", "14 insumos al día" — Landing.tsx líneas 57-60, clase `.dato`). La frase bajo el carrusel ya no admite "en construcción": ahora dice "Vistas ilustrativas de la app." (línea 346). Sigue siendo razonable pedir evidencia aún más fiel (ver defecto #1 nuevo abajo), pero el golpe de confianza original quedó resuelto.
- Defecto #3 (dos botones con apariencia de CTA en Oferta): CONFIRMADO corregido. `landing-375-oferta.png` muestra "Elegir mensual →" como texto subrayado sin fondo ni borde (Landing.css línea 44: `.elegir-mensual { ... color:var(--text-2); text-decoration:underline; }`, Landing.tsx línea 389 usa esa clase, no `btn-cta`/`btn-secundario`). Queda 1 sola acción primaria visualmente dominante en la sección.
- Defecto #5 (contraste de --text-2): el constructor midió #716C5F sobre #FAFAF6 = 5.00:1 (≥4.5:1 AA) — verificado con la fórmula WCAG, cumple. Cierro este punto.
- Defecto #2 (falta de dispositivo visual ownable ligado al "Radar de Ganancia", más allá de los blobs de gradiente): NO se tocó, como el propio reporte de cambios lo advierte. Sigue vigente, ver abajo.

TOP DEFECTOS (máx 5, ordenados por impacto):
1. [Identidad visual global — src/globals.css + `.blob` en Landing.css, confirmado en las 9 capturas] Persiste el defecto #2 de la revisión anterior, sin cambios: papel cálido + serif display (Fraunces) + sans body (Manrope) + blobs de gradiente difusos repetidos en 4 secciones (#hero, #solucion, #app-por-dentro, #oferta) sigue siendo una fórmula editorial-SaaS genérica e intercambiable con cualquier otra landing de la misma receta. No hay ningún elemento gráfico de firma ligado al mecanismo bautizado "Radar de Ganancia" (ej. un trazo tipo aguja/radar, una textura propia, un patrón de fondo distintivo) → diseñar ese dispositivo ownable y usarlo para reemplazar al menos 1-2 de los blobs genéricos. Este es ahora el defecto #1 por impacto: con los otros 2 corregidos, es el que más separa a esta landing de "memorable" en el Eje 3 de craft.
2. ["La app por dentro" — landing-375-app-por-dentro.png, Landing.tsx líneas 56-61 y 117-126] El fix agregó datos reales a las tarjetas, pero los íconos siguen siendo genéricos de línea (un ícono de "imagen de paisaje" para "Costeo", un ícono de "documento" para "Escaneo") que no ilustran literalmente la pantalla real de la app — siguen leyéndose como marcador de posición con datos superpuestos, no como una vista real de producto (nivel showcase que exige el sistema para mockups de conversión) → cuando exista UI real de esas pantallas, reemplazar por capturas/ilustraciones fieles de cada una; mientras tanto, usar un ícono que sí represente la acción exacta (ej. una balanza o una cinta métrica para "Costeo" en vez de una imagen genérica).
3. [Oferta — landing-375-oferta.png, Landing.tsx líneas 376 y 389] El plan recomendado dice "Empezar mis 7 días gratis" y el plan mensual dice "Elegir mensual →" — ambos enlazan a /onboarding sin distinguir en el copy que el plan mensual NO tiene los 7 días de prueba (la nota-plan dice "Se cobra mes a mes", sin aclarar si también hay prueba) → unificar el mensaje de prueba gratis en ambos planes o aclarar explícitamente la diferencia, para que el usuario no sienta que perdió el beneficio al elegir mensual.
4. [Flexibilidad h7 — todo el archivo, verificado en código] Sigue sin existir ningún atajo, ayuda al experto o default inteligente más allá de la navegación estándar por enlaces — aceptable como piso para una landing, pero sin ningún esfuerzo deliberado que suba la heurística sobre el mínimo aprobatorio. Sin cambios desde la revisión anterior.
5. [Craft Eje 4 — movimiento, verificado en código] El carrusel de "La app por dentro" avanza solo cada 2.8s (Landing.tsx líneas 90-95) pero no respeta `prefers-reduced-motion` como sí lo hacen el conteo de precio y el `.entrada`/`.aparece` — el único guard de reduced-motion en el componente Carrusel es para el autoplay inicial (línea 86 `if (...) return`, correcto), así que en realidad SÍ lo respeta; bajo revisión no hay defecto aquí. (Retirado del listado activo — se documenta solo para dejar constancia de que se verificó.)

---

# VEREDICTO revisor-visual — landing
Fecha: 2026-11-14 00:00
Screenshot: docs/revisiones/landing-375-hero.png (+ landing-375-problema.png, landing-375-agitacion.png, landing-375-solucion.png, landing-375-app-por-dentro.png, landing-375-oferta.png, landing-375-garantia.png, landing-375-faq.png, landing-375-cta-final.png — las 9 secciones de scroll)
Usabilidad: 31/40
Craft: 16/20
Copy (si vende): 18/20
Fidelidad (si hubo referencia): N-A
Veredicto: NO LISTA

Nota de verificación de los 4 fixes previos (no se asumieron, se confirmaron en código y screenshot):
- Color de acento: CONFIRMADO cambiado a petróleo (#185062 claro / #59A6C0 oscuro, src/globals.css) — ya no es el verde del veredicto anterior.
- Radio de tarjetas del carrusel: CONFIRMADO uniforme — `.frame .placeholder` usa `var(--radius-card)` (14px), igual que pregunta-card/paso/plan/garantia-box.
- Comparación de "valor total" en Oferta: CONFIRMADA en unidades comparables — "$146" tachado vs "hoy $71.88/año" (landing-375-oferta.png, Landing.tsx línea 360).
- Garantía propia a 14 días: CONFIRMADA — "La Garantía del Primer Precio Real... Garantía propia de MargenPro · 14 días" (landing-375-garantia.png), ya no atribuida a Hotmart.
- Animación de entrada por sección: CONFIRMADA — `useAparecerAlScroll` + clase `.aparece.visto` con stagger aplica a Problema/Agitación/Solución/Oferta/Garantía/FAQ (Landing.tsx, Landing.css líneas 12-19).

Con esos 4 corregidos, esta pasada encontró hallazgos NUEVOS (no listados antes) que mantienen la pantalla fuera del gate de usabilidad (necesita ≥36/40, está en 31/40); el craft sí cruza su propio umbral (16/20) pero el gate es conjunto y ambos deben pasar.

TOP DEFECTOS (máx 5, ordenados por impacto):
1. [Sección "La app por dentro" — Landing.tsx líneas 338-348, Landing.css `.frame .placeholder`, confirmado en landing-375-app-por-dentro.png] Los 4 "mockups" de la app son solo una caja con borde punteado, un ícono genérico y una palabra ("ESCANEO", "COTIZACIÓN") — sin ningún dato simulado, sin jerarquía, sin parecerse a una pantalla real — y el texto justo debajo CONFIESA al usuario "Vistas ilustrativas — la app real está en construcción" en medio de una página que le está pidiendo pagar. Esto es lo opuesto de lo que exige el sistema para mockups de conversión (nivel showcase, lleno de datos de ejemplo) y es un golpe directo a la confianza justo antes del CTA → reemplazar los 4 placeholders por capturas/ilustraciones reales de cada pantalla con datos de ejemplo (como ya hace el resto del sitio) y eliminar la frase que admite que la app no está terminada.
2. [Identidad visual global — src/globals.css + `.blob` en Landing.css, confirmado en las 9 capturas] El hue del acento ya se corrigió (petróleo, no verde, resolviendo el riesgo de clon con "Capítulo" del veredicto anterior), pero la fórmula que queda — papel cálido (#FAFAF6) + serif display (Fraunces) + sans body (Manrope) + blobs de gradiente difusos repetidos en 4 secciones (#hero, #solucion, #app-por-dentro, #oferta) — sigue siendo una receta editorial-SaaS genérica, intercambiable con cualquier otra landing que use la misma fórmula de "blob + acento único". No hay todavía un dispositivo ownable propio ligado al mecanismo bautizado ("Radar de Ganancia") → diseñar un elemento gráfico de firma (ej. un trazo/ilustración tipo radar/aguja, textura de papel, patrón de fondo propio) que reemplace al menos 1-2 de los blobs genéricos.
3. [Oferta — landing-375-oferta.png, Landing.tsx líneas 362-389] Dos botones con apariencia de CTA compiten uno al lado del otro en la grilla de planes: "Empezar mis 7 días gratis" (botón lleno) y "Elegir mensual" (botón con borde) — ambos llevan al mismo destino (/onboarding), pero visualmente son 2 acciones primarias en la misma vista, violando la regla de "1 acción primaria por pantalla" (h8) → bajar "Elegir mensual" a un enlace de texto simple debajo del plan recomendado en vez de un segundo botón con su propio estilo visual.
4. [Flexibilidad h7 — todo el archivo, verificado en código] No existe ningún atajo, ayuda al experto ni default inteligente más allá de la navegación estándar por enlaces (comportamiento nativo del navegador) — aceptable como piso para una landing, pero sin ningún esfuerzo deliberado documentado que suba la heurística sobre el mínimo aprobatorio.
5. [Contraste de texto secundario — src/globals.css `--text-2: #716C5F` sobre `--bg: #FAFAF6`] El gris cálido usado en subtítulos, metadatos y el texto de FAQ (14-15px) está cerca del límite de 4.5:1 AA para texto normal — no se pudo medir con herramienta de contraste en esta revisión, pero a simple vista en las capturas (ej. landing-375-solucion.png, párrafo bajo el h2) se ve con menos peso del recomendable → medir con una herramienta de contraste real y oscurecer levemente `--text-2` si no cumple AA.

---

# VEREDICTO revisor-visual — landing
Fecha: 2026-11-07 00:00
Screenshot: docs/revisiones/landing-375-margenpro-01-hero.jpg
Usabilidad: 30/40
Craft: 13/20
Copy (si vende): 17/20
Fidelidad (si hubo referencia): N-A
Veredicto: NO LISTA

Top defectos:
1. [Identidad global — FICHA-ARTE + código :root, confirmado en las 4 capturas] La paleta papel cálido (#FAFAF6) + tinta verde (#3F7D6B) + serif display/sans body (Fraunces/Manrope) reproduce de cerca la fórmula del ejemplo canónico VETADO "Capítulo" de `53-PANTALLA-CANONICA.md` (papel cálido + tinta verde + serif/sans) — el hue del acento está a solo ~30° de distancia del verde de ese ejemplo (#3F5D45 vs #3F7D6B), muy por debajo de los ≥60° que exige el sistema ante un patrón similar → desplazar el hue del acento (más frío/azulado u oliva oscuro) y/o aumentar el tinte cálido del fondo para que no quede intercambiable con el patrón editorial crema+verde. No es copia literal (fuentes y hex exactos difieren), pero es un riesgo real de "segundo genérico" — un ojo entrenado lo nota al segundo de ver la paleta.
2. [Oferta — código líneas 332-335, confirmado en captura 03] El "Valor total" compara un paquete anual tachado de $146 contra un precio MENSUAL "$5.99/mes" (unidades distintas: año vs mes) — confunde cuánto ahorra realmente el usuario → mostrar el tachado también en términos mensuales, o aclarar "$146/año" vs "$71.88/año hoy" para comparar lo mismo contra lo mismo.
3. [Garantía — docs/copy/landing.md línea 53 + sección 7 del código, captura 04] El plazo de la garantía ("Respaldada por la garantía Hotmart de 7 días") está marcado internamente en el copy fuente como "⚠️ PENDIENTE DE CONFIRMAR" al configurar el producto en Hotmart, pero ya se publica en la landing como dato cerrado → confirmar el plazo real en Hotmart antes de publicar; un plazo incorrecto es un claim legal potencialmente falso (gate de integridad 61).
4. [Craft Eje 5 — código `.frame .placeholder`, línea 127, confirmado en captura 03] El radio de borde de las tarjetas del carrusel "La app por dentro" es 18px, distinto al `--radius-card:14px` usado en el resto de tarjetas de la página (pregunta-card, paso, plan, garantia-box) → unificar a 14px para que el radio sea idéntico en toda la pantalla.
5. [Craft Eje 4 — código, solo `.hero-grid` usa la clase `.entrada`] Las secciones debajo del hero (Problema, Agitación, Solución, Oferta, Garantía, FAQ) no tienen animación de entrada al hacer scroll — aparecen de golpe sin stagger, rompiendo la firma de movimiento definida en FICHA-ARTE.md ("stagger 60ms en la entrada de cada pantalla") → agregar un IntersectionObserver con fadeUp/stagger a los bloques de cada sección.

Nota positiva verificada: el espacio vacío del carrusel "La app por dentro" reportado en el veredicto anterior (2026-11-07 14:00) está confirmado CORREGIDO en la captura 03 — las tarjetas placeholder ya no dejan hueco muerto antes del CTA.

---

## Historial — veredicto anterior (2026-11-07 14:00, pre-pivote MargenPro)

Usabilidad: 29/40
Craft: 11/20
Copy (si vende): 16/20
Fidelidad (si hubo referencia): N-A
Veredicto: NO LISTA

Top defectos de esa revisión:
1. [Footer, solo código] El texto "MargenPro · soporte pendiente de dominio propio" expuesto como copy real al usuario final → corregido (ver nota de la sesión del 2026-11-07 en este mismo archivo, ya reemplazado).
2. [Sección "La app por dentro"] Espacio vacío masivo entre placeholders del carrusel y el CTA → CORREGIDO, confirmado visualmente en esta revisión (captura 03).
3. [Hero / FAQ / PS del CTA final] Contradicción "sin tarjeta" vs trial con tarjeta → corregido según nota de sesión; revisado de nuevo en esta pasada, sin inconsistencia visible.
4. [Identidad visual, Eje 3] Riesgo de cercanía con paleta canónica vetada "Capítulo" → el agente constructor descartó este hallazgo por autoevaluación (prohibida por el sistema); esta revisión independiente lo CONFIRMA como riesgo real y lo vuelve a listar arriba como defecto #1.
5. [Craft Eje 4] Cero animaciones baseline → parcialmente corregido (conteo animado del precio héroe + stagger del hero ya implementados); persiste la falta de animación de entrada en las secciones posteriores al hero (ver defecto #5 de esta revisión).
