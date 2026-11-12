import { useAppStore } from '../../lib/appStore'
import type { Moneda } from '../../lib/types'
import './Ajustes.css'

export default function Ajustes() {
  const { cfg, setCfg, modoCalculo, setModoCalculo, moneda, setMoneda } = useAppStore()
  const modoReal = modoCalculo === 'real'

  return (
    <>
      <h2 className="titulo-seccion">Configuración</h2>
      <p className="sub-seccion">Ajusta tu app a tu negocio.</p>

      <h3 style={{ fontSize: 14, marginBottom: 4 }}>Gastos de tu negocio</h3>
      <p style={{ fontSize: 12.5, color: 'var(--text-2)', marginBottom: 12 }}>Opcional — si no lo llenas, seguimos usando un cálculo simple. Si lo llenas, tus precios van a ser más exactos.</p>

      <div className="fila-config">
        <div className="txt"><div className="n">Usar mis gastos reales</div><div className="d">En vez del cálculo simple</div></div>
        <button className={`toggle-switch${modoReal ? ' on' : ''}`} onClick={() => setModoCalculo(modoReal ? 'simple' : 'real')} aria-label="Usar mis gastos reales"><span /></button>
      </div>

      {modoReal && (
        <div style={{ paddingTop: 14 }}>
          <div className="tarjeta" style={{ marginBottom: 18 }}>
            <p style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>¿No sabes qué porcentaje poner? Sácalo de un mes real tuyo:</p>
            <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
              Si en un mes vendiste en total <strong>$5.000.000</strong>, pagaste <strong>$1.000.000</strong> de arriendo y sueldo, y <strong>$2.000.000</strong> en todo lo demás (ingredientes, empaques, envíos, comisiones): tu % de arriendo y gastos fijos es 1.000.000 ÷ 5.000.000 = <strong>20%</strong>.
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5, marginTop: 8 }}>
              Ojo con no contar dos veces: en "otros gastos" de abajo NO vuelvas a meter tus ingredientes y empaques — esos ya los cobra la app exactos, insumo por insumo. Aquí solo van cosas que no registraste como insumo, como comisiones de pago o envíos.
            </p>
          </div>

          <div className="slider-wrap">
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)' }}>% de tus ventas que se va en arriendo, sueldo y servicios</label>
            <div className="slider-valor">{cfg.fijoPct}%</div>
            <input type="range" min={0} max={60} value={cfg.fijoPct} onChange={(e) => setCfg((c) => ({ ...c, fijoPct: parseInt(e.target.value, 10) }))} />
          </div>

          <div className="slider-wrap">
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)' }}>% de tus ventas en otros gastos (no insumos)</label>
            <div className="slider-valor">{cfg.variablePct}%</div>
            <input type="range" min={0} max={40} value={cfg.variablePct} onChange={(e) => setCfg((c) => ({ ...c, variablePct: parseInt(e.target.value, 10) }))} />
          </div>

          <div className="campo">
            <label>¿Cuánto vale tu hora de trabajo?</label>
            <input type="number" value={cfg.valorHora} onChange={(e) => setCfg((c) => ({ ...c, valorHora: parseFloat(e.target.value) || 0 }))} />
          </div>
        </div>
      )}

      <h3 style={{ fontSize: 14, margin: '18px 0 4px' }}>Moneda de tus insumos</h3>
      <div className="campo">
        <select value={moneda} onChange={(e) => setMoneda(e.target.value as Moneda)}>
          <option value="COP">Peso colombiano (COP)</option>
          <option value="MXN">Peso mexicano (MXN)</option>
          <option value="PEN">Sol peruano (PEN)</option>
          <option value="USD">Dólar (USD)</option>
        </select>
      </div>
      <p style={{ fontSize: 11.5, color: 'var(--text-2)', marginTop: -8 }}>Tu suscripción a MargenPro siempre se cobra en USD — esto es solo la moneda de tus insumos.</p>
    </>
  )
}
