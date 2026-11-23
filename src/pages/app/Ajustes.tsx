import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../lib/appStore'
import { supabase } from '../../lib/supabaseClient'
import { Toast, useToast } from '../../components/Toast'
import type { Moneda } from '../../lib/types'
import './Ajustes.css'

const IconoOk = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
)
const IconoAviso = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4M12 17h.01" /><circle cx="12" cy="12" r="9" /></svg>
)

export default function Ajustes() {
  const store = useAppStore()
  const { toast, mostrarToast } = useToast()
  const navigate = useNavigate()

  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false)
  const [textoBorrado, setTextoBorrado] = useState('')
  const [borrando, setBorrando] = useState(false)

  const [cfgLocal, setCfgLocal] = useState(store.cfg)
  const [modoCalculoLocal, setModoCalculoLocal] = useState(store.modoCalculo)
  const [monedaLocal, setMonedaLocal] = useState(store.moneda)
  const [logoLocal, setLogoLocal] = useState(store.logoNegocio)
  const [nombreLocal, setNombreLocal] = useState(store.nombreNegocio)
  const [lineaLocal, setLineaLocal] = useState(store.lineaAtencion)

  // La config real llega de Supabase un instante después del primer render — cuando termina de
  // cargar, se sincroniza el formulario local (si no, quedaría pegado en los valores por defecto).
  useEffect(() => {
    if (store.cargandoConfig) return
    setCfgLocal(store.cfg)
    setModoCalculoLocal(store.modoCalculo)
    setMonedaLocal(store.moneda)
    setLogoLocal(store.logoNegocio)
    setNombreLocal(store.nombreNegocio)
    setLineaLocal(store.lineaAtencion)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.cargandoConfig])

  const modoReal = modoCalculoLocal === 'real'

  function manejarSubidaLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0]
    e.target.value = ''
    if (!archivo) return
    if (!archivo.type.startsWith('image/')) { mostrarToast(<IconoAviso />, 'Ese archivo no es una imagen.'); return }
    if (archivo.size > 2 * 1024 * 1024) { mostrarToast(<IconoAviso />, 'La imagen pesa mucho — usa una de menos de 2 MB.'); return }
    const lector = new FileReader()
    lector.onload = () => setLogoLocal(typeof lector.result === 'string' ? lector.result : null)
    lector.readAsDataURL(archivo)
  }

  async function eliminarMiCuenta() {
    setBorrando(true)
    const { data: sesion } = await supabase.auth.getSession()
    const token = sesion.session?.access_token
    const { data, error } = await supabase.functions.invoke('eliminar-mi-cuenta', {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
    setBorrando(false)
    if (error || !data?.ok) { mostrarToast(<IconoAviso />, 'No pudimos eliminar tu cuenta. Intenta de nuevo o escríbenos a margenpro.soporte@gmail.com.'); return }
    await supabase.auth.signOut()
    navigate('/')
  }

  async function guardarCambios() {
    const ok = await store.guardarConfigNegocio({
      cfg: cfgLocal, modoCalculo: modoCalculoLocal, moneda: monedaLocal,
      nombreNegocio: nombreLocal, lineaAtencion: lineaLocal, logoNegocio: logoLocal,
    })
    if (!ok) { mostrarToast(<IconoAviso />, 'No pudimos guardar los cambios. Intenta de nuevo.'); return }
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
            <p style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>¿No sabes qué porcentaje poner? Un ejemplo con números:</p>
            <p style={{ fontSize: 12.5, color: 'var(--text-2)', marginBottom: 8 }}>El mes pasado vendiste <strong>$5.000.000</strong> y pagaste <strong>$1.000.000</strong> de arriendo, sueldo y servicios.</p>
            <p style={{ fontSize: 12.5, color: 'var(--text-2)', marginBottom: 10 }}>La cuenta: divides lo que pagaste entre lo que vendiste — <strong>$1.000.000 ÷ $5.000.000 = 0,20</strong>, o sea <strong>20%</strong>. Pon la primera barra ahí.</p>
            <p style={{ fontSize: 12.5, color: 'var(--text-2)', marginBottom: 8 }}>Y en todo lo demás (envíos, comisiones, publicidad) pagaste <strong>$2.000.000</strong>.</p>
            <p style={{ fontSize: 12.5, color: 'var(--text-2)' }}>Misma cuenta: <strong>$2.000.000 ÷ $5.000.000 = 0,40</strong>, o sea <strong>40%</strong>. Pon la segunda barra ahí.</p>
          </div>

          <div className="slider-wrap">
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)' }}>% de tus ventas que se va en arriendo, sueldo y servicios <span style={{ color: 'var(--text-2)', fontWeight: 400 }}>(costo fijo)</span></label>
            <div className="slider-valor">{cfgLocal.fijoPct}%</div>
            <input type="range" min={0} max={80} value={cfgLocal.fijoPct} onChange={(e) => setCfgLocal((c) => ({ ...c, fijoPct: parseInt(e.target.value, 10) }))} />
            <p className="ayuda-campo" style={{ marginTop: 6 }}>Costo fijo: lo que pagas siempre, vendas mucho o poco (arriendo, sueldo fijo, servicios).</p>
          </div>

          <div className="slider-wrap">
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)' }}>% de tus ventas en otros gastos (no insumos) <span style={{ color: 'var(--text-2)', fontWeight: 400 }}>(costo variable)</span></label>
            <div className="slider-valor">{cfgLocal.variablePct}%</div>
            <input type="range" min={0} max={80} value={cfgLocal.variablePct} onChange={(e) => setCfgLocal((c) => ({ ...c, variablePct: parseInt(e.target.value, 10) }))} />
            <p className="ayuda-campo" style={{ marginTop: 6 }}>Costo variable: sube o baja según cuánto vendas (comisiones de pago, domicilios, publicidad).</p>
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
          {store.plan === 'pro' ? (
            <>
              <label className="btn-secundario" style={{ margin: 0, cursor: 'pointer' }}>
                {logoLocal ? 'Cambiar logo' : 'Subir mi logo'}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={manejarSubidaLogo} />
              </label>
              {logoLocal && (
                <button onClick={() => setLogoLocal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-2)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', padding: 0, alignSelf: 'flex-start' }}>Quitar logo</button>
              )}
            </>
          ) : (
            <>
              <button className="btn-secundario" style={{ margin: 0 }} onClick={() => mostrarToast(<IconoAviso />, 'El logo en tus cotizaciones es de los planes pagos.')}>🔒 Subir mi logo</button>
              <button onClick={() => navigate('/paywall')} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', padding: 0, alignSelf: 'flex-start' }}>Ver planes</button>
            </>
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

      <h3 style={{ fontSize: 14, margin: '28px 0 4px' }}>Tu cuenta</h3>
      <p style={{ fontSize: 12.5, color: 'var(--text-2)', marginBottom: 12 }}>
        <a href="/como-cancelar" style={{ color: 'var(--text-2)' }}>Cómo cancelar tu suscripción</a> ·{' '}
        <a href="/privacidad" style={{ color: 'var(--text-2)' }}>Privacidad</a> ·{' '}
        <a href="/terminos" style={{ color: 'var(--text-2)' }}>Términos</a>
      </p>

      {!confirmandoBorrado ? (
        <button className="btn-texto" style={{ color: 'var(--error)' }} onClick={() => setConfirmandoBorrado(true)}>Eliminar mi cuenta</button>
      ) : (
        <div className="tarjeta" style={{ borderColor: 'rgb(var(--error-tint)/.4)' }}>
          <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>¿Eliminar tu cuenta para siempre?</p>
          <p className="ayuda-campo" style={{ marginBottom: 10 }}>
            Esto borra TODOS tus datos de MargenPro — insumos, recetas, cotizaciones, facturas escaneadas y tu configuración. No se puede deshacer.
          </p>
          <div className="nota-estimado" style={{ marginBottom: 12 }}>
            <IconoAviso />
            <span>
              <strong>Esto NO cancela tu suscripción ni tu cobro en Hotmart.</strong> Son dos sistemas distintos —
              si solo eliminas tu cuenta aquí, Hotmart te puede seguir cobrando. Primero cancela tu
              suscripción (<a href="/como-cancelar" target="_blank" rel="noopener noreferrer">ver cómo</a>),
              y después elimina tu cuenta.
            </span>
          </div>
          <div className="campo" style={{ marginBottom: 10 }}>
            <label>Para confirmar, escribe ELIMINAR</label>
            <input value={textoBorrado} onChange={(e) => setTextoBorrado(e.target.value)} placeholder="ELIMINAR" />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-secundario" style={{ margin: 0, width: 'auto', flex: 1 }} onClick={() => { setConfirmandoBorrado(false); setTextoBorrado('') }}>Cancelar</button>
            <button className="btn-secundario" style={{ margin: 0, width: 'auto', flex: 1, borderColor: 'rgb(var(--error-tint)/.4)', color: 'var(--error)' }}
              disabled={textoBorrado.trim().toUpperCase() !== 'ELIMINAR' || borrando} onClick={eliminarMiCuenta}>
              {borrando ? 'Eliminando…' : 'Sí, eliminar para siempre'}
            </button>
          </div>
        </div>
      )}

      <Toast toast={toast} />
    </>
  )
}
