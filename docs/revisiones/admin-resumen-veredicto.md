# VEREDICTO revisor-visual — admin-resumen
Fecha: 2026-11-18 00:00
Screenshot: docs/revisiones/admin-resumen-1366.jpg
Usabilidad: 20/40
Craft: 9/20
Copy (si vende): N-A
Fidelidad (si hubo referencia): N-A
Veredicto: NO LISTA
Top defectos:
1. Tarjeta "Gasto de IA hoy" muestra literal "(ai_calls)" (nombre de tabla interna) → quitar jerga de sistema, dejar solo "por escaneos de factura".
2. Resumen.tsx linea 44 "if (!r) return null" → pantalla principal en blanco sin skeleton mientras cargan las 4 consultas → mostrar skeleton de las 3 tarjetas durante la carga.
3. Ninguna de las 4 llamadas a Supabase tiene catch/manejo de error → si falla una, la pantalla queda en blanco para siempre sin aviso → agregar estado de error con que paso + que hacer.
4. Mitad inferior del panel (debajo de las 3 tarjetas, de ~y330 a y599) completamente vacia, sin grafico de tendencia ni contenido → llenar con evolucion mensual o reorganizar para que no quede vacio muerto.
5. Cero movimiento: los valores heroe (0, US$0,02) no tienen conteo animado como manda la ficha de arte, y el banner usa emojis crudos (checkmark/alerta) como icono en vez de un chip SVG — ambos son anti-patron explicito del sistema.
