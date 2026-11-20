import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import InfoTooltip from '../../components/InfoTooltip'

const IconoUsuarios = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><path d="M16 6.2a3.2 3.2 0 010 6M21 20c0-2.8-1.9-5.1-4.5-5.8" /></svg>
)
const IconoRayo = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h7l-1 8 11-14h-7l1-6z" /></svg>
)
const IconoAncla = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="2.2" /><path d="M12 7v14M5 12H2a10 10 0 0020 0h-3M5 12a7 7 0 0014 0" /></svg>
)

interface FilaUsuario {
  user_id: string
  email: string
  name: string | null
  role: 'user' | 'admin'
  access_status: 'active' | 'disabled'
  created_at: string
  insumos_count: number
  recetas_count: number
  cotizaciones_count: number
}

export default function AdminUsuarios() {
  const [filas, setFilas] = useState<FilaUsuario[] | null>(null)
  const [retencion, setRetencion] = useState<{ d1: number; d7: number; d30: number } | null>(null)
  const [emailNuevo, setEmailNuevo] = useState('')
  const [nombreNuevo, setNombreNuevo] = useState('')
  const [invitando, setInvitando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [miPropioId, setMiPropioId] = useState<string | null>(null)
  const [confirmandoRol, setConfirmandoRol] = useState<string | null>(null)
  const [cambiandoRol, setCambiandoRol] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMiPropioId(data.user?.id ?? null))
  }, [])

  async function cargar() {
    const { data } = await supabase.rpc('admin_resumen_usuarios')
    setFilas((data as FilaUsuario[] | null) ?? [])
    const { data: eventos } = await supabase.from('event_log').select('user_id, created_at').eq('evento', 'sesion_iniciada')
    if (eventos && data) {
      const altaPorUsuario = new Map((data as FilaUsuario[]).map((f) => [f.user_id, new Date(f.created_at).getTime()]))
      const conSesionEnDia = (dias: number) => {
        const usuarios = new Set<string>()
        eventos.forEach((e) => {
          const alta = altaPorUsuario.get(e.user_id)
          if (alta === undefined) return
          const diffDias = (new Date(e.created_at).getTime() - alta) / 86400000
          if (diffDias >= dias && diffDias < dias + 1) usuarios.add(e.user_id)
        })
        return usuarios.size
      }
      const totalUsuarios = (data as FilaUsuario[]).length || 1
      setRetencion({
        d1: Math.round((conSesionEnDia(1) / totalUsuarios) * 100),
        d7: Math.round((conSesionEnDia(7) / totalUsuarios) * 100),
        d30: Math.round((conSesionEnDia(30) / totalUsuarios) * 100),
      })
    }
  }

  useEffect(() => { cargar() }, [])

  async function invitar() {
    if (!emailNuevo.trim() || !emailNuevo.includes('@')) { setMensaje('Escribe un correo válido.'); return }
    setInvitando(true)
    setMensaje(null)
    const { data: sesion } = await supabase.auth.getSession()
    const token = sesion.session?.access_token
    const { data, error } = await supabase.functions.invoke('admin-invitar-usuario', {
      body: { email: emailNuevo.trim(), name: nombreNuevo.trim() || undefined },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
    setInvitando(false)
    if (error || !data?.ok) { setMensaje('No pudimos enviar la invitación. Intenta de nuevo.'); return }
    setMensaje('Invitación enviada.')
    setEmailNuevo('')
    setNombreNuevo('')
    cargar()
  }

  async function cambiarAcceso(userId: string, nuevo: 'active' | 'disabled') {
    // Nunca un update directo a profiles — role/access_status solo se pueden cambiar vía esta
    // función protegida (verificada en el servidor), para que nadie pueda auto-ascenderse a admin.
    const { error } = await supabase.rpc('admin_actualizar_usuario', { target_user_id: userId, nuevo_access_status: nuevo })
    if (error) return
    setFilas((prev) => prev?.map((f) => (f.user_id === userId ? { ...f, access_status: nuevo } : f)) ?? null)
  }

  async function cambiarRol(userId: string, nuevo: 'user' | 'admin') {
    setCambiandoRol(true)
    const { error } = await supabase.rpc('admin_actualizar_usuario', { target_user_id: userId, nuevo_role: nuevo })
    setCambiandoRol(false)
    setConfirmandoRol(null)
    if (error) { setMensaje('No pudimos cambiar el rol. Intenta de nuevo.'); return }
    setFilas((prev) => prev?.map((f) => (f.user_id === userId ? { ...f, role: nuevo } : f)) ?? null)
  }

  const usuariosActivosD7 = filas ? filas.filter((f) => new Date(f.created_at).getTime() >= Date.now() - 7 * 86400000).length : 0

  return (
    <div>
      <h1 className="admin-titulo">Usuarios</h1>
      <p className="admin-subtitulo">Quiénes son, qué tanto activaron y a quién invitar.</p>

      <div className="admin-grid">
        <div className="admin-card">
          <div className="admin-card-icono"><IconoUsuarios /></div>
          <div className="admin-card-label">Total de usuarios</div>
          <div className="admin-card-valor">{filas?.length ?? '…'}</div>
        </div>
        <div className="admin-card">
          <div className="admin-card-icono"><IconoRayo /></div>
          <div className="admin-card-label">Nuevos últimos 7 días</div>
          <div className="admin-card-valor">{filas ? usuariosActivosD7 : '…'}</div>
        </div>
        <div className="admin-card">
          <div className="admin-card-icono"><IconoAncla /></div>
          <div className="admin-card-label">Retención D1 / D7 / D30<InfoTooltip texto="De cada 100 personas que se registran, cuántas vuelven a abrir la app 1, 7 y 30 días después. Si baja mucho, la app no está enganchando." /></div>
          {retencion ? (
            <div className="admin-card-valor" style={{ fontSize: 18 }}>{retencion.d1}% / {retencion.d7}% / {retencion.d30}%</div>
          ) : (
            <div className="admin-card-sin-datos">Necesita más días de datos de uso real.</div>
          )}
        </div>
      </div>

      <div className="admin-seccion">
        <h3>Invitar usuario</h3>
        <div className="admin-form-inline">
          <div className="campo">
            <label htmlFor="emailNuevo">Correo</label>
            <input id="emailNuevo" type="email" value={emailNuevo} onChange={(e) => setEmailNuevo(e.target.value)} placeholder="correo@ejemplo.com" />
          </div>
          <div className="campo">
            <label htmlFor="nombreNuevo">Nombre (opcional)</label>
            <input id="nombreNuevo" value={nombreNuevo} onChange={(e) => setNombreNuevo(e.target.value)} placeholder="Nombre" />
          </div>
          <button className="admin-btn" disabled={invitando} onClick={invitar}>{invitando ? 'Enviando…' : 'Invitar'}</button>
        </div>
        {mensaje && <p style={{ fontSize: 13, color: 'var(--text-2)' }}>{mensaje}</p>}
      </div>

      <div className="admin-seccion">
        <h3>Todos los usuarios</h3>
        {!filas ? null : filas.length === 0 ? (
          <p className="admin-card-sin-datos">Todavía no hay usuarios registrados.</p>
        ) : (
          <table className="admin-tabla">
            <thead>
              <tr><th>Correo</th><th>Nombre</th><th>Insumos</th><th>Recetas</th><th>Cotizaciones</th><th>Rol</th><th>Estado</th><th></th></tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.user_id}>
                  <td>{f.email}</td>
                  <td>{f.name ?? '—'}</td>
                  <td>{f.insumos_count}</td>
                  <td>{f.recetas_count}</td>
                  <td>{f.cotizaciones_count}</td>
                  <td><span className={`admin-badge ${f.role === 'admin' ? 'activo' : ''}`}>{f.role === 'admin' ? 'Administrador' : 'Usuario'}</span></td>
                  <td><span className={`admin-badge ${f.access_status === 'active' ? 'activo' : 'disabled'}`}>{f.access_status === 'active' ? 'Activo' : 'Desactivado'}</span></td>
                  <td style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {f.access_status === 'active' ? (
                      <button className="admin-btn admin-btn-secundario" onClick={() => cambiarAcceso(f.user_id, 'disabled')}>Desactivar</button>
                    ) : (
                      <button className="admin-btn admin-btn-secundario" onClick={() => cambiarAcceso(f.user_id, 'active')}>Activar</button>
                    )}
                    {f.user_id === miPropioId ? (
                      <span className="admin-card-sin-datos" style={{ fontStyle: 'normal' }}>Eres tú</span>
                    ) : confirmandoRol === f.user_id ? (
                      <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 12.5 }}>{f.role === 'admin' ? '¿Quitarle el acceso de administrador?' : '¿Hacerlo administrador?'}</span>
                        <button className="admin-btn" disabled={cambiandoRol} onClick={() => cambiarRol(f.user_id, f.role === 'admin' ? 'user' : 'admin')}>Sí</button>
                        <button className="admin-btn admin-btn-secundario" disabled={cambiandoRol} onClick={() => setConfirmandoRol(null)}>No</button>
                      </span>
                    ) : (
                      <button className="admin-btn admin-btn-secundario" onClick={() => setConfirmandoRol(f.user_id)}>
                        {f.role === 'admin' ? 'Quitar admin' : 'Hacer admin'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
