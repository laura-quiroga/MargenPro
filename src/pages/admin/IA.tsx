import { useEffect, useState } from 'react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { supabase } from '../../lib/supabaseClient'
import InfoTooltip from '../../components/InfoTooltip'

const IconoChispa = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l1.8 4.3L18 8l-4.2 1.7L12 14l-1.8-4.3L6 8l4.2-1.7L12 2z" /><path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z" /></svg>
)
const IconoCalendario = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
)
const IconoUsuario = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></svg>
)

interface Fila { tipo: string; tokens_in: number; tokens_out: number; costo_usd: number; created_at: string; user_id: string }
interface Dia { fecha: string; costo: number }

function ultimos14Dias(): string[] {
  const dias: string[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() - i)
    dias.push(d.toISOString().slice(0, 10))
  }
  return dias
}

export default function AdminIA() {
  const [filas, setFilas] = useState<Fila[] | null>(null)

  useEffect(() => {
    let activo = true
    const desde = new Date()
    desde.setUTCDate(desde.getUTCDate() - 14)
    supabase.from('ai_calls').select('tipo, tokens_in, tokens_out, costo_usd, created_at, user_id')
      .gte('created_at', desde.toISOString()).then(({ data }) => {
        if (!activo) return
        setFilas((data as Fila[] | null) ?? [])
      })
    return () => { activo = false }
  }, [])

  if (filas && filas.length === 0) {
    return (
      <div>
        <h1 className="admin-titulo">IA</h1>
        <p className="admin-subtitulo">Costo real por feature y por usuario.</p>
        <div className="admin-seccion">
          <div className="admin-sin-datos-bloque">
            <strong>Sin datos todavía</strong>
            Esto se llena solo en cuanto alguien use el escaneo de factura — cada llamada real a
            la IA queda registrada en ai_calls con su costo exacto.
          </div>
        </div>
      </div>
    )
  }

  const porDia: Record<string, number> = {}
  ultimos14Dias().forEach((d) => { porDia[d] = 0 })
  ;(filas ?? []).forEach((f) => {
    const dia = f.created_at.slice(0, 10)
    if (dia in porDia) porDia[dia] += Number(f.costo_usd)
  })
  const datos: Dia[] = Object.entries(porDia).map(([fecha, costo]) => ({ fecha: fecha.slice(5), costo: Number(costo.toFixed(4)) }))

  const costoTotal = (filas ?? []).reduce((acc, f) => acc + Number(f.costo_usd), 0)
  const costoHoy = porDia[ultimos14Dias()[13]] ?? 0
  const porUsuario: Record<string, number> = {}
  ;(filas ?? []).forEach((f) => { porUsuario[f.user_id] = (porUsuario[f.user_id] ?? 0) + Number(f.costo_usd) })
  const usuarioMasCaro = Object.entries(porUsuario).sort((a, b) => b[1] - a[1])[0]

  return (
    <div>
      <h1 className="admin-titulo">IA</h1>
      <p className="admin-subtitulo">Costo real por feature y por usuario, desde ai_calls.</p>

      <div className="admin-grid">
        <div className="admin-card">
          <div className="admin-card-icono"><IconoChispa /></div>
          <div className="admin-card-label">Gasto de IA hoy<InfoTooltip texto="Lo que ya te cobró el proveedor de IA hoy, calculado sobre cada escaneo de factura real — no es un estimado." /></div>
          <div className="admin-card-valor">US${costoHoy.toFixed(2)}</div>
        </div>
        <div className="admin-card">
          <div className="admin-card-icono"><IconoCalendario /></div>
          <div className="admin-card-label">Gasto últimos 14 días</div>
          <div className="admin-card-valor">US${costoTotal.toFixed(2)}</div>
        </div>
        <div className="admin-card">
          <div className="admin-card-icono"><IconoUsuario /></div>
          <div className="admin-card-label">Usuario que más gasta<InfoTooltip texto="Quién de tus usuarios acumuló más costo de IA en los últimos 14 días — útil para detectar un abuso o un plan que necesita un tope." /></div>
          <div className="admin-card-insight" style={{ fontSize: 12 }}>{usuarioMasCaro ? `US$${usuarioMasCaro[1].toFixed(2)} gastados` : '—'}</div>
        </div>
      </div>

      <div className="admin-seccion">
        <h3>Gasto diario (14 días)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={datos}>
            <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: 'var(--text-2)' }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v) => [`US$${Number(v).toFixed(4)}`, 'Gasto']} />
            <Bar dataKey="costo" fill="var(--accent)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
