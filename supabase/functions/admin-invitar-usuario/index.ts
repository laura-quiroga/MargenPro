// Edge Function: admin-invitar-usuario
// Solo puede llamarla un usuario con profiles.role='admin' (verificado acá, en el servidor —
// nunca solo ocultando el botón en el cliente). Si es admin, usa el cliente de service-role
// (nunca expuesto al navegador) para invitar al correo nuevo y guardar su nombre.

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
    console.error('admin-invitar-usuario error:', e)
    return json({ error: 'Algo salió mal invitando al usuario.', detalle: String(e) }, 500)
  }
})

async function manejar(req: Request): Promise<Response> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'No autenticado' }, 401)

  let email: string
  let name: string | undefined
  try {
    const body = await req.json()
    email = String(body.email ?? '').trim()
    name = body.name ? String(body.name).trim() : undefined
    if (!email || !email.includes('@')) throw new Error('correo inválido')
  } catch {
    return json({ error: 'Falta un correo válido.' }, 400)
  }

  // Cliente con la sesión de quien llama — RLS decide qué puede leer, igual que el frontend.
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) return json({ error: 'No autenticado' }, 401)

  const { data: perfil, error: perfilError } = await supabase
    .from('profiles').select('role').eq('id', userData.user.id).single()
  if (perfilError || !perfil || perfil.role !== 'admin') {
    return json({ error: 'No autorizado' }, 403)
  }

  // Solo a partir de aquí se usa el cliente de servicio — ya está verificado que es admin.
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const { data: invitado, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: name ? { name } : undefined,
  })
  // Nunca revelar si el correo ya tenía cuenta (evita enumeración) — mensaje genérico en ambos casos.
  if (inviteError) {
    return json({ error: 'No pudimos enviar la invitación. Revisa el correo e intenta de nuevo.' }, 400)
  }

  if (name && invitado.user) {
    await supabaseAdmin.from('profiles').update({ name }).eq('id', invitado.user.id)
  }

  return json({ ok: true })
}
