import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

interface Resumen {
  gastoIaHoy: number
  usuariosActivosHoy: number
  usuariosTotal: number
  erroresUltimas24h: number
}

function inicioDeHoyUtc(): string {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  return d.toISOString()
}

export default function AdminResumen() {
  const [r, setR] = useState<Resumen | null>(null)

  useEffect(() => {
    let activo = true
    async function cargar() {
      const inicioHoy = inicioDeHoyUtc()
      const [aiHoy, eventosHoy, usuariosTotal, errores] = await Promise.all([
        supabase.from('ai_calls').select('costo_usd').gte('created_at', inicioHoy),
        supabase.from('event_log').select('user_id').eq('evento', 'sesion_iniciada').gte('created_at', inicioHoy),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('error_log').select('id', { count: 'exact', head: true }).gte('created_at', inicioHoy),
      ])
      if (!activo) return
      const gastoIaHoy = (aiHoy.data ?? []).reduce((acc, f) => acc + Number(f.costo_usd), 0)
      const usuariosActivosHoy = new Set((eventosHoy.data ?? []).map((f) => f.user_id)).size
      setR({
        gastoIaHoy,
        usuariosActivosHoy,
        usuariosTotal: usuariosTotal.count ?? 0,
        erroresUltimas24h: errores.count ?? 0,
      })
    }
    cargar()
    return () => { activo = false }
  }, [])

  if (!r) return null

  const hayAvisos = r.erroresUltimas24h > 0
  const money = (n: number) => `US$${n.toLocaleString('es-CO', { maximumFractionDigits: 2 })}`

  return (
    <div>
      <h1 className="admin-titulo">Resumen</h1>
      <p className="admin-subtitulo">Los números que de verdad importan, de un vistazo.</p>

      {hayAvisos ? (
        <div className="admin-banner aviso">
          <div className="admin-banner-item">
            <strong>⚠️ Hay {r.erroresUltimas24h} error{r.erroresUltimas24h === 1 ? '' : 'es'} nuevo{r.erroresUltimas24h === 1 ? '' : 's'} en las últimas 24 horas.</strong>
            {' '}Por qué importa: puede estar afectando a usuarios reales sin que lo sepas. Qué hacer: revisa la sección "Errores" para ver el detalle.
          </div>
        </div>
      ) : (
        <div className="admin-banner ok">
          <div className="admin-banner-item">✅ Todo en orden este mes.</div>
        </div>
      )}

      <div className="admin-grid">
        <div className="admin-card">
          <div className="admin-card-label">Ganancia real este mes</div>
          <div className="admin-card-sin-datos">Sin datos — aún no conectaste Hotmart para saber tus ingresos reales.</div>
        </div>
        <div className="admin-card">
          <div className="admin-card-label">Usuarios activos hoy</div>
          <div className="admin-card-valor">{r.usuariosActivosHoy}</div>
          <div className="admin-card-insight">de {r.usuariosTotal} usuarios en total</div>
        </div>
        <div className="admin-card">
          <div className="admin-card-label">Gasto de IA hoy</div>
          <div className="admin-card-valor">{money(r.gastoIaHoy)}</div>
          <div className="admin-card-insight">por escaneos de factura (ai_calls)</div>
        </div>
      </div>
    </div>
  )
}
