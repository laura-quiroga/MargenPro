// Edge Function: admin-crear-usuario-prueba
// Utilidad de DESARROLLO para que el dueño (admin) se cree a sí mismo una cuenta de prueba con
// correo + contraseña (en vez de enlace mágico) y pueda entrar a la app de inmediato, sin
// depender de revisar un correo real. Mismo chequeo de admin que admin-invitar-usuario.

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
    console.error('admin-crear-usuario-prueba error:', e)
    return json({ error: 'Algo salió mal creando el usuario de prueba.', detalle: String(e) }, 500)
  }
})

async function manejar(req: Request): Promise<Response> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'No autenticado' }, 401)

  let email: string
  let password: string
  let name: string
  try {
    const body = await req.json()
    email = String(body.email ?? '').trim()
    password = String(body.password ?? '')
    name = String(body.name ?? 'Usuario de prueba').trim()
    if (!email || !email.includes('@')) throw new Error('correo inválido')
    if (password.length < 8) throw new Error('contraseña muy corta')
  } catch {
    return json({ error: 'Faltan datos válidos (correo, contraseña de al menos 8 caracteres).' }, 400)
  }

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

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const { data: creado, error: crearError } = await supabaseAdmin.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { name },
  })
  if (crearError || !creado.user) {
    return json({ error: crearError?.message ?? 'No pudimos crear el usuario de prueba.' }, 400)
  }

  await supabaseAdmin.from('profiles').update({ name, source: 'prueba_interna' }).eq('id', creado.user.id)

  return json({ ok: true })
}
