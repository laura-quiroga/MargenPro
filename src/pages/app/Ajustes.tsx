import { useState } from 'react'
import { useAppStore } from '../../lib/appStore'
import { Toast, useToast } from '../../components/Toast'
import type { Moneda } from '../../lib/types'
import './Ajustes.css'

const IconoOk = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
)

export default function Ajustes() {
  const store = useAppStore()
  const { toast, mostrarToast } = useToast()

  const [cfgLocal, setCfgLocal] = useState(store.cfg)
  const [modoCalculoLocal, setModoCalculoLocal] = useState(store.modoCalculo)
  const [monedaLocal, setMonedaLocal] = useState(store.moneda)
  const [logoLocal, setLogoLocal] = useState(store.logoNegocio)
  const [nombreLocal, setNombreLocal] = useState(store.nombreNegocio)
  const [lineaLocal, setLineaLocal] = useState(store.lineaAtencion)

  const modoReal = modoCalculoLocal === 'real'

  function manejarSubidaLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    const lector = new FileReader()
    lector.onload = () => setLogoLocal(typeof lector.result === 'string' ? lector.result : null)
    lector.readAsDataURL(archivo)
  }

  function guardarCambios() {
    store.setCfg(cfgLocal)
    store.setModoCalculo(modoCalculoLocal)
    store.setMoneda(monedaLocal)
    store.setLogoNegocio(logoLocal)
    store.setNombreNegocio(nombreLocal)
    store.setLineaAtencion(lineaLocal)
    mostrarToast(<IconoOk />, 'Cambios guardados.')
  }

  return (
    <>
      <h2 className="titulo-seccion">Configuración</h2>
      <p className="sub-seccion">Ajusta tu app a tu negocio.</p>

      <h3 style={{ fontSize: 14, marginBottom: 4 }}>Gastos de tu negocio</h3>
      <p style={{ fontSize: 12.5, color: 'var(--text-2)', marginBottom: 12 }}>Opcional — si no lo llenas, seguimos usando un cálculo simple. Si lo llenas, tus precios van a ser más exactos.</p>

      <div className="fila-config">
        <div className="txt"><div className="n">Usar mis gastos reales</div><div className="d">En vez del cálculo simple</div></div>
        <button className={`toggle-switch${modoReal ? ' on' : ''}`} onClick={() => setModoCalculoLocal(modoReal ? 'simple' : 'real')} aria-label="Usar mis gastos reales"><span /></button>
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
            <div className="slider-valor">{cfgLocal.fijoPct}%</div>
            <input type="range" min={0} max={60} value={cfgLocal.fijoPct} onChange={(e) => setCfgLocal((c) => ({ ...c, fijoPct: parseInt(e.target.value, 10) }))} />
          </div>

          <div className="slider-wrap">
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)' }}>% de tus ventas en otros gastos (no insumos)</label>
            <div className="slider-valor">{cfgLocal.variablePct}%</div>
            <input type="range" min={0} max={40} value={cfgLocal.variablePct} onChange={(e) => setCfgLocal((c) => ({ ...c, variablePct: parseInt(e.target.value, 10) }))} />
          </div>

          <div className="campo">
            <label>¿Cuánto vale tu hora de trabajo?</label>
            <input type="number" value={cfgLocal.valorHora} onChange={(e) => setCfgLocal((c) => ({ ...c, valorHora: parseFloat(e.target.value) || 0 }))} />
          </div>
        </div>
      )}

      <h3 style={{ fontSize: 14, margin: '18px 0 4px' }}>Tu negocio</h3>
      <p style={{ fontSize: 12.5, color: 'var(--text-2)', marginBottom: 12 }}>Así aparece en las cotizaciones que le mandas a tus clientes.</p>

      <div className="campo">
        <label>Nombre de tu negocio</label>
        <input value={nombreLocal} onChange={(e) => setNombreLocal(e.target.value)} placeholder="Ej: Postres de la Abuela" />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, overflow: 'hidden', background: 'var(--sunken)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <img src={logoLocal || '/isotipo.svg'} alt="Logo de tu negocio" style={logoLocal ? { width: '100%', height: '100%', objectFit: 'cover' } : { width: 28, height: 28 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
          <label className="btn-secundario" style={{ margin: 0, cursor: 'pointer' }}>
            {logoLocal ? 'Cambiar logo' : 'Subir mi logo'}
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={manejarSubidaLogo} />
          </label>
          {logoLocal && (
            <button onClick={() => setLogoLocal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-2)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', padding: 0, alignSelf: 'flex-start' }}>Quitar logo</button>
          )}
        </div>
      </div>

      <div className="campo">
        <label>Línea de atención</label>
        <p className="ayuda-campo">Teléfono, WhatsApp o lo que prefieras que tus clientes usen para escribirte.</p>
        <input value={lineaLocal} onChange={(e) => setLineaLocal(e.target.value)} placeholder="Ej: 573001234567" />
      </div>

      <h3 style={{ fontSize: 14, margin: '18px 0 4px' }}>Moneda de tus insumos</h3>
      <div className="campo">
        <select value={monedaLocal} onChange={(e) => setMonedaLocal(e.target.value as Moneda)}>
          <option value="COP">Peso colombiano (COP)</option>
          <option value="MXN">Peso mexicano (MXN)</option>
          <option value="PEN">Sol peruano (PEN)</option>
          <option value="USD">Dólar (USD)</option>
        </select>
      </div>
      <p style={{ fontSize: 11.5, color: 'var(--text-2)', marginTop: -8, marginBottom: 20 }}>Tu suscripción a MargenPro siempre se cobra en USD — esto es solo la moneda de tus insumos.</p>

      <button className="btn-cta" onClick={guardarCambios}>Guardar cambios</button>
      <Toast toast={toast} />
    </>
  )
}
