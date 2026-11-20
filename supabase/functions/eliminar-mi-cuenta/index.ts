// Edge Function: eliminar-mi-cuenta
// Derecho de eliminación (Ley 1581/LGPD/LFPDPPP) — cualquier usuario borra su PROPIA cuenta y
// todos sus datos, sin pasar por un admin. Borra al usuario de auth.users; todas las tablas con
// datos del negocio (profiles, insumos, recetas, cotizaciones, ai_calls, event_log, etc.) tienen
// "on delete cascade" hacia auth.users, así que se borran solas en la misma operación. Los
// archivos de Storage (facturas escaneadas, logo) se borran aparte porque no están ligados por
// una foreign key con cascada.

import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

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
    console.error('eliminar-mi-cuenta error:', e)
    return json({ error: 'Algo salió mal eliminando tu cuenta. Intenta de nuevo o escríbenos a soporte@margenpro.app.', detalle: String(e) }, 500)
  }
})

async function manejar(req: Request): Promise<Response> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'No autenticado' }, 401)

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) return json({ error: 'No autenticado' }, 401)
  const userId = userData.user.id

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // Borra los archivos del usuario en los dos buckets (no tienen cascada por FK).
  for (const bucket of ['facturas-temporales', 'logos-negocio']) {
    const { data: archivos } = await supabaseAdmin.storage.from(bucket).list(userId)
    if (archivos && archivos.length) {
      await supabaseAdmin.storage.from(bucket).remove(archivos.map((a) => `${userId}/${a.name}`))
    }
  }

  // Borra al usuario de auth — profiles/insumos/recetas/cotizaciones/ai_calls/event_log se van
  // solos por "on delete cascade"; error_log solo pierde la referencia (queda anónimo).
  const { error: errorBorrar } = await supabaseAdmin.auth.admin.deleteUser(userId)
  if (errorBorrar) return json({ error: 'No pudimos eliminar tu cuenta. Intenta de nuevo o escríbenos a soporte@margenpro.app.' }, 500)

  return json({ ok: true })
}
