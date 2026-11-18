import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

const ETIQUETA_EVENTO: Record<string, string> = {
  sesion_iniciada: 'Sesión iniciada',
  receta_creada: 'Receta creada',
  cotizacion_creada: 'Cotización creada',
  insumo_agregado: 'Insumo agregado',
  factura_escaneada: 'Factura escaneada',
}

export default function AdminUso() {
  const [conteos, setConteos] = useState<Record<string, number> | null>(null)

  useEffect(() => {
    let activo = true
    supabase.from('event_log').select('evento').then(({ data }) => {
      if (!activo) return
      const c: Record<string, number> = {}
      ;(data ?? []).forEach((f) => { c[f.evento] = (c[f.evento] ?? 0) + 1 })
      setConteos(c)
    })
    return () => { activo = false }
  }, [])

  const total = conteos ? Object.values(conteos).reduce((a, b) => a + b, 0) : 0
  const masFrecuente = conteos ? Object.entries(conteos).sort((a, b) => b[1] - a[1])[0] : null

  return (
    <div>
      <h1 className="admin-titulo">Uso</h1>
      <p className="admin-subtitulo">Qué hacen de verdad tus usuarios dentro de la app.</p>

      {conteos && total === 0 ? (
        <div className="admin-seccion">
          <div className="admin-sin-datos-bloque">
            <strong>Sin datos todavía</strong>
            Esto se llena solo a medida que los usuarios crean recetas, cotizaciones e insumos
            desde el día del despliegue — no hay eventos sintéticos, solo uso real.
          </div>
        </div>
      ) : (
        <>
          <div className="admin-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="admin-card">
              <div className="admin-card-label">Acción más frecuente</div>
              <div className="admin-card-valor" style={{ fontSize: 20 }}>{masFrecuente ? ETIQUETA_EVENTO[masFrecuente[0]] ?? masFrecuente[0] : '…'}</div>
              <div className="admin-card-insight">{masFrecuente ? `${masFrecuente[1]} veces registrada` : ''}</div>
            </div>
          </div>
          <div className="admin-seccion">
            <h3>Todas las acciones registradas</h3>
            <table className="admin-tabla">
              <thead><tr><th>Acción</th><th>Veces</th></tr></thead>
              <tbody>
                {Object.entries(conteos ?? {}).sort((a, b) => b[1] - a[1]).map(([evento, n]) => (
                  <tr key={evento}><td>{ETIQUETA_EVENTO[evento] ?? evento}</td><td>{n}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
