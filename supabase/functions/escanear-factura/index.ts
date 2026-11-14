// Edge Function: escanear-factura
// Recibe { facturaId } (nunca la imagen en el body — ya vive en Storage, subida directo por
// el cliente). Lee la factura de facturas_escaneadas, descarga la foto de Storage, llama a
// Claude con visión + tool-use forzado, valida con zod, y guarda el resultado.
// La clave de Anthropic vive SOLO aquí (secreto de Supabase) — nunca en el cliente.

import { createClient } from 'npm:@supabase/supabase-js@2'
import Anthropic from 'npm:@anthropic-ai/sdk@0.69'
import { z } from 'npm:zod@4'
import { encodeBase64 } from 'jsr:@std/encoding@1/base64'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
// Haiku: barato y rápido, ideal para extracción (ver docs/sistema/30-INTEGRACION-IA.md).
const AI_MODEL = Deno.env.get('AI_MODEL') ?? 'claude-haiku-4-5'
const TOPE_MENSUAL = 30

const ItemSchema = z.object({
  texto_original: z.string().min(1),
  producto: z.string().min(1),
  cantidad: z.number().positive(),
  medida: z.enum(['kg', 'g', 'L', 'ml', 'libra', 'unidad', 'docena', 'paquete']),
  precio: z.number().nonnegative(),
  confianza: z.number().min(0).max(1),
})
const FacturaSchema = z.object({ items: z.array(ItemSchema) })

const TOOL_EXTRAER = {
  name: 'extraer_factura',
  description: 'Extrae cada producto, cantidad, unidad de medida, precio y confianza de la imagen de una factura o recibo de compra.',
  input_schema: {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            texto_original: { type: 'string', description: 'El texto exacto de esa línea en la factura, tal como aparece.' },
            producto: { type: 'string', description: 'Nombre limpio y corto del producto (ej: "Harina de trigo", no "HARINA TRIGO X 25KG BULTO").' },
            cantidad: { type: 'number', description: 'El PESO, VOLUMEN o número de piezas REAL comprado de ese producto — nunca un conteo de paquetes/líneas que no refleje lo que de verdad se compró. Busca el peso/volumen real en CUALQUIER lugar donde una factura pueda ponerlo: dentro del nombre del producto (ej: "Harina de Trigo 500gr", "Leche 1L"), en una columna aparte llamada algo como "peso"/"gramaje"/"contenido"/"presentación", o — si ninguna de esas existe — en la propia columna de cantidad (algunas facturas SÍ ponen ahí el peso real, no un conteo de paquetes). Si el peso real viene de un lugar distinto a la columna de cantidad, multiplícalo por el número de paquetes comprados (ej: 2 paquetes de "Harina 500gr" → cantidad=1000). Si el producto no tiene ningún peso/volumen indicado en ninguna parte (ej: "Huevos", "Servilletas", algo que se cuenta por pieza), usa el número de la columna de cantidad tal cual, con medida "unidad"/"docena"/"paquete" según corresponda.' },
            medida: { type: 'string', enum: ['kg', 'g', 'L', 'ml', 'libra', 'unidad', 'docena', 'paquete'], description: 'La unidad real del número que escribiste en "cantidad" — si el peso real es "500gr" la medida es "g" y cantidad=500×paquetes, nunca "paquete" cuando hay un peso/volumen real identificado en cualquier parte de la factura.' },
            precio: { type: 'number', description: 'Precio TOTAL pagado por esa línea completa. Si la factura solo trae un precio POR UNIDAD/paquete (sin columna de total), multiplícalo tú por el número de paquetes comprados para obtener el total — nunca devuelvas el precio unitario si hay más de un paquete. Como un número entero de pesos, SIN puntos ni comas. En facturas latinoamericanas el PUNTO separa miles, no decimales: "$4.500" son cuatro mil quinientos pesos → 4500, NUNCA 4.5. "$23.500" → 23500, NUNCA 23.5.' },
            confianza: { type: 'number', description: 'Qué tan seguro estás de esta lectura, de 0 a 1.' },
          },
          required: ['texto_original', 'producto', 'cantidad', 'medida', 'precio', 'confianza'],
          additionalProperties: false,
        },
      },
    },
    required: ['items'],
    additionalProperties: false,
  },
} as const

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405)
  try {
    return await manejar(req)
  } catch (e) {
    console.error('escanear-factura error:', e)
    return json({ error: 'Algo salió mal procesando la factura.', detalle: String(e) }, 500)
  }
})

