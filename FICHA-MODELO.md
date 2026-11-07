# FICHA-MODELO — el plano de la app que ya gana — RecetarioPro

- Estado: BORRADOR (una sola señal de revenue por app — estimado de agregador, no verificado con 2 fuentes independientes; sin acceso a Sensor Tower/Meta Ads Library en esta sesión)

## 1. LA APP MODELO
- Nombre: Recipe Cost Calculator (Google Play) · Plataforma: Android · País/idioma: listado global, app en inglés
- POR QUÉ ella: [x] mecanismo replicable (costo de ingredientes → precio sugerido) [x] sin foso estructural (no depende de marca/red) [x] demanda creciendo (categoría con varios competidores nuevos en 2025-2026) [x] grietas visibles (reseñas piden mejor manejo de ingredientes/empaque)

## 2. REVENUE PROBADO
- [x] Estimado de agregador (AppGoblin): ~16.1K instalaciones, 2.1K usuarios activos/mes, revenue estimado <$10K/mes, 57% IAP / 43% ads | fuente: AppGoblin | fecha: 2026-11-07
- [ ] MRR verificado, Top grossing, Ads Library, Acquire, Sensor Tower: NO ENCONTRADO — fuera del alcance de las herramientas de esta sesión (requiere acceso a stores/paneles pagos)
- ⚠️ Solo un tipo de señal marcado → la ficha queda en BORRADOR; se decide seguir con criterio propio dado que el patrón se repite en 6+ apps similares (ver FICHA-MERCADO)

## 3. EL MECANISMO DEL MODELO
- Qué hace: el usuario registra ingredientes con su precio, arma una receta con cantidades, y la app calcula el costo total y un precio de venta sugerido con margen
- Su momento aha: justo al terminar de armar la primera receta y ver el precio sugerido aparecer calculado al instante
- Cómo lo comunica: "calcula el costo real de tu receta y fija un precio de venta rentable" (paráfrasis de su propia descripción en la store)

## 4. EL PLANO DE PRODUCTO (de las descripciones públicas de la store — fecha: 2026-11-07)
- Onboarding: corto — registrar el primer ingrediente es el primer paso
- Momento del paywall: tras usar las funciones básicas (ingredientes/recetas limitados en el plan gratis)
- Pricing: freemium con compra dentro de la app (precio exacto no público)
- Features CORE: base de ingredientes, constructor de recetas, cálculo de margen
- Features accesorias: catálogo/página de venta para el negocio (en algunos competidores como BakeCost)

## 5. LO QUE SUS USUARIOS DICEN
- Top quejas (reseñas 1-2★ / comentarios encontrados): "le faltan funciones de manejo de ingredientes" (CakeCost) · apps que no separan bien empaque de ingrediente · apps que no avisan cuando sube el costo de un insumo
- Lo que aman: "simple y fácil de usar" (CakeCost, varias reseñas)

## 6. SUS ÁNGULOS DE VENTA
- NO ENCONTRADO — sin acceso a Meta Ads Library ni TikTok Creative Center en esta sesión; se retoma si se decide invertir en ads (ver `34-ADQUISICION-Y-TRAFICO.md`)

## 7. NUESTRO EJE ÚNICO DE DIFERENCIACIÓN
- Eje que cambiamos: idioma-geo + ángulo emocional → versión en español, pensada para LATAM, con el ángulo de "ganancia real y tranquilidad" en vez de "herramienta de cálculo"
- Por qué solo ese: el mecanismo (ingrediente → receta → precio) ya está probado por varios competidores; lo que falta en español es la ejecución simple y el tono que le habla directo al dolor de la repostera, no a la contabilidad
- Qué conservamos del modelo: estructura base (ingredientes → receta → margen → precio), paywall tras probar el cálculo real
- Nuestro mecanismo derivado: separar ingredientes de empaque/consumibles (queja #1 de la competencia) + aviso/actualización rápida cuando sube el precio de un insumo (deseo explícito del avatar) — esto es lo que nos diferencia

## 8. A QUIÉN ALIMENTA ESTA FICHA
- Constitución del producto (01) · baseline de onboarding (02B) · baseline de pricing (02C) · landing (19) · tabla de líderes del nicho (16)

## Cierre
- Fecha de cierre: 2026-11-07 · Aprobada por el usuario: PENDIENTE
