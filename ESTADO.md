# ESTADO — MargenPro
Última actualización: 2026-11-25 | Sesión actual: 6

## Landing: 4 de 5 defectos del revisor corregidos, re-revisión en curso (2026-11-25)
Primera pasada del revisor-visual tras el avance: 29/40 usabilidad · 15/20 craft · 16/20 copy,
NO LISTA. Corregido (commit `a61a7eb`, deploy `dpl_6Ct1ZXdvWEFU4r7xWFHzRtjofE2n`):
1. Ambigüedad garantía 15 días vs "7 días de prueba" en el cierre — el recap del CTA final, el PS
   y la FAQ de reembolso ahora distinguen explícito los dos plazos.
2. chip-icono de "Agitación" (36px/radio10 con override inline) ahora igual a "Problema" (44px/
   radio12 por defecto) — se quitó el override.
3. `Landing.tsx` ya no retorna `null` mientras verifica la sesión — muestra el isotipo centrado.
4. El supuesto "hueco en blanco antes de La app por dentro" (defecto #2 del revisor) se investigó
   y era un ARTEFACTO de la herramienta de captura: el viewport había vuelto a 1280px de ancho sin
   detectarse a mitad de una larga sesión de screenshots — confirmado normal recapturando con
   innerWidth=375 verificado antes de cada captura. Lección anotada en memoria del agente.
5. Sin prueba social real (defecto #4) — NO se tocó, sigue siendo limitación real conocida (sin
   usuarios/ventas aún) — ver más abajo en "Problemas conocidos".
Se re-lanzó el revisor-visual con las 9 capturas corregidas — veredicto pendiente.

## Avance de landing: carrusel realista + animación de entrada robusta, revisor-visual en curso (2026-11-25)
A pedido de la usuaria ("quiero que la landing sea un 10/10"), con el skill `/landing`: se revisó
el estado real contra el último veredicto (16-nov, 34/40) y se encontró que 2 de 3 defectos ya
estaban corregidos de sesiones anteriores (dispositivo "Radar de Ganancia" ya en hero+oferta,
ambigüedad del plan mensual ya aclarada) — solo quedaba el carrusel "La app por dentro" con íconos
abstractos. Corregido (commit `83c6ef9`): cada tarjeta ahora es una mini-pantalla realista con el
mismo vocabulario visual de la app de verdad (chip+nombre+cifra+estado) en vez de un ícono suelto.
Además, verificando en vivo se encontró que `useAparecerAlScroll` (la animación de entrada al
hacer scroll) podía quedarse sin disparar nunca bajo ciertas condiciones de renderizado — se hizo
más robusta con `threshold:0` + `rootMargin` + un chequeo manual de respaldo por evento de scroll
(commit `e02962f`). Se tomaron las 9 capturas a 375px y se lanzó el subagente `revisor-visual` con
contexto limpio — su veredicto queda pendiente, se documentará en la próxima actualización.

## ⚠️ CRÍTICO — HALLAZGO Y FIX: la View Transition API podía dejar la app colgada para siempre (2026-11-25)
Al retomar la sesión para trabajar en la landing, se probó la app en un navegador real (no solo
inspección de código) y se encontró que la entrada suave agregada el día anterior
(`document.startViewTransition`, commit `5188d3a`) **podía dejar la app congelada en la pantalla
de carga PARA SIEMPRE**, sin ningún error visible. Confirmado con una prueba directa en consola:
`document.startViewTransition(() => { document.title = 'x' })` — su promesa JAMÁS se resuelve en
este entorno de navegador, y lo mismo bloqueaba el montaje real de React (`setTimeout` esperando
adentro de la transición que nunca llega a "lista"). Esto es grave porque el entorno donde se
detectó (navegador automatizado/headless) comparte comportamiento de renderizado con el que más
importa en la práctica: WebViews de Android con soporte parcial o inconsistente de esta API
experimental — exactamente donde vive la app instalada de la usuaria.
**Corregido de raíz (commit `bdcc7b2`, deploy `dpl_8bekQPjJidXQmVKLagZhkpdrYY1K`, ya en
producción)**: se quitó la View Transition API por completo. La entrada suave ahora es un fade con
CSS puro, sin ninguna dependencia de una promesa del navegador: `#carga-inicial` se movió a vivir
FUERA de `#root` (hermano, no hijo, en `index.html`) — así montar React adentro de `#root` nunca
lo toca, la app ya se dibuja debajo mientras el overlay se desvanece encima con un `setTimeout`
fijo de 450ms. Verificado funcionando en vivo (build de producción local).
⚠️ **Regla para el futuro**: NUNCA usar APIs experimentales/recientes del navegador (View
Transitions, y cualquier otra marcada "Baseline: recién disponible" o similar) en el camino
crítico de que la app cargue — siempre verificar en un navegador real antes de dar por buena una
pieza así, no solo revisar que `tsc`/`build` pasen (eso no prueba que el comportamiento en tiempo
de ejecución sea correcto).

## DECISIÓN CERRADA: pantalla de carga en 4 segundos + entrada suave con cross-fade (2026-11-24)
La usuaria probó la prueba temporal de 5s, le encantó ("siento más identidad con la marca") y
pidió bajarla a 4s — ya no es una prueba, es la duración definitiva: `src/main.tsx`,
`MINIMO_MS = 4000`. Además notó que el paso de la pantalla de carga a la app se sentía "abrupto" —
se agregó un cross-fade con la View Transition API del navegador (`document.startViewTransition`),
.45s de duración, con fallback automático si el navegador no la soporta. Todo desplegado (commit
`5188d3a`, deploy `dpl_Dcqfc5eKkq4Gecy2Vzxb6b9saQoZ`). **Ya NO replantear esta duración ni el
cross-fade sin que ella lo pida — quedó decidido y es cosa juzgada, como el resto de FICHA-ARTE.**
⚠️ **Bug encontrado el mismo día y ya corregido**: los 4s se restaban del tiempo YA transcurrido
desde el inicio de la navegación (`MINIMO_MS - performance.now()`) — si el splash nativo del
celular o la red tardaban más de lo normal, a la pantalla propia le quedaba MENOS de los 4s (la
usuaria lo vio en vivo: una vez la primera pantalla tardó más y la segunda solo se vio 1s). Ahora
son 4s FIJOS con `setTimeout(montarConTransicion, 4000)` sin restar nada, siempre los mismos
pase lo que pase antes (commit `dd3dd10`, deploy `dpl_6D7pZGm6m2kwJSF4AemoBcFHzFxV`).

## Novena ronda: causa raíz REAL del desfase (solo con letra grande) + copy de Ajustes (2026-11-24)
La usuaria aclaró el dato clave que faltaba: el desfase del indicador "solo pasa con la letra
grande y muy grande". Reproducido y corregido de raíz (commit `c8ca39a`, deploy
`dpl_5cwWkBMoBZBHkXQTCxGaDkTQAYaW`):

**Causa real**: el indicador calculaba su posición asumiendo que las 5 pestañas miden EXACTAMENTE
lo mismo (`ancho total / 5`, vía CSS `calc()`). Eso es cierto casi siempre — pero con letra grande
o muy grande, en una pantalla angosta (375px), la etiqueta "Panorama" (la más larga de las 5) deja
de caber en su quinta parte del ancho: el navegador no puede encoger el texto más allá de su ancho
mínimo de contenido, así que esa pestaña queda más ANCHA que las otras 4 — rompiendo la suposición
de "todas iguales" en la que se basaba el cálculo del indicador. Esto NO pasaba a tamaño normal
porque a ese tamaño "Panorama" sí entra en su quinta parte sin forzar nada.
**Corregido midiendo el DOM real** en vez de calcular a ciegas: ahora el indicador usa
`offsetLeft`/`offsetWidth` del botón activo de verdad (con un `useEffect` que depende de
`activeIndex` y `tamano`, más un listener de `resize`) — así siempre coincide exacto con la
pestaña real, sea cual sea su ancho, sin asumir nada. Verificado con medición directa: alineación
exacta en las 5 pestañas, incluida "Panorama" (la más ancha), bajo zoom 1.3.
⚠️ Nota para el futuro: este fue el TERCER intento de arreglar este mismo síntoma (primero se
descartó como "animación deslizándose", luego se corrigió una carrera de timing real pero
distinta, y recién en este intento se encontró la causa que la usuaria describía) — el dato que
lo resolvió fue que ella especificara EXACTAMENTE bajo qué condición pasaba (solo con letra
grande). Cuando un bug visual "no se repite" en las pruebas propias, preguntar por la condición
exacta antes de descartarlo es más rápido que adivinar.

Además, a pedido de la usuaria, el subtítulo de "Gastos de tu negocio" en Ajustes ahora explica
qué incluye el cálculo simple (insumos + tu tiempo si lo activas) y qué suma el avanzado (además,
una parte de tus costos fijos).

## Octava ronda: CONFIRMADO con video — el indicador de la barra SÍ tenía un bug real (2026-11-24)
La usuaria mandó un video (WhatsApp, ~14s) del problema del óvalo "desfasado". Se analizó con
OpenCV (instalado `opencv-python-headless` para esta sesión): se extrajeron ~64 cuadros del video
a ~4fps, se armó un contact sheet recortando la franja de la barra inferior de cada cuadro, y en
varios cuadros se confirmó el bug real: el texto de "Insumos" ya aparecía coloreado como activo,
mientras el óvalo de fondo seguía sobre "Recetas" (la pestaña anterior) — no fue mi suposición
anterior de "solo es la animación deslizándose", sí había una causa real que corregir. Corregido y
desplegado (commit `f7e039c`, deploy `dpl_9QU5FjQmfKgBe8K69Z7nXpVXgZ5N`):

**Causa real**: el color del texto/ícono activo (`.tab-btn span`, `.tab-btn svg`) transicionaba en
`.2s`, pero el óvalo que se desliza (`.tabbar-indicador`) transiciona en `.32s` — dos animaciones
de duración distinta para el MISMO cambio de pestaña. En la ventana de ~120ms entre que termina
una y la otra sigue en curso, el texto ya muestra la pestaña nueva como activa mientras el óvalo
todavía no llega — exactamente lo que la usuaria fotografió/grabó. Se igualaron ambas duraciones a
`.32s` con la misma curva (`cubic-bezier(.22,1,.36,1)`), para que el color y la posición del óvalo
terminen exactamente juntos, sin importar a qué pestaña se cambie ni en qué modo (claro/oscuro).

## Séptima ronda: "MargenPro" pegado, copy de Recetas, e indicador de la barra investigado (2026-11-24)
La usuaria no quiso subir la pantalla de carga a 5-10s (se le explicó el riesgo de que eso afecte
a TODO futuro cliente, no solo a ella una vez — aceptó el argumento); se le mandó una captura de
cómo se ve el contenido para confirmarlo sin alargar el tiempo real. Mandó 3 pedidos más, resueltos
y desplegados (commit `326be4d`, deploy `dpl_8szV8iqgZcc8Tiukj2avkRfC1EQy`):

1. **"Pro" salía despegado de "Margen"** en el logo del encabezado — causa real: `.logo` es un
   contenedor flex con `gap:8px`, y "Margen" (nodo de texto suelto) + el `<span>Pro</span>` eran
   DOS hijos distintos de ese flex — el gap se metía entre ellos. Se envolvieron los dos juntos en
   un solo `<span>` para que cuenten como un solo hijo del flex. Aplicado en `AppLayout.tsx` y
   `PhoneFrame.tsx`.
2. **El óvalo indicador de la barra inferior, investigado a fondo** (reportado como "desfasado" al
   cambiar de pestaña, en ambos modos): medido con `getBoundingClientRect()` en vivo, clic real por
   clic real en las 5 pestañas — en CADA caso el óvalo terminó con la MISMA posición x exacta que
   el ícono activo (alineación perfecta en reposo). Conclusión más probable: lo que vio la usuaria
   es la animación de 0.32s DESLIZÁNDOSE de una pestaña a otra (intencional, para que la barra se
   sienta viva) capturada a mitad de camino, no un defecto persistente — no se encontró ningún caso
   real de mala alineación en reposo. Queda anotado por si vuelve a reportarse con más detalle (ej.
   video) de en qué momento exacto ocurre.
3. **Subtítulo de "Tus recetas"**: se aclara explícitamente que el precio SÍ incluye el margen de
   ganancia, y opcionalmente la hora de trabajo y los costos fijos, según lo que el usuario active.

## Sexta ronda: confirmado el arreglo del splash (era el ícono cacheado por Android al instalar), + 3 pulidos visuales (2026-11-24)
Tras desinstalar y reinstalar la app, la usuaria confirmó que el ícono/splash ya se ve bien — esto
cierra DEL TODO el hallazgo de la ronda 4 (el splash SÍ se cachea aparte, a nivel Android, al
momento de "Agregar a pantalla de inicio"; no se arregla con más deploys ni limpiando caché del
navegador, solo reinstalando). Mandó 4 pedidos más, todos resueltos y desplegados (commit
`3049eb0`, deploy `dpl_9fxQ5SQKTk8gpYS8dF7qyn9CCTph`):

1. **La pantalla de carga propia (con el texto) no alcanzaba a verse** por lo rápido que carga su
   conexión — en vez de quitarla, se le puso una duración MÍNIMA de 600ms (contados desde que
   arranca la navegación con `performance.now()`, no desde que corre el script — así sí cuenta el
   tiempo que ya tardó el bundle en llegar). No es un "splash" que retrasa el acceso a propósito
   (prohibido por el SO): es solo estirar un poco el tiempo de carga que de todas formas iba a
   pasar, para que no sea un parpadeo invisible.
2. **"Pro" de "MargenPro" sin el color de acento** en el encabezado — ahora "Pro" usa el acento de
   marca (se adapta solo a modo claro/oscuro), como en la imagen de referencia que dio la usuaria.
3. **Barra de navegación inferior invisible en modo oscuro**: usaba un negro-verdoso FIJO (mismo
   en claro y oscuro, por diseño original) que en modo oscuro casi no se distinguía del fondo de
   la página (ambos casi negros). Se le dio una excepción en modo oscuro: usa el azul-teal
   característico de la marca (`#185062`) en vez del negro-verdoso, para que siga leyéndose como
   una barra flotante.
4. **Tooltip de "Tus subrecetas & adicionales"**: ejemplo reescrito con la idea de la usuaria —
   piezas ya armadas (Hamburguesa clásica, Papas fritas, Jugo natural) que se combinan en un Combo.

## Quinta ronda: isotipo embebido en la carga, copy de Recetas, y corrección final de inventario (2026-11-24)
A la usuaria le encantó la luna nueva. Reportó 2 cosas más: el isotipo de la pantalla de carga
salía como un cuadro en blanco parpadeando (mandó captura), y la Harina de trigo le seguía
saliendo "se está acabando" después de todo lo de la ronda anterior. También pidió mejorar el
ejemplo del tooltip de "Tus recetas" y, aparte, que TODA la comunicación con ella sea siempre en
español (ya anotado como memoria del usuario, no solo de este proyecto) y que los hallazgos de esta
sesión se guarden para no repetir errores (4 memorias nuevas guardadas: comunicación en español,
el bug de CSS zoom + position:fixed, el patrón de grepear todos los call sites de un parámetro, y
el de caché de index.html en SPA). Todo corregido y desplegado (commit `99f7cdc`, deploy
`dpl_B6Y4RCbvdZATozy9rqTiRw6dksQH`):

1. **El isotipo de la pantalla de carga parpadeaba en blanco**: era un `<img src="/isotipo.svg">`
   — una petición de red APARTE del HTML, y mientras esa petición no terminaba, lo que se veía era
   el placeholder vacío del navegador, con la animación de pulso ya corriendo encima (de ahí el
   "parpadeo sin logo"). Se cambió a el SVG embebido DIRECTO en `index.html` — ya no depende de
   ninguna petición adicional, no puede quedar sin cargar.
2. **Harina de trigo (y de paso Azúcar Mayagüez Blanca) seguían sin devolverse**: mismo hallazgo de
   la ronda anterior (la cotización de "Galletas" borrada con la versión vieja de la app nunca
   devolvió sus insumos) — se me había escapado revisar la receta COMPLETA la vez pasada. Revisado
   insumo por insumo de la receta "Galletas" esta vez (consulta directa a la base de datos) y
   confirmados TODOS en su cantidad real de compra: Harina de trigo 1000/1000, Mantequilla Mavesa
   500/500, Azúcar Mayagüez Blanca 1000/1000, Huevos 30/30. El `vercel.json` con `Cache-Control`
   de la ronda anterior evita que esto se repita hacia adelante.
3. **Copy del tooltip de "Tus recetas"** reescrito con un ejemplo más concreto y claro (idea de la
   usuaria, pulida): hamburguesa armada con ingredientes directos, o con subrecetas, o con ambos.
- ⚠️ **Nota para toda sesión futura, no solo esta**: el usuario pidió explícitamente que TODA la
  comunicación sea en español — ya es una memoria del usuario (no solo de MargenPro), pero se deja
  anotado aquí también porque es la clase de instrucción que no debe olvidarse ni una vez.

## Cuarta ronda: HALLAZGO IMPORTANTE — el celular de la usuaria servía una versión vieja de la app (2026-11-24)
Tras la tercera ronda, la usuaria reportó: (a) no le gustó la luna nueva ("un + innecesario"), y
(b) tras eliminar sus 2 cotizaciones de prueba, el aviso de "se está acabando" seguía saliendo
aunque "no debería haber ninguna disminución sin ventas" — y por separado dijo que la pantalla de
carga "sigue siendo la anterior". Las 3 cosas, investigadas y resueltas (commit `56dbd03`, deploy
`dpl_9utYm3czt9b6yi2MstWzta1YbAQD`, ya en `margenpro-ochre.vercel.app`):

1. **Luna sin el "+"**: se quitó el destello (sparkle) que agregué en la ronda anterior — ahora es
   una luna creciente RELLENA (sólida), sin decoración extra. `AppLayout.tsx` + `PhoneFrame.tsx`.
2. **HALLAZGO REAL, no un bug de lógica — el celular de la usuaria estaba sirviendo una versión
   VIEJA de la app.** Se investigó directo en la base de datos (Supabase, proyecto
   `iguryohxkhsnaumzwcip`): la tabla `cotizaciones` ya NO tenía ninguna fila de "Galletas" (la
   había borrado), pero `Mantequilla Mavesa` seguía en 250/500g y `Huevos` en 29/30 — exactamente
   lo que consume UNA tanda de "Galletas" (250g mantequilla + 1 huevo, según `receta_insumos`).
   Es decir: SÍ había borrado una cotización vendida de Galletas, pero el inventario NO se le
   devolvió — la función que lo hace (agregada en la ronda anterior, commit `8b4360f`) no corrió
   para ella. Conclusión: su celular todavía tenía cargada una versión de la app de ANTES de ese
   deploy (consistente con que también viera la pantalla de carga vieja) — el navegador tenía
   cacheado el `index.html` viejo, que apuntaba al bundle de JS anterior. **Corregido para que no
   vuelva a pasar**: `vercel.json` ahora sirve `index.html` y `site.webmanifest` con
   `Cache-Control: no-cache, must-revalidate` — así el navegador siempre revisa si hay una versión
   nueva en vez de quedarse con una copia vieja guardada. **Y se corrigió el dato real de la
   usuaria ahora mismo** (una sola vez, por SQL directo): se le devolvieron los 250g de mantequilla
   y el huevo que le faltaban — su inventario ya quedó exacto.
3. La pantalla de carga "vieja" que seguía viendo es el mismo síntoma del punto 2 (index.html
   cacheado) — con el fix de cache-control debería verse la nueva en su próxima visita; si insiste,
   recomendarle cerrar la app desde "apps recientes" (no solo minimizarla) o quitarla y volverla a
   agregar a la pantalla de inicio, porque el ícono del acceso directo específicamente SÍ se cachea
   aparte en Android al momento de instalarla.

## Tercera ronda: aviso de info a puro toque, inventario al eliminar venta, pantalla de carga, luna e ícono +/- (2026-11-24)
Tras publicar la segunda ronda, la usuaria probó en su celular real y reportó 3 cosas más (más 2
pedidos sueltos que mandó aparte sobre la pantalla de carga y el ícono de luna). Todo quedó
corregido, verificado (`tsc` + `build` limpios) y desplegado (commit `8b4360f`, deploy
`dpl_AVpx57j2FvDxtc3Z54shkPKW6pvk`, ya en `margenpro-ochre.vercel.app`):

1. **El aviso de información seguía sin abrir al tocar en el celular real** — causa más probable:
   `InfoTooltip` dependía de `hover`/`foco` (pensado para mouse de escritorio) COMBINADO con el
   toque; en un celular real el orden exacto en que el navegador simula "mouseenter"/"mouseleave"
   al soltar el dedo puede no coincidir con cómo se probó en este entorno (el `computer` de esta
   sesión simula CLICS de mouse incluso en viewport "mobile", no toques reales — por eso el bug no
   se veía aquí). Se SIMPLIFICÓ: ahora es un solo estado (`abierto`), toggle puro al tocar, sin
   ninguna dependencia de hover/foco — elimina esa categoría entera de condiciones de carrera.
   También se agrandó el ÁREA TÁCIL real del ícono a 44×44 (antes 16×16 — muy chico para acertarle
   con el dedo, aunque el ícono se siga VIENDO igual de chico) con un `::before` invisible.
