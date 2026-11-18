import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

interface FilaGasto { id: string; canal: string; monto_usd: number; mes: string }

export default function AdminNegocio() {
  const [gastos, setGastos] = useState<FilaGasto[] | null>(null)
  const [canal, setCanal] = useState('')
  const [monto, setMonto] = useState('')
  const [guardando, setGuardando] = useState(false)

  async function cargar() {
    const { data } = await supabase.from('acquisition_spend').select('*').order('mes', { ascending: false })
    setGastos((data as FilaGasto[] | null) ?? [])
  }

  useEffect(() => { cargar() }, [])

  async function agregarGasto() {
    const montoNum = parseFloat(monto)
    if (!canal.trim() || !montoNum || montoNum <= 0) return
    setGuardando(true)
    const inicioMes = new Date()
    inicioMes.setUTCDate(1)
    await supabase.from('acquisition_spend').insert({ canal: canal.trim(), monto_usd: montoNum, mes: inicioMes.toISOString().slice(0, 10) })
    setGuardando(false)
    setCanal('')
    setMonto('')
    cargar()
  }

  const totalGasto = gastos?.reduce((acc, g) => acc + Number(g.monto_usd), 0) ?? 0

  return (
    <div>
      <h1 className="admin-titulo">Negocio</h1>
      <p className="admin-subtitulo">LTV, CAC y ganancia por canal de adquisición.</p>

      <div className="admin-seccion">
        <div className="admin-sin-datos-bloque">
          <strong>Sin datos — faltan tus ingresos reales (Hotmart)</strong>
          El LTV (cuánto deja un cliente en promedio) y el ratio LTV:CAC (debe ser ≥3:1) necesitan
          ingresos reales por canal, que todavía no existen. Mientras tanto, puedes empezar a
          registrar aquí lo que gastas en cada canal — en cuanto conectes Hotmart, el cálculo
          aparece solo.
        </div>
      </div>

      <div className="admin-seccion">
        <h3>Registrar gasto de adquisición</h3>
        <div className="admin-form-inline">
          <div className="campo">
            <label htmlFor="canalGasto">Canal</label>
            <input id="canalGasto" value={canal} onChange={(e) => setCanal(e.target.value)} placeholder="ej. Meta Ads" />
          </div>
          <div className="campo">
            <label htmlFor="montoGasto">Monto (USD)</label>
            <input id="montoGasto" type="number" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0" />
          </div>
          <button className="admin-btn" disabled={guardando} onClick={agregarGasto}>{guardando ? 'Guardando…' : 'Agregar'}</button>
        </div>
      </div>

      <div className="admin-seccion">
        <h3>Gasto por canal este período</h3>
        {!gastos ? null : gastos.length === 0 ? (
          <p className="admin-card-sin-datos">Todavía no registraste ningún gasto.</p>
        ) : (
          <table className="admin-tabla">
            <thead><tr><th>Mes</th><th>Canal</th><th>Gasto</th></tr></thead>
            <tbody>
              {gastos.map((g) => (
                <tr key={g.id}><td>{g.mes}</td><td>{g.canal}</td><td>US${Number(g.monto_usd).toLocaleString('es-CO')}</td></tr>
              ))}
            </tbody>
            <tfoot><tr><td></td><td style={{ fontWeight: 700 }}>Total</td><td style={{ fontWeight: 700 }}>US${totalGasto.toLocaleString('es-CO')}</td></tr></tfoot>
          </table>
        )}
      </div>
    </div>
  )
}
