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