async function manejar(req: Request): Promise<Response> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'No autenticado' }, 401)

  let facturaId: string
  try {
    const body = await req.json()
    facturaId = body.facturaId
    if (!facturaId) throw new Error('falta facturaId')
  } catch {
    return json({ error: 'Falta el identificador de la factura.' }, 400)
  }

  // Cliente con la sesión del usuario — RLS decide qué puede leer/escribir, igual que el frontend.
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) return json({ error: 'No autenticado' }, 401)
  const user = userData.user

  const { data: factura, error: facturaError } = await supabase
    .from('facturas_escaneadas').select('*').eq('id', facturaId).single()
  if (facturaError || !factura) return json({ error: 'No encontramos esa factura.' }, 404)
  if (!factura.imagen_path) return json({ error: 'Esta factura no tiene una imagen asociada.' }, 400)

  // Tope mensual (30 escaneos/mes) — el circuit-breaker de costo del plan aprobado.
  const inicioMes = new Date()
  inicioMes.setUTCDate(1)
  inicioMes.setUTCHours(0, 0, 0, 0)
  const { count } = await supabase
    .from('ai_calls').select('id', { count: 'exact', head: true })
    .eq('tipo', 'escaneo_factura').gte('created_at', inicioMes.toISOString())
  if ((count ?? 0) >= TOPE_MENSUAL) {
    const mensaje = 'Ya usaste tus 30 escaneos de este mes — vuelven a abrirse el próximo mes. Mientras tanto puedes cargar este insumo a mano.'
    await supabase.from('facturas_escaneadas').update({ estado: 'descartada', error: mensaje }).eq('id', facturaId)
    return json({ error: mensaje }, 429)
  }

  const { data: imagenBlob, error: imagenError } = await supabase.storage
    .from('facturas-temporales').download(factura.imagen_path)
  if (imagenError || !imagenBlob) {
    const mensaje = 'No pudimos leer la imagen que subiste. Intenta con otra foto.'
    await supabase.from('facturas_escaneadas').update({ estado: 'descartada', error: mensaje }).eq('id', facturaId)
    return json({ error: mensaje }, 400)
  }
  const bytes = new Uint8Array(await imagenBlob.arrayBuffer())
  const base64 = encodeBase64(bytes)
  const mediaType = /\.png$/i.test(factura.imagen_path) ? 'image/png' : 'image/jpeg'

  const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') })
  const messages: Anthropic.MessageParam[] = [{
    role: 'user',
    content: [
      { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
      {
        type: 'text',
        text: 'Esta es la foto de una factura o recibo de compra de un negocio de comida en Latinoamérica — el formato puede ser CUALQUIERA: factura impresa de tienda mayorista, recibo de supermercado, ticket de tirilla térmica, factura escrita a mano, con o sin tabla, con columnas en cualquier orden. No asumas un diseño fijo: para cada línea de producto, identifica con cuidado estos 3 datos sin importar dónde estén ubicados en ESTA factura en particular: (1) el nombre del producto, (2) cuánto se compró REALMENTE de ese producto (su peso, volumen o número de piezas — revisando el nombre del producto, una columna de peso/presentación/contenido si existe, y la columna de cantidad, para decidir cuál de ellas tiene el dato real en ESTA factura), y (3) el precio TOTAL pagado por esa línea (si la factura solo da un precio por unidad/paquete, multiplícalo por las unidades compradas). Registra también qué tan seguro estás de la lectura (0 a 1) — si no puedes leer algo con total claridad, igual regístralo con confianza baja, no lo omitas. IMPORTANTE sobre los números: en facturas latinoamericanas el PUNTO separa los miles, no los decimales — "$4.500" son cuatro mil quinientos pesos (4500), NO cuatro punto cinco (4.5). Si ves una tabla con columnas que no están perfectamente alineadas en la imagen, guíate por la fila completa de cada producto, no solo por su posición vertical. Sobre el peso/cantidad real: muchas facturas ponen en su columna de "cantidad" solo el número de PAQUETES comprados (ej: "1", "2"), mientras el peso real está escrito dentro del nombre del producto (ej: "Harina de Trigo 500gr", "Leche Entera 1L", "Aceite 900ml") — en ese caso usa el peso del nombre, multiplicado por los paquetes, nunca el conteo de paquetes solo. Pero en otras facturas la columna de cantidad SÍ es el peso real (ej: "2.5" junto a "kg") — en ese caso úsala directamente. Decide caso por caso mirando lo que la factura realmente muestra, no una regla fija.',
      },
    ],
  }]

  let items: z.infer<typeof ItemSchema>[] | null = null
  let tokensIn = 0
  let tokensOut = 0

  for (let intento = 0; intento <= 1; intento++) {
    const res = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 2048,
      tools: [TOOL_EXTRAER],
      tool_choice: { type: 'tool', name: 'extraer_factura' },
      messages,
    })
    tokensIn += res.usage.input_tokens
    tokensOut += res.usage.output_tokens
    const toolUse = res.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
    const parsed = FacturaSchema.safeParse(toolUse?.input)
    if (parsed.success) { items = parsed.data.items; break }
    messages.push({ role: 'assistant', content: res.content })
    messages.push({ role: 'user', content: `La extracción no validó: ${parsed.error.message}. Corrige y vuelve a llamar la herramienta "extraer_factura".` })
  }

  // Precios aproximados de Haiku (ver docs/sistema/30-INTEGRACION-IA.md) — verificar vigentes.
  const costoUsd = (tokensIn / 1_000_000) * 1 + (tokensOut / 1_000_000) * 5

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  await supabaseAdmin.from('ai_calls').insert({
    user_id: user.id, tipo: 'escaneo_factura', tokens_in: tokensIn, tokens_out: tokensOut, costo_usd: costoUsd, factura_id: facturaId,
  })

  if (!items) {
    const mensaje = 'No pudimos leer esta factura con claridad. Intenta con una foto más nítida, con buena luz y sin sombras, o carga el insumo a mano.'
    await supabase.from('facturas_escaneadas').update({ estado: 'descartada', error: mensaje }).eq('id', facturaId)
    return json({ error: mensaje }, 422)
  }

  await supabase.from('facturas_escaneadas').update({ estado: 'revision', items }).eq('id', facturaId)
  return json({ items })
}
