# FICHA DE DIRECCIÓN DE ARTE — MargenPro

## Referencia del usuario (CONTRATO — ver 16)
- ¿Hay imagen(es) de referencia del usuario?: NO → se usó el PROTOCOLO A/B/C (54), fusión de líderes
- N/A — no aplica extracción de imagen

## Identidad derivada (FUSIÓN — 16 PASO 0.2bis + banco del 54 para el dispositivo)
- TABLA DE LÍDERES (heredada de las 3 direcciones de `dev/direcciones-abc.html`):
  - Opción A "Receta de Confianza" → Nubank/Trii (claridad financiera cálida) + apps editoriales de gastronomía → tarjeta con el precio como dato héroe, hairline degradé, serif con carácter
  - Opción C "Receta Clara" → Notion/Linear (calma, precisión) + Nubank (claridad financiera) → timeline de pasos, un solo acento, mucho aire
- **Dirección final elegida por el usuario: FUSIÓN A+C** — composición de A (tarjeta-héroe con el precio) + claridad paso a paso de C (indicador "Paso X de 3") · color: verde salvia de C, RECOLOREADO el 2026-11-07 (ver nota de recoloreo abajo)
- Combinación tipográfica probada usada: display serif + sans única de cuerpo (fila "serif de carácter + sans neutra", 29) — validada contra líderes: SÍ (Fraunces ya validada en Opción A, Manrope ya validada en Opción C)
- Arquetipo: la cuidadora-organizadora de un negocio pequeño pero serio · Mundo del sujeto: cocina casera + libreta de cuentas clara, no "fintech fría"
- Dirección del banco 54 usada para el DISPOSITIVO OWNABLE: tarjeta-héroe con borde hairline degradé (de A) envolviendo el indicador de progreso "Paso X de 3" (de C) · Líder de origen de la paleta (tomada tal cual, sin alterar el hue): verde salvia de Notion/estética editorial calmada (Opción C)

## Personalidad compilada
- 3 adjetivos de personalidad: cálida, clara, confiable
- Compilación: spring suave (sin rebote exagerado) · duración base 250ms · stagger de entrada 60ms · exclamaciones máx 1/pantalla · celebración nivel moderado (hitos reales: primera receta, primera cotización vendida, cierre de mes) · radio tendencial 14px

## Brand kit final

### Modo claro (por defecto)
- Fondo: #FAFAF6 · Superficie: #FFFFFF · Hundido: #F0EFE9 · Texto 1º/2º: #2B2A26 / #716C5F
- Acento: #185062 — "petróleo/verde-azulado oscuro" (SOLO en: precio/dato héroe, CTA primario, paso activo del timeline, ícono activo del tab bar) · 2ª nota: N/A — un solo acento, 60-30-10 estricto
- Semánticos: éxito #185062 (mismo acento, refuerza "ganaste") · error #B3453A · aviso #C98A2C

### Modo oscuro (toggle del usuario, derivado — nunca "asumido" por defecto)
- Fondo: #1A1D1B · Superficie: #232923 · Hundido: #151715 · Texto 1º/2º: #F3F1EA / #A8A79C
- Acento: #59A6C0 (versión más clara del verde salvia para mantener contraste ≥4.5:1 sobre fondo oscuro)
- Semánticos: éxito #59A6C0 · error #E0837A · aviso #E0B15C

### Tipografía y escala
- Display: Fraunces (pesos 600-700, uso ESCASO: solo el precio/dato héroe y titulares de pantallas de venta) · Body: Manrope (pesos 400-700, todo lo demás: labels, botones, navegación, cuerpo)
- Escala: display 32-36px · title 20-22px · body 14-16px · label 11-13px
- Radio: 14px tarjetas / 12px botones · Profundidad: sombras sutiles con tinte del acento (3 niveles: fondo/superficie/hundido) · Espaciado base: escala 4·8·12·16·24·32·48·64
- Dispositivo ownable: tarjeta-héroe con hairline degradé del acento envolviendo el precio sugerido, + indicador "Paso X de 3" siempre visible en las pantallas de construcción de receta
- Motion signature: easing suave tipo ease-out · stagger 60ms en la entrada de cada pantalla · firma: el precio aparece con un conteo animado de 0 al valor final (nunca estático)

## Trazabilidad y vetos
- Ruta de diseño (PREGUNTA DE REFERENCIA del 54): propuesta propia (el usuario no tenía referencia visual)
- Protocolo A/B/C: opción elegida FUSIÓN A+C (composición de A + claridad de C) · color de C · descartada: B "Horno Encendido" (anillo de progreso + Figtree — el usuario no la mencionó al combinar) · página comparativa: `dev/direcciones-abc.html`
- Réplica fiel: N/A — no hubo captura del usuario
- Tour de la app: `dev/vista-previa-app.html` · vistas incluidas: onboarding, pantalla principal (mecanismo costo→precio), paywall, resumen mensual, cotización por WhatsApp · aprobado por el usuario: PENDIENTE (se le presenta a continuación)
- Paleta derivada de: banco 54 "Receta Clara" (verde salvia, tomado tal cual de la Opción C) · Dispositivo ownable elegido: tarjeta-héroe con hairline + indicador de paso
- Registro anti-repetición: paleta verde salvia (#185062) + par Fraunces/Manrope quedan vetados para el próximo proyecto del SO (anotar en ESTADO.md)
- Modo (claro/oscuro) DERIVADO por: el claro es el default porque el mundo del sujeto (cocina, papel, luz de mañana) pide calidez; el oscuro se ofrece como toggle explícito pedido por el usuario, no asumido

## Idioma UI: español LATAM · Fecha de cierre de la ficha: 2026-11-07 · Aprobada por el usuario: SÍ (eligió la fusión A+C y el color de C explícitamente)
