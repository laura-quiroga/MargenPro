import { useEffect, useState } from 'react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { supabase } from '../../lib/supabaseClient'

interface Resumen {
  gastoIaHoy: number
  usuariosActivosHoy: number
  usuariosTotal: number
  erroresUltimas24h: number
}

interface Dia { fecha: string; eventos: number }

const IconoOk = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
)
const IconoAviso = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4M12 17h.01" /><circle cx="12" cy="12" r="9" /></svg>
)

function inicioDeHoyUtc(): string {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  return d.toISOString()
}

function ultimos7Dias(): string[] {
  const dias: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() - i)
    dias.push(d.toISOString().slice(0, 10))
  }
  return dias
}

/** Cuenta animada al montar — mismo patrón ya usado en la landing/paywall para los números héroe. */
function ValorContado({ valor, formatear }: { valor: number; formatear: (n: number) => string }) {
  const [mostrado, setMostrado] = useState(0)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setMostrado(valor); return }
    let inicio: number | null = null
    const duracion = 600
    let raf = 0
    function paso(ts: number) {
      if (inicio === null) inicio = ts
      const prog = Math.min((ts - inicio) / duracion, 1)
      setMostrado(valor * (1 - Math.pow(1 - prog, 3)))
      if (prog < 1) raf = requestAnimationFrame(paso)
    }
    raf = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(raf)
  }, [valor])
  return <>{formatear(mostrado)}</>
}

export default function AdminResumen() {
  const [r, setR] = useState<Resumen | null>(null)
  const [actividad, setActividad] = useState<Dia[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let activo = true
    async function cargar() {
      setError(null)
      try {
        const inicioHoy = inicioDeHoyUtc()
        const desde7Dias = ultimos7Dias()[0]
        const [aiHoy, eventosHoy, usuariosTotal, errores, eventos7Dias] = await Promise.all([
          supabase.from('ai_calls').select('costo_usd').gte('created_at', inicioHoy),
          supabase.from('event_log').select('user_id').eq('evento', 'sesion_iniciada').gte('created_at', inicioHoy),
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('error_log').select('id', { count: 'exact', head: true }).gte('created_at', inicioHoy),
          supabase.from('event_log').select('created_at').gte('created_at', `${desde7Dias}T00:00:00.000Z`),
        ])
        if (!activo) return
        const primerError = [aiHoy, eventosHoy, usuariosTotal, errores, eventos7Dias].find((r) => r.error)
        if (primerError?.error) throw primerError.error

        const gastoIaHoy = (aiHoy.data ?? []).reduce((acc, f) => acc + Number(f.costo_usd), 0)
        const usuariosActivosHoy = new Set((eventosHoy.data ?? []).map((f) => f.user_id)).size
        const porDia: Record<string, number> = {}
        ultimos7Dias().forEach((d) => { porDia[d] = 0 })
        ;(eventos7Dias.data ?? []).forEach((f) => {
          const dia = (f.created_at as string).slice(0, 10)
          if (dia in porDia) porDia[dia] += 1
        })

        setR({ gastoIaHoy, usuariosActivosHoy, usuariosTotal: usuariosTotal.count ?? 0, erroresUltimas24h: errores.count ?? 0 })
        setActividad(Object.entries(porDia).map(([fecha, eventos]) => ({ fecha: fecha.slice(5), eventos })))
      } catch {
        if (activo) setError('No pudimos cargar el resumen. Revisa tu conexión e intenta de nuevo.')
      }
    }
    cargar()
    return () => { activo = false }
  }, [])

  if (error) {
    return (
      <div>
        <h1 className="admin-titulo">Resumen</h1>
        <div className="admin-seccion">
          <div className="admin-sin-datos-bloque">
            <strong>Algo salió mal</strong>
            {error}
          </div>
        </div>
      </div>
    )
  }

  if (!r) {
    return (
      <div>
        <h1 className="admin-titulo">Resumen</h1>
        <p className="admin-subtitulo">Los números que de verdad importan, de un vistazo.</p>
        <div className="admin-grid">
          {[0, 1, 2].map((i) => (
            <div key={i} className="admin-card admin-card-skeleton">
              <div className="skeleton-linea" style={{ width: '60%' }} />
              <div className="skeleton-linea" style={{ width: '40%', height: 24, marginTop: 10 }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const hayAvisos = r.erroresUltimas24h > 0
  const money = (n: number) => `US$${n.toLocaleString('es-CO', { maximumFractionDigits: 2 })}`

  return (
    <div>
      <h1 className="admin-titulo">Resumen</h1>
      <p className="admin-subtitulo">Los números que de verdad importan, de un vistazo.</p>

      {hayAvisos ? (
        <div className="admin-banner aviso">
          <div className="admin-banner-item" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--aviso)', flexShrink: 0, marginTop: 1 }}><IconoAviso /></span>
            <span>
              <strong>Hay {r.erroresUltimas24h} error{r.erroresUltimas24h === 1 ? '' : 'es'} nuevo{r.erroresUltimas24h === 1 ? '' : 's'} en las últimas 24 horas.</strong>
              {' '}Por qué importa: puede estar afectando a usuarios reales sin que lo sepas. Qué hacer: revisa la sección "Errores" para ver el detalle.
            </span>
          </div>
        </div>
      ) : (
        <div className="admin-banner ok">
          <div className="admin-banner-item" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ color: 'var(--accent)' }}><IconoOk /></span>
            <span>Todo en orden este mes.</span>
          </div>
        </div>
      )}

      <div className="admin-grid">
        <div className="admin-card">
          <div className="admin-card-label">Ganancia real este mes</div>
          <div className="admin-card-sin-datos">Sin datos — aún no conectaste Hotmart para saber tus ingresos reales.</div>
        </div>
        <div className="admin-card">
          <div className="admin-card-label">Usuarios activos hoy</div>
          <div className="admin-card-valor"><ValorContado valor={r.usuariosActivosHoy} formatear={(n) => Math.round(n).toString()} /></div>
          <div className="admin-card-insight">de {r.usuariosTotal} usuarios en total</div>
        </div>
        <div className="admin-card">
          <div className="admin-card-label">Gasto de IA hoy</div>
          <div className="admin-card-valor"><ValorContado valor={r.gastoIaHoy} formatear={money} /></div>
          <div className="admin-card-insight">por escaneos de factura</div>
        </div>
      </div>

      <div className="admin-seccion">
        <h3>Actividad de los últimos 7 días</h3>
        {actividad && actividad.every((d) => d.eventos === 0) ? (
          <p className="admin-card-sin-datos">Todavía no hay uso registrado en estos días.</p>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={actividad ?? []}>
              <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: 'var(--text-2)' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [v, 'Eventos']} />
              <Bar dataKey="eventos" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
