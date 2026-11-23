// Edge Function: hotmart-webhook
// Recibe los avisos automáticos de Hotmart (compra aprobada, cancelación, reembolso,
// contracargo) y activa/desactiva el plan pago de ese comprador en MargenPro — sin que nadie
// tenga que hacerlo a mano. Verifica que el aviso venga REALMENTE de Hotmart comparando el
// "hottok" que manda en el cuerpo contra el secreto guardado en este servidor (nunca en el
// código ni en el frontend) — si no coincide, se rechaza sin tocar nada.
//
// Eventos que ACTIVAN el plan pago ("pro"): PURCHASE_APPROVED, PURCHASE_COMPLETE.
// Eventos que LO QUITAN (vuelve a "gratis"): PURCHASE_CANCELED, PURCHASE_REFUNDED,
// PURCHASE_CHARGEBACK, PURCHASE_EXPIRED, SUBSCRIPTION_CANCELLATION.
// Cualquier otro evento (ej. boleto impreso, factura generada) se ignora — no es ni una compra
// confirmada ni una cancelación.
//
// Siempre responde 200 si el hottok es válido (incluso si el evento no aplicaba a nada), porque
// si Hotmart recibe un error reintenta el mismo aviso sin parar.

import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const HOTTOK_SECRETO = Deno.env.get('HOTTOK_SECRETO')

const EVENTOS_ACTIVAN: Record<string, true> = {
  PURCHASE_APPROVED: true,
  PURCHASE_COMPLETE: true,
}
const EVENTOS_DESACTIVAN: Record<string, true> = {
  PURCHASE_CANCELED: true,
  PURCHASE_REFUNDED: true,
  PURCHASE_CHARGEBACK: true,
  PURCHASE_EXPIRED: true,
  SUBSCRIPTION_CANCELLATION: true,
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405)
  try {
    return await manejar(req)
  } catch (e) {
    console.error('hotmart-webhook error:', e)
    // 200 igual: un error nuestro no debe hacer que Hotmart reintente para siempre un aviso
    // que de todas formas no vamos a poder procesar distinto la próxima vez. Queda en los logs
    // del servidor para revisión.
    return json({ ok: false }, 200)
  }
})

async function manejar(req: Request): Promise<Response> {
  if (!HOTTOK_SECRETO) {
    console.error('hotmart-webhook: falta configurar el secreto HOTTOK_SECRETO en este servidor.')
    return json({ ok: false }, 200)
  }

  const body = await req.json().catch(() => null) as Record<string, unknown> | null
  if (!body) return json({ ok: false }, 200)

  const hottokRecibido = body.hottok as string | undefined
  if (!hottokRecibido || hottokRecibido !== HOTTOK_SECRETO) {
    console.error('hotmart-webhook: hottok inválido — aviso rechazado, no viene de Hotmart.')
    return json({ ok: false, error: 'hottok inválido' }, 401)
  }

  const evento = body.event as string | undefined
  const data = body.data as Record<string, unknown> | undefined
  const buyer = data?.buyer as Record<string, unknown> | undefined
  const correo = (buyer?.email as string | undefined)?.trim()

  if (!evento || !correo) return json({ ok: true, procesado: false })

  let nuevoPlan: 'pro' | 'gratis' | null = null
  if (EVENTOS_ACTIVAN[evento]) nuevoPlan = 'pro'
  else if (EVENTOS_DESACTIVAN[evento]) nuevoPlan = 'gratis'
  if (!nuevoPlan) return json({ ok: true, procesado: false })

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const { data: resultado, error } = await supabaseAdmin.rpc('hotmart_actualizar_plan', {
    correo_comprador: correo,
    nuevo_plan: nuevoPlan,
  })
  if (error) {
    console.error('hotmart-webhook: error actualizando el plan:', error)
    return json({ ok: false }, 200)
  }

  return json({ ok: true, procesado: true, cuentaEncontrada: resultado === true })
}
