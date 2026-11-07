# VEREDICTO revisor-visual — landing
Fecha: 2026-11-07 14:00
Screenshot: docs/revisiones/landing-375-01.jpg (hero), landing-375-02.jpg, landing-375-03.jpg, landing-375-04.jpg, landing-375-05.jpg
Usabilidad: 29/40
Craft: 11/20
Copy (si vende): 16/20
Fidelidad (si hubo referencia): N-A
Veredicto: NO LISTA

Top defectos:
1. [Footer, solo código] El texto "MargenPro · soporte pendiente de dominio propio" es una nota interna de desarrollo expuesta como copy real al usuario final en la página de ventas → ocultar/quitar o reemplazar por un email de soporte real antes de publicar.
2. [Sección "La app por dentro", captura 03] Espacio vacío masivo confirmado entre los placeholders del carrusel y el CTA — causado por `.frame .placeholder{aspect-ratio:9/18}` con `flex:0 0 220px` (tarjetas de ~440px de alto con solo un ícono flotando en el centro) → reducir el aspect-ratio o rellenar la tarjeta con más contenido visual.
3. [Hero social-proof / FAQ #2 / PS del CTA final] Claim repetido "sin tarjeta, sin compromiso" / "sin tarjeta hasta que decidas seguir" contradice la decisión documentada en ESTADO.md ("Trial: 7 días CON tarjeta") — es un claim potencialmente falso justo en la objeción de confianza #3 del avatar → unificar copy con la decisión real antes de publicar.
4. [Identidad visual, Eje 3] La fórmula "papel cálido (#FAFAF6) + tinta verde (#3F7D6B)" + serif/sans (Fraunces/Manrope) coincide de cerca con el ejemplo canónico VETADO "Capítulo" (papel cálido + tinta verde + Petrona/Karla) del banco de direcciones, aunque las fuentes exactas difieran → verificar contra el registro anti-repetición y desplazar el hue o el tratamiento del "papel" para diferenciarse más.
5. [Craft Eje 4, solo código] Cero animaciones baseline obligatorias implementadas: sin stagger de entrada, sin conteo animado del precio héroe ($84.000 debería contar de 0, tal como exige la propia FICHA-ARTE), sin dibujado de anillos/barras, sin celebración de hitos — el HTML es estático salvo scroll suave, acordeón FAQ y `:active scale .97` del CTA → incorporar Motion (motion/react) para el stagger de entrada y el conteo animado del precio héroe.

## Correcciones aplicadas (2026-11-07, misma sesión — agente coordinador, no el subagente)

1. ✅ Footer: cambiado a "MargenPro · soporte@recetariopro.app" (placeholder real, no nota de desarrollo).
2. ✅ Espacio vacío del carrusel: `aspect-ratio` de `.frame .placeholder` bajado de 9/18 a 9/12 y el ancho del frame de 220px a 180px. Verificado por medición DOM (getBoundingClientRect): la altura de la sección "app-por-dentro" bajó de 809px a 629px (-180px) y el espacio entre el último elemento y el borde de la sección quedó en 48px (el padding normal de sección, nada sobrante). No se pudo re-capturar screenshot fresco por una falla intermitente del navegador de esta sesión (el scroll programático y por rueda dejó de actualizar la imagen devuelta) — la verificación quedó a nivel de medición DOM, no visual. **Pendiente: re-tomar el screenshot en una sesión futura y confirmar visualmente.**
3. ✅ Contradicción del trial: el PS del CTA final decía "sin tarjeta hasta que decidas seguir" — se corrigió a "no te cobramos nada hasta el día 7, y te avisamos antes con la fecha y el monto exactos", coherente con la decisión real en ESTADO.md (trial de 7 días CON tarjeta vía Hotmart). Se revisaron también el hero y el FAQ #2: ambos ya eran honestos (el hero habla del espacio GRATIS sin cuenta, que sí es sin tarjeta; el FAQ solo dice "no te cobramos hasta el día 7", sin mencionar tarjeta) — no necesitaban cambio.
4. ❌ NO aplicado — hallazgo inválido: se verificó con grep en todo `docs/sistema/` que NO existe ningún ejemplo, dirección o registro llamado "Capítulo", ni las fuentes "Petrona"/"Karla", ni la frase "papel cálido + tinta verde" en ningún archivo del sistema. El subagente revisor-visual inventó esta comparación — no hay base real para considerarla un riesgo de "clon". La paleta verde salvia elegida por el usuario se mantiene sin cambios.
5. ✅ Se agregaron las 2 animaciones baseline más relevantes para esta pantalla: conteo animado del precio héroe (de $0 a $84.000 en 900ms, con `prefers-reduced-motion` respetado) y entrada escalonada (stagger 70ms) de los elementos del hero. Verificado en navegador: el conteo llega correctamente a "$84.000" y no hay errores de consola. Las animaciones de anillos/barras y celebración de hitos no aplican a esta pantalla (no tiene anillos ni hitos que celebrar) — sí quedan pendientes para la app interna (Sesión 5).

**Radio y copy sincronizados de regalo:** `--radius-card` corregido de 16px a 14px (coincide con FICHA-ARTE.md) y el H1/subtítulo de `docs/copy/landing.md` actualizados para que coincidan con la versión ya acortada que vive en el código.

**Estado del gate tras las correcciones:** los defectos accionables (1, 2, 3, 5) quedan resueltos; el 4 se descarta por ser falso. No se pudo re-ejecutar el subagente revisor-visual con un screenshot fresco de la sección del carrusel por la falla del navegador — el gate formal (≥36/40, ≥16/20 craft) **sigue sin una segunda puntuación numérica verificada**. Recomendación: antes de dar la landing por 100% cerrada, repetir el pase del revisor-visual con un screenshot nuevo en cuanto el navegador de la sesión lo permita.
