import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import InfoTooltip from '../../components/InfoTooltip'

const IconoChispa = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l1.8 4.3L18 8l-4.2 1.7L12 14l-1.8-4.3L6 8l4.2-1.7L12 2z" /><path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z" /></svg>
)

function inicioDeMesUtc(): string {
  const d = new Date()
  d.setUTCDate(1)
  d.setUTCHours(0, 0, 0, 0)
  return d.toISOString()
}

export default function AdminGananciaReal() {
  const [costoIaMes, setCostoIaMes] = useState<number | null>(null)

  useEffect(() => {
    let activo = true
    supabase.from('ai_calls').select('costo_usd').gte('created_at', inicioDeMesUtc()).then(({ data }) => {
      if (!activo) return
      setCostoIaMes((data ?? []).reduce((acc, f) => acc + Number(f.costo_usd), 0))
    })
    return () => { activo = false }
  }, [])

  return (
    <div>
      <h1 className="admin-titulo">Ganancia real</h1>
      <p className="admin-subtitulo">Lo que de verdad queda, no lo que factura la pasarela.</p>

      <div className="admin-seccion">
        <h3>Lo único que ya es real este mes</h3>
        <div className="admin-grid" style={{ gridTemplateColumns: '1fr' }}>
          <div className="admin-card">
            <div className="admin-card-icono"><IconoChispa /></div>
            <div className="admin-card-label">Costo real de IA este mes<InfoTooltip texto="Lo que de verdad te cobró el proveedor de IA este mes por cada escaneo de factura — no un estimado ni un promedio." /></div>
            <div className="admin-card-valor">{costoIaMes === null ? '…' : `US$${costoIaMes.toLocaleString('es-CO', { maximumFractionDigits: 2 })}`}</div>
            <div className="admin-card-insight">desde ai_calls — escaneos de factura</div>
          </div>
        </div>
      </div>

      <div className="admin-seccion">
        <div className="admin-sin-datos-bloque">
          <strong>Sin datos — faltan ingresos, Hotmart, afiliados e impuestos</strong>
          En cuanto conectes Hotmart vas a ver aquí DOS escenarios lado a lado, porque no es lo
          mismo cada uno (docs/sistema/40-UNIT-ECONOMICS.md): <br />
          <strong>Venta directa:</strong> ingresos − comisión de Hotmart (~9-10%) − impuestos − IA − infraestructura − email.<br />
          <strong>Venta por afiliado:</strong> lo mismo, pero restando también la comisión del afiliado
          (puede dejarte un margen real de 0% o menos en esa venta, aunque la venta directa se vea
          sana) — por eso nunca se muestra un solo número optimista.
        </div>
      </div>
    </div>
  )
}
