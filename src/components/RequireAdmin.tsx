import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

type Estado = 'cargando' | 'admin' | 'no-admin'

/** Guard de UX para /admin/*. La seguridad REAL vive en RLS/RPC (profiles.role, private.is_admin())
 * — esto solo evita que un usuario normal vea la interfaz; no puede leer datos aunque adivine la
 * URL, porque las políticas del servidor ya lo bloquean. */
export default function RequireAdmin() {
  const [estado, setEstado] = useState<Estado>('cargando')

  useEffect(() => {
    let activo = true
    async function verificar() {
      const { data: userData } = await supabase.auth.getUser()
      const usuario = userData.user
      if (!usuario) { if (activo) setEstado('no-admin'); return }
      const { data: perfil } = await supabase.from('profiles').select('role').eq('id', usuario.id).maybeSingle()
      if (!activo) return
      setEstado(perfil?.role === 'admin' ? 'admin' : 'no-admin')
    }
    verificar()
    return () => { activo = false }
  }, [])

  if (estado === 'cargando') return null
  if (estado === 'no-admin') return <Navigate to="/app" replace />
  return <Outlet />
}