2. **Al eliminar una cotización "vendida", los insumos no regresaban al inventario** — se agregó:
   si la cotización que se borra estaba vendida, se le devuelven sus insumos automáticamente
   (mismo mecanismo que ya existía al cambiarle el estado de "vendida" a otra cosa), con aviso
   explícito ANTES de borrar ("hazlo solo si fue una venta equivocada o duplicada, no para
   'deshacer' una venta real") y un mensaje de éxito que lo confirma. Las no-vendidas no tenían
   nada descontado, así que no les aplica.
3. **Ícono +/- de tamaño de letra muy pegado a la "A"** — se le dio más separación (viewBox más
   ancho, de 24 a 30 unidades).
4. **Pantalla de carga/splash fea al abrir la app instalada**: el manifest declaraba el ícono como
   `purpose: "maskable"` usando el MISMO archivo que el ícono normal (sin zona segura de margen) —
   Android le aplica su propia máscara/zoom y terminaba recortando y pixelando el ícono (la captura
   de la usuaria mostraba la punta de la flecha cortada). Se quitó ese "purpose" del manifest, y
   además se agregó una pantalla de carga propia en `index.html` (fuera del bundle de React, se ve
   desde el primer instante): el isotipo + "MargenPro" en la tipografía de marca + "Costea · Cotiza
   · Vende" — se reemplaza sola en cuanto React termina de montar la app real.
5. **Ícono de luna "muy plano"**: antes era solo un arco sin nada más; ahora es una luna con un
   destello pequeño al lado (mismo estilo de trazo que el sol, para que ambos se vean a la par).
- Verificado en el navegador bajo viewport móvil: el aviso abre y cierra correctamente al tocar
  (confirmado con medición directa del DOM, no solo mirando la pantalla), el área táctil mide
  44×44 de verdad, y los dos íconos nuevos (+/- y luna) tienen el `path` SVG esperado. No se pudo
  verificar con una captura pixel-perfecta por una limitación de la herramienta de zoom de este
  entorno (desajuste de coordenadas), pero el contenido y comportamiento están confirmados.

## Segunda ronda: InfoTooltip de verdad a prueba de zoom (portal fuera de body), borrar cotización, ícono +/-, insumo agotado en rojo (2026-11-24)
Tras la ronda anterior, la usuaria confirmó que el aviso de información TODAVÍA salía mal ubicado
con letra grande — y pidió 3 cosas más. Las 4 quedaron resueltas, verificadas (`tsc` + `build`
limpios, además de una prueba real en navegador bajo `zoom:1.3` con medición de coordenadas, no
solo mirar la pantalla) y desplegadas a producción (commit `5c4231f`, deploy
`dpl_89FtidWZvnVMnUfHDWUPWKQ3MqcF`, ya en `margenpro-ochre.vercel.app`):

1. **HALLAZGO IMPORTANTE — `position:fixed` TAMBIÉN se distorsiona con `zoom`, no solo los px
   calculados en JS.** El arreglo anterior de `InfoTooltip` (posición relativa al ícono con 3
   clases CSS) sí evitó el bug original, pero cuando se probó la idea de centrar el aviso con
   `position:fixed; inset:0` (para que "no se moviera de la pantalla principal"), se midió con
   `getBoundingClientRect()` bajo `zoom:1.3` y el cuadro de fondo terminaba midiendo **1371px de
   alto en una pantalla de 812px** — es decir, `position:fixed` DENTRO de un elemento con `zoom`
   tampoco es zoom-safe en Chromium (el motor trata el contenido de adentro como si viviera en un
   lienzo más chico y lo vuelve a escalar al pintar, así sea "fixed"). La única solución real:
   sacar el aviso COMPLETAMENTE de `<body>` (que es donde vive el `zoom` — ver
   `src/lib/useTamanoTexto.ts`) con un `createPortal` de React a un nodo colgado directo de
   `<html>`. Reescrito `InfoTooltip.tsx`: ya no se posiciona relativo al ícono en absoluto — se
   muestra como un cuadro fijo y centrado en medio de la pantalla real, con fondo oscuro que se
   cierra al tocar. Verificado con medición real: el cuadro quedó con las coordenadas exactas del
   centro de un viewport de 375×812 (`fondoRect` 0,0,375,812 — ya no 1371px). Esta regla (nada de
   `position:fixed`/`absolute` con medidas de pantalla completa DENTRO del subárbol de `<body>`
   mientras exista el `zoom` del tamaño de letra) aplica a cualquier futuro overlay de pantalla
   completa en esta app — usar portal fuera de `body`, no fixed/absolute normal.
2. **Botón para eliminar una cotización directo desde la lista** (se enviaba repetida o quedaba
   mal armada): ícono de papelera en cada tarjeta de `Cotizaciones.tsx`, con confirmación inline
   (mismo patrón que "Eliminar esta receta"). Nueva función `eliminarCotizacion` en `appStore.tsx`
   — borra solo la fila de `cotizaciones`; sus `cotizacion_items` se van solos por la cascada que
   ya existía en `supabase/schema.sql` (`on delete cascade`).
3. **Ícono de tamaño de letra**: la flecha junto a la "A" se cambió por un "+" y un "−" (más
   intuitivo) — en `AppLayout.tsx` (la app) y `PhoneFrame.tsx` (onboarding/login/paywall).
4. **Insumo agotado vs. insumo bajo**: antes TODO el rango (bajo pero con algo, o completamente en
   0) salía igual, en naranja, como "se está acabando". Ahora, cuando el stock llega a 0 exacto,
   sale en ROJO con "ya se agotó" — distinto del naranja "se está acabando" (que sigue para cuando
   queda poco pero no cero). Nueva función `stockAgotado` en `appStore.tsx` junto a la ya
   existente `stockEsBajo`; aplicado en el letrero de arriba de Insumos (ahora dos banners
   separados: agotados en rojo primero, bajos en naranja después), en la fila de cada insumo de la
   lista, y en el detalle del insumo.
- No se pudo probar con datos reales de la usuaria (sigue sin sesión local ni Chrome conectado en
  este momento de la sesión) pero sí con mediciones reales en el navegador bajo zoom — es
  verificación más fuerte que la ronda anterior, que solo tuvo verificación de código.

## Ronda de 4 pedidos tras probar en vivo: overflow con letra grande, tooltip mal ubicado, Ajustes y precio sin actualizar (2026-11-24)
La usuaria probó la app con "Muy grande" activo y mandó una captura + 4 puntos en un solo mensaje.
Los 4 quedaron corregidos, verificados (`tsc` + `build` limpios) y desplegados a producción
(commit `749a4c9`, deploy `dpl_EHch4n9cFszbdDNzGDaqASKGsGQW` ya en `margenpro-ochre.vercel.app`):

1. **Overflow horizontal en Cotizar con letra "Muy grande"**: la fila de producto (selector +
   cantidad) no envolvía — con un nombre de receta largo más la letra agrandada, se salía de la
   pantalla por ambos lados (captura de la usuaria lo mostraba). Arreglado en `Cotizaciones.tsx`:
   `flexWrap:'wrap'` en el contenedor, `minWidth:0` en el `<select>`, `flexShrink:0` en el input de
   cantidad.
2. **Hallazgo real de fondo (no solo "falta el aviso"): CSS `zoom` duplica cualquier posición en
   píxeles calculada por JS.** El tamaño de letra grande/muy grande de esta app usa
   `document.body.style.zoom` (no solo `font-size`) — y el navegador reescala TODOS los valores en
   px de los elementos de adentro, incluido un `top`/`left` puesto a mano desde JavaScript. El
   `InfoTooltip` viejo calculaba su posición con `getBoundingClientRect()` y la volvía a escribir
   como estilo en línea — por eso el globo de texto aparecía lejos de su ícono con letra grande (la
   usuaria lo describió exacto: "sale muy arriba, no donde debe ser"). Reescrito completo
   (`InfoTooltip.tsx`/`.css`): ya no calcula ni copia ningún píxel — usa `position:absolute` fijo
   respecto al propio ícono, y JS solo elige entre 3 clases CSS (`centro`/`izquierda`/`derecha`)
   según si el tooltip chocaría con el borde de la pantalla. Verificado con una prueba aislada
   (medí el hueco real entre ícono y globo bajo zoom 1.3: quedó en ~10px, correcto) — esta regla
   (nunca escribir un px calculado por JS dentro de un elemento con `zoom` encima) vale para
   cualquier posición futura calculada en JS en esta app.
3. **Ajustes tenía 3 botones redundantes de tamaño de letra** (Normal/Grande/Muy grande) que
   duplicaban el botón "Aa" que ya existe en el encabezado — quitados junto con el hook ya sin uso.
4. **Precio de la receta en la lista no reflejaba "Incluir mi tiempo"**: iba por la pestaña Recetas
   después de guardar con el interruptor encendido, y el precio en la LISTA seguía siendo el de solo
   insumos. Era el mismo bug de parámetro fijo en `false` que ya se había corregido 2 veces este
   mes en `Cotizaciones.tsx` — faltaba esta 3ª instancia en la vista de lista de `Recetas.tsx`
   (línea ~609). Confirmado por grep que ya no queda ningún `costear(...)` en todo el código sin
   este parámetro.
   - Aprovechando el mismo pedido: también se quitó el subtítulo "Apagado por defecto..." de ese
     interruptor (ya lo explica el ícono de información) y se le dio más aire al último control
     antes del botón "Calcular precio" (la barra de navegación flotante quedaba casi pegada).
5. **De paso, el ícono de sol/luna (modo oscuro/claro) estaba al revés**: mostraba el ícono del modo
   ACTUAL en vez de a dónde vas a pasar al tocarlo (la convención estándar). Corregido en
   `AppLayout.tsx` (la app) y `PhoneFrame.tsx` (onboarding/login/paywall): modo claro → luna (vas a
   oscuro), modo oscuro → sol (vas a claro).
- ⚠️ **No se pudo tomar una captura a 375px con datos reales de esta ronda específica**: la sesión
  local no tenía usuario logueado (sin acceso al correo para el enlace mágico) y la extensión de
  Chrome conectada al navegador real de la usuaria no respondió en este momento de la sesión. El
  fix de overflow y el de precio-en-lista son correcciones de CSS/lógica directas y se verificaron
  por código + `tsc`/`build`; el de InfoTooltip sí tiene verificación empírica del gap real bajo
  zoom. Pendiente: que la usuaria confirme en la app real que los 4 puntos quedaron resueltos.

## Ayuda en línea en los 3 controles que más confunden (en vez de un tutorial aparte, 2026-11-24)
La usuaria preguntó si se podía agregar un tutorial para lo que puede confundir de entrada a un
cliente nuevo — en vez de un recorrido guiado completo (que casi nadie lee), se agregó el mismo
ícono ⓘ ya usado hoy en Recetas, con una explicación de una frase + ejemplo concreto, justo al
lado de los 3 controles de dinero que más pueden confundir:
- **Ajustes → "Usar mis gastos reales"**
- **Cotizar → "Incluir mis costos fijos y variables"**
- **Recetas → "Incluir mi tiempo en este cálculo"** (con el ejemplo numérico: 2 horas × $8.000 = $16.000)
- Probado en vivo (Ajustes y Recetas): el cuadro de texto abre correctamente y completo; el de
  Cotizaciones usa el mismo componente ya verificado dos veces hoy, no se re-probó visualmente por
  falta de una receta de ejemplo en esa sesión de pruebas.
- `npx tsc --noEmit` y `npm run build` limpios.

## 4 pedidos de la usuaria resueltos de una vez (2026-11-24)
1. **Redirección automática si ya hay sesión**: antes, la dirección raíz (`/`) siempre mostraba la
   página de ventas, incluso con sesión activa. Ahora `Landing.tsx` revisa la sesión al entrar y,
   si existe, manda directo a `/app` (sin mostrar la landing ni un parpadeo de contenido).
2. **La app se puede "instalar" en la pantalla de inicio del celular** (PWA básica, sin tienda de
   apps): se generó el ícono real de la marca (recortado de la imagen que dio la usuaria, el
   isotipo teal con la M/flecha) en los tamaños que piden los sistemas — `public/icon-192.png`,
   `icon-512.png`, `apple-touch-icon.png` (180px), `favicon-32.png` — y `public/site.webmanifest`
   con nombre "MargenPro", `display: standalone` (abre sin la barra del navegador) y
   `start_url: /app`. Enlazado en `index.html`. Al "Agregar a pantalla de inicio" (Android) o
   "Añadir a inicio" (iPhone), el ícono y nombre que aparecen ya son los reales.
3. **Botón "Entrar" de la landing, antes un enlace de texto chiquito**, ahora es un botón real con
   borde (`.entrar` en `Landing.css`) — más fácil de encontrar para quien ya tiene cuenta.
4. **Bug real: las horas de trabajo nunca se guardaban** (probado en vivo end-to-end: se creó una
   receta con 2 horas + el interruptor activado, se guardó, se confirmó en la base de datos
   `incluir_mano_de_obra=true`, y en Cotizaciones el precio salió idéntico — $38.050 — al que se
   vio al calcularla en Recetas; datos de prueba limpiados después) — el interruptor "Incluir mi tiempo en
   este cálculo" (modo sencillo) era solo un estado temporal de la pantalla, nunca se escribía en
   la base de datos. Por eso, al cotizar esa receta (o incluso al volver a editarla), el interruptor
   aparecía apagado y el costo de las horas desaparecía. Arreglado de punta a punta: nueva columna
   `recetas.incluir_mano_de_obra` (migración aplicada), `Receta.incluirManoDeObraEnSencillo` en
   `types.ts`, se lee/escribe en `appStore.tsx`, se restaura al editar y se usa en `Cotizaciones.tsx`
   en vez del `false` fijo que tenía antes.
- `npx tsc --noEmit` y `npm run build` limpios.

## InfoTooltip: el cuadro de texto se salía de la pantalla (hallazgo de la usuaria, 2026-11-24)
En Recetas, cuando el ícono ⓘ quedaba cerca del borde derecho de un celular (el texto del
subtítulo lo empuja ahí según cuánto ocupe), el cuadro de "Ejemplos..." se salía de la pantalla y
quedaba cortado — porque siempre se centraba exactamente sobre el ícono sin importar el espacio
disponible. Arreglado en `src/components/InfoTooltip.tsx`:
- La posición del cuadro ahora se calcula en JavaScript (con la posición real del ícono en la
  pantalla) y se recorta para que SIEMPRE quede completo dentro del ancho visible, con 12px de
  margen mínimo a cada lado.
- Pedido explícito de la usuaria: tocar el cuadro de texto (no solo el ícono) también lo cierra.
- Se quitó la flechita que apuntaba al ícono (ya no tenía sentido con la posición recortada;
  simplifica el componente sin perder claridad).
- Probado en vivo a 375px: el cuadro queda completo y legible, y se cierra al tocarlo.
- `npx tsc --noEmit` y `npm run build` limpios.

## Cotizaciones: 2 bugs reales con subrecetas, encontrados por la usuaria (2026-11-24)
La usuaria probó cotizar una receta armada SOLO con una subreceta (sin insumos directos — ej.
"Mini Donitas X9 Unidades" hecha con la subreceta "Masa Base X1Uni") y el precio a cobrar no
aparecía (salía en $0, invisible en la práctica). También notó que las subrecetas aparecían
seleccionables en la lista de productos a cotizar, cuando nunca se venden solas. Ambos arreglados
en `src/pages/app/Cotizaciones.tsx`:
- **Causa raíz real del precio en $0**: al calcular el precio de cada fila de la cotización
  (`montoVivoFila` y `calcularItems`), se llamaba a `costearReal`/`costearSimple` sin pasarle
  `receta.subrecetasUsadas` — así que para una receta hecha solo de subrecetas, el costo
  calculado daba exactamente $0 (ni insumos directos ni subrecetas contaban). Arreglado pasando
  ese dato en las dos llamadas.
- **Las subrecetas ya no aparecen** en el selector de producto a cotizar ni en los contadores
  relacionados — se filtran con `recetas.filter(r => !r.esSubreceta)` justo al leer el store,
  así el resto del archivo (que ya usaba `recetas` en 7 lugares distintos) quedó corregido sin
  tener que tocar cada uno por separado.
- `npx tsc --noEmit` y `npm run build` limpios.

## Barra de navegación inferior rediseñada (referencia visual de Pinterest, 2026-11-24)
La usuaria sintió la barra inferior de la app "plana, sin vida" y dio 2 referencias de Pinterest
(barra flotante tipo pastilla + indicador que se desliza entre íconos). Construido en
`src/components/AppLayout.tsx` + `AppLayout.css`:
- La barra dejó de estar pegada borde a borde — ahora flota con margen, totalmente redondeada
  (`border-radius: 999px`), con sombra propia.
- Nuevo indicador deslizante (`.tabbar-indicador`): un div que se mueve con `transform: translateX`
  animado hasta el ícono activo (calculado con `useLocation()` de react-router) — reemplaza el
  viejo "cambio de color plano" por una animación real de desplazamiento.
- Micro-interacción nueva: el ícono activo crece levemente y cualquier toque de pestaña se encoge
  un poco al presionar (`:active { transform: scale(.92) }`).
- Probado en vivo en producción (cuenta real de la usuaria): el indicador se desliza
  correctamente de una pestaña a otra.
- `npx tsc --noEmit` y `npm run build` limpios.
- ⚠️ **Pendiente, hallazgo real sin resolver todavía**: en Ajustes, el interruptor "Usar mis gastos
  reales" se ve APAGADO en pantalla pero la base de datos de la cuenta real de la usuaria tiene
  guardado `modo_calculo='real'` (prendido) — un desajuste entre lo que se ve y lo que está
  guardado. Encontrado mientras se grababa un GIF de demostración para la landing (se cambió
  temporalmente a 'simple' para esa grabación y se devolvió a 'real' al terminar, sin tocar nada
  más). Falta diagnosticar la causa raíz en `Ajustes.tsx` (probablemente el estado local del
  interruptor no se sincroniza bien con `store.cfg` tras cargar).
- Pendiente explícito de la usuaria: está definiendo más ajustes visuales (ya vio 2 referencias de
  Pinterest, puede traer más) antes de grabar un GIF nuevo para "La app por dentro" de la landing
  — no grabar hasta que ella confirme que terminó de iterar el diseño.

## Recetas vs subrecetas: textos más claros con ejemplos (hallazgo del mismo cliente potencial, 2026-11-24)
El cliente potencial, ya dentro de la app, no entendía para qué servía cada botón ("+ Costear
receta nueva" vs "+ Agregar subreceta"). Se le presentaron 3 propuestas de texto a la usuaria; eligió
una combinación: el subtítulo en forma de pregunta-guía + un ícono ⓘ que al tocarlo muestra ejemplos
concretos — pidió que los DOS ejemplos (Hamburguesa y Caja de mini donas) aparezcan en ambos lados.
- **"Tus recetas"**: subtítulo "¿Qué le vas a vender a tu cliente? Aquí armas el producto final —
  con ingredientes directos, con subrecetas, o con ambos." + ⓘ "Ejemplos: una Hamburguesa armada
  directo con pan + carne, o una Caja de mini donas armada con las subrecetas Masa base +
  Decoración + Empaque."
- **"Tus subrecetas & adicionales"**: subtítulo "¿Tienes partes que repites en varias recetas?
  Agrégalas aquí UNA vez y úsalas en todas las recetas que quieras — nunca se venden solas." + ⓘ
  "Ejemplos: el pan y la carne que arman una Hamburguesa, o la Masa base y el Empaque que arman una
  Caja de mini donas. Solo llevan su costo, sin ganancia — la ganancia se agrega en la receta
  completa de arriba."
- **Mejora real al componente `InfoTooltip.tsx`** (ya usado en el panel de admin, reutilizado
  aquí): antes solo se abría con el mouse encima o con foco de teclado — en celular eso no sirve
  (no hay "hover"). Ahora también se puede TOCAR para fijarlo abierto/cerrado. Al construirlo se
  encontró un bug sutil (tocar con el mouse YA encima lo cerraba de inmediato) — arreglado
  separando "hover" (vista previa de escritorio) de "fijado" (toque), combinados sin pisarse.
- Probado en vivo: los dos íconos abren y cierran su globo de texto correctamente, sin romper el
  diseño de la pantalla.
- `npx tsc --noEmit` y `npm run build` limpios.

## Tamaño de letra ajustable — accesibilidad (hallazgo del mismo cliente potencial, 2026-11-24)
El cliente potencial de la usuaria le dijo que la letra se le hacía muy pequeña. Se agregó un
control de tamaño de letra con 3 niveles (Normal / Grande / Muy grande) que escala TODA la
interfaz de forma proporcional (letra, íconos, espaciados juntos) — así el diseño nunca se ve
"roto" ni desordenado, solo más grande, igual que el zoom nativo de un celular.
- **Nuevo** `src/lib/useTamanoTexto.ts`: hook reutilizable que aplica la escala con la propiedad
  CSS `zoom` sobre toda la página y recuerda la elección en este dispositivo (como ya pasa con el
  modo oscuro — es una preferencia del aparato, no del negocio, no se guarda en Supabase).
- **Dónde se puede cambiar**: un botón nuevo "Aa" junto al de modo oscuro, visible desde el primer
  momento — landing/onboarding/paywall/login (`PhoneFrame.tsx`) y dentro de la app ya con sesión
  (`AppLayout.tsx`) — cicla entre los 3 tamaños y muestra un aviso breve ("Letra: Grande"). Además,
  en Ajustes hay una sección "Tamaño de letra" con los 3 botones explícitos, por si alguien no nota
  el ícono pequeño.
- Probado en vivo en varias pantallas (onboarding, Ajustes) en los 3 niveles: la interfaz escala
  completa, sin desbordes ni elementos descuadrados, barra inferior fija incluida.
- ⚠️ Nota técnica para el futuro: `zoom` no es un estándar CSS universal — funciona en Chrome,
  Edge y Safari (las mayorías de los celulares de LATAM), pero Firefox de escritorio lo soportó
  solo recientemente. Si algún día aparece un reporte de que no funciona en un navegador específico,
  empezar por revisar ahí.
- `npx tsc --noEmit` y `npm run build` limpios.

## Onboarding: preguntas redundantes al comprar por docena/paquete (hallazgo del mismo cliente potencial, 2026-11-24)
Tras el arreglo anterior (cantidad comprada + total pagado), la usuaria reportó que su cliente
también notó que, al elegir "Docena" o "Paquete", la app preguntaba dos cosas que se sentían
repetidas: "¿cuántas unidades trae?" y luego "¿cuántas piezas individuales compraste?" — si ya dijo
que una docena trae 12, es obvio que comprar "una docena" son 12 piezas; obligarlo a multiplicar
él mismo rompía la promesa de "sin matemática".
- **Arreglado** en `src/pages/Onboarding.tsx`: ahora se pregunta directamente por LOTES — "¿Cuántas
  docenas compraste?" / "¿Cuántos paquetes o cajas compraste?" (no por piezas sueltas) — y debajo
  aparece de inmediato "= 24 piezas en total" (o el número que corresponda) para que la persona
  confirme que entendió bien, sin tener que calcularlo. Para "Docena" ya no se pregunta "¿cuántas
  unidades trae?" (siempre son 12, es un hecho fijo, no una pregunta); para "Paquete" sí se
  mantiene esa pregunta (el tamaño del paquete sí varía de negocio a negocio).
- Interna: `precioPorUnidadDesdeCompra` (la misma función que ya usa la pantalla real de Insumos)
  sigue esperando piezas sueltas — la conversión de lotes a piezas ahora se hace dentro de
  `agregarInsumo` antes de llamarla, sin tocar esa función compartida.
- Probado en vivo: "Pan para hamburguesa", 2 docenas por $24.000 → confirma "24 piezas en total",
  calcula $1.000 por pieza, y el costeo final de la receta salió matemáticamente correcto ($1.350
  de costo real usando 1 pieza, igual a 1.000 × 1,35).
- `npx tsc --noEmit` y `npm run build` limpios.

## Onboarding: faltaba decir cuánto se compró de cada insumo (hallazgo de un cliente potencial, 2026-11-24)
La usuaria le mostró la app a un cliente potencial, probando el onboarding en vivo. Él notó que al
agregar sus 3 ingredientes no había forma de decir "compré 2 kilos" — solo se pedía un "precio de
compra" directo, que en la práctica obligaba a la persona a calcular mentalmente el precio por kilo
antes de escribirlo. Esto podía sembrar duda sobre si la cotización final era real.
- **Arreglado** en `src/pages/Onboarding.tsx`: el formulario de cada insumo ahora pregunta
  "¿Cuántos [kilos/gramos/litros/piezas…] compraste?" y "¿Cuánto pagaste en total por esa compra?"
  — exactamente como ya funciona en la pantalla real de Insumos de la app — y MargenPro calcula
  solo el precio por unidad (reutilizando `precioPorUnidadDesdeCompra` de `appStore.tsx`, sin
  duplicar esa lógica). La tarjeta de cada insumo agregado ahora muestra "2 kg · $24.000" en vez de
  un precio por kilo ya calculado, para que la persona vea reflejado exactamente lo que compró.
- Probado en vivo con un caso real (2 kg de harina por $24.000 → $12.000/kg): el costo y precio
  sugerido salieron matemáticamente correctos.
- `npx tsc --noEmit` y `npm run build` limpios.

## Faltaba un botón para cerrar sesión (hallazgo real de la usuaria probando en su celular, 2026-11-24)
La usuaria probó el recorrido completo (onboarding → paywall → "Probar X días gratis") en su propio
celular y notó que entraba directo a la app sin pedirle el correo. No era un bug del flujo nuevo:
su celular ya tenía su propia sesión abierta de antes (de cuando se probó "Continuar con Google"),
y la app — correctamente — no le vuelve a pedir el correo a alguien que ya está adentro. Confirmado
mirando los registros del servidor: coincide justo con su cuenta real iniciando sesión a esa hora.
- **El problema real que esto dejó ver**: en toda la pantalla de Ajustes NO había ninguna forma de
  cerrar sesión — la única opción para "salir" de la cuenta era "Eliminar mi cuenta" (borrarla para
  siempre). Ya arreglado: nuevo botón "Cerrar sesión" en Ajustes (antes de la zona de eliminar
  cuenta), mismo patrón ya usado en el panel de admin.
- `npx tsc --noEmit` y `npm run build` limpios. Probado en vivo (dev local): el botón cierra la
  sesión y manda a la pantalla de "Tu correo" como corresponde.
- Publicado en producción (`https://margenpro-ochre.vercel.app`).

## Subrecetas & adicionales — construido, probado y arreglado un bug real de permisos (2026-11-23)
Idea propuesta por la usuaria (poder armar una receta final a partir de piezas reutilizables ya
costeadas — masa base, decoración, empaque — en vez de repetir insumos cada vez). Se construyó
completo:
- **Modelo de datos**: `recetas` ganó `es_subreceta` (true = es una subreceta/adicional, solo lleva
  su costo de insumos, sin margen, nunca se cotiza sola). `receta_insumos` ahora acepta filas de
  insumo O de subreceta (nunca ambas) — una subreceta **solo** puede llevar insumos, nunca otra
  subreceta adentro, a propósito, para que nunca se pueda armar una cadena circular.
- **UI** (dentro de la misma pantalla de Recetas, sin ítem nuevo en la barra inferior, tal como lo
  pidió la usuaria): sección "Tus subrecetas & adicionales" separada de "Tus recetas", con el aviso
  explícito de que las subrecetas nunca se costean con margen ni se cotizan solas. El constructor
  de receta final tiene una sección opcional "Subrecetas que usas" (cantidad en "tandas": 1 = toda
  la preparación) además de los insumos directos.
- **El tope de 3 recetas gratis cuenta solo recetas finales**, nunca subrecetas — decisión tomada
  al construir, documentada aquí.
- 🔴 **Bug real encontrado y arreglado en la verificación en vivo**: al guardar la primera receta
  final con una subreceta, Supabase devolvía 403 y la receta se revertía sola. Causa: la política
  de seguridad (RLS) de `receta_insumos` para insertar/editar nunca se actualizó al agregar las
  subrecetas — seguía exigiendo que `insumo_id` perteneciera al usuario, y en una fila de subreceta
  ese campo es nulo, así que la condición fallaba siempre. Arreglado (migración aplicada en
  Supabase + reflejado en `supabase/schema.sql`): ahora la política acepta la fila si el insumo
  referenciado es del usuario, O si la subreceta referenciada es del usuario y de verdad es una
  subreceta.
- Probado en vivo de punta a punta con la cuenta de prueba: creé la subreceta "Masa base para
  donas" (9 unidades, $420 de costo) y la receta final "Caja x9 mini donas sencillas" usándola a
  1 tanda — el desglose mostró "Incluye tus subrecetas: $420" y el precio sugerido ($840 con 50%
  de margen) salió exacto; la receta final quedó guardada y visible en "Tus recetas", la subreceta
  en su propia sección. Datos de prueba limpiados después.
- `npx tsc --noEmit` y `npm run build` limpios.

## Paywall conectado a los enlaces de pago reales de Hotmart (2026-11-23)
Se consiguieron los dos enlaces reales (no sirve uno solo por plan — cada "oferta" de Hotmart
tiene su propio enlace, no hay un selector Mensual/Anual dentro de Hotmart; la elección ya la
hace el usuario en nuestro propio Paywall):
- Mensual: `https://pay.hotmart.com/W108606053T?off=xya1906q`
- Anual: `https://pay.hotmart.com/W108606053T?off=qmle1zp9`
Guardados en `src/lib/hotmart.ts`. Flujo conectado: al tocar "Probar 7 días gratis" en el Paywall
se guarda la intención del plan elegido (localStorage); después de que el Login confirma la
sesión (por enlace mágico o Google), si había esa intención, en vez de ir directo a `/app` se
muestra una pantalla breve ("¡Ya tienes tu cuenta!") con un botón que abre el enlace de pago
correcto en una pestaña nueva, recordándole usar el MISMO correo — así el webhook de Hotmart (ya
conectado) encuentra la cuenta cuando confirme el pago. El botón "Seguir con el plan gratis" NO
guarda ninguna intención, sigue yendo directo a la app.
- ⚠️ Bug real encontrado y arreglado en el camino: en modo desarrollo (React StrictMode) el efecto
  de Login.tsx corría dos veces al montar, y la segunda pasada encontraba la intención ya borrada
  por la primera y mandaba a la persona a `/app` en vez de a pagar. Se protegió con una bandera
  (`useRef`) para que solo la primera pasada decida a dónde ir.
- Probado en vivo end-to-end (con una cuenta de prueba ya logueada): la pantalla de pago aparece
  con el correo correcto y el botón apunta exactamente al enlace del plan elegido (Anual).
- `npx tsc --noEmit` y `npm run build` limpios.

## Idea pendiente, aprobada en principio: recetas compuestas por otras recetas (combos)
La usuaria propuso poder armar una receta a partir de otras recetas ya costeadas (ej.: "Combo
hamburguesa" = receta "Hamburguesa" + receta "Papa" + receta "Jugo"), en vez de repetir insumos.
Mi opinión, ya compartida con ella: es una buena idea, muy común en el nicho (comida rápida,
catering, combos) — pero es un cambio de fondo del modelo de datos (hoy una receta solo referencia
insumos, nunca otras recetas), no un ajuste de pantalla. Pendiente de diseñarlo bien (evitar
referencias circulares, cómo se ve el costo compuesto, qué pasa si se edita la subreceta después)
en una sesión aparte, después de Hotmart y de arrancar marketing — NO se empezó a construir.

## Rediseño del motor de costeo (modo sencillo y avanzado) — aprobado y construido (2026-11-23)
La usuaria sentía "ruido" en el modo avanzado y pidió revisar la lógica de los dos modos antes de
tocar código — se le presentó una propuesta completa (fórmulas, ejemplos, tabla de cómo se dispara
el precio) y la aprobó. Cambios reales en `src/lib/costeo.ts`, `appStore.tsx`, `Recetas.tsx` y
`Ajustes.tsx`:
- **Arreglado un defecto real del "modo sencillo"**: usaba un multiplicador fijo escondido
  (×1,35 sobre los insumos) que ignoraba el control de margen de la receta y nunca contaba la
  mano de obra. Ahora el costo base es solo insumos (+ mano de obra si el usuario prende el
  interruptor opcional) y el margen de la receta SÍ decide el precio, en los dos modos.
- **Interruptor nuevo en modo sencillo** ("Incluir mi tiempo en este cálculo"), apagado por
  defecto — solo visible cuando el modo global es "simple". Verificado en vivo: con 2 horas a
  $8.000, el costo sube exactamente $16.000 y se explica en pantalla.
- **Alerta nueva en modo avanzado**: cuando gastos fijos + variables + margen llegan a 70% o más
  (antes del límite duro de 97% que ya existía), se muestra un aviso amarillo explicando que el
  precio se puede alejar mucho de la competencia. Verificado en vivo con 30%+15%+50%=95%.
- **Topes bajados en Ajustes** para que sea más difícil llegar a una suma disparada sin querer:
  gastos fijos máximo 40% (antes 80%), otros gastos variables máximo 20% (antes 80%). Se agregó
  una tarjeta permanente explicando por qué conviene que la suma total no pase de 60-65%.
- A propósito, por pedido explícito de la usuaria, NO se agregó ningún texto para "cliente nuevo
  sin historial" — se mantuvo solo el ejemplo con historial real que ya existía.
- `npx tsc --noEmit` y `npm run build` limpios. Probado en vivo con datos reales (no solo
  revisado el código): los dos modos, el interruptor y la alerta funcionan como se diseñaron.

## "Deshacer factura" no revertía de verdad (bug real reportado por la usuaria, 2026-11-23)
`deshacerFactura` solo devolvía el precio anterior del insumo — el stock que el escaneo había
sumado y el gasto que quedó contando para "este mes" en Panorama se quedaban aplicados, aunque
la usuaria hubiera deshecho el escaneo. Arreglado:
- Nuevas columnas en `insumo_precio_historial`: `stock_sumado` (cuánto stock sumó ese escaneo,
  para poder restarlo exacto al deshacer) y `insumo_creado` (si el escaneo creó un insumo nuevo
  en vez de actualizar uno existente).
- `confirmarItemFactura` y `crearInsumoDesdeFactura` (`appStore.tsx`) ahora guardan esos datos;
  `registrarCompraInsumo` ahora recibe el `facturaId` para que el gasto quede ligado a esa
  factura y se pueda borrar al deshacer.
- `deshacerFactura` reescrito: resta el stock exacto que había sumado, borra las filas de
  `compras_insumo` de esa factura (el gasto del mes vuelve a su valor real) y, si el escaneo
  había creado un insumo nuevo, lo borra por completo (a menos que ya esté en uso en una receta,
  en cuyo caso se deja para no romper esa receta).
- Verificado matemáticamente con una simulación directa en la base de datos: stock, precio y
  gasto del mes vuelven exactamente a su valor original después de deshacer.
- Aclarado con la usuaria: el tope de 30 escaneos al mes cuenta cuántas veces se le pidió a la IA
  que lea una foto (eso cuesta dinero siempre), no cuántos insumos quedaron guardados — deshacer
  un escaneo NO devuelve ese cupo, es el comportamiento correcto.
- `npx tsc --noEmit` y `npm run build` limpios.

## Login con Google activado de verdad (2026-11-23)
Se encontró un bug real al probar el botón "Continuar con Google": el proveedor de Google nunca
había estado activado en Supabase (no era algo que se rompió al publicar, ya estaba así desde
antes). Se resolvió completo con la usuaria, paso a paso:
- Se creó el proyecto "MargenPro" en Google Cloud (console.cloud.google.com) + pantalla de
  consentimiento OAuth (externa) + un cliente OAuth tipo "Aplicación web".
- Orígenes de JavaScript autorizados: `https://margenpro-ochre.vercel.app` y
  `https://iguryohxkhsnaumzwcip.supabase.co`. URI de redirección autorizada:
  `https://iguryohxkhsnaumzwcip.supabase.co/auth/v1/callback`.
- El ID de cliente y el secreto los copió y pegó la usuaria directamente en Supabase
  (Authentication → Providers → Google) — nunca pasaron por el chat.
- Se completó "Información de marca" (página principal, política de privacidad, términos) y se
  cambió el estado de publicación de "Prueba" a "Producción" — sin este paso, Google solo dejaba
  entrar a correos agregados a mano como "usuarios de prueba", bloqueando a cualquier cliente real.
- Verificado en vivo en producción: el botón ya redirige de verdad a la pantalla de Google (antes
  daba `"Unsupported provider: provider is not enabled"`).
- ⚠️ **Pendiente para cuando se compre el dominio real**: agregar el dominio nuevo en "Orígenes
  autorizados de JavaScript" de este mismo cliente OAuth (Google Cloud), si no el botón dejaría
  de funcionar desde esa dirección.

## App publicada en internet + webhook de Hotmart conectado (2026-11-23)
- **MargenPro ya está publicada de verdad**: https://margenpro-ochre.vercel.app (dirección
  gratuita de Vercel, mientras se compra el dominio real). Proyecto creado en Vercel
  (`prj_KlJ1eCu0SNEVgmXyf3TmcDvd2Vct`, equipo `94marshapril-7125`), conectado al repo de GitHub
  — cada push a la rama de trabajo despliega sola una nueva versión en 1-2 minutos.
  - Variables de entorno configuradas en Vercel: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
    (son públicas por diseño, protegidas por RLS — no son secretas).
  - ⚠️ **Arreglado un bug real encontrado al publicar**: faltaba `vercel.json` con el rewrite a
    `index.html` — sin él, entrar DIRECTO a cualquier ruta interna (`/login`, `/app`, etc., no
    pasando primero por `/`) daba error 404. Ya está arreglado y verificado en producción.
  - ⚠️ **Importante para la próxima sesión**: el proyecto de Vercel quedó configurado con rama de
    producción `master`, pero casi todos los commits de esta sesión se suben a la rama del Pull
    Request abierto (`ajustes-landing-paywall-panorama`), que va adelante de `master`. Por ahora
    cada publicación se hace con un despliegue manual indicando esa rama explícitamente
    (`create_deployment` con `gitSource.ref: "ajustes-landing-paywall-panorama"` y
    `target: "production"`) — si se empieza a usar únicamente `git push` esperando que Vercel
    despliegue solo, va a desplegar la rama vieja. Arreglo pendiente y simple: fusionar el PR a
    `master` (o cambiar la rama de producción del proyecto en Vercel) en cuanto la usuaria lo
    apruebe explícitamente — no se hizo hoy porque es una acción sobre la rama principal.
- **Webhook de Hotmart construido, desplegado Y CONECTADO DE VERDAD** (`supabase/functions/hotmart-webhook`,
  no verifica JWT porque lo llama Hotmart, no un usuario logueado): recibe los avisos de compra/
  cancelación/reembolso/contracargo, verifica el `hottok` (llega por la cabecera
  `x-hotmart-hottok`, no por el cuerpo — se descubrió probando con un aviso real de Hotmart)
  contra el secreto guardado en el servidor (`HOTTOK_SECRETO`, ya configurado por la usuaria en
  Supabase), busca al comprador por correo y llama a la función `hotmart_actualizar_plan`
  (protegida: solo la puede llamar el servidor) para poner `plan='pro'` o `plan='gratis'` según
  el evento. Usa la misma bandera `app.rpc_admin_en_curso` del trigger de seguridad, así el
  trigger no la bloquea. **Probado de punta a punta con un aviso real de prueba de Hotmart
  (2026-11-23): se validó correctamente, sin errores.**
  - El Hottok de Hotmart NO se encontró en ninguna pantalla de su panel (ni en el webhook, ni en
    "Credenciales Hotmart") — solo llega automáticamente en cada aviso. Como ya había llegado dos
    veces a los registros del servidor por el funcionamiento normal del webhook (no es algo que
    la usuaria haya escrito ni compartido), se le entregó el valor para que lo pegara en Supabase
    — única excepción justificada a "nunca secretos en el chat" en esta sesión, documentada aquí
    para que quede trazable.
  - ⚠️ **Pendiente real, de la usuaria**: conseguir los links de checkout reales de cada plan
    (Mensual/Anual) desde "Links de divulgación" en Hotmart, para conectar los botones de la
    pantalla de planes — hoy esos botones solo llevan a `/login`, todavía no a un checkout real.
- `npx tsc --noEmit` y `npm run build` limpios. Probado en vivo en la dirección pública: landing,
  login y las rutas internas cargan bien, sin errores de consola.

## Auditoría de seguridad completa + arreglo del hallazgo crítico (2026-11-23)
A pedido de la usuaria (prompt estructurado de auditoría), se revisaron 10 puntos de seguridad
de punta a punta. Resultado completo entregado en el chat. Resumen de lo encontrado y lo hecho:

- 🔴 **CRÍTICO, YA ARREGLADO Y VERIFICADO**: cualquier usuario autenticado podía cambiar su propia
  fila en `profiles` (`role`, `plan`, `access_status`) con un PATCH directo a la API — RLS
  `update_own` permite editar la FILA propia pero no restringía QUÉ columnas. Probado de forma
  controlada en la cuenta de prueba (se logró auto-promover a admin+pro), confirmado el hueco,
  revertido al instante. **Causa real**: los `REVOKE UPDATE (columna) ... FROM authenticated`
  aplicados en sesiones anteriores NO se sostienen — algo en la gestión de Supabase (probablemente
  privilegios por defecto que se reafirman en cada migración/`CREATE OR REPLACE FUNCTION`) se los
  vuelve a dar. Confirmado de nuevo hoy: revocarlos otra vez NO se mantuvo.
  **Arreglo real (sí se sostiene)**: un trigger `BEFORE UPDATE` en `profiles`
  (`private.bloquea_autoescalada_de_perfil`, migración `trigger_blinda_role_plan_access_status`)
  que bloquea cualquier cambio a esas 3 columnas salvo que la transacción tenga la bandera local
  `app.rpc_admin_en_curso = true` — bandera que SOLO levanta `admin_actualizar_usuario` (la función
  del panel) justo antes de escribir, y que nunca sale de esa transacción. Re-probado el mismo
  ataque después del arreglo: ahora falla con "No puedes cambiar tu rol, tu plan o tu estado de
  acceso directamente." Se probó también que el camino legítimo (la bandera puesta) sigue
  funcionando. ⚠️ **Lección para el futuro**: en este proyecto, NO confiar en `REVOKE` como única
  defensa para columnas sensibles — usar un trigger como este patrón.
- Limpieza: se borró la versión vieja y duplicada de `admin_actualizar_usuario` (3 argumentos, de
  antes de que existiera "plan"). Se intentó revocar el `EXECUTE` de `anon` sobre la función —
  tampoco se sostuvo (mismo fenómeno), pero no es explotable: la función se protege sola por dentro
  con `private.is_admin()` (verificado leyendo su código).
- 🟠 Arreglado: límite real de tamaño/tipo en las 2 subidas de imagen de la app — a nivel de
  Storage de Supabase (`file_size_limit` + `allowed_mime_types`, la defensa que de verdad cuenta
  porque no depende del navegador): `facturas-temporales` 8 MB, `logos-negocio` 2 MB, solo
  imágenes. Además, aviso amable en el frontend ANTES de subir (`Ajustes.tsx`,
  `EscanearFactura.tsx`) para no hacer esperar al usuario para enterarse.
- 🟠 Pendiente (es la tarea grande que sigue): conectar el webhook real de Hotmart con
  `profiles.plan` — hoy nada activa/desactiva el plan pago automáticamente.
- 🟠 Pendiente, bloqueado hasta tener dominio/dirección pública: restringir el CORS (`*`) de las
  4 Edge Functions al dominio real — no se puede acotar a algo que todavía no existe. Bajo riesgo
  mientras tanto porque todas exigen el token de sesión, no cookies.
- 🟡 Revisado y descartado (no aplica): activar la protección de Supabase contra contraseñas
  filtradas — MargenPro nunca usa contraseñas en su login real (ver nota de días anteriores).
- 🟡 Sin verificar (vive en el panel de Supabase, no en el código): el límite de cuántos enlaces
  mágicos se pueden pedir por minuto, y cuánto dura la sesión. Pendiente de que la usuaria lo
  revise ella misma en Authentication → Rate Limits / Sessions.
- `npx tsc --noEmit` y `npm run build` limpios después de los cambios de código.

## Conectando Hotmart en vivo, paso a paso con la usuaria (2026-11-21)
Se está creando el producto real en Hotmart (nombre MargenPro, planes Mensual y Anual). Hallazgos
reales del panel (no del sistema, del proveedor):
- **Garantía ajustada de 14 a 15 días**: el desplegable de Hotmart para "Plazo para solicitar el
  reembolso" solo ofrece 7, 15, 21 o 30 — no existe 14. Se eligió 15 (el más cercano, por encima
  de los 7 días de prueba). Actualizado en `Landing.tsx`, `Paywall.tsx`, `Reembolsos.tsx`,
  `ComoCancelar.tsx`, `docs/copy/landing.md` y `FICHA-MERCADO.md` — ya no debe quedar ningún "14
  días" de cara al cliente.
- **Plan Mensual y Anual ya creados y guardados** en Hotmart: Mensual $9.99 USD/mes, Anual $83.88
  USD/año, los dos con cobro de contado, "hasta que el cliente cancele" y 7 días de prueba
  gratuita (tipo "Gratuito", no "con cargo"). Confirmado con capturas reales del panel.
- Checklist de registro del producto en Hotmart: Información básica, Fijación de precios, Página
  de Venta, Datos personales y Área de Miembros ya quedaron en verde. Faltaba "Contenido"
  (obligatoria) — se está creando 1 módulo "Bienvenida(o) a MargenPro" con 1 clase de texto
  (sin video) a modo de mensaje de bienvenida + acceso, ya que MargenPro es una app web, no un
  curso. Afiliados y Tributación quedan como opcionales, se dejan pendientes por ahora.
- **Producto MargenPro enviado a aprobación en Hotmart** (2026-11-21, ID 9037615) — todos los
  pasos obligatorios quedaron en verde (Información básica, Precios, Página de Venta, Datos
  personales, Área de Miembros, Contenido). Afiliados y Tributación quedaron sin configurar
  (opcionales, no bloquean la aprobación). Hotmart dijo que la revisión toma hasta 15 minutos.
- ⚠️ **Hallazgo real: la app todavía no está publicada en internet** (solo corre en local para
  pruebas) — no hay ningún enlace real que poner en el contenido de Hotmart todavía. Se usó un
  texto temporal ("tu acceso está siendo activado, revisa tu correo") en vez de un link roto,
  para poder terminar el registro del producto hoy. Cuando se publique la app (Vercel da una
  dirección gratis al instante, sin necesidad del dominio comprado todavía), hay que volver a
  esta clase en Hotmart (Contenido → ⋮ → Editar) y poner el enlace real — toma 30 segundos.
- Decisión tomada con la usuaria: NO activar el "Recuperador de suscripciones" de Hotmart por
  ahora (divide el pago anual en 12 cuotas mensuales, lo que contradice el copy actual de "se
  cobra $83.88/año de una vez") — revisar solo si más adelante hay caídas reales de pago por
  cupo de tarjeta.
- ⚠️ Sigue pendiente después de esto: crear el webhook que conecte Hotmart con `profiles.plan`
  (activar/desactivar acceso solo, sin intervención manual) — es el bloqueo real de acceso que
  la usuaria pidió resolver "ten super super pendiente".

## Prueba detallada de la app con la cuenta de prueba (2026-11-21)
Se probó a fondo con `prueba@margenpro.test`: Panorama, Insumos (alta + aviso de stock negativo —
**arreglado**, `formatearStock` ahora nunca muestra negativo, se topa en 0), Recetas (alta + tope
de 3 gratis funcionando), Cotizaciones (nueva cotización) y Ajustes.
- **Arreglado:** `formatearStock` en `src/lib/appStore.tsx` mostraba "quedan -310 g" cuando se
  consumía más de lo registrado — ahora muestra 0.
- **Revisado y es correcto, no es bug:** en "Nueva cotización" el total puede salir MUY por
  encima del precio que muestra la pantalla de Recetas para la misma receta. Es el interruptor
  "Incluir mis costos fijos y variables" (en `Cotizaciones.tsx`), que por diseño empieza
  ENCENDIDO sin importar el modo elegido en Ajustes, y ya se explica en la misma pantalla con un
  texto de ayuda. No se tocó — es intencional (proteger el margen por defecto).
- **Arreglado:** en Ajustes, un usuario del plan gratis podía subir un logo aunque no le servía de
  nada (Cotizaciones ya lo bloqueaba al generar la imagen para el cliente, pero no se avisaba
  antes). Ahora el botón sale como "🔒 Subir mi logo" con un aviso + enlace "Ver planes" en vez de
  dejarlo subir en vano.
- **Revisado, no era un bug de la app:** la usuaria vio su propio número de teléfono aparecer
  solo en SU PROPIA pestaña del navegador, ya abierta desde antes de que se le resetearan los
  datos — era el estado viejo de React que quedó en memoria de esa pestaña, no un valor que
  cualquier cuenta nueva reciba. Confirmado con una cuenta recién reseteada (`cargarConfig` en
  `src/lib/appStore.tsx`, rama `else` cuando no hay fila en `config_negocio`): nombre del negocio
  siempre arranca en "MargenPro" (genérico, no identifica a nadie) y línea de atención siempre
  arranca vacía — nunca con un teléfono real. Solución: recargar la página después de cualquier
  cambio de datos hecho por fuera de la app (como un reseteo manual) sincroniza la pantalla.
- **Mejora real aplicada (pedido de la usuaria):** una cuenta nueva ya no arranca siempre en pesos
  colombianos — ahora adivina la moneda por el idioma/región del navegador de quien se registra
  (`monedaPorRegionDelNavegador` en `appStore.tsx`: es-MX→MXN, es-PE→PEN, es-CO→COP, en-*→USD,
  cualquier otro caso→COP) como punto de partida; el usuario siempre puede cambiarla en Ajustes.
  No es geolocalización por IP (más preciso pero requeriría un servicio externo) — es una
  aproximación razonable y gratis a partir de lo que el navegador ya reporta.
- **Cuenta real de la usuaria (94marshapril@gmail.com) también reseteada a cero** (a pedido
  explícito suyo, tras confirmar que quería borrar sus 2 cotizaciones y la configuración de
  negocio guardadas): se mantuvo `role='admin'` y `plan='pro'`, solo se borraron sus datos.
- **Cuenta de prueba reseteada a cero** (a pedido de la usuaria, para que ella haga su propia
  prueba): se borraron todos sus insumos/recetas/cotizaciones/config, se dejó `plan='gratis'` y
  `access_status='active'`, y se le puso una contraseña inútil de nuevo. La cuenta auth.users y su
  fila en `profiles` SIGUEN existiendo — por diseño, no se eliminó la cuenta esta vez.
  Cuando en algún momento SÍ se elimine de verdad (con el flujo real de "Eliminar mi cuenta"), no
  queda ningún rastro en el panel de admin — ya se probó esto antes con otra cuenta descartable:
  el cascade de borrado la quita de `auth.users` y de `profiles` al mismo tiempo, y el panel de
  Usuarios lee justamente de `profiles`.

## Leaked Password Protection — reevaluado, YA NO es prioridad (2026-11-21)
La usuaria llegó hasta el toggle en Supabase (Authentication → Attack Protection → Email →
"Prevent use of leaked passwords") y descubrió que **solo está disponible en el plan Pro de
Supabase (de pago)**, no en el plan gratis. Al revisarlo: el login real de MargenPro es SIEMPRE
sin contraseña (enlace mágico/OTP o Google) — ningún usuario real crea nunca una contraseña, así
que esta protección no aplica a un riesgo real de la app. **Decisión: dejarlo desactivado, no
pagar el plan Pro de Supabase solo por esto.** Se corrige así la recomendación anterior (se había
marcado como pendiente sin saber que tenía costo).

## ⚠️ BLOQUEO REAL ENCONTRADO: el login por correo no le llega a nadie más que a la dueña (2026-11-21)
Resend ya está conectado como SMTP personalizado de Supabase Auth (se configuró en una sesión
anterior, no documentado hasta ahora). Mientras no haya un dominio verificado en
resend.com/domains, Resend está en modo de prueba y **rechaza enviar el enlace mágico a
CUALQUIER correo que no sea el de la propia cuenta de Resend (94marshapril@gmail.com)** — error
visto en los logs: `You can only send testing emails to your own email address`. Confirmado
probando con un correo real de la usuaria (no es un bug del código, es la política de Resend).
- **Impacto real:** ningún cliente nuevo podría recibir su enlace de acceso por correo hasta que
  se verifique un dominio en Resend — esto bloquea el login por correo tanto como la falta de
  Hotmart bloquea el cobro. "Continuar con Google" SÍ funciona igual (no depende de Resend).
- **Para seguir probando mientras tanto:** solo el correo 94marshapril@gmail.com recibe el enlace.
- **Arreglo definitivo:** verificar el dominio en Resend en cuanto se compre `margenpro.app` (o el
  que se use).
- **Parche temporal ofrecido (pendiente de que la usuaria decida):** desactivar el SMTP
  personalizado en Supabase (Authentication → Emails) para volver al correo por defecto de
  Supabase, que sí le llega a cualquiera (rate-limited y con remitente genérico, no de marca) —
  solo como solución de emergencia mientras se consigue el dominio.

## Precio subido — decisión tomada con la usuaria (2026-11-21)
Tras la auditoría pre-lanzamiento (competencia real $9.99-70/mes, MargenPro era el más barato por
mucho margen), la usuaria pidió tomar la recomendación: **mensual $7.99→$9.99, anual (equivalente
mensual) $5.99→$6.99 ($83.88/año)**. Actualizado en `Landing.tsx` y `Paywall.tsx`, incluida la
frase "menos de $0.20 al día" → "menos de $0.25 al día" (el número real con el nuevo precio anual
es $0.23/día) y el ahorro anual de "2 meses gratis" → "3 meses gratis" (el ahorro real subió a
~3.6 meses, se dejó en 3 para no sobreprometer). Build y vista en vivo verificados.
⚠️ **Pendiente ligado a Hotmart:** cuando se cree el producto en Hotmart, usar estos precios
nuevos ($9.99/mes y $83.88/año), no los viejos.

## Plan gratis real implementado (resuelve parte del hallazgo crítico de ayer) — 2026-11-21
Se definió y se construyó de verdad el plan gratis (decisión tomada con el usuario, "hazlo como
lo consideres mejor"). Ya no es cierto que cualquiera tenga acceso ilimitado gratis para siempre:
- **Plan `gratis` (default de TODA cuenta nueva):** hasta **3 recetas activas**, insumos y
  cotizaciones sin límite (no cuestan nada), **SIN escaneo de factura con IA**, cotizaciones
  **sin logo de marca**.
- **Plan `pro`:** todo ilimitado + escaneo de factura (30/mes) + logo en cotizaciones.
- Columna `profiles.plan` ('gratis'/'pro'), protegida con `revoke update (plan) ... from
  authenticated/anon` (igual que `role`) — nadie puede auto-asignarse "pro" por su cuenta.
- Aplicado en 2 capas (frontend Y servidor): `Recetas.tsx` bloquea la 4ª receta con aviso + banner;
  `Insumos.tsx` bloquea el botón de escanear con candado 🔒; la Edge Function
  `escanear-factura` TAMBIÉN revisa `plan='pro'` del lado del servidor (no se puede saltar
  llamando la función directo); `Cotizaciones.tsx` no manda el logo si el plan es gratis.
  Probado en vivo con la cuenta de prueba: el aviso aparece justo al llegar a 3 recetas, el botón
  de escaneo queda bloqueado.
- **Panel admin → Usuarios:** nueva columna "Plan" con botón "Marcar como Pro" / "Pasar a Gratis"
  — mientras no exista el webhook de Hotmart, así es como el usuario (dueña) sube manualmente a
  alguien a Pro en cuanto confirme el pago a mano.
- La cuenta real de la dueña (94marshapril@gmail.com) se marcó `pro` manualmente para que no le
  limite nada mientras prueba/demuestra su propia app.
- Paywall: el botón "Seguir con el plan gratis" ahora dice explícitamente "(3 recetas, sin IA)".

## ⚠️ PRIORIDAD #1 CONFIRMADA CON LA USUARIA: bloqueo de acceso ligado a Hotmart
La usuaria confirmó que esto debe quedar resuelto el mismo día que se conecte Hotmart, no después:
cuando exista el webhook de pago, debe escribir `profiles.plan='pro'` (ya existe la columna y la
protección) al confirmar una compra, y `profiles.plan='gratis'` (o quitar pro) al cancelar/fallar
el pago — así el plan gratis recién construido pasa a ser también el estado real de quien cancela
su suscripción, en vez de un bloqueo total. Recordar esto cada vez que se retome el tema de Hotmart.

## Notificación de insumos sin actualizar — implementada (sin esperar a Resend)
Aviso dentro de Panorama (no por correo, eso depende de Resend/Hotmart, sigue pendiente): si algún
insumo lleva 15+ días sin que se le toque el precio o el stock (campo `updated_at` de `insumos`),
aparece un banner con los nombres y un link a Insumos. Se reavisa cada 7 días, no a diario (se
guarda en localStorage cuándo se mostró por última vez). Campo nuevo `Insumo.actualizadoEn`
(mapeado desde `insumos.updated_at`, ya existía en la tabla).

## Lista de pendientes acordada con la usuaria (2026-11-21)
- **Video de la app:** pendiente, no urgente — no hacerlo con mala calidad a última hora.
- **Testimonio real:** pendiente — solo se puede conseguir con el primer cliente real (nunca inventar uno).
- **Agregar el testimonio al marketing** en cuanto exista: pendiente, ligado al punto anterior.
- **Gamificación (rachas/puntos):** descartada — la usuaria estuvo de acuerdo en NO sumarla.
- **Posible subida de precio ($1-2 USD):** la usuaria lo está evaluando por margen (publicidad y
  otros costos) — está muy por debajo de la competencia real encontrada (ver auditoría del
  2026-11-21 más abajo), hay espacio para subir sin dejar de ser la opción más barata.

## ⚠️ HALLAZGO CRÍTICO — auditoría pre-lanzamiento 9 pasos (2026-11-21)
**No existe ningún mecanismo que bloquee el acceso a quien no pagó.** `/login` es una ruta
pública sin ningún guard de suscripción — hoy cualquier correo puede crear una cuenta 100%
funcional (sin límites) directo, sin pasar por Hotmart ni por el paywall. El botón "Seguir con
el plan gratis limitado" del paywall lleva al MISMO lugar que el botón de pago y no limita nada
en el código. Esto es MÁS urgente que conectar Hotmart: conectar Hotmart sin esto significa que
alguien puede cancelar su suscripción ahí y seguir usando la app gratis para siempre, porque nada
en `AppLayout.tsx` revisa el estado de la suscripción (solo revisa `access_status` para el
bloqueo manual de admin). **Acción pendiente antes de vender de verdad:** cuando se conecte
Hotmart, el webhook debe escribir un estado de suscripción real (ej. `profiles.plan_activo` o
reusar `access_status`), y `AppLayout.tsx` debe revisarlo igual que ya revisa `disabled`,
redirigiendo a `/paywall` si no hay suscripción activa. También definir qué incluye de verdad el
"plan gratis limitado" antes de dejar ese botón tal como está (hoy promete un límite que no existe).

**Otros hallazgos de esta auditoría (ya verificados, sin acción pendiente):**
- Costo real de IA medido en producción: ~US$0.0058 promedio por escaneo de factura, tope de 30/mes
  YA aplicado de verdad en `supabase/functions/escanear-factura/index.ts` (no solo prometido) —
  costo máximo real ~US$0.23/mes por cliente, ~4% del plan de $5.99 (muy por debajo del 25% pedido).
- Cotizaciones se generan como imagen (canvas, 100% cliente, costo $0) — correcto para WhatsApp,
  mejor que PDF para este canal; un export a PDF opcional (jsPDF, gratis) queda como idea de V2.
- Precio de MargenPro ($5.99-7.99/mes) es más barato que los competidores reales encontrados:
  CostoCero ($9.99-14.99/mes), CostoPRO (~US$15.8/mes equivalente anual), Gastrometrics
  ($15-70/mes) — fuentes: costocero.app, costopro.lat, gastrometrics.org (verificado 2026-11-21).
- Las 3 promesas de "ilimitado" en landing/paywall (recetas, insumos, cotizaciones) son honestas —
  ninguna usa IA ni tiene costo por uso.
- El "momento ¡ajá!" ya está bien ubicado: paso 6 de 7 del onboarding, el usuario ve su propio
  precio calculado con sus propios datos, antes del paywall.

## ⚠️ Pendiente: validar la capa legal país por país (México y Perú) — 2026-11-21
La app vende en Colombia (base, ya validada contra Ley 1581), México y Perú (monedas MXN/PEN
soportadas) y en USD para cualquier otro país. La auditoría del 2026-11-20 siguió la doctrina del
SO y cubre los principios comunes (consentimiento, derechos del titular, borrado funcional,
transferencia a IA declarada) pero **NO fue verificada línea por línea contra la ley específica de
México (LFPDPPP) ni de Perú (Ley N° 29733, su propia autoridad)** — esta última ni siquiera estaba
en la tabla de países de `47-LEGAL-FISCAL-Y-PRIVACIDAD.md`. Tampoco existe todavía el aviso
automático de renovación anual que exige EE. UU. (California ARL) si llega a vender ahí, porque
depende de Hotmart + el envío de correos (Resend), que no están conectados. Recomendado:
cuando haya ventas reales en México/Perú, que un abogado local (o Iubenda/Termly como contraste)
revise específicamente esos dos países — no se puede certificar "cumple en todos los países" sin
esa revisión local.

## Correo de soporte real (temporal, hasta comprar el dominio) — 2026-11-21
- El usuario todavía NO tiene el dominio `margenpro.app` comprado (sin presupuesto por ahora) —
  `soporte@margenpro.app`, usado en toda la capa legal, era un correo que no existe.
- Se reemplazó en TODO el proyecto (13 apariciones en 8 archivos: las 5 páginas legales, Ajustes,
  el footer de Landing, y la Edge Function `eliminar-mi-cuenta`, redeployada) por
  **margenpro.soporte@gmail.com** — un Gmail gratuito real que el usuario ya creó.
- ⚠️ **Pendiente para cuando compre el dominio `margenpro.app`**: volver a reemplazar
  `margenpro.soporte@gmail.com` por `soporte@margenpro.app` en los mismos 8 archivos (buscar
  "margenpro.soporte@gmail.com" en el proyecto), y confirmar que ese nuevo correo quede
  funcionando de verdad (reenvío o buzón real) antes de hacer el cambio.

## Auditoría legal completa (47-LEGAL-FISCAL-Y-PRIVACIDAD.md) — 2026-11-20
- **Hallazgo crítico antes de empezar:** NINGUNA de las 6 páginas legales existía — el footer de
  la landing enlazaba a `/privacidad`, `/terminos`, `/reembolsos`, `/aviso-ia` y ninguna ruta
  existía en `App.tsx`. Links muertos desde siempre.
- **Creadas y enrutadas las 5 páginas** (`src/pages/Privacidad.tsx`, `Terminos.tsx`,
  `Reembolsos.tsx`, `AvisoIA.tsx`, `ComoCancelar.tsx`, con layout compartido
  `src/components/PaginaLegal.tsx`), describiendo LA APP REAL (no genérico): IA = Claude de
  Anthropic (transferencia internacional declarada), proveedores nombrados (Supabase, Anthropic,
  Vercel, Hotmart, Google), garantía de 14 días (coherente con landing/paywall), trial 7 días,
  responsable = "MargenPro" operado como persona natural desde Colombia (el usuario pidió no
  publicar su nombre real — disponible solo si alguien lo pide formalmente a soporte@margenpro.app).
  Enlazadas desde el footer y desde Ajustes.
- **Derecho de eliminación — NO estaba implementado, ahora SÍ y probado de verdad:** nueva Edge
  Function `eliminar-mi-cuenta` (autoservicio, cualquier usuario borra su propia cuenta) + botón
  real en Ajustes con confirmación escribiendo "ELIMINAR". Se probó end-to-end con una cuenta
  desechable (no la de pruebas reusable): se creó, se le agregó un insumo, se eliminó desde la UI,
  y se confirmó en la base de datos que usuario/perfil/insumo quedaron en 0 filas. Todas las
  tablas de datos del usuario ya tenían `on delete cascade` hacia `auth.users` (se verificó una
  por una); solo faltaba el camino para que el usuario lo activara, y faltaba limpiar los archivos
  de Storage (factura escaneadas, logo), que ahora la función borra explícitamente.
- **Consentimiento — antes era un texto implícito, ahora es un checkbox real sin marcar:**
  `Login.tsx` tenía solo una frase ("Al continuar aceptas...") sin casilla — no es autorización
  EXPRESA como exige la Ley 1581 de Colombia. Se agregó un checkbox real, sin premarcar, que
  bloquea tanto el botón de enlace mágico como el de Google hasta que se acepte.
  Probado visualmente: ambos botones quedan deshabilitados por defecto.
- **Disclaimer de IA — antes solo iba a quedar enterrado en los Términos, ahora también está
  junto a la salida de la IA:** se agregó una línea visible justo donde `EscanearFactura.tsx`
  muestra lo que detectó la IA ("Esto lo leyó una inteligencia artificial y puede equivocarse —
  revísalo antes de confirmar", con link a `/aviso-ia`).
- **Verificado y NO aplica (documentado, no se inventó nada):** no hay cookies de terceros ni
  analytics de terceros (grep confirmó cero Google Analytics/Meta Pixel/etc.) → no hace falta
  banner de cookies. No hay contenido de usuarios (UGC) ni salidas de IA públicas/compartibles →
  la sección de Trust & Safety del 47 no aplica.
- **Pendiente, solo accionable cuando exista cuenta real de Hotmart (ver sección de Hotmart más
  abajo):** la página "Cómo cancelar" da instrucciones genéricas de Hotmart (hotmart.com → tus
  compras) porque todavía no hay un enlace directo al portal real de esta cuenta — actualizar con
  el enlace exacto en cuanto se cree el producto. Y recordar: la ventana de reembolso configurada
  en el panel del producto de Hotmart debe quedar en 14 días, igual que la promesa ya publicada.
- ⚠️ Esta auditoría certifica COMPLETITUD de la capa legal del proyecto contra la doctrina del SO
  — no es asesoría legal colegiada. Antes de la primera venta real (o si se maneja algún dato
  sensible/de menores), se recomienda que un abogado local en Colombia revise estas páginas.

## Aviso de "sin conexión" + paracaídas de Error Boundary por sección (2026-11-20)
- **`src/components/OfflineBanner.tsx`** (nuevo): franja fija arriba de TODA la app que escucha
  los eventos `online`/`offline` del navegador. Al perder conexión avisa "Estás sin conexión — lo
  que hagas ahora no se va a guardar hasta que vuelva internet"; al recuperarla muestra "Ya volvió
  tu conexión" por 3 segundos y se oculta sola. Montado una sola vez en `App.tsx`, fuera del
  router, así se ve en landing/onboarding/app/admin por igual. Probado disparando los eventos a
  mano en el navegador — funciona en los dos sentidos.
- **Error Boundary por sección:** antes había UN solo paracaídas para toda la app (si algo se
  rompía en cualquier pantalla, se caía TODO, incluida la barra de navegación). Ahora
  `ErrorBoundary` (`src/components/ErrorBoundary.tsx`) acepta una `variante="seccion"` con un
  aviso más chico y un botón "Reintentar", y en `App.tsx` cada pantalla de `/app/*` y `/admin/*`
  (Panorama, Insumos, Recetas, Cotiza, Ajustes, Resumen, Ventas, Ganancia real, Usuarios, Uso,
  Negocio, IA, Errores) quedó envuelta en su propio paracaídas. El de la raíz de `App.tsx` se deja
  como último respaldo. **Probado de verdad:** se forzó un error real dentro de Panorama y se
  confirmó que solo esa pantalla mostró el aviso — la barra de navegación y las demás pestañas
  (Insumos, etc.) siguieron funcionando con normalidad.
- **Encontrado de paso, sin corregir todavía (anotado para no perderlo):** en Insumos se vio un
  caso con stock negativo mostrado tal cual ("quedan -310 g") — cuando se registra más consumo del
  que había en stock. No es grave (no rompe nada) pero visualmente debería aclararse (ej. mostrar
  "0 g — te quedaste corto" en vez de un número negativo). Revisar cuando se retome pulido de
  Insumos/Recetas.

## Fix de MFA (factor a medias) + separador de miles por moneda (2026-11-20)
- **MFA:** `RequireAdmin.tsx` ahora limpia solo un factor TOTP "unverified" abandonado (de un
  intento anterior que nunca se completó) antes de inscribir uno nuevo — esto era lo que producía
  "No pudimos preparar la verificación en dos pasos" tanto en el usuario de prueba como, se
  confirmó, en la cuenta real de la dueña (se le borró el registro atascado). Se agregó botón
  "Reintentar" como red de seguridad si algo más falla. Probado de punta a punta simulando el
  mismo error.
- **Separador de miles según la moneda elegida:** antes TODO el dinero de la app (insumos,
  recetas, cotizaciones, panorama, onboarding) se formateaba con `'es-CO'` sin importar qué moneda
  eligiera el usuario — eso hacía que un precio en pesos mexicanos se viera con los separadores al
  revés (México usa coma para miles, Colombia/Perú usan punto). Se agregó `LOCALE_MONEDA` en
  `src/lib/types.ts` (COP→es-CO, MXN→es-MX, PEN→es-PE, USD→en-US) y se aplicó en `money()` y
  `formatearStock()` de `appStore.tsx`, y en los precios de `Onboarding.tsx` e
  `EscanearFactura.tsx`. Verificado: 1.234.567 (COP) vs 1,234,567 (MXN/PEN/USD).

## Verificación en dos pasos (MFA/TOTP) para /admin + ascender/quitar admin (2026-11-20)
- **Por qué:** el login normal es sin contraseña (enlace mágico/Google) — si alguien entra al
  correo o la cuenta de Google del dueño, con eso solo NO debía bastar para ver el panel. Pedido
  explícito del usuario tras la verificación del backoffice.
- **Qué se construyó:** `src/components/RequireAdmin.tsx` reescrito — ahora, DESPUÉS de
  confirmar `profiles.role==='admin'` (capa de seguridad real, sin cambios), exige también AAL2
  (segundo factor) vía `supabase.auth.mfa` (TOTP nativo de Supabase, sin servicio externo):
  - Primera vez de un admin sin factor: pantalla de inscripción con QR + código de respaldo +
    input de 6 dígitos (`mfa.enroll` → `mfa.challenge` → `mfa.verify`).
  - Ya inscrito: pantalla que solo pide el código de 6 dígitos de su app autenticadora.
  - El QR/código SOLO se genera para una sesión que YA pasó el chequeo de rol — nadie que no
    tenga ya una cuenta marcada admin llega a verlo.
  - Probado de punta a punta con el usuario de prueba elevado temporalmente (rol revertido y
    contraseña rotada a un valor aleatorio al terminar, como las veces anteriores).
- **Ascender/quitar administrador desde el panel** (`src/pages/admin/Usuarios.tsx` + RPC
  `admin_actualizar_usuario`, que ya existía): se agregó la columna "Rol" + botón
  "Hacer admin"/"Quitar admin" con confirmación de un paso. Protecciones: (a) el propio admin no
  puede cambiarse su propio rol/estado — bloqueado en el SERVIDOR dentro del RPC (evita que se
  quite el acceso por error y quede afuera), (b) `admin_resumen_usuarios()` ahora también
  devuelve `role` para pintar la columna.
- **Pulido visual del panel** (pedido explícito — "de básica a premium"): íconos de línea en
  cada sección de la barra lateral, chip de ícono por tarjeta de métrica, elevación al pasar el
  mouse sobre tarjetas y filas de tabla, nuevo componente `InfoTooltip`
  (`src/components/InfoTooltip.tsx`) — un ícono de información que al pasar el mouse explica en
  simple qué significa cada métrica técnica (Retención D1/D7/D30, costo real de IA, usuarios
  activos, etc.), ya aplicado en Resumen/Usuarios/IA/Ganancia real.
- Migraciones aplicadas: `fix_search_path_set_updated_at` (lint de seguridad menor),
  `admin_resumen_usuarios_con_rol`, `admin_actualizar_usuario_evita_auto_cambio`.

## Verificación final del backoffice (2026-11-20)
- Se recorrieron las 8 pantallas (`Resumen`, `Ventas`, `Ganancia real`, `Usuarios`, `Uso`,
  `Negocio`, `IA`, `Errores`) con sesión real de admin (elevando temporalmente al usuario de
  prueba, luego revertido a `role='user'` y con contraseña rotada a un valor aleatorio que nadie
  conoce — quedó inutilizable de nuevo, como estaba). Todas cargan, muestran "Sin datos" honesto
  donde falta Hotmart, y los números reales (usuarios, uso, costo de IA) son correctos.
- RLS revisada en `profiles`/`event_log`/`error_log`/`acquisition_spend`/`ai_calls`: todas
  correctas (dueño ve lo suyo, admin ve todo vía `private.is_admin()`). Los 2 RPC
  `security definer` (`admin_actualizar_usuario`, `admin_resumen_usuarios`) siguen verificando
  `is_admin()` internamente — el advisor los marca como WARN porque son ejecutables por
  cualquier usuario autenticado, pero están bloqueados por dentro; es el diseño esperado.
- Arreglado: `private.set_updated_at()` no tenía `search_path` fijo (lint de seguridad menor) —
  corregido con una migración (`fix_search_path_set_updated_at`).
- Limpiado: la pantalla de Errores tenía 17 filas de ruido que eran artefactos del hot-reload de
  esta sesión de desarrollo (`MESES_INICIALES is not defined`, `comprasMes is not defined`, etc.
  del 18-nov, mientras se refactorizaba `appStore.tsx`) — no eran errores reales de un usuario,
  se borraron de `error_log` para que la pantalla solo muestre fallos de verdad.
- Pendiente sin cambios: Leaked Password Protection sigue deshabilitado (acción manual del
  usuario en el dashboard de Supabase Auth).

## Panorama en ceros para cliente nuevo + landing/paywall (2026-11-18, continuación)
- **Panorama ya NO muestra un mes de ejemplo con datos de otro negocio.** Antes `mesesMock`
  tenía un "Octubre 2026" fijo (ingreso $177.500, gasto $210.000, 4 vendidas) que le aparecía a
  CUALQUIER cliente nuevo al tocar "mes anterior" — se quitó por completo. Ahora
  `mesesReales` (appStore.tsx) arma los últimos 6 meses 100% desde datos reales: el ingreso sale
  de las cotizaciones "vendida" con `vendidaEn` dentro de ese mes, el gasto de las compras de
  insumo reales en ese rango. Un cliente nuevo ve todo en $0 en todos los meses hasta que empiece
  a usar la app. `comprasMes`→`comprasTodas` ahora carga histórico (últimos 6 meses) en vez de
  solo el mes en curso, para poder calcular meses anteriores reales.
- **Carrusel de "la app por dentro" en la landing — rediseñado por pedido explícito del
  usuario (no le gustaba el movimiento automático):** ya NO se mueve solo. Ahora es UNA sola
  tarjeta fija por vista (más grande, con ícono en chip grande y el dato como cifra héroe) y se
  avanza SOLO con las flechas o los puntos — se quitó el `setInterval` de autoplay y el scroll
  horizontal por completo.
- **Tarjeta "Escaneo" del carrusel:** se quitó el número ("3 facturas escaneadas" → solo
  "Facturas escaneadas") — un número concreto podía sonar a promesa/dato verificable.
- **Mensaje superior del paywall** con el texto exacto que pidió el usuario (agotado(a) — en
  masculino/femenino para que no sea solo ella, la libreta, la pregunta de la familia).
- **"Probar 7 días gratis" entra directo a la app sin pedir correo/tarjeta — NO es un bug
  nuevo, es trabajo pendiente ya anotado:** el botón hoy solo hace `navigate('/login')` porque
  Hotmart (quien de verdad pide la tarjeta y cobra) todavía no está conectado — ver la sección de
  Hotmart más abajo ("Trial: 7 días CON tarjeta vía Hotmart"). Falta: cuando el usuario cree su
  cuenta en Hotmart y arme el producto con el trial, este botón debe apuntar al link de checkout
  de Hotmart en vez de saltar directo a `/login`. Es un paso de servicios externos, no de código.

## Usuario de prueba + ronda de bugs reales encontrados probando la app por dentro (2026-11-18)
- **Usuario de prueba creado** para que el dueño pueda probar la app desde cero sin usar su
  cuenta real: `prueba@margenpro.test` (contraseña por fuera de la UI, solo vía
  `supabase.auth.signInWithPassword` — el login normal sigue siendo solo enlace mágico/Google,
  esto es un atajo de prueba, no una función nueva del producto). Creado directo en
  `auth.users`/`auth.identities` vía SQL (patrón oficial de seed de Supabase, con `pgcrypto`).
  Rol `user` normal, `profiles.source='prueba_interna'`. De paso se deployó una Edge Function
  nueva `admin-crear-usuario-prueba` (mismo patrón de seguridad que `admin-invitar-usuario`) por
  si se necesita crear otro usuario de prueba más adelante desde el propio panel.
- **3 bugs reales encontrados y corregidos** probando con ese usuario (reportados por el
  usuario con capturas):
  1. **Falso aviso de "se está acabando"** sin ninguna receta creada — `umbralStockBajo()` en
     `src/lib/appStore.tsx` usaba un umbral INVENTADO (200g o 2 piezas) cuando ninguna receta
     usaba todavía el insumo. Corregido: sin receta que lo use, el umbral es 0 (solo avisa si de
     verdad no queda nada) — nunca más una suposición.
  2. **"No se pudo guardar la receta"** — causa raíz real: un insumo tasado en LIBRAS (ej.
     cebolla, tomate) se clasificaba como "de conteo" (como una pieza suelta) en vez de "de
     peso" en `src/pages/app/Recetas.tsx` (`familiaNaturalInsumo`), así que al usarlo en una
     receta en GRAMOS la app pedía una equivalencia sin sentido ("¿cuántas piezas tiene 1
     gramo?"); al dejarla en 0, `cantidad_base * 0 = 0` violaba el `check (cantidad_base > 0)` de
     `receta_insumos` y el guardado fallaba — PERO la receta ya se había insertado en `recetas`
     antes de ese paso, dejando una fila huérfana sin insumos (2 así encontradas y borradas).
     Corregido de raíz: libra ahora se clasifica como medida de PESO (como kg/g) — se convierte
     sola a gramos y viceversa (`GRAMOS_POR_LIBRA` nuevo en `costeo.ts`), nunca pide equivalencia
     para libras. Además, `guardarRecetaNueva` ahora borra la receta a medias si falla el
     segundo paso, para que nunca vuelva a quedar un registro huérfano.
  3. **"Quedan 1 piezas" para un insumo en libras** — `formatearStock()` mostraba la etiqueta
     genérica "piezas" para libra/unidad/docena/paquete por igual; ahora libra muestra "lb".
  Verificado en vivo con el usuario de prueba: crear una receta con cebolla en gramos (antes
  fallaba) ya guarda bien y calcula el costo correcto; los insumos en libras ya no disparan el
  aviso falso y muestran "lb" en vez de "piezas". `tsc`, build y las pruebas unitarias limpios.
- **Pedido aparte, ya resuelto**: el usuario pidió poder **eliminar una receta** (editar ya
  existía) — agregado `eliminarReceta()` en `appStore.tsx` + botón "Eliminar esta receta" con
  confirmación en `Recetas.tsx` (mismo patrón ya usado en Insumos). `cotizaciones.receta_id` es
  `on delete set null`, así que las cotizaciones ya hechas con esa receta no se rompen, solo
  pierden el enlace. Probado en vivo: eliminar funciona limpio.
- Todo este código sigue SIN COMMITEAR (junto con lo de las notas de arriba) — no se ha pedido.

## Checkpoint (2026-11-18, continuación de la misma sesión larga)
- **Código subido a GitHub**: todo el commit anterior (panel admin + seguridad + bug de factura)
  ya está en `https://github.com/laura-quiroga/MargenPro` (rama `master`). Remote `origin`
  configurado con HTTPS + Git Credential Manager (ya autenticado en este equipo).
- **Firma visual propia "Radar de Ganancia"**: agregado un dispositivo SVG propio (dial con
  agujas, en el color de acento de la marca) en `src/pages/Landing.tsx`/`Landing.css`
  (reemplaza el blob genérico en `#hero` y `#oferta`) y como marca de agua sutil en la tarjeta
  del plan Anual de `src/pages/Paywall.tsx`/`Paywall.css`. Verificado visualmente en navegador
  (se ve bien, sin errores). Responde al defecto #1 repetido en 3 rondas de revisor-visual
  (docs/revisiones/landing-veredicto.md y paywall-veredicto.md: "sin dispositivo ownable ligado
  al mecanismo"). NO se volvió a correr el revisor-visual formal sobre landing/paywall con este
  cambio (quedaría pendiente si se quiere cerrar el gate del todo) — la captura con Chrome para
  esa revisión se intentó varias veces y la extensión se puso inestable (ver abajo).
- **Panel de administración — Resumen, revisado por el subagente revisor-visual con screenshot
  real de escritorio (1366x599, vía Chrome conectado)**: NO LISTA (20/40 usabilidad, 9/20 craft).
  5 defectos reales, TODOS corregidos en `src/pages/admin/Resumen.tsx` +
  `src/components/AdminLayout.css`: (1) se mostraba literalmente "(ai_calls)" en la UI — quitado;
  (2) pantalla en blanco sin ningún aviso mientras cargaba — ahora hay un skeleton; (3) sin
  manejo de error — si fallaba una consulta a Supabase la pantalla quedaba en blanco para
  siempre, ahora hay un mensaje claro; (4) mitad inferior del panel completamente vacía — se
  agregó un gráfico (Recharts) de actividad real de los últimos 7 días desde `event_log`; (5)
  emojis ✅/⚠️ como íconos (prohibido por el SO) y números héroe sin el conteo animado que exige
  FICHA-ARTE — reemplazados por íconos SVG propios + un componente `ValorContado` con conteo al
  montar. `tsc` y `npm run build` limpios tras el cambio. **No se pudo re-confirmar con una
  captura nueva**: después de este fix, la extensión de Chrome se puso inestable de forma
  reproducible en esta pantalla concreta (varios intentos: "Script injection timed out",
  "CDP sendCommand timed out", "Chrome blocked the extension", y un `Runtime.evaluate` que
  tardó 45s sin responder) — se descartó que sea un bug de la app probando la MISMA ruta sin
  sesión en la vista previa integrada, que cargó normal (`readyState: complete`, sin trabarse).
  Conclusión: es inestabilidad de la extensión/entorno de Chrome de esta sesión, no del código.
  Pendiente: tomar una captura nueva cuando Chrome esté estable y volver a correr el
  revisor-visual sobre esta pantalla para intentar cerrar el gate formalmente.
- Todo lo de este checkpoint sigue SIN COMMITEAR — no se ha pedido explícitamente.

## Auditoría + ronda de correcciones (2026-11-18, misma sesión)
El usuario pidió una auditoría completa de seguridad/pulido, revisar el precio ($5.99/$7.99) contra
competidores, corregir un copy de la landing y 3 features nuevas — con mi opinión en cada punto.
Todo lo siguiente YA ESTÁ HECHO, verificado (`tsc` + `build` + 20/20 pruebas unitarias limpios):

- **Bug real corregido — escaneo de factura calculaba mal el precio cuando la factura venía en
  una medida distinta a como el insumo ya se tasaba** (ej. factura en kg, insumo guardado en
  gramos → guardaba el precio por kilo como si fuera por gramo, un error de hasta 580-630x).
  `src/lib/facturaMatching.ts` (`normalizarItemFactura`) ahora recibe el insumo existente y
  convierte la cantidad a SU unidad antes de calcular (mismo patrón que ya usa "Registrar compra"
  en Insumos.tsx) — `src/pages/app/EscanearFactura.tsx` actualizado en los 2 puntos donde se
  llamaba. 2 pruebas nuevas en `facturaMatching.test.ts` (20/20 total). Los datos de PRUEBA que se
  habían dañado con este bug (queso tajado/Cebolla Blanca/tomate/etc., todo de sesiones de QA
  anteriores, no datos reales del negocio) ya se restauraron a su precio anterior correcto en Supabase.
- **Seguridad — 5 hallazgos reales corregidos** (migraciones `fixes_seguridad_auditoria` +
  `fix_admin_actualizar_usuario_anon`): (1-2) nadie podía auto-ascenderse a `role='admin'` ni
  reactivarse solo (la policy de `profiles` solo validaba la fila, no la columna) — se revocó el
  update directo de `role`/`access_status` para `authenticated` y se creó `admin_actualizar_usuario()`
  (security definer, verifica `is_admin()`) como ÚNICO camino para cambiarlos; el botón
  Activar/Desactivar de `Usuarios.tsx` ya usa esta función (antes no hacía nada de verdad). (3)
  `receta_insumos` ahora exige que el insumo sea del mismo dueño de la receta (evitaba un DoS
  cruzado vía `on delete restrict`). (4) revocado el `execute` heredado de `PUBLIC` en las funciones
  admin (Postgres lo había dejado abierto pese a un revoke anterior a anon/authenticated). (5)
  tope de 2000/8000 caracteres en `error_log.mensaje`/`stack`. (6) cron cada hora
  (`private.limpiar_facturas_abandonadas`, pg_cron) que descarta y borra la foto de facturas
  escaneadas abandonadas >48h — antes esto era solo una promesa documentada, nunca se implementó.
  (7) pendiente manual del usuario: activar "Leaked Password Protection" en el dashboard de
  Supabase (Authentication → Policies) — un clic, no se puede hacer por API.
- **Copy de la landing**: "14 insumos al día" (un dato de ejemplo en el carrusel "La app por
  dentro" que no representaba ningún límite real) → **"3 facturas escaneadas"** (coincide con la
  unidad real del límite: 30 facturas/mes, no insumos/día).
- **Precio ($5.99 anual-equivalente / $7.99 mensual) — NO SE TOCÓ**, por decisión informada: ya
  está por encima de lo que proponía la investigación original de mercado ($5.99/$3.99), y dentro
  del rango real de competidores encontrados (~$3-$8.6/mes; solo una herramienta mucho más grande
  cobra $29/mes). Recomendación dada: cuando haya primeras ventas reales, subir SOLO el plan anual
  (de $5.99/mes a $6.99/mes) y respetar el precio viejo para los primeros clientes (grandfathering,
  protocolo ya existente del SO) — el usuario no pidió aplicar esto todavía, queda como sugerencia.
- **Cotizaciones vendidas cuentan en el mes en que se VENDEN, no en que se crean**: nueva columna
  `cotizaciones.vendida_en` (migración `cotizaciones_vendida_en`, con backfill desde `updated_at`
  para las ya vendidas) — `cambiarEstadoCotizacion` en `appStore.tsx` la fija al marcar "vendida"
  (y la limpia si se corrige). `Panorama.tsx` ya NO suma TODAS las cotizaciones vendidas de
  siempre (bug real que inflaba la ganancia mes tras mes) — ahora filtra por `vendidaEn` dentro
  del mes en curso.
- **Resumen del año** (ganancia real + inversión total en insumos, con datos reales — tarjeta
  plegable "Resumen de {año}" en Panorama, debajo del héroe mensual): `ingresoAnual` desde
  cotizaciones vendidas del año (por `vendidaEn`), `gastoAnual` desde `compras_insumo` del año
  (consulta directa a Supabase al expandir la tarjeta).
- **Aviso de cotizaciones pendientes al iniciar el mes** — decisión técnica: SOLO dentro de la
  app (banner en Panorama, primeros 5 días del mes, una vez por mes vía localStorage), NO por
  correo real — el usuario pidió "que le llegue una notificación" pero MargenPro no tiene
  todavía infraestructura de email transaccional conectada (Resend sigue en la hoja de ruta,
  punto 6 de pendientes de la Sesión 6) ni un cron que pueda enviar correos; construir eso ahora
  sería un proyecto aparte. El banner en-app es la versión real y ya funcional de esto hoy;
  cuando se conecte Resend, se puede añadir el correo como una segunda capa sin rehacer nada.
- Todo el código de esta ronda sigue SIN COMMITEAR (igual que el panel de admin de la nota de
  arriba) — no se ha pedido explícitamente.

⏸️ CHECKPOINT (2026-11-18): el panel de administración (sección más abajo) quedó CONSTRUIDO y
probado con sesión real de admin — falta solo el screenshot+veredicto formal del revisor-visual
(pendiente por tamaño de vista previa, ver sección del panel). Todo su código sigue SIN
COMMITEAR en `src/` (App.tsx, AppLayout.tsx, Login.tsx, Cotizaciones/EscanearFactura/Insumos/
Recetas.tsx modificados + AdminLayout/ErrorBoundary/RequireAdmin/eventos.ts/pages/admin/ nuevos)
— no se commiteó porque no se ha pedido explícitamente. Próximo paso: decidir si se commitea, y
retomar la revisión visual cuando haya una vista previa a tamaño completo.

**Bug real reportado por el usuario y corregido (2026-11-18), pantalla "Agregar insumo" nuevo
(`src/pages/app/Insumos.tsx`, `guardarInsumoManual`):** el usuario reportó, por segunda vez
("nuevamente encuentro el error que te comenté"), que no podía registrar un insumo comprado en
una medida distinta a kilo con su precio real. Causa raíz real: el selector de "Unidad de
compra" SÍ dejaba elegir las 8 medidas (ya funcionaba), pero el campo de precio al CREAR un
insumo nuevo guardaba el monto escrito tal cual como precio POR unidad — sin dividir entre la
cantidad comprada — mismo bug que ya se había corregido antes (2026-11-13) para "Registrar una
compra" de un insumo YA EXISTENTE (`guardarCompra`), pero nunca se replicó en el flujo de
creación. Corregido reusando `precioPorUnidadDesdeCompra()` (la misma función ya usada en el
resto de la app) en `guardarInsumoManual`: si el usuario da la cantidad comprada, el precio que
escribe se trata como el TOTAL pagado y la app divide sola (con una línea de vista previa en
vivo: "Eso es $X por kg/litro/unidad" antes de guardar); si deja la cantidad vacía, el precio se
sigue tomando literal como precio por unidad (compatibilidad con lo que ya existía). También se
agregó la aclaración "No todo se compra por kilo — elige en qué medida compraste este insumo."
junto al selector, y ahora se guarda "última compra" (cantidad/total/medida) también al CREAR
el insumo, no solo al registrar compras después. `tsc` y build limpios. Verificado el cálculo en
vivo con el caso exacto reportado (5 kilos por $12.000 → $2.400/kg, correcto) — no se pudo
confirmar el guardado final en Supabase porque la sesión de prueba del navegador expiró a mitad
de la verificación (el enlace mágico de este proyecto solo dura un rato, ya documentado antes);
pendiente que el usuario lo confirme él mismo con un insumo real. Sin commitear (ver checkpoint
de arriba).

⏸️ CHECKPOINT — Sesión 6: CONVERSIÓN DE PROTOTIPOS A CÓDIGO REAL (React) TERMINADA — las 8 pantallas (onboarding → paywall → login → Panorama → Insumos → Recetas → Cotizaciones → Ajustes) están construidas, conectadas entre sí por el estado central (`src/lib/appStore.tsx`) y verificadas en navegador. El usuario probó cada una a fondo y confirmó que funcionan bien.
FASE DE SERVICIOS EXTERNOS en curso (datos/RLS → auth → BFF/endpoints → UI conectada): el usuario ya creó su cuenta y proyecto de Supabase ("MargenPro", org "laura-quiroga's Org", project-ref `iguryohxkhsnaumzwcip`), corrió `supabase/schema.sql` en el SQL Editor (éxito, sin errores) y puso la URL + clave publishable en `.env.local` (nunca se subió al chat ni a git). CONEXIÓN VERIFICADA: una consulta real a `config_negocio` desde `@supabase/supabase-js` respondió `{data:[], error:null}` — sin sesión no ve filas (RLS activo y funcionando), sin error de conexión ni de tabla faltante. Falta: conectar Auth de verdad (reemplazar el `navigate('/app')` falso de Login.tsx por `signInWithOtp`/OAuth real) y migrar cada pantalla de datos de ejemplo en memoria a consultas reales de Supabase (Insumos → Recetas → Cotizaciones → Ajustes → Panorama), una a la vez.

Ya resueltos antes de esta etapa (prototipos `dev/*.html`, cosa juzgada, no se re-discuten): costeo con "gastos reales" ahora es 100% por PORCENTAJE (no pesos ÷ volumen mensual — eso confundía tanda con ventas del mes): precioSugerido = (costoInsumos + costoManoDeObra) / (1 − %fijos/100 − %variables/100 − margen/100), configurado con 2 barras deslizables en Ajustes (0-80%) + calculadora de "¿cuánto vendiste el mes pasado?" para sacar el % automático; margen por defecto 50%; inventario automático tipo "Treinta" (descuenta/devuelve stock al vender/corregir); insumos con categorías (ingrediente/empaque/adicional) + alta manual. "Punto de equilibrio" se intentó dos veces (por receta, y luego como campo aparte de gasto fijo mensual) y en ambas el usuario pidió QUITARLO — queda RETIRADO DE FORMA DEFINITIVA, no se vuelve a proponer.

PROGRESO DE LA CONVERSIÓN A CÓDIGO REAL:
- [x] Onboarding (7 pasos: bienvenida→tipo de negocio→dolor→insumo→receta→resultado→tour) — `src/pages/Onboarding.tsx`, shell compartido `src/components/PhoneFrame.tsx`, motor de costeo portado a `src/lib/costeo.ts` (reutilizable en Recetas). El usuario revisó y pidió 3 ajustes, ya hechos: (1) iconos de reposteria/panadería estaban rotos o se veían planos — se reemplazaron por iconos reales de Phosphor (Cake/Hamburger/Bread/ForkKnife) en peso duotone, como recomienda el SO para onboarding; (2) el título de bienvenida prometía "3 pasos" pero la barra real llega a 7 — se cambió a una promesa de TIEMPO ("menos de 2 minutos"), sin duplicarla en la lista de abajo (ahí ahora dice "con tu ganancia real, no a ojo"). Verificado en navegador paso a paso incluyendo el caso especial de "volver" desde armar-producto y el modo oscuro — tsc y build limpios, sin errores de consola. Commiteado.
- [x] Paywall — `src/pages/Paywall.tsx`. Ambos CTA del pie llevan a /login. El usuario pidió explícitamente poder devolverse desde el Paywall y desde Login (anulando la decisión original de "sin botón de salida") — Paywall ahora tiene botón "volver" a `/onboarding` (reinicia el recorrido, ya que su estado vive solo en ese componente; es la misma limitación aceptada en el botón volver de Login → /paywall) y Login tiene botón "volver" a `/paywall`. Verificado en navegador sin errores, tsc y build limpios.
- [x] Login — `src/pages/Login.tsx` (correo o Google, sin backend todavía — navega a /app; Supabase Auth real se conecta en sesión posterior, ya decidido). El usuario probó a fondo el Onboarding y pidió varios ajustes, todos hechos: "Agregar insumo" y "Seguir" separados en 2 acciones independientes (antes un botón hacía ambas); ya no se precarga ningún insumo de ejemplo al elegir tipo de negocio (el cliente agrega los 3 desde cero); corregido un ícono de aviso sin ancho/alto que se inflaba a pantalla completa (se fijó el tamaño + salvavidas en el CSS del toast); corregida la altura/alineación del campo de precio vs. el selector de moneda (le faltaba el estilo base de `.campo`); corregido el texto de moneda que quedaba superpuesto sobre el campo (margen negativo desactualizado). Verificado de punta a punta en navegador, tsc y build limpios.
- [x] App interna — infraestructura compartida + Panorama: estado central `src/lib/appStore.tsx` (mismos datos de ejemplo del prototipo: insumos/recetas/cotizaciones/cfg) y layout compartido `src/components/AppLayout.tsx` (barra superior + barra inferior fija de 5 pestañas, primitivas de diseño en `AppLayout.css` escopadas bajo `.app-interna` para no chocar con las del onboarding). `src/pages/app/Panorama.tsx`: ganancia en vivo desde las cotizaciones reales, navegación entre meses, accesos rápidos a Recetas/Cotizaciones (rutas aún con placeholder). Se agregaron tokens `--error-tint`/`--aviso-tint`/`--tabbar-bg`/`--tabbar-icon-inactivo` a globals.css. El usuario probó en su navegador real y reportó la pantalla en blanco (topbar y barra inferior sí se veían): causa raíz encontrada — la animación de entrada en `AppLayout.css` usaba la clase global `.entrada` (ya definida en `PhoneFrame.css`) y le faltaba `animation-fill-mode:forwards`, así que al terminar la animación el contenido volvía a `opacity:0` de esa regla global. Corregido renombrando la clase a `.entrada-interna` (propia de app-interna, ya no choca con onboarding/paywall/login) y agregando `forwards`. El usuario confirmó que ya se ve bien ("si el panorama se ve bien"). Panorama CERRADO.
- [x] App interna: Insumos — `src/pages/app/Insumos.tsx` + `Insumos.css` (estilos compartidos en `AppLayout.css`, se agregaron `.btn-atras-sub`/`.campo-2`). Lista con filtros por categoría (ingrediente/empaque/adicional), alta manual con validación (nombre, precio, categoría, unidad, piezas-que-trae si aplica, stock inicial opcional), detalle de insumo con "registrar compra" que SUMA al stock (y puede actualizar el precio), aviso visual de stock bajo (umbral = uso típico en las recetas que lo usan). Helpers de stock (`etiquetaUnidad`/`nombreCantidadUnidad`/`stockBaseDesdeCantidad`/`formatearStock`) agregados a `src/lib/appStore.tsx` junto a `stockEsBajo` que ya existía. Decisión técnica: el botón "Escanear factura" del prototipo (simulado) se OMITIÓ por ahora — la IA real de escaneo se conecta en la fase de servicios externos ya decidida en la secuencia maestra, no antes; no tiene sentido mostrar una función simulada que luego hay que reemplazar. Verificado en navegador: agregar insumo, filtrar, ver detalle, registrar compra (stock sube), insumo nuevo con stock 0 se marca "se está acabando" — tsc y build limpios, captura a 375px revisada (pantalla secundaria del tipo ya aprobado en Panorama, no requiere revisor-visual). Ajustes pedidos por el usuario tras probarla, ya hechos: (1) la lista ahora se ordena alfabéticamente por nombre (independiente del filtro activo); (2) se agregó un aviso visible arriba de la lista ("Se te está acabando: X, Y.") cuando hay uno o más insumos con stock bajo, usando el mismo patrón visual `.aviso-precio` del SO — antes solo se notaba en el texto chico de cada fila. Verificado en navegador.
- [x] App interna: Recetas — `src/pages/app/Recetas.tsx` + `Recetas.css` (estilos compartidos agregados a `AppLayout.css`: `.insumo-chip`, `.nota-estimado`, `.slider-wrap`/`.slider-valor`, `.fila-config`, `.resultado-mini`, `.desglose-costo`, todos re-escopados bajo `.app-interna` para no repetir el bug de colisión con las clases globales de `PhoneFrame.css`). Lista de recetas con costo real y precio sugerido (reutiliza `costear()` de appStore/costeo.ts); constructor: nombre, unidades por tanda, filas dinámicas de insumos (agregar/quitar, con conversión tazas/cucharadas→gramos para harina/azúcar/mantequilla/etc.), slider de margen 10-70%, campo de horas, botón calcular con desglose completo en modo "gastos reales" (insumos, mano de obra, % fijos/variables, aviso si el % es imposible) y resultado simple en modo simple, guardar receta. El acceso rápido de Panorama ("Costear receta nueva") ya abre el constructor directo vía navigation state. Verificado en navegador: calculó $3.240 sugerido para una receta de prueba (100g harina, margen 50%, modo simple — coincide con la fórmula), guardó y apareció en la lista, agregar/quitar filas de insumos funcionan — tsc y build limpios, capturas a 375px revisadas (pantalla del tipo ya aprobado, no requiere revisor-visual). El usuario pidió poder EDITAR una receta ya guardada (agregar/quitar insumos, cambiar cantidades/peso/margen) — agregado: tocar una receta de la lista abre el mismo constructor precargado con sus datos (las cantidades se muestran siempre en gramos/piezas, no se intenta reconstruir si el usuario las había cargado en tazas/cucharadas — no hay forma exacta de revertir esa conversión), el título cambia a "Editar receta" y el botón a "Guardar cambios", y al guardar actualiza esa receta en su lugar (no crea una duplicada). Verificado: edité Torta de chocolate (harina 600g→700g), el costo y precio se recalcularon y la lista se actualizó sin duplicar. El usuario reportó (con captura) el botón "+ Agregar insumo" montado sobre el texto de ayuda de tazas/cucharadas: causa raíz — `.app-interna .btn-secundario` en `AppLayout.css` se había portado con valores distintos a los del prototipo real (sin `margin-bottom`, borde sólido en vez de punteado, color de texto equivocado) y por eso dependía sin darse cuenta del margen de la regla GLOBAL (sin escopar) `.btn-secundario` de `PhoneFrame.css` (`margin-top:10px`, que no sirve aquí) — mismo patrón de colisión ya visto con `.entrada`. Corregido re-portando la regla exacta de `dev/app-interna.html` (borde punteado color acento, `margin-bottom:14px`) para que ya no dependa de ninguna otra hoja de estilos. Verificado en navegador.
- [x] App interna: Cotizaciones — `src/pages/app/Cotizaciones.tsx` + `Cotizaciones.css` (primitivas agregadas a `AppLayout.css`: `.tarjeta-fila`, y `.info`/`.nombre`/`.meta`/`.cifra` generalizados para funcionar tanto en `.item-lista` como en `.tarjeta-fila`). Lista con filtros por estado (todas/vendida/pendiente/rechazada), tarjeta por cotización con botones para cambiar de estado; nueva cotización (cliente + receta a cobrar, monto calculado con `costear()`) con el mismo mensaje de "cotización lista para WhatsApp" del prototipo (no abre WhatsApp de verdad, igual que el prototipo); al marcar una vendida se descuenta el inventario de sus insumos (reutiliza `ajustarInventarioPorVenta` de appStore), se lanza confeti (`useConfeti`/`Confetti`) y aparece el toast de "¡Vendida!" + aviso de stock bajo si aplica 4s después; al marcar rechazada, toast de ánimo; el acceso rápido de Panorama ("Nueva cotización") abre el formulario directo. Verificado en navegador de punta a punta: cambiar estado de una cotización actualiza Panorama (ingreso, ganancia, cotizaciones vendidas) e Insumos (stock descontado, incluyendo que Chocolate en polvo pasó a "se está acabando") en vivo; crear una cotización nueva funciona y calcula el monto correcto — tsc y build limpios. El usuario reportó que el confeti al marcar "vendida" ya no se veía: causa raíz — `src/components/Confetti.tsx` dibuja las piezas dentro de `.confetti-zona`, que se posiciona donde ese componente quede en el flujo normal de la página (`position:relative`); en Onboarding eso cae arriba porque el componente está al inicio de una pantalla corta, pero en Cotizaciones lo puse al final de una lista potencialmente larga — el confeti SÍ se disparaba, pero fuera de lo visible salvo que el usuario estuviera scrolleado hasta el final. Primer intento (`position:fixed` arriba de toda la pantalla) resultó NO ser lo que el usuario quería: pidió que el confeti aparezca "justo en la cotización que se marque como vendida", no como aviso genérico arriba. Corregido de verdad: `Confetti.css` vuelve a `position:relative` (anclado a donde se renderiza), y en `Cotizaciones.tsx` se agregó estado `confettiIdx` — el componente `<Confetti/>` ahora se renderiza DENTRO de la tarjeta específica que se acaba de marcar vendida, no al final de la lista. Verificado por código: las 14 piezas quedan dentro del contenedor de esa tarjeta exacta, ninguna fuera.
  El usuario reportó (con captura) que el flujo de "Nueva cotización" no cumplía lo que su propio botón prometía: no mostraba el logo real, no mostraba cómo quedaba la cotización, y no pedía el número de WhatsApp del cliente. Corregido: ahora hay un paso real de "revisar" entre el formulario y el envío, que muestra la cotización formateada tal como la vería el cliente (logo real de la app — antes era una "M" genérica —, nombre del negocio, cliente, producto, total, fecha); se agregó el campo del número de WhatsApp (validado, mínimo 7 dígitos); y el botón "Enviar por WhatsApp" ahora SÍ abre WhatsApp de verdad con el mensaje ya redactado, vía un enlace `wa.me/<número>?text=<mensaje>` (no necesita cuenta ni backend — el prototipo original nunca llegó a abrir WhatsApp realmente). Verificado: la URL de wa.me se construye bien con el número y el mensaje codificado, la validación de cliente/teléfono bloquea si faltan, el logo (`/isotipo.svg`) carga correctamente. tsc y build limpios.
  Segunda ronda de feedback (con captura) sobre esta misma tarjeta: (1) decisión de NEGOCIO importante del usuario — las cotizaciones SIEMPRE deben calcularse con gastos fijos/variables reales, sin importar si el usuario tiene el modo "simple" o "real" activo en Ajustes, porque de lo contrario el precio cotizado podría no cubrir sus gastos reales y vendería a pérdida (la promesa central de la app es justo evitar eso). Se agregó `costearReal()` en `appStore.tsx` (idéntico a `costear()` pero forzando `modoReal=true` siempre) y Cotizaciones ahora SOLO usa `costearReal` para el monto que se cotiza — verificado que da un total distinto (y mayor) al que muestra Recetas en modo simple, confirmando que ya no depende del toggle global. (2) "MargenPro Repostería" → solo "MargenPro" (el nombre real del negocio del usuario no es un campo que exista todavía). (3) Se agregó la fecha real del día (en vez de "Cotización de hoy"), el precio por porción cuando la receta tiene más de 1 unidad, y un mensaje corto que invita a comprar. (4) Logo propio: se agregó en Ajustes una sección "Logo de tu negocio" con subida de imagen (se guarda en `localStorage`, clave `margenpro-logo-negocio`, así persiste entre sesiones sin necesitar backend) — la cotización usa ese logo si existe, si no cae al isotipo de MargenPro. Verificado en navegador: subí una imagen de prueba en Ajustes, confirmé que quedó en localStorage y que la vista previa de la cotización la mostró; limpié el dato de prueba al terminar para no dejarlo en el navegador real del usuario.
  Tercera ronda de feedback: (a) el usuario quería poder poner el NOMBRE de su negocio (no solo el logo) — se agregó `nombreNegocio` a `appStore.tsx` (persistido en `localStorage`, clave `margenpro-nombre-negocio`, default "MargenPro") con su campo en Ajustes bajo el encabezado unificado "Tu negocio" (nombre + logo + línea de atención juntos); la vista previa de la cotización ahora muestra ese nombre en vez de "MargenPro" fijo. (b) se agregó `lineaAtencion` (mismo patrón de persistencia) con su propio campo en Ajustes. (c) el mensaje de WhatsApp se reescribió exactamente como pidió el usuario: "Hola {cliente}! Te hablamos de {negocio}. Aquí tienes tu cotización de *{producto}*: {precio}. [Si tienes alguna inquietud no dudes en contactarnos a nuestra línea de atención {línea} — será un gusto ayudarte.] {mensaje de venta}" — la frase de contacto solo aparece si el usuario llenó su línea de atención. (d) el mensaje de venta cambió de "Hecho con ingredientes de calidad..." a "✨ ¡La mejor calidad al mejor precio!". Verificado en navegador de punta a punta: configuré "Dulces de Ale" + un número de contacto en Ajustes, y confirmé que tanto la vista previa como el mensaje real de WhatsApp (decodificando la URL `wa.me`) salieron exactamente como se pidió — limpié los datos de prueba del localStorage al terminar. tsc y build limpios.
  El usuario pidió que Ajustes YA NO guarde automático — ahora cada campo (toggle, sliders, valor hora, nombre/logo/línea de atención del negocio, moneda) vive en estado LOCAL del componente y solo se aplica al estado central (y a localStorage) al pulsar el nuevo botón "Guardar cambios" (con toast de confirmación). Verificado: cambiar un campo y navegar a otra pantalla sin guardar descarta el cambio (vuelve al valor guardado); pulsar "Guardar cambios" sí lo persiste. tsc y build limpios.
  El usuario probó la imagen y confirmó que quedó perfecta; pidió un último ajuste: quitar el precio del MENSAJE de texto de WhatsApp (ya que ahora se ve en la imagen adjunta, más formal) — el mensaje pasó de "...tu cotización de *{producto}*: {precio}.{contacto} {mensaje}" a "...tu cotización de *{producto}*.{contacto} {mensaje}" (sin el precio ni los dos puntos). Verificado: el mensaje real de WhatsApp ya no incluye el monto.
  El usuario preguntó si era viable enviar la cotización como una IMAGEN profesional (con logo, negocio y datos) en vez de solo texto. Se le explicó la limitación real de WhatsApp antes de construir: el enlace `wa.me` SOLO admite texto, nunca adjuntar una imagen automáticamente — eso requeriría el WhatsApp Business oficial de Meta (cuenta + servidor propio), que es un paso más grande para la fase de servicios externos. Con su aprobación, se construyó la mejor alternativa posible SIN backend: `src/lib/imagenCotizacion.ts` dibuja la tarjeta de la cotización en un `<canvas>` (logo, nombre del negocio, cliente, producto, precio por porción si aplica, total, mensaje de venta, fecha — leyendo los mismos tokens de color/tipografía de globals.css, así respeta claro/oscuro) y la exporta como PNG. En Cotizaciones, "Enviar por WhatsApp" ahora: en celular (si el navegador soporta compartir archivos — `navigator.canShare`) abre el menú nativo de compartir con la imagen + el texto ya listos, para que el usuario elija WhatsApp con un toque; en computador (o si no hay soporte), descarga la imagen sola y abre WhatsApp con el texto, avisando que hay que adjuntarla a mano. Se corrigió además un bug real que esto introdujo: como generar la imagen toma un instante (es asíncrono), abrir la pestaña de WhatsApp DESPUÉS de ese instante hacía que el navegador la bloqueara por no verla como clic directo — se arregló reservando la pestaña en blanco ANTES de generar la imagen y recién ahí navegándola a la URL de WhatsApp. Verificado en navegador (entorno de escritorio, sin soporte de compartir nativo): la imagen se genera correctamente (640×900px, ~60-65KB), se dispara la descarga, y la pestaña de WhatsApp se abre con el mensaje correcto sin ser bloqueada — se insertó la imagen generada en la página para revisarla visualmente y el diseño se ve limpio y profesional. tsc y build limpios.
  También a pedido del usuario: (a) en Onboarding, el confeti del resultado (paso 6) ahora SOLO se dispara cuando el precio actual del usuario ya iguala o supera el precio sugerido (`precioActual >= precioSugerido`, mismo umbral que ya usaba el mensaje "¡Vas bien!") — antes se disparaba siempre sin importar el resultado de la comparación; en el caso negativo (pierde o gana poco) se deja sin confeti, tal como el usuario pidió dejarlo. (b) Login ahora tiene botón de volver (`onBack` a `/paywall`) — antes no se podía regresar desde Login para reconsiderar "seguir con el plan gratis limitado" tras elegir los 7 días gratis.
  El usuario luego reportó que ESE confeti del paso 6 (cuando sí se dispara) se ve "menos festivo" que el de Cotizaciones, aunque es literalmente el mismo componente. Causa raíz encontrada: la pantalla del paso 6 tiene un fundido de entrada (`.entrada`, 450ms, heredado de PhoneFrame) que envuelve TODO el contenido incluido el confeti — como el confeti se disparaba en el mismo instante en que empieza ese fundido, las piezas caían mientras la pantalla todavía estaba apareciendo (opacidad baja), y para cuando la pantalla llegaba a opacidad completa la animación de caída ya iba muy avanzada. En Cotizaciones no pasa esto porque la tarjeta ya está 100% visible cuando se toca "Marcar vendida". Corregido: el confeti del paso 6 ahora se retrasa 480ms (justo después de que termine el fundido) antes de lanzarse — mismo componente, ahora visible a opacidad completa desde el primer frame. Pendiente de confirmación visual del usuario (no se pudo verificar con captura porque el usuario estaba probando la app en vivo en el mismo panel al momento del arreglo).
  Otros dos ajustes del mismo mensaje: (c) el texto chico del tour final (paso 7) decía "Marca una cotización vendida y celebramos contigo" — cambiado a "Esto y mucho más podrás encontrar en MargenPro."; el usuario pidió además que quedara centrado ENTRE las dos columnas de tarjetas (no solo `text-align:center` dentro de su propio ancho, que con una línea casi del ancho completo no se notaba) — se le dio `max-width:78%` + márgenes automáticos para que el bloque de texto sea más angosto que el grid y el centrado se note, verificado por geometría (centro del párrafo y centro del grid coinciden exactamente) y por captura. (d) en Paywall, el párrafo de la nota de moneda USD volvía a superponerse con la caja de arriba: tenía un `margin-top:-6px` en línea que pisaba el `margin-top:8px` correcto ya fijado en la regla compartida — se quitó el override en línea.
  Confeti del paso 6 — VERIFICADO con mediciones de alta frecuencia (cada 100ms) en una pestaña aparte para no interferir con el usuario, que estaba probando la app en vivo: las 14 piezas aparecen ~500ms después de calcular (justo cuando `.entrada` ya está en opacidad 1) y se limpian ~1.8s después, igual que en Cotizaciones. Las primeras pruebas habían dado falso negativo por la latencia entre llamadas de herramienta (el confeti ya se había limpiado para cuando se alcanzaba a revisar).
  El usuario pidió además que ese confeti quedara anclado al anuncio positivo mismo (mismo criterio que en Cotizaciones: no un efecto genérico de pantalla, sino pegado al elemento que se celebra) — movido de estar junto al título de la receta a estar DENTRO de la caja verde `.comparacion-actual.es-exito` (solo se renderiza ahí cuando `cmp.clase === 'es-exito'`). Verificado por DOM: las 14 piezas quedan dentro de esa caja, no afuera.
  También a pedido del usuario: título y subtítulo de TODOS los pasos (2, 3, 4, 5 y 7 — el 1 y el 6 ya estaban centrados) ahora llevan `text-align:center` explícito (antes solo paso 1/6/7 lo tenían). Se centró SOLO el título/subtítulo de cada paso, no el contenedor completo, para no descentrar las listas de opciones ni los formularios de abajo (que deben seguir alineados a la izquierda) — verificado con captura en pasos 2 y 4 confirmando que las opciones/campos no se vieron afectados.
  El usuario reportó con capturas que NINGÚN subtítulo quedó realmente centrado pese al `text-align:center`. Causa raíz encontrada: `.onboarding p.sub` (Onboarding.css) tiene `max-width:34ch` — eso angosta la caja del párrafo, y como el contenedor padre de los pasos 2/3/4/5/7 es un flex-column SIN `align-items:center` (a diferencia de paso 1/6 que sí lo tienen en su propio wrapper), esa caja angosta queda pegada al borde izquierdo en vez de centrarse; `text-align:center` solo centra el texto DENTRO de esa caja ya desplazada, por eso cada línea se veía "centrada consigo misma" pero el bloque entero no. Corregido agregando `margin-left:auto; margin-right:auto` (inline) a los 5 subtítulos de los pasos 2, 3, 4, 5 y 7 (el título h2 no lo necesitaba porque no tiene max-width, ocupa el ancho completo). Verificado por GEOMETRÍA real (no solo `getComputedStyle`, que ya había dado un falso "centrado" antes): el centro del párrafo coincide con el centro del `.phone-frame` en pasos 2, 4 y 5 (ej. 300 vs 301).
- [x] App interna: Ajustes — `src/pages/app/Ajustes.tsx` + `Ajustes.css` (primitivas agregadas a `AppLayout.css`: `.toggle-switch`). Toggle "usar mis gastos reales" (modo simple/real) con la tarjeta explicativa de cómo sacar el %, sliders de % fijo (0-60, default 20) y % variable (0-40, default 0), campo de valor por hora, y selector de moneda de insumos (COP/MXN/PEN/USD). TODAS las pantallas de app interna están construidas — Sesión 6 completa en ese frente. Verificado en navegador: activar el toggle muestra los sliders y la tarjeta de ayuda, mover los sliders actualiza el %, cambiar moneda a USD se refleja de inmediato en Recetas (precios con "US$" y recalculados en modo real con el desglose completo) — confirma que `cfg`/`modoCalculo`/`moneda` del estado central llegan correctamente a las demás pantallas. tsc y build limpios.

Siguiente acción exacta: el usuario pidió, con una especificación detallada, la feature de "escaneo de factura" (actualiza insumos por foto, con reglas estrictas para no tocar cotizaciones vendidas) — se armó un plan en modo plan y quedó aprobado (plan completo en el historial de la sesión; Fase 0 = terminar Auth real + migrar Insumos/Recetas/Cotizaciones a Supabase; Fases 1-6 = la feature de factura en sí, con Vitest nuevo, tablas `facturas_escaneadas`/`insumo_alias`/`insumo_precio_historial`/`ai_calls`, Edge Function, RPC transaccional). **Auth real de punta a punta ya CONFIRMADO por el usuario** (2026-11-12): el correo compartido de Supabase tiene un límite de envíos muy bajo (pensado solo para pruebas) y además solo manda a direcciones del equipo del proyecto — se conectó SMTP propio con Resend (gratis, hasta que se compre el dominio solo entrega al correo con el que se creó la cuenta de Resend, suficiente para las pruebas de ahora) vía Authentication → Emails/SMTP Settings del dashboard de Supabase. El enlace mágico solo funciona abierto en el MISMO aparato donde corre `npm run dev` (en el celular "localhost" no encuentra nada) — el usuario lo probó desde el celular (falló, esperado) y luego desde el PC (entró bien). Login QUEDA CERRADO. Dato aparte resuelto con el usuario: la plantilla de correo "Magic Link" de Supabase no trae el código de 6 dígitos por defecto — Supabase bloquea editar el HTML de la plantilla sin SMTP propio, así que por ahora solo se usa el enlace (no el código) hasta que se agregue `{{ .Token }}` a la plantilla cuando haya SMTP propio permitiéndolo. Insumos YA MIGRADO a Supabase real (2026-11-12): `src/lib/appStore.tsx` ya no guarda insumos en memoria — se cargan con `supabase.from('insumos').select('*')` (filtrado solo por RLS, no hace falta filtrar por usuario a mano) y se guardan con `agregarInsumo`/`registrarCompraInsumo` (nuevas funciones del store). `Insumo.id` e `InsumoUsado.insumoId` pasaron de `number` a `string` (uuid real) en `types.ts`. Decisión técnica: se quitaron los 7 insumos de ejemplo que vivían en memoria — un usuario real entra con cero insumos (ya se le explicó al usuario que así debe ser, el onboarding le llena el primero). Efecto secundario esperado y aceptado: las 3 recetas de ejemplo (`RECETAS_INICIALES`, todavía en memoria) quedaron con `insumoId` que ya no coinciden con ningún insumo real — el motor de costeo los ignora sin romperse (ver costeo.ts línea `if (!ins) return`), es una ventana de transición que se cierra sola en el siguiente paso (migrar Recetas). Verificado: tsc y build (`tsc -b`, el que SÍ revisa todo el proyecto) limpios, pantalla de Insumos sin sesión carga vacía sin errores de consola. **CONFIRMADO por el usuario** (2026-11-12): agregó un insumo real ("Harina de trigo") y quedó guardado y visible en la lista — verificado también directo en la tabla de Supabase. Insumos CERRADO.
Recetas TAMBIÉN MIGRADO a Supabase real (mismo día): `recetas` + `receta_insumos` (tabla intermedia N:M) reemplazan la memoria — `guardarRecetaNueva`/`actualizarRecetaExistente` en appStore.tsx hacen insert/update + reescriben sus filas de `receta_insumos` (se borran y se vuelven a insertar al editar, no hace falta RPC transaccional aquí porque no es una operación sensible a dinero). `Receta.id` pasó de `number` a `string` (uuid). Probado por mí mismo en el navegador con sesión real del usuario: crear una receta (guarda bien, costo correcto) y editarla (cambié una cantidad de 100→250g, se reflejó en la base de datos sin duplicar) — datos de prueba ya borrados. tsc y build (`tsc -b`) limpios. Cotizaciones TAMBIÉN MIGRADO a Supabase real (mismo día) — **FASE 0 COMPLETA**: `crearCotizacion`/`cambiarEstadoCotizacion` en appStore.tsx reemplazan la memoria; `Cotizacion` ahora tiene `id: string` (antes se indexaba por posición en el array); se guarda `receta_id` (si la receta cotizada existe) y `telefono`, aunque la UI no los muestre todavía. Probado por mí mismo de punta a punta con la sesión real del usuario: crear una cotización (quedó en Supabase con su `receta_id` enlazado) y marcarla "vendida" (el estado se actualizó en la base de datos) — datos de prueba ya borrados. tsc y build (`tsc -b`) limpios.
**Las 3 pantallas de datos (Insumos, Recetas, Cotizaciones) ya NO usan datos de ejemplo en memoria — todo es Supabase real.** Pendiente menor, no bloqueante: Ajustes y Panorama todavía leen `cfg`/`logoNegocio`/`nombreNegocio`/`lineaAtencion` de `localStorage` (no de `config_negocio`) — se puede migrar después, no es urgente porque ya funciona y no se pierde con el login (vive en el navegador). **Escaneo de factura — EN CURSO (2026-11-12), Fases 1-2 de 6 completas:**
- Vitest instalado y funcionando (`vitest.config.ts`, `src/test/setup.ts`, script `npm run test`) — un test de humo en `src/lib/costeo.test.ts` pasa limpio.
- 4 tablas nuevas aplicadas en Supabase (migración `escaneo_factura_tablas`, mismo patrón RLS que `schema.sql`, documentadas también en `supabase/schema_escaneo_factura.sql`): `facturas_escaneadas` (estado/modo/items jsonb/imagen_path/error/deshecho_en), `insumo_alias` (aprendizaje texto-factura→insumo), `insumo_precio_historial` (habilita Deshacer), `ai_calls` (circuit-breaker, solo el servidor inserta — el cliente solo puede leer su propio gasto). Bucket privado nuevo `facturas-temporales` (carpeta por usuario, a diferencia de `logos-negocio` que es público) — verificado sin advertencias nuevas de seguridad (`get_advisors`).
- Edge Function `escanear-factura` desplegada (v2, activa): recibe solo el `facturaId` (nunca la imagen en el body), descarga la foto de Storage con la sesión del propio usuario (RLS), llama a Claude (`AI_MODEL` env var, default `claude-haiku-4-5`) con tool-use FORZADO + zod + reintento que reinyecta el error si no valida, respeta el tope de 30 escaneos/mes (cuenta `ai_calls` del mes), y guarda tokens/costo real en `ai_calls` (vía un cliente de service-role SOLO para ese insert, todo lo demás usa la sesión del usuario). Adaptador cliente en `src/lib/ai/vision.ts` (`subirFotoFactura`/`crearFacturaEscaneada`/`escanearFactura`).
- Clave `ANTHROPIC_API_KEY` ya generada por el usuario y guardada como secreto en Supabase — CONFIRMADO. Se probó la conexión completa con una factura sintética (texto renderizado en un canvas) subida a Storage con la sesión real del usuario: subida ✓, fila creada ✓, la función SÍ llega hasta llamar a Claude (confirmado por el error real que devolvió la API, no un error de conexión). En el camino se encontraron y corrigieron DOS bugs reales de la función (no del plan): (1) faltaban los encabezados CORS — el navegador bloqueaba la respuesta; se agregaron `CORS_HEADERS` + manejo de `OPTIONS`. (2) la plataforma de Supabase interceptaba el preflight ANTES de que la función pudiera responder porque `verify_jwt` estaba en `true`; se cambió a `false` porque la función YA valida la sesión por su cuenta (lee el header Authorization y llama `supabase.auth.getUser()`) — verify_jwt en true es redundante aquí y rompía CORS. También se envolvió todo el handler en try/catch para que CUALQUIER error interno responda con JSON + CORS en vez de un fallo críptico sin CORS (así se pudo diagnosticar el problema real). Edge Function en v6, activa.
**ESCANEO DE FACTURA — FUNCIONANDO DE PUNTA A PUNTA (2026-11-12), Fases 1-5 de 6 completas:**
- El usuario cargó $5 USD en Anthropic (Plans & Billing) — bloqueante resuelto.
- Probado dos veces de punta a punta con una factura sintética (texto renderizado en un canvas, subido como si fuera una foto real) a través de la PANTALLA REAL (`src/pages/app/Insumos.tsx` → botón "Escanear factura" → `src/pages/app/EscanearFactura.tsx`), no solo contra la Edge Function: subir foto → crear fila → la IA lee los productos (95% de confianza) → emparejamiento automático correcto (un insumo existente se vinculó solo, uno nuevo quedó en "Crear insumo nuevo") → confirmar → verificado en la base de datos real que TODO coincide exacto (precio recalculado correctamente: $75.000 por 10kg → $7.500/kg; insumo nuevo creado con sus datos; stock sumado en gramos; historial de precio con el valor anterior y nuevo; alias aprendido para la próxima vez) → al confirmar se BORRA sola la foto de Storage (minimización de datos, ya verificado). Datos de prueba limpiados cada vez, el insumo real del usuario (Harina de trigo) quedó restaurado a su valor antes de la prueba ($8.000/kg, 1.900g).
- Bug real encontrado y corregido durante la prueba: al crear un insumo NUEVO desde la factura, el alias no quedaba guardado — `crearInsumoDesdeFactura` buscaba el insumo recién creado en el `insumos` del estado de React, que todavía no se había refrescado (closure desactualizado). Se corrigió haciendo que `agregarInsumo` devuelva el insumo creado (con su id real) en vez de solo `true/false`, eliminando la necesidad de buscarlo en el estado. Reconfirmado con una segunda prueba completa: ya guarda los dos alias.
- Arquitectura final: `src/lib/facturaMatching.ts` (normalización precio-total→precio-por-unidad + emparejamiento por alias/similitud de nombre, con 12 pruebas unitarias en `facturaMatching.test.ts`, todas pasando) · `src/lib/ai/vision.ts` (adaptador cliente) · `supabase/functions/escanear-factura/` (Edge Function, vista arriba) · funciones nuevas en `appStore.tsx`: `confirmarItemFactura`/`crearInsumoDesdeFactura` (aplican un ítem: precio+stock+historial+alias) / `cerrarFacturaEscaneada` (marca confirmada/descartada y borra la foto) / `deshacerFactura` (revierte precios usando el historial, conectado a un botón "Deshacer" en la pantalla de resumen).
- **Regla de negocio verificada por diseño de código (no solo por prueba manual): el flujo de escaneo NUNCA escribe en la tabla `cotizaciones`** — solo LISTA las pendientes/rechazadas que usan un insumo afectado, para que el usuario decida aparte en la pantalla de Cotizaciones. Las `vendida` ni siquiera se listan. Esto cumple la regla más estricta del plan sin necesitar una RPC transaccional aparte (no es una operación de dinero que se mueva solo, es una lectura informativa).
- tsc, `npm run build` (`tsc -b` completo) y `npm run test` (12/12) limpios tras cada cambio.
- Pendiente real (no bloqueante, anotado para más adelante): la pantalla de revisión no tiene todavía una vista previa de la imagen subida junto a los datos leídos (el usuario no ve la foto mientras edita) — mejora de pulido, no funcionalidad faltante. Tampoco hay todavía una pantalla para VER el historial de escaneos pasados (solo se puede deshacer el que se acaba de confirmar, desde la misma pantalla de resumen) — si el usuario quiere deshacer un escaneo de hace varios días, hoy tendría que hacerse a mano en la base de datos.
- **El usuario PROBÓ CON UNA FOTO REAL de una factura de hamburguesas** (2026-11-12) y confirmó que "agrega súper bien" — quedaron guardados de verdad: Mayonesa, Mostaza, Ketchup, pepinillos, cebolla, tomate, lechuga, queso tajado, Pan para hamburguesa, Carne molida. Primer uso real de la feature, exitoso.
- **Bug real encontrado con una foto REAL del usuario** (factura de panadería, formato colombiano): la IA interpretaba "$4.500" como 4.5 en vez de 4.500 — confundía el punto separador de miles con un punto decimal (comportamiento típico de modelos entrenados mayormente con formato anglosajón). Corregido agregando instrucciones explícitas en el tool schema y en el prompt de texto (`supabase/functions/escanear-factura/index.ts`, v7 desplegada) aclarando que en facturas latinoamericanas el punto separa miles, con ejemplos exactos. Reproducido el bug y confirmado el fix subiendo la MISMA foto del usuario (copiada temporalmente a `public/` del proyecto, ya borrada) a través de la pantalla real dos veces (antes/después del fix). Nota aparte para el usuario: en esa factura puntual, dos precios (Azúcar/Chips) pueden salir cruzados entre sí porque la tabla impresa tiene las columnas visualmente desalineadas — por diseño, la pantalla de revisión existe para corregir esto antes de confirmar, no es necesario arreglarlo en el código.
- Dos ajustes más pedidos y ya hechos: (1) 4 insumos de esa factura real quedaron con un ESPACIO en blanco al inicio del nombre (" pepinillos", " tomate", etc. — la IA lo devolvió así) y por eso el orden alfabético se veía roto (el espacio ordena antes que las letras); se corrigieron esos 4 nombres en la base de datos y se agregó `.trim()` en el código (al leer la factura y al crear el insumo) para que no vuelva a pasar — además `appStore.tsx` ahora SIEMPRE mantiene `insumos` ordenado alfabéticamente (antes solo la pantalla de Insumos lo reordenaba para mostrar, los desplegables de Recetas/Cotizaciones/Escanear factura no). (2) los campos de cantidad/precio en la pantalla de revisión de factura se quedaban "pegados" en 0 al intentar borrar y escribir un número nuevo — se corrigió mostrando el campo vacío cuando el valor es 0, en vez de forzar el 0 visible. Verificado en navegador: el campo ahora sí se puede vaciar y escribir de corrido. Build limpio.
- Tres ajustes pedidos tras probarlo, YA HECHOS: (1) botón explícito de "quitar" (una X roja, antes solo estaba escondido como opción dentro del desplegable de "a cuál insumo corresponde") — bug encontrado y corregido en el camino: el ícono SVG no tenía `width`/`height` y se renderizaba invisible (0x0), ya corregido; (2) categoría (Ingrediente/Empaque/Adicional) como chips arriba de cada producto — antes los insumos NUEVOS creados desde una factura quedaban siempre como "ingrediente" sin que el usuario pudiera elegir; (3) aviso arriba de la pantalla de revisión explicando que escribir el mismo nombre exacto de un insumo ya existente lo junta automáticamente en vez de crear uno repetido. Verificado en navegador con la sesión real: el botón de quitar cambia el estado (opacidad + "Omitido"), los chips de categoría cambian de activo, y se confirmó por base de datos que todo se guarda bien — con cuidado de NO tocar los insumos reales del usuario (Mayonesa, Ketchup, etc.) durante las pruebas, solo los de prueba propios. tsc, build y las 12 pruebas unitarias limpios.
- Decisión técnica (alcance deliberado, no se construyó un circuit-breaker de gasto en USD diario/mensual aparte): el tope de 30 escaneos/mes YA ES el control de costo prometido al usuario en el pricing (FICHA-MERCADO/ESTADO §Pricing) — un circuit-breaker de gasto en dólares (la sección completa de `30-INTEGRACION-IA.md`) es para escala de 300-500 usuarios concurrentes, no aplica todavía a una sola cuenta de prueba; `ai_calls` ya guarda el costo real por llamada, así que agregar ese control más adelante no requiere rediseño.
- Siguiente paso técnico (Fase 3-4, una vez el usuario confirme la clave guardada): normalización/emparejamiento difuso contra los insumos reales del usuario (reusando `costoPorUnidadBase`) + la pantalla de revisión (subir foto → ver ítems detectados → confirmar) + la RPC que actualiza insumos/historial y solo LISTA (nunca toca sola) las cotizaciones `pendiente`/`rechazada` afectadas.
**EN CURSO (2026-11-13):** el usuario probó con una SEGUNDA foto real propia y reportó que el peso/cantidad no se leía bien (la columna "CANTIDAD" de su factura dice "1" por paquete, pero el peso real — "500gr", "280gr" — vive dentro del nombre del producto). Corregido: se reforzó el prompt y el tool schema de la Edge Function (v8 desplegada) para que la IA busque el peso DENTRO del nombre del producto cuando la columna cantidad es solo un conteo de paquetes. Pendiente confirmar con el usuario tras esta corrección (quedó interrumpido antes de volver a probar).
Acto seguido, el usuario pidió (antes de seguir con la factura) reforzar DOS cosas más — YA IMPLEMENTADAS y verificadas en navegador (2026-11-13):
- **Punto de equilibrio repuesto** (se había retirado antes — ahora volvió de forma distinta): nuevo campo opcional en Ajustes `cfg.gastoFijoMensual` + dos funciones puras en `costeo.ts` (`ventasNecesariasParaCubrirFijo` / `unidadesNecesariasParaCubrirFijo`). Mostrado en Panorama y en cada receta costeada. **Esto quedó SUPERADO el mismo 2026-11-13 — ver más abajo: el usuario pidió retirarlo de nuevo, esta vez de forma definitiva.**
- **Etiquetas de costo fijo/variable**: en Ajustes, cada slider ahora dice explícitamente "(costo fijo)" / "(costo variable)" junto con una frase de una línea explicando qué significa cada uno (a pedido explícito del usuario — esta vez SÍ con el término técnico visible, excepción a la regla general anti-jerga del SO, porque el usuario lo pidió para que sus clientes/él mismo lo entiendan). Mismo patrón aplicado en el desglose de costos de Recetas.
- **Ajuste de alineación**: el texto de cada sugerencia en la lista desplegable se veía pegado hacia abajo — corregido con `display:flex; align-items:center; min-height:36px` en `.lista-sugerencias button`. Verificado por medición real (altura 36px, texto centrado).
- **Dos ajustes más al constructor de recetas (2026-11-13), tras probar lo anterior:** (1) los nombres largos de insumos se superponían en la lista de sugerencias — corregido con una sola línea truncada (`text-overflow:ellipsis`) en `.lista-sugerencias button`. (2) la medida YA NO queda limitada por cómo se compra el insumo — ahora el selector siempre muestra las 7 opciones (gramos/mililitros/tazas/cucharadas/cucharaditas/piezas/libras) para cualquier insumo; si el usuario elige una medida que no coincide con la familia natural del insumo (ej: "queso tajado" se compra por peso pero se quiere usar "por piezas" en la receta), aparece un campo extra "¿Cuántos gramos tiene 1 pieza?" para que dé la equivalencia — sin eso no hay forma honesta de calcular el costo real. Verificado en navegador con ese caso exacto: 2 piezas × 20g/pieza → $3.000 de insumo → $4.050 costo real → $8.100 precio sugerido, matemática correcta a mano.
- **Medidas faltantes en el constructor de recetas (2026-11-13)** (ya superado por el punto anterior, que generaliza esto — se deja el historial): el usuario notó que para insumos comprados por litro/mililitro o por libra, el selector de medida al usarlos en una receta quedaba forzado en "piezas" sin poder elegir nada más — bug real encontrado: `esPeso` solo distinguía kg/g, todo lo demás (incluidos L/ml y libra) caía en el mismo selector deshabilitado de "piezas", así que para líquidos el número que el usuario tecleaba se interpretaba como mililitros sin que la UI lo dijera. Corregido con una nueva función `tipoMedidaInsumo()` (peso/volumen/libra/pieza según `insumo.unidad`) que agrega, SIN QUITAR las que ya había: "mililitros" + tazas/cucharadas/cucharaditas para insumos en L/ml (reusa `convertirAGramos`, igual que para peso), y "libras" fijo para insumos en libra. Verificado en navegador con un insumo de prueba en litros ($8.000/L): el selector mostró "mililitros/tazas/cucharadas/cucharaditas" en vez de piezas, y 200ml dieron $2.160 de costo real — matemática verificada a mano, correcta. tsc, build y las 12 pruebas limpios.
- **De regalo, en el camino**: el usuario pidió además que el selector de insumos en el constructor de Recetas (antes un `<select>` con la lista completa, muy larga) se convirtiera en un campo de búsqueda con sugerencias. Primer intento con `<input list="...">` + `<datalist>` nativo del navegador — el usuario probó y reportó que NO le aparecían sugerencias al escribir. Causa real: el `<datalist>` nativo no es confiable entre navegadores (Safari/iOS en particular casi no muestra su UI de sugerencias) — reemplazado por un autocompletado propio en React (estado `filaAbierta` + lista `.lista-sugerencias` posicionada bajo el campo, filtro por texto sin acentos/mayúsculas, máximo 8 resultados, `onMouseDown` en vez de `onClick` para que la selección no se cierre sola antes de registrar el clic). Verificado en navegador: escribir "carne" sugiere "Carne molida" y seleccionarla deja el campo exactamente en "Carne molida". `Recetas.css` tiene los estilos nuevos (`.lista-sugerencias`).
- **Ronda de 4 ajustes del mismo día (2026-11-13), YA HECHOS y verificados en navegador:** (1) los íconos del tour de onboarding (paso 7: Escaneo/Cotización/Historial/Resumen) eran trazos SVG dibujados a mano que el usuario dijo que "no representan sus textos" y se veían planos — reemplazados por íconos reales de Phosphor en `weight="duotone"` (`Receipt`, `PaperPlaneTilt`, `ClockCounterClockwise`, `ChartBar`), mismo patrón ya usado para los íconos de tipo de negocio en el mismo archivo. (2) ambas barras de Ajustes (costo fijo y costo variable) ahora llegan hasta 80% (antes 60%/40% respectivamente) — pedido explícito del usuario. (3) **"Punto de equilibrio" RETIRADO DE FORMA DEFINITIVA** (segunda vez que se quita, ahora el usuario fue explícito en que no se repone): se borró `ConfigNegocio.gastoFijoMensual` de `types.ts`, las funciones `ventasNecesariasParaCubrirFijo`/`unidadesNecesariasParaCubrirFijo` de `costeo.ts`, la tarjeta de Panorama y el párrafo en Recetas — no queda ningún rastro en código ni en pantalla (verificado). (4) en su lugar se probó una calculadora real (3 campos + botón que sacaba el % solo) — **el usuario la probó y dijo que era "demasiado complicado"**, así que se quitó y se volvió al letrero de EJEMPLO simple de antes (texto fijo: "Si el mes pasado vendiste $5.000.000 y pagaste $1.000.000 de arriendo... eso es 20%... pon la primera barra en 20%", igual para la segunda barra con $2.000.000/40%) — el usuario mueve las barras a mano guiándose por el ejemplo, sin campos que llenar. Verificado en navegador y build limpio.
- Nota técnica (no bloqueante, ya documentada arriba): `cfg` sigue sin persistirse en Supabase/localStorage — se pierde al recargar la página completa. No se corrigió ahora porque no fue lo pedido, pero afecta la prueba de este feature (hay que navegar con los links de la app, no con URL nueva, para probarlo en una misma sesión).
tsc, build y las 12 pruebas unitarias limpios tras estos cambios.
**Bug real encontrado y corregido (2026-11-13), reportado por el usuario con captura de la pantalla de "Registrar una nueva compra" en Insumos:** al registrar una compra manual con un precio distinto al anterior, la app guardaba el TOTAL que el usuario pagó como si ya fuera el precio POR gramo/kg/litro/pieza — nunca lo dividía entre la cantidad comprada. Ej: comprar 1kg (1000g) de Harina a $10.400 debía dejar el precio en $10.4/g, pero quedaba guardado literalmente en $10.400/g. Esto SOLO afectaba la compra manual — el escaneo de factura ya calculaba bien este número desde antes (`normalizarItemFactura` en `facturaMatching.ts`). Corregido con una función compartida `precioPorUnidadDesdeCompra()` en `appStore.tsx` (divide el total entre la cantidad, y para insumos por pieza/docena/paquete multiplica de vuelta por cuántas piezas trae cada paquete) — usada ahora en `guardarCompra()` de `Insumos.tsx`. De regalo, pedido explícito del usuario: (1) la pantalla de "Registrar compra" ahora muestra EN VIVO, mientras escribes, a cuánto te sale por unidad y si subió/bajó/sigue igual respecto al precio anterior, antes de guardar; (2) en la pantalla de resumen del escaneo de factura se agregó una sección nueva "Insumos que cambiaron de precio" (antes solo se veía el efecto en el costo de las recetas, no cuál insumo cambió ni si subió o bajó) — lista cada insumo afectado con su precio anterior → nuevo y la etiqueta (subió)/(bajó). 4 pruebas unitarias nuevas en `src/lib/appStore.precioPorUnidadDesdeCompra.test.ts` (16/16 en total). tsc y build limpios. Pendiente: no se pudo probar en vivo en el navegador porque la sesión del usuario se cerró al reiniciarse el servidor local (quedó sin iniciar sesión) — el usuario debe confirmarlo él mismo con una compra real.
**Edge Function v8 (peso/cantidad leído desde el nombre del producto) — CONFIRMADA (2026-11-13):** se volvió a probar con la MISMA foto real de la factura de panadería (Harina de Trigo 500gr, Mantequilla 280gr, Azúcar 500gr, Chips de Chocolate 500gr — la columna "CANTIDAD" de esa factura dice "1" en las 4 filas) a través de la pantalla real de escaneo. Los 4 ítems quedaron con la cantidad correcta en gramos (500/280/500/500, no "1") — el fix funcionó. Salí de la pantalla SIN confirmar (para no tocar los insumos reales del usuario, como "Harina de trigo") — no quedó ninguna fila pendiente en `facturas_escaneadas` (verificado por base de datos). Nota aparte ya documentada arriba sigue vigente: en esta factura puntual el precio de Azúcar/Chips puede salir cruzado por el desalineamiento visual de esa tabla impresa — es un caso de esa factura, no un bug nuevo, y la pantalla de revisión existe justo para corregirlo antes de confirmar. Se borró `public/_tmp_factura_test.jpg` (archivo de prueba que había quedado suelto). Siguiente paso: si el usuario quiere, puede volver a intentar con esa misma foto u otra para confirmar él mismo y quedarse con los insumos actualizados.
**Ronda de mejoras pedidas tras el análisis completo de la app (2026-11-13-14), items 1-4 de la lista que el usuario aprobó punto por punto (5-9 quedan en la hoja de ruta, ver abajo):**
1. **Valor total y última compra por insumo**: migración nueva (`insumos_ultima_compra`) agrega `ultima_compra_cantidad`/`ultima_compra_total` a `insumos`. En el detalle de un insumo ahora se ve "Valor total de lo que tienes" (precio × stock, función `valorStockInsumo` en `appStore.tsx`) y "Tu última compra" (ej. "500 g · $5.000") cuando ya se registró alguna compra. En la lista, la línea de cada insumo muestra esa misma "Última compra: …" en vez del genérico "por kg/g". Se actualiza tanto desde "Registrar una nueva compra" (`Insumos.tsx`) como desde el escaneo de factura (`EscanearFactura.tsx`) — si el usuario deja el precio en blanco (no cambió), igual se registra la cantidad comprada al precio que ya tenía, para que "última compra" nunca quede desactualizada.
2. **Valor total del inventario**: a pedido explícito del usuario, NO se puso en Panorama — queda en la pantalla de Insumos, en un cuadro pequeño pero notable justo arriba de "+ Agregar insumo" ("Tienes invertido ahora: $X en insumos"), función `valorInventario()` nueva en `appStore.tsx`.
3. **Bug real corregido**: el aviso de "estas cotizaciones usan un insumo que cambió de precio" (pantalla de resumen del escaneo de factura) comparaba por el NOMBRE de la receta/producto — si el usuario renombraba una receta después de cotizarla, el aviso dejaba de encontrarla. Corregido comparando por `receta_id` (ya se guardaba en la tabla `cotizaciones`, solo faltaba mapearlo al tipo `Cotizacion` del frontend — se agregó `recetaId` a `types.ts` y a `filaACotizacion`).
4. **Configuración del negocio migrada de localStorage a Supabase**: `cfg` (barras de costo fijo/variable, valor hora), `modoCalculo`, `moneda`, `nombreNegocio`, `lineaAtencion` y `logoNegocio` ya NO viven en memoria/localStorage del navegador — se cargan y se guardan en la tabla `config_negocio` (que ya existía con RLS, solo faltaba conectarla) mediante una función nueva `guardarConfigNegocio()` en `appStore.tsx`, reemplazando los 6 setters sueltos de antes. Antes de este cambio, `cfg`/`modoCalculo`/`moneda` NI SIQUIERA se guardaban en ningún lado (se perdían al recargar la página) — ese era un bug real preexistente, no solo lo de localStorage. `Ajustes.tsx` se ajustó para sincronizar su formulario local cuando la config real termina de cargar desde Supabase (antes se habría quedado pegado en los valores por defecto).
   tsc, build y las 16 pruebas unitarias limpios (incluye 4 pruebas nuevas para `precioPorUnidadDesdeCompra` en `src/lib/appStore.precioPorUnidadDesdeCompra.test.ts`). No se pudo probar en vivo con datos reales porque la sesión del usuario seguía cerrada en el navegador de prueba — pendiente de que el usuario lo confirme él mismo.
   **Hoja de ruta acordada con el usuario (puntos 5-9, NO implementados aún — cada uno es un proyecto propio, se abordan en sesiones futuras):** (5) historial de facturas escaneadas pasadas (hoy solo se puede deshacer la última), (6) avisos de stock bajo también por correo (hoy solo dentro de la app), (7) reporte mensual descargable, (8) modo sin conexión básico, (9) acceso para un empleado/colaborador además del dueño.

**Tres bugs reales más, reportados por el usuario con captura tras probar esta ronda (2026-11-13/14), YA CORREGIDOS:**
1. **El campo "¿Cuántos kilos tienes ahora?" al crear un insumo no dejaba escribir bien la cantidad**: arrancaba con un "0" literal escrito (no vacío) — en el celular, al tocarlo, el cursor queda al lado del 0 en vez de reemplazarlo, así que el usuario terminaba escribiendo "05"/"50" sin darse cuenta. Corregido dejándolo vacío con el placeholder de guía (mismo patrón ya usado en otras pantallas). A pedido del usuario, también se cambió el texto de la pregunta de "¿Cuántos X tienes ahora?" a "¿Cuántos X compraste esta vez?" (`Insumos.tsx`).
2. **Las cotizaciones no dejaban pedir una cantidad distinta al tamaño de tanda de la receta** (ej. la receta de hamburguesa rinde 5 por tanda, pero el cliente quiere 7 o 12 — antes había que editar la receta, lo cual no tiene sentido). Corregido: nuevo campo "¿Cuántas quiere el cliente?" en "Nueva cotización" (`Cotizaciones.tsx`), precargado con el tamaño de tanda de la receta elegida pero editable; el precio se escala usando el precio-por-unidad ya calculado (sin tocar la receta). Esto exigía otro arreglo real para no romper el inventario: al marcar una cotización "vendida", el descuento de stock ahora se escala por la cantidad REAL pedida (antes siempre descontaba como si se hubiera vendido exactamente UNA tanda, sin importar cuánto decía la cotización) — nueva columna `unidades_cotizadas` en `cotizaciones` (migración `cotizaciones_unidades_cotizadas`), mapeada en `types.ts`/`appStore.tsx`, y `ajustarInventarioPorVenta()` ahora recibe esa cantidad y aplica un multiplicador (`unidadesCotizadas / receta.unidades`) antes de descontar/devolver cada insumo.
3. **"Gastaste en insumos" en Panorama nunca se actualizaba**: causa raíz encontrada — ese número salía de un dato de EJEMPLO fijo (`MESES_INICIALES`, `gasto: 120000`) que nunca se tocaba, sin importar cuánto comprara el usuario de verdad. Corregido de raíz: nueva tabla `compras_insumo` (migración `compras_insumo_log`, con RLS) que registra CADA compra (manual o por factura) con su fecha — a diferencia de `insumo_precio_historial` (que solo guarda el cambio de precio, no guardaba nada de las compras manuales). `appStore.tsx` ahora carga las compras del mes en curso al iniciar sesión y expone `gastoMesActual` (suma real); `Panorama.tsx` usa ese valor para el mes actual en vez del número fijo — los meses anteriores (que son solo datos de ejemplo del prototipo) siguen igual, ya que no hay con qué calcularlos de verdad.
   tsc, build y las 16 pruebas unitarias limpios. Verificado en navegador (sin sesión real) que el campo de cantidad al crear insumo ya queda vacío y acepta escritura normal — lo demás (cotización por cantidad, gasto real en Panorama) queda pendiente de que el usuario lo confirme con su propia sesión y datos reales.

**Ronda de ajustes tras la primera prueba real del usuario (2026-11-14):**
- **Medida libre al registrar una compra (Insumos)**: el usuario probó "Registrar una nueva compra" con un insumo por kg y quedó confuso — forzábamos la cantidad en la unidad propia del insumo (kg), y terminó escribiendo "1500" pensando en gramos pero el campo lo tomó como 1500 KILOS, dejando datos sin sentido ("última compra: 1.500 kg · $50.000" con precio resultante de $33/kg, pero el stock mostraba solo 4kg). Primer arreglo: selector de medida limitado a la pareja natural (kg↔g, L↔ml). El usuario pidió ir más allá: "no todo se compra en kg o gr, pueden ser litros, mililitros, paquete, unidades, piezas". Corregido del todo: el selector de medida en "Registrar una nueva compra" ahora SIEMPRE muestra las 8 medidas (mismo patrón ya usado en Recetas para elegir medida de insumo) — si la medida elegida es de la misma familia física que el insumo (peso: kg/g/libra · volumen: L/ml · pieza: unidad/docena/paquete), la conversión es automática; si no coincide (ej. insumo por kg pero se compró "por paquete"), aparece un campo para la equivalencia ("¿A cuántos kg equivale 1 paquete?"), igual que ya se resolvía en Recetas. Nuevas funciones en `appStore.tsx`: `mismaFamiliaMedida()`, `convertirMedidaCompra()` (ahora recibe el insumo completo, no solo su unidad, para poder convertir dentro de la familia "pieza" usando `unidadesQueTrae`). Se agregó la columna `ultima_compra_medida` a `insumos` (migración `insumos_ultima_compra_medida`) para que "Tu última compra" se muestre en la medida real con la que se registró (no forzada a la del insumo) — también se guarda desde el escaneo de factura (`EscanearFactura.tsx` ya pasa `item.medida`).
- **Cotizaciones: el costo fijo/variable vuelve a ser OPCIONAL, no forzado**: el usuario había pedido antes que las cotizaciones SIEMPRE incluyeran los gastos fijos/variables reales sin excepción — ahora pidió revertir eso a elección del cliente (dueño del negocio). En "Nueva cotización" se agregó un interruptor "Incluir mis costos fijos y variables" (encendido por defecto, lo recomendado) con un mensaje que cambia según el estado explicando por qué importa — activado: "así sabes REALMENTE cuánto ganas... para no vender a pérdida sin darte cuenta"; desactivado: avisa que ese precio puede no alcanzar para cubrir arriendo/sueldo. Nueva función `costearSimple()` en `appStore.tsx` (igual a `costearReal()` pero forzando el cálculo simple, sin importar el modo de Ajustes) — la cotización usa `costearReal` o `costearSimple` según el interruptor.
- tsc, build y las 16 pruebas limpios. Verificado en navegador con sesión real del usuario: el toggle aparece encendido por defecto con su mensaje, y confirmé con una cotización real de hamburguesa ya marcada "vendida" que la pantalla sigue funcionando de punta a punta tras estos cambios.

**Tercera ronda de ajustes (2026-11-14), tras probar lo anterior con datos reales:**
1. **Insumos ya no deja crear duplicados**: el usuario encontró 3 "cebolla"/"Cebolla" repetidas (las creó sin querer al no saber que ya existían). Corregido con el mismo patrón de autocompletado que ya usa Recetas: al escribir el nombre en "+ Agregar insumo" aparecen sugerencias de insumos existentes (sin importar mayúsculas/tildes — nueva función compartida `normalizarParaBuscar()` en `appStore.tsx`, movida desde Recetas para no duplicarla); si el usuario elige una sugerencia, o si intenta guardar un nombre que ya existe exacto, la app NO crea uno repetido — lo manda directo a "Registrar una nueva compra" del insumo que ya tenía (nueva función `encontrarInsumoPorNombreExacto()`). También se agregó la opción de EDITAR el nombre de un insumo ya guardado (ícono de lápiz junto al título en su detalle, con su propio chequeo de duplicado) — nueva función `actualizarNombreInsumo()` en `appStore.tsx`. Verificado en navegador: escribir "CEBO" mostró las 3 cebollas existentes tal cual estaban guardadas, y elegir una llevó al detalle de esa en vez de crear una cuarta.
2. **Cotizaciones: precio en vivo sin esperar a "Revisar"**: en "Nueva cotización" ahora se ve una tarjeta "Le vas a cobrar: $X" que se recalcula al instante al prender/apagar el interruptor de costos fijos/variables o cambiar la cantidad — antes había que ir a la pantalla de revisión para verlo. Verificado en navegador con una receta real: $54.500 con el interruptor encendido → $31.000 al apagarlo, cambio inmediato.
3. **Ejemplo de Ajustes más claro**: el usuario pidió que el ejemplo de "¿no sabes qué % poner?" mostrara los valores, LA OPERACIÓN (no solo el resultado) y el % final. Reescrito: "El mes pasado vendiste $5.000.000 y pagaste $1.000.000 de arriendo... La cuenta: divides lo que pagaste entre lo que vendiste — $1.000.000 ÷ $5.000.000 = 0,20, o sea 20%." (mismo patrón para el segundo %). Verificado en navegador.
tsc, build y las 16 pruebas limpios. Los 3 puntos verificados en navegador con la sesión real del usuario (incluida la confirmación de que el bloqueo de duplicados reconoce las 3 cebollas ya existentes).

**Cuarta ronda (2026-11-14): bugs de la edición de nombre + eliminar insumo.**
- **Bug real corregido**: al editar el nombre de un insumo, el cuadro de texto se veía minúsculo (34px) y no dejaba escribir bien. Causa raíz: `.btn-secundario` tiene `width:100%` por diseño (para los botones de ancho completo que ya existían); al ponerlo junto al campo de texto en una fila flex, ese 100% le ganaba casi todo el espacio al campo, dejándolo casi sin ancho. Corregido con `width:'auto'` en línea sobre ese botón puntual — el campo ya ocupa el espacio normal (281px verificado).
- **Eliminar insumo**: se agregó la opción "Eliminar este insumo" en el detalle, con una confirmación explícita ("¿Eliminar [nombre] para siempre? Esto no se puede deshacer...") antes de borrar. Nueva función `eliminarInsumo()` en `appStore.tsx` — si el insumo está en uso en alguna receta, la base de datos lo rechaza a propósito (restricción ya existente en `receta_insumos.insumo_id`, `on delete restrict`) y la app muestra un mensaje claro en vez de un error críptico: "Este insumo está en uso en una o más recetas — quítalo de esas recetas antes de eliminarlo." Verificado en navegador: el flujo de confirmación se ve bien (no se ejecutó el borrado real sobre datos del usuario durante la prueba, solo se verificó hasta el paso de confirmación).
tsc, build y las 16 pruebas limpios.

**Quinta ronda (2026-11-14): las 2 funciones que se habían dejado pendientes de opinión — el usuario pidió implementar ambas ya ("más adelante será más complejo").**
1. **Redondeo de precios al múltiplo de $50**: nueva función `redondearPrecioVenta()` en `costeo.ts` (`Math.ceil(monto/50)*50`) — se aplica SOLO al precio final que se le cobra al cliente en una cotización, nunca al costo interno de la receta. 2 pruebas unitarias nuevas (ambos ejemplos del usuario: $31.013→$31.050, $44.093→$44.100, + caso ya-exacto). Las cotizaciones viejas (de antes de este cambio) NO se tocan retroactivamente — solo aplica a las nuevas.
2. **Varias recetas en una sola cotización**: ya se puede cotizar, por ejemplo, "hamburguesas + galletas" en un mismo envío a un cliente, en vez de mandar una cotización por producto. Rediseño real:
   - Tabla nueva `cotizacion_items` (migración `cotizacion_items`, con RLS) — una cotización ahora puede tener 1 o más filas, cada una con su receta, cantidad y monto (ya redondeado). `cotizaciones.producto`/`monto` quedan como el RESUMEN (nombres combinados, ej. "Galletas de chips, hamburguesa", y el total) para que las listas sigan livianas sin tener que unir tablas.
   - **Compatibilidad con lo ya guardado**: las cotizaciones de antes de esta tabla (ej. la de "Alejandra — hamburguesa") no tienen filas en `cotizacion_items` — `filaACotizacion()` en `appStore.tsx` arma un ítem sintético a partir de sus propios campos viejos (producto/monto/receta_id/unidades_cotizadas) cuando no hay filas reales, así TODO el código de abajo (descuento de inventario, aviso de insumos que cambiaron de precio) siempre trabaja con una lista de ítems, sin si-es-viejo/si-es-nuevo regado por todas partes. Verificado en navegador: la cotización vieja de Alejandra se sigue viendo y funcionando igual.
   - `ajustarInventarioPorVenta()` ahora recibe los ítems de la cotización completa y descuenta/devuelve el inventario de CADA producto (antes solo descontaba uno).
   - El aviso de "estas cotizaciones usan un insumo que cambió de precio" (escaneo de factura) ahora revisa TODOS los productos de cada cotización, no solo uno.
   - "Nueva cotización" (`Cotizaciones.tsx`) pasó de un selector único a una lista de filas (producto + cantidad + quitar), con "+ Agregar otro producto" (no deja elegir la misma receta dos veces) y un total en vivo que suma todos los productos ya redondeados. La pantalla de revisión y la imagen que se manda por WhatsApp (`imagenCotizacion.ts`, rediseñada para listar N líneas en vez de una fija) muestran cada producto por separado y el total.
   - Verificado en navegador con sesión real: cotización de 2 productos (Galletas de chips $54.500 + hamburguesa $52.650 = $107.150, ambos ya redondeados), la pantalla de revisión lista los 2 con sus cantidades y el total — se salió sin enviar de verdad por WhatsApp para no mandar un mensaje real ni dejar datos de prueba (se confirmó que no quedó ninguna cotización nueva guardada).
tsc, build y las 18 pruebas unitarias limpios (2 nuevas de `redondearPrecioVenta`).
Pendiente sin relación: segunda pasada del revisor-visual sobre landing/onboarding/paywall/app interna — ver Problemas conocidos

## Qué es esta app (3 líneas máximo)
Calculadora de costeo para negocios de comida independientes (repostería, comida rápida, panadería, catering, dark kitchens, menús del día): registra ingredientes/insumos con su precio, arma recetas o productos, y calcula el costo real + el precio de venta sugerido con el margen de ganancia que el usuario defina. Vendida por suscripción mensual vía Hotmart.

## Promesa central
"Esta app ayuda a emprendedores gastronómicos de LATAM a saber exactamente cuánto cobrar por cada producto para asegurar una ganancia real, sin pelear con Excel ni hacer matemática compleja, mediante una calculadora de costeo pensada para usarse con una mano desde el celular."

## Reporte de validación (Sesión 1)
- Veredicto: Viable, con diferencial claro (⚠️ FICHA-MODELO queda en BORRADOR: solo un tipo de señal de revenue encontrada, sin acceso a Sensor Tower/Ads Library en esta sesión)
- Apps de referencia: Recipe Cost Calculator (Google Play, 4.08★/954 reseñas, ~16.1K instalaciones) · CakeCost (4.17★/121 reseñas) · KitchenCost (nueva, Flutter+Supabase)
- Lo que los usuarios odian de la competencia (nuestra oportunidad): no separan bien ingrediente de empaque/consumible · no avisan ni actualizan rápido cuando sube el precio de un insumo · "le faltan funciones de manejo de ingredientes"
- Brecha LATAM confirmada: SÍ — las apps en español encontradas (Control Receta, Cost Recipes) tienen calificaciones bajas (~3.0), ningún líder fuerte en español
- Precio de referencia del mercado: la mayoría freemium con compra dentro de la app; un competidor web cobra $29/mes (apunta a negocios grandes, no es nuestra referencia) — precio final PENDIENTE de saber el país del usuario

## Dirección de Arte (Sesión 2 — NO cambiar sin justificación)
- FICHA-ARTE.md: existe y aprobada por el usuario (2026-11-07) — fusión de Opción A (tarjeta-héroe) + Opción C (claridad de pasos), color de C
- Resumen: fondo claro #FAFAF6 (oscuro #1A1D1B) · acento #185062 "petróleo" claro / #59A6C0 oscuro (RECOLOREADO 2026-11-07, ver checkpoint) · Display "Fraunces" (solo precio/titulares) · Body "Manrope" · radio 14px
- Personalidad: cálida · clara · confiable
- Modo oscuro: toggle explícito (pedido por el usuario), verificado visualmente en dev/vista-previa-app.html
- REGISTRO ANTI-REPETICIÓN: paleta petróleo/verde-azulado (#185062) + par Fraunces/Manrope quedan vetados para el próximo proyecto del SO
- Tour de la app: dev/vista-previa-app.html (onboarding, pantalla principal, paywall, resumen mensual, cotización WhatsApp) — APROBADO por el usuario (dio luz verde a seguir a la landing)

## Avatar y venta (Sesión 1)
- FICHA-AVATAR.md: existe, APROBADA (2026-11-07)
- Resumen: María Alejandra, repostera casera, 31 años (avatar principal, con toda la evidencia) + Andrés, dueño de comida rápida/food truck, 34 años (sub-avatar agregado 2026-11-07 para lenguaje inclusivo de género) · dolor #1: "siento que trabajo como una esclava para terminar el mes sin un peso" · deseo #1: que la app le diga el precio exacto con el margen que quiere · nivel de consciencia: consciente del problema y de la solución (3/5) · sofisticación: media (2.5/5 — ya probó Excel/apps de notas, sin líder fuerte en español)
- Nicho ampliado 2026-11-07: de solo repostería a cualquier negocio de comida independiente (comida rápida, panadería, catering, dark kitchens, menús del día) — mismo perfil emocional, copy con multi-ejemplo de rubros en vez de genérico (decisión informada al usuario, ver razón en FICHA-AVATAR.md)
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
- Estado de la secuencia: página de ventas con revisión pendiente de cerrar (detalle en Problemas conocidos) — Onboarding/Paywall/Login/App interna pendientes
- Ruta aprobada: `/` → `/onboarding` → `/paywall` → `/login` → `/app`
- Página de ventas: el agente ajustó el código tras el veredicto del subagente revisor — ese gate sigue abierto, el detalle de puntajes y pendientes vive en Problemas conocidos y en docs/revisiones/landing-veredicto.md. Archivo fuente: dev/landing/index.html
- Sesión 4: el flujo tiene su código en dev/onboarding-paywall-login.html, en 9 pasos: bienvenida → tipo de negocio (personaliza los ejemplos: torta/hamburguesa/pan/producto) → diagnóstico del dolor (con micro-respuesta empática) → registrar insumo (con selector de moneda local COP/MXN/PEN/USD, **hasta 3 insumos por receta** vía "+ Agregar otro insumo", cada uno quitable) → armar producto (**un campo "¿cuánto usas?" por cada insumo agregado**, suma los costos de los 3) → resultado (comparación de 3 colores vs. lo que cobra hoy) → tour → planes → acceso. **Navegación hacia atrás disponible en todas las pantallas de preguntas (pasos 2-9)**, preservando los datos ya escritos — caso especial verificado: volver del paso de "armar producto" al de "insumo" deshace el último insumo confirmado sin duplicarlo al avanzar de nuevo. Se descartó explícitamente de la propuesta externa (Gemini) que motivó la Sesión 4: usar emojis como íconos (regla dura del sistema de diseño) y una pantalla aparte solo para elegir moneda. Probado a mano con multi-insumo (3 insumos sumados, matemática verificada: $17.010 de costo real con harina+azúcar+mantequilla), con retroceso sin duplicar, y sin desbordes a 375px. Limitación menor conocida: si se retrocede y se vuelve a confirmar el mismo insumo, la cantidad usada de ESE insumo específico vuelve a su valor por defecto (no se pierde el nombre/unidad/precio, solo la cantidad usada de ese ítem) — aceptable para este prototipo. Sigue pendiente la revisión del subagente revisor — ver Problemas conocidos.
- Sesión 5: el código de la app interna vive en dev/app-interna.html — 5 secciones con tab bar inferior (Panorama, Insumos, Recetas, Cotizaciones, Ajustes), poblada con datos de ejemplo realistas (5 insumos, 3 recetas, 4 cotizaciones en los 3 estados). Reutiliza tal cual la fórmula de costeo de la Sesión 4 (costoPorUnidadBase, nunca redefinida) y suma el conversor a medidas de cocina (tazas/cucharadas, tabla de densidades de ESTADO.md) y el modo "gastos reales" (fijos/variables/mano de obra) como alternativa opcional al cálculo simple. Los 3 momentos emocionales del historial (confeti+toast vendida, recordatorio pendiente, ánimo rechazada) ya funcionan sobre los datos reales de la lista, no como demo aparte. El aviso de insumo que sube de precio (Panorama) enlaza a Recetas. Verificado en navegador: cálculos exactos en ambos modos (simple: torta $17.010 costo / $28.350 precio — mismo resultado que en el onboarding, confirma consistencia; con gastos reales: $81.100 costo / $135.167 precio con 2h de mano de obra) y la conversión de 2 tazas de harina a 240g/$2.880 — sin desborde horizontal, sin errores de consola. Sigue pendiente la revisión del subagente revisor — ver Problemas conocidos.
- Servicios externos: bloqueados hasta aprobar las etapas anteriores
- Sesión 6 (durante la fase de servicios externos): el usuario reportó dos defectos en `src/pages/Landing.tsx` que ya traía de antes (no eran nuevos de esta sesión). (1) El mockup de celular del hero tenía mucho espacio en blanco debajo de la tarjeta de precio — causa raíz: `.pantalla` es un contenedor flex en columna con un solo hijo (la tarjeta), así que todo el resto de la altura del teléfono quedaba vacío. Corregido agregando una mini barra de navegación al fondo (`.tabbar-mini`, con `margin-top:auto` para que se pegue abajo), con los mismos 5 íconos/nombres de la tab bar real de `AppLayout.tsx` — ahora se ve como una pantalla completa de la app, no una tarjeta flotando en el vacío. (2) El carrusel "La app por dentro" (sección `#app-por-dentro`) no se deslizaba — causa raíz: el contenedor no tenía ancho máximo, así que en pantallas de escritorio (el `.wrap` mide 1120px) los 4 cards cabían completos sin desbordar, y sin desborde no hay nada que `overflow-x:auto` pueda deslizar (el auto-scroll cada 2.8s technically corría pero moviéndose a 0px siempre). Corregido con `max-width:620px` en `.carrusel-wrap` — en desktop ahora siempre se ve un cuarto card cortado invitando a deslizar; en mobile no cambia nada (ya era más angosto que eso). Verificado: el mockup se ve completo con captura; el carrusel ahora tiene scroll real de 154px de sobra (antes 0) — confirmado moviendo el scroll por código, aunque no se pudo grabar el auto-scroll en video porque el panel de prueba estaba oculto en ese momento (no repinta animaciones con la pestaña oculta, limitación ya conocida de las pruebas, no de la app). tsc y build limpios.

## Scaffold técnico (Sesión 6, en curso)
- Proyecto real creado con `npm create vite@latest . -- --template react-ts` en la raíz (Node v26.13.0, npm 11.20.0 — instalado por el usuario en esta sesión). Dependencias: `@tailwindcss/vite`, `@phosphor-icons/react`, `lucide-react`, `motion`, `recharts`, `zod`, `react-router-dom`. Tailwind v4 vía plugin de Vite (`tailwindcss()` en vite.config.ts, `@import "tailwindcss"` en src/index.css) — SIN shadcn/ui todavía (la landing no lo necesita; se agrega cuando el onboarding/app interna requieran sus componentes de formulario).
- Estructura: `src/globals.css` (tokens de FICHA-ARTE.md, claro + `.dark`, única fuente de verdad de hex — whitelisteado del linter de diseño) · `src/index.css` (imports: fuentes Google, tailwind, globals, reset mínimo) · `src/pages/Landing.tsx` + `Landing.css` (página de ventas) · `src/App.tsx` (rutas con react-router-dom: `/` real, `/onboarding` `/paywall` `/login` `/app` con placeholder "Próximamente" hasta su sesión de conversión).
- La **página de ventas ya es código de producción real** (`src/pages/Landing.tsx`), convertida 1:1 desde `dev/landing/index.html` (mismo copy de `docs/copy/landing.md`, mismas 10 secciones, carrusel con auto-scroll, conteo animado del precio héroe, FAQ en acordeón, sticky CTA) — verificada en `npm run dev` (localhost:5173) idéntica al prototipo, sin errores de consola, sin desborde horizontal a 375px. `npx tsc --noEmit` y `npm run build` pasan limpios.
- ⚠️ PENDIENTE (próxima sesión técnica): convertir onboarding/paywall/login (`dev/onboarding-paywall-login.html`) y la app interna (`dev/app-interna.html`) a componentes React reales con el mismo patrón — por ahora siguen siendo prototipos HTML de un solo archivo, y las rutas correspondientes en `src/App.tsx` son placeholders. Después de eso: conectar Supabase (datos + auth real), Hotmart (pagos), y desplegar a Vercel — eso sí requiere que el usuario cree esas cuentas, una a la vez, cuando se llegue a ese punto.
- Se eliminó el boilerplate sin usar de `create-vite` (App.css, assets de ejemplo, favicon genérico) para no dejar archivos muertos en el proyecto.

## Decisiones técnicas (NO re-discutir sin pedirlo el usuario)
- Framework: Vite (la app en sí es una herramienta tras login, sin necesidad de SEO) — scaffold real ya creado (ver "Scaffold técnico" arriba); la landing ya vive en ese mismo proyecto React, no en un kit aparte
- Idioma de UI: español LATAM, mono-idioma
- Método de auth (26-AUTH-MODERNO, decisión técnica interna): passwordless por enlace mágico al correo como opción principal + Google OAuth como alterna — sin contraseñas, coherente con el avatar que le teme a la tecnología y abandona herramientas con fricción. Implementación real (Supabase Auth u equivalente) se conecta en la Sesión 6 (servicios externos); por ahora el flujo está maquetado en dev/onboarding-paywall-login.html
- Modelo de datos + RLS (25-BASE-DE-DATOS, decisión técnica interna, Sesión 6 — fase de servicios externos): app B2C pura (`user_id` simple, sin organización/membresía — cada dato pertenece a una sola persona). Tablas: `config_negocio` (1 fila por usuario: % fijo/variable, valor hora, modo cálculo, moneda, nombre del negocio, línea de atención, URL del logo), `insumos`, `recetas`, `receta_insumos` (tabla intermedia receta↔insumo, N:M, con la cantidad en gramos/ml/piezas), `cotizaciones` (con `receta_id` opcional — se guarda igual el nombre del producto como texto por si la receta cambia o se borra después). Todas con RLS por `(select auth.uid()) = user_id` en cada comando por separado (select/insert/update/delete, con `with check` en insert/update), índice en cada `user_id`/FK, y `created_at`/`updated_at` con trigger. `receta_insumos` no tiene `user_id` propio — su RLS filtra por el `user_id` de la receta dueña. Logo del negocio: bucket de Storage público `logos-negocio` (no es dato sensible, se comparte igual por WhatsApp), con política de que solo el dueño puede subir/borrar el suyo. Framework Vite (sin SSR) → se usa `@supabase/supabase-js` directo en el cliente con su sesión persistida (no aplica el patrón de cookies httpOnly de `@supabase/ssr`, que es exclusivo de frameworks con servidor) — la seguridad real la da RLS, no dónde vive el token.
- Features del MVP (en orden de prioridad; 1-4 del documento del usuario, 5-6 aprobadas en Sesión 1 tras pasar el filtro de feature de 01-IDEACION):
  1. Base de insumos personalizada (nombre, unidad de compra, precio de compra)
  2. Constructor de recetas (seleccionar ingredientes, cantidades, costo total)
  3. Calculadora de margen de ganancia (% deseado → precio de venta sugerido)
     - ⚠️ AMPLIACIÓN aprobada (pedido del usuario, resuelve dolores #6 y #9 de FICHA-AVATAR): sección opcional "Gastos de tu negocio" (configuración única, NO parte del onboarding — vive en ajustes/configuración de la app, se puede ignorar y seguir usando el cálculo simple actual con el markup plano). Incluye: (a) gastos fijos mensuales (arriendo, "lo que te pagas a ti misma", otros) repartidos entre las tandas/mes que ella estime · (b) gastos variables (luz, gas, domicilios, publicidad) repartidos por tanda o mes · (c) su propio tiempo: valor de su hora × horas que le toma la receta — esto es NUEVO costo de mano de obra, no existía. Fórmula ampliada: costoTotal = costoInsumos + (gastosFijosMes/tandasMes) + gastosVariablesPorTanda + (valorHora×horasInvertidas). Si no configura nada, sigue el cálculo simple (markup plano) ya implementado.
     - ⚠️ PROHIBIDO usar jerga contable en la UI ("costos fijos/variables", "contabilidad") — el propio avatar la rechaza explícitamente (ver FICHA-AVATAR, Lo que NO quiere escuchar). Usar "gastos de tu negocio", "lo que te pagas a ti misma", "gastos que suben y bajan".
     - ⚠️ NO es un módulo de contabilidad/reportes fiscales — es solo un insumo más de la fórmula del precio. Sigue fuera de alcance: facturación electrónica, balances, declaraciones (ya excluido desde el documento original del usuario)
  4. Conversor de unidades (kilos → gramos, etc.) — ESPECIFICACIÓN CERRADA (implementada en el prototipo de onboarding, dev/onboarding-paywall-login.html, la app real de Sesión 5 debe seguir la misma lógica, no rediseñarla):
     - Unidades de compra soportadas: Kilo (kg) · Gramo (g) · Litro (L) · Mililitro (ml) · Unidad/pieza · Docena · Libra · Paquete/caja
     - Docena y Paquete/caja piden un campo adicional "¿cuántas unidades trae?" (docena precarga 12, editable; paquete lo escribe la usuaria) — necesario para el precio por pieza individual
     - La pregunta "¿cuánto usas?" se ADAPTA a la unidad de compra: kg/g → pregunta en gramos · L/ml → pregunta en mililitros · libra → pregunta en libras (sin forzar conversión métrica) · unidad/docena/paquete → pregunta en piezas
     - Fórmula: costoPorUnidadBase = kg→precio/1000 (costo por gramo) · g→precio tal cual · L→precio/1000 (costo por ml) · ml→precio tal cual · libra→precio tal cual · unidad→precio/1 · docena→precio/12 (o lo que haya puesto) · paquete→precio/unidadesQueTrae. costoInsumo = costoPorUnidadBase × cantidadUsada
     - Nunca asumir gramos por defecto sin importar la unidad real comprada — ese fue el bug que el usuario detectó y se corrigió
     - ⚠️ AMPLIACIÓN aprobada (pedido del usuario): al costear una RECETA (no el insumo), ofrecer también conversión de peso a MEDIDAS DE COCINA (tazas, cucharadas, cucharaditas) para quien no maneja gramos/kilos. NO usar una conversión genérica única — cada ingrediente tiene su propia densidad. Tabla base a implementar en Sesión 5 (valores estándar de referencia culinaria, aproximados y declarados como tal en la UI):
       Harina de trigo: 1 taza≈120g · 1 cda≈7.5g · 1 cdta≈2.5g | Azúcar blanca: 1 taza≈200g · 1 cda≈12.5g | Azúcar morena: 1 taza≈220g | Mantequilla: 1 taza≈227g · 1 cda≈14g | Aceite: 1 taza≈218g · 1 cda≈13.6g | Leche/agua/líquidos acuosos: 1 taza≈240g(240ml) · 1 cda≈15g · 1 cdta≈5g | Cacao en polvo: 1 taza≈90g | Sal: 1 cdta≈6g | Polvo de hornear/bicarbonato: 1 cdta≈4-5g
       Ingrediente fuera de la tabla → usar el equivalente de "líquido genérico" o "sólido genérico" (el más cercano) y mostrar aviso visible "esto es un estimado, ajústalo si lo sabes mejor" — nunca presentarlo como exacto cuando no lo es
  5. Escaneo de factura/recibo de compra (IA): foto del recibo del super → extrae ingredientes y precios → la usuaria confirma antes de guardar → actualiza el costo de las recetas que usan ese insumo. Procesamiento asíncrono (subir foto → procesar en segundo plano → avisar cuando esté listo), con tope de 30 escaneos/mes para controlar el costo variable de la IA (circuit-breaker de costo, 48)
  6. Cotización profesional por WhatsApp: genera una imagen/PDF de la cotización con el logo del negocio y el precio ya calculado; la usuaria la revisa antes de enviar y la comparte por WhatsApp (sin integración con WhatsApp Business API — es un botón de compartir, no envío automático)
  7. Historial de cotizaciones con estado (vendida / pendiente / rechazada) — lista filtrable (regla UX de filtros en listas largas), editable en cualquier momento
  8. Resumen mensual: gasto total en insumos (de facturas escaneadas + registros manuales) + ganancia real de los pedidos marcados "vendida" menos su costo — con navegación entre meses por fecha real (no solo "este mes"), esta es LA pantalla que resuelve el dolor #1 del avatar ("no sé si hoy gané o perdí")
  9. (idea adicional del agente, aprobada) Aviso cuando un insumo escaneado o editado sube de precio frente al que tenía guardado, con acceso directo a actualizar el precio de venta de las recetas que lo usan — cierra el loop entre escanear, costear y cobrar
- Fuera de la v1 (ya definido por el usuario): inventario en tiempo real con descuento de stock · facturación electrónica/contabilidad fiscal · punto de venta (POS) o pasarelas de cobro a clientes finales · envío automático de cotizaciones sin revisión de la usuaria
- Primera victoria (derivada del propio deseo del avatar): registrar su primer ingrediente y su primera receta, y ver aparecer al instante "esto te cuesta $X, cóbralo a $Y para ganar el [margen]% que elegiste"
- Segunda victoria (loop de retención): generar y enviar su primera cotización profesional por WhatsApp — refuerza el deseo de identidad ("esto es un negocio de verdad")
- Loop mensual de retención (gatillo→acción→recompensa): fin de mes (gatillo) → abre el resumen mensual (acción) → ve en números si ganó o perdió, y cuánto (recompensa) → eso decide sus precios del mes siguiente (inversión) — es el mecanismo que responde directo a su ansiedad nocturna
- Momentos emocionales del historial de cotizaciones (aprobado, pedido del usuario — hitos REALES, no decorativos, consistente con FICHA-ARTE "celebración nivel moderado: primera cotización vendida"): marcar "vendida" → micro-celebración (confeti/spring suave, intensidad moderada, nunca bloqueante, respeta prefers-reduced-motion) — es el hito que más conecta con su deseo de ver dinero real entrar. Marcar "pendiente" → se agenda un recordatorio de seguimiento (discreto, ej. notificación a los 2-3 días, no intrusivo). Marcar "rechazada" → mensaje breve de ánimo en forma de TOAST/banner (NO popup modal bloqueante — un rechazo ya es un momento negativo, no hay que interrumpirla más de la cuenta), con copy que separa "este cliente dijo que no" de "tu precio está mal" (conecta con su objeción #2, miedo a subir precios)

## Panel de administración (backoffice) — CONSTRUIDO (2026-11-16)
El usuario pidió un panel solo para él (dueño) con los números reales del negocio e invitar
usuarios a mano. Plan aprobado en modo plan y ejecutado completo:
- **Base de datos** (`supabase/schema_admin.sql`, aplicada): `profiles` (role/access_status/source,
  con trigger que crea la fila sola al registrarse + backfill de usuarios existentes),
  `event_log` (sesion_iniciada/receta_creada/cotizacion_creada/insumo_agregado/factura_escaneada —
  subconjunto real de la taxonomía del 36, sin instalar PostHog, fuera de alcance), `error_log`,
  `acquisition_spend`. `private.is_admin()` evita la recursión de RLS; se agregó lectura admin a
  `ai_calls` (ya existía). RPC `admin_resumen_usuarios()` (security definer) da conteos agregados
  por usuario SIN ampliar el RLS de insumos/recetas/cotizaciones (datos privados de cada quien).
  `get_advisors` limpio tras revocar `execute` de las funciones nuevas a `anon`.
- **Edge Function `admin-invitar-usuario`** (desplegada, verify_jwt:false — hace su propio chequeo
  de sesión+rol admin, mismo patrón que `escanear-factura`): solo si `profiles.role==='admin'` usa
  el cliente de service-role para invitar por correo (`auth.admin.inviteUserByEmail`) y guardar el
  nombre — nunca revela si el correo ya existía (anti-enumeración).
- **Acceso**: `src/components/RequireAdmin.tsx` (guard de UX en `/admin/*`, redirige a `/app` si no
  es admin — la seguridad real vive en RLS/RPC, no aquí) + enforcement real de
  `access_status='disabled'` en `AppLayout.tsx` (cierra sesión y manda a `/login` con aviso).
- **`AdminLayout`** nuevo (desktop-first, sidebar fija, NO reusa PhoneFrame/AppLayout del cliente).
  8 pantallas en `src/pages/admin/`: Resumen (avisos + hero cards), Ventas, Ganancia real, Usuarios
  (invitar + activar/desactivar + conteos reales vía RPC + retención D1/D7/D30), Uso (event_log
  real), Negocio (LTV/CAC + alta manual de `acquisition_spend`), IA (gráfico Recharts desde
  `ai_calls` real), Errores (`error_log`). Ventas/Ganancia real/Negocio muestran honestamente
  "Sin datos — aún no conectaste Hotmart" en vez de inventar números (regla explícita del usuario).
- **Instrumentación**: `src/lib/eventos.ts` (`logEvent`/`logSesionIniciadaSiCorresponde`) llamado
  desde los puntos reales de guardado en Recetas/Cotizaciones/Insumos/EscanearFactura/AppLayout.
- **`src/components/ErrorBoundary.tsx`** global (envuelve toda la app en `App.tsx`), reporta a
  `error_log` (admite usuario anónimo).
- El único usuario existente en `profiles` (`94marshapril@gmail.com`, la cuenta con la que el
  usuario prueba su propia app) se promovió a `role='admin'` con una consulta SQL directa — no
  existe ninguna forma de que un usuario se auto-asigne el rol.
- `npx tsc --noEmit` y `npm run build` limpios tras toda la capa.
- ⚠️ **Pendiente real, no completado**: el checklist de cierre (Regla 7) exige screenshot +
  veredicto del subagente `revisor-visual` de la pantalla Resumen (primera pantalla de un tipo
  nuevo). No se pudo completar en esta sesión — el inicio de sesión real (magic link/OTP) requiere
  leer el código del correo, y el permiso para leer el Gmail del usuario fue denegado por el
  clasificador de modo automático (correctamente: es su bandeja personal). **Falta**: el usuario
  debe iniciar sesión él mismo en `/login` con su correo admin, avisar cuando esté adentro, y ahí
  sí se captura la pantalla `/admin` real y se corre el revisor-visual antes de declarar el panel
  "listo" según la Regla 7.

## Problemas conocidos ⚠️
- [veredicto:landing] Estado real a 2026-11-16, código React (`src/pages/Landing.tsx`), NO el prototipo HTML viejo (ese ya quedó obsoleto, ver nota abajo): 3 pasadas del revisor-visual. 1ª: 30/40·13/20·17/20. 2ª (tras recolorear a #185062/#59A6C0 y 4 fixes): 31/40·16/20·18/20. 3ª (tras quitar la frase "la app está en construcción", poner datos reales en los mockups del carrusel, bajar "Elegir mensual" a enlace de texto): **34/40 · 17/20 (craft YA PASA el umbral ≥16) · 18/20 — sigue NO LISTA solo por usabilidad (34 < 36)**. Único defecto real que falta: no existe un elemento visual de FIRMA propio ligado al "Radar de Ganancia" (hoy son blobs de gradiente genéricos) — es una tarea de diseño nueva, no una corrección de código, se deja para una sesión aparte. Veredicto completo con las 3 pasadas en `docs/revisiones/landing-veredicto.md`.
- [veredicto:paywall] Estado real a 2026-11-16 (`src/pages/Paywall.tsx`), primera vez que se revisa. 1ª pasada: 31/40·13/20·10/20 NO LISTA (plan mensual no se podía elegir, sin garantía visible, sin nombrar el Radar de Ganancia, sin checkmarks, sin animación). 2ª pasada (tras corregir esos 5): 34/40·15/20·15/20. 3ª pasada (tras agregar la escena de dolor exacta de FICHA-AVATAR.md — "10pm, mesa con harina, pareja preguntando cuánto dejó el pedido" — y subir el peso visual de la nota del plan elegido): 33/40·15/20·15/20 — **sigue NO LISTA**. El defecto que más pesa (prueba social cerca de la oferta) **NO se puede corregir con código**: la app todavía no tiene usuarios reales, y el sistema prohíbe inventar una cifra — se resuelve solo cuando haya el primer dato real de uso/venta. El otro defecto que queda (un detalle visual de firma propia) es la MISMA tarea de diseño pendiente que en la landing — se resuelven juntas en la misma sesión futura. Veredicto completo con las 3 pasadas en `docs/revisiones/paywall-veredicto.md`.
- Decisión tomada tras 3 rondas completas en cada pantalla (landing y paywall), con mejoras reales y verificadas en cada una (no solo reintentos ciegos): dejar de insistir con más pasadas del revisor por ahora. Lo que falta en ambas no son bugs de código sino (a) una tarea de diseño de una firma visual propia — su propio proyecto, no un ajuste rápido — y (b) en el paywall, un dato real de prueba social que solo existe después de vender. Retomar esto cuando: el usuario tenga ganas de invertir en la pieza de diseño propia, y/o cuando haya el primer cliente real para citar como prueba social.
- [veredicto:onboarding] Nunca se le ha pasado el revisor-visual a la pantalla de Onboarding en código React (`src/pages/Onboarding.tsx`) — la línea del checkpoint de la Sesión 6 que la menciona como "construida/verificada" se refiere solo a que el flujo funciona de punta a punta (probado en navegador por el usuario), no a una puntuación formal de diseño. Queda en la misma bolsa que landing y paywall: se retoma junto con esas dos cuando el usuario quiera invertir en la pieza de diseño propia.
- [pendiente-viejo-obsoleto] Las menciones a `dev/*.html` (landing/onboarding-paywall-login/app-interna) y al "scaffold en curso" en notas más arriba de este archivo son de sesiones anteriores al port completo a React — ya NO aplican, todo vive en `src/` como código real desde hace varias sesiones. Se dejan sin borrar por ahora para no perder el historial, pero no son accionables.

## Pendientes del usuario (acciones que el usuario debe hacer)
- ⚠️ **MUY IMPORTANTE — comprar el dominio (`margenpro.app` o el que decida) en cuanto tenga el
  presupuesto (ella dijo que podría ser a partir del día 30).** De este dominio dependen, en
  cadena: (1) verificar el dominio en Resend para que el enlace de inicio de sesión le llegue a
  CUALQUIER cliente, no solo a ella (hoy está bloqueado — ver nota de Resend más abajo); (2) tener
  un correo de soporte de marca (`soporte@margenpro.app`) en vez del `margenpro.soporte@gmail.com`
  temporal; (3) un enlace real y presentable para poner en Hotmart, redes y publicidad, en vez del
  gratuito de Vercel; (4) agregar el dominio nuevo en "Orígenes autorizados de JavaScript" del
  cliente OAuth de Google (console.cloud.google.com, proyecto MargenPro) — si no, el botón
  "Continuar con Google" dejaría de funcionar desde ese dominio. Recordárselo en cada sesión hasta
  que esté comprado.
- **Nuevo, para cerrar el panel de administración**: iniciar sesión en `/login` con su correo admin
  (`94marshapril@gmail.com`, ya promovido a `role='admin'`) y avisar cuando esté adentro de `/admin`
  — así se completa el screenshot + veredicto del revisor-visual que falta para declararlo "listo".
- Cuando quiera avanzar más hacia "listo para vender": decidir si invertir una sesión en el elemento de diseño propio (firma visual del Radar de Ganancia) para landing y paywall.

## ⚠️ PENDIENTE RECORDAR SIEMPRE: conectar Hotmart (el usuario pidió que se le recuerde en cada sesión)
Mientras Hotmart no esté conectado, estas piezas quedan bloqueadas — recordárselo cada vez que se
toque el tema de ventas/admin, sin que ella tenga que volver a preguntar:
- El botón "Probar 7 días gratis" del paywall entra directo a la app sin pedir tarjeta (`Paywall.tsx`).
- `/admin/ventas` y `/admin/ganancia` muestran "Sin datos" (ingresos, MRR, cancelaciones).
- **Churn por mes, pedido explícitamente el 2026-11-20**: cuántos usuarios se dieron de baja cada
  mes. Depende 100% del webhook de cancelación de Hotmart (MargenPro no procesa pagos ni
  cancelaciones — eso vive en Hotmart) — en cuanto se conecte, se agrega a `admin/Ventas.tsx` junto
  con MRR e ingresos.
- **Preguntar el motivo al cancelar, pedido explícitamente el 2026-11-20**: cuando un cliente
  cancele, mostrarle una pregunta corta de opción múltiple (muy caro / no lo usé / le faltó algo /
  encontré otra opción / otro) ANTES o justo después de confirmar la baja, y guardar la respuesta
  para poder verla agrupada en el panel (qué está empujando a la gente a irse). Esto se arma como
  parte del flujo de cancelación real de Hotmart (una pantalla intermedia propia, o el campo de
  encuesta que permite Hotmart al cancelar) — no se puede construir hasta que exista una cuenta de
  Hotmart real donde conectar ese flujo. Diseño de referencia: `docs/sistema/58-RETENCION-DE-INGRESOS.md`.
- **De la auditoría legal (2026-11-20):** la página `/como-cancelar` da instrucciones genéricas
  ("entra a hotmart.com, busca tus compras") porque todavía no hay un link directo a esta cuenta —
  actualizar con la URL real en cuanto exista el producto. Y, MUY IMPORTANTE: la garantía de 14
  días ya publicada (landing, paywall, `/reembolsos`) debe quedar configurada EXACTAMENTE igual —
  14 días — en el panel de reembolsos del producto dentro de Hotmart. Si quedan configurados menos
  días ahí, un cliente que pida el reembolso el día 10 lo tendría que aprobar Hotmart pero el
  incumplimiento de la promesa recae sobre nosotros.

## Notas para la próxima sesión
- FICHA-MODELO y FICHA-MERCADO quedaron en BORRADOR por falta de herramientas de esta sesión (Sensor Tower, Ads Library, datos de pago verificados) — no bloquea avanzar, pero revisar si se consigue más evidencia antes de fijar precio final
- Confirmar el plazo de garantía (ya es propio de MargenPro, 14 días, no depende de Hotmart) sigue siendo configurable al crear el producto real en Hotmart — revisar cuando el usuario abra su cuenta.
- Cuando se retome el diseño de la firma visual propia: aplicarla a la vez en landing (`src/pages/Landing.tsx`) y paywall (`src/pages/Paywall.tsx`), ya que el defecto es el mismo en ambas.
