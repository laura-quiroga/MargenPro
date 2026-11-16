import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PhoneFrame from '../components/PhoneFrame'
import './Paywall.css'

const PRECIO_ANUAL_FINAL = 5.99

function PrecioAnualAnimado() {
  const [valor, setValor] = useState(0)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setValor(PRECIO_ANUAL_FINAL); return }
    let inicio: number | null = null
    const duracion = 700
    let raf = 0
    function paso(ts: number) {
      if (inicio === null) inicio = ts
      const prog = Math.min((ts - inicio) / duracion, 1)
      setValor(Number((PRECIO_ANUAL_FINAL * (1 - Math.pow(1 - prog, 3))).toFixed(2)))
      if (prog < 1) raf = requestAnimationFrame(paso)
    }
    raf = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(raf)
  }, [])
  return <>${valor.toFixed(2)}</>
}

export default function Paywall() {
  const navigate = useNavigate()
  const [planElegido, setPlanElegido] = useState<'anual' | 'mensual'>('anual')

  return (
    <PhoneFrame onBack={() => navigate('/onboarding')}>
      <div className="paywall">
        <div className="pantalla-contenido">
          <div className="paso-indicador entrada" style={{ textAlign: 'center' }}>Tu primer costeo está listo</div>
          <p className="sub entrada" style={{ textAlign: 'center', fontSize: 12.5, marginBottom: 2, fontStyle: 'italic' }}>Son las 10pm, limpias la mesa llena de harina y sacas la libreta para sumar gastos — y no quieres volver a quedarte sin saber qué responderle a tu pareja.</p>
          <h2 className="entrada" style={{ fontSize: 21, textAlign: 'center', marginBottom: 4 }}>El <span className="acento">Radar de Ganancia</span> te dice si ganaste o perdiste, antes de que termine el mes</h2>
          <p className="sub entrada" style={{ textAlign: 'center', fontSize: '13.5px', marginBottom: 4 }}>Sin recetas limitadas, y con tus precios actualizándose solos cuando suban tus insumos.</p>

          <div className="stack-valor entrada">
            <div className="linea"><span><span className="check-custom">✓</span> Recetas y cotizaciones ilimitadas</span><span>$96</span></div>
            <div className="linea"><span><span className="check-custom">✓</span> Escanea una factura y tus precios se actualizan solos</span><span>$30</span></div>
            <div className="linea"><span><span className="check-custom">✓</span> Manda cotizaciones con tu logo en 30 segundos</span><span>$20</span></div>
            <div className="total"><span>Valor total al año</span><span><span className="tachado">$146</span> hoy $71.88/año</span></div>
          </div>
          <p className="nota-moneda entrada">Este precio de MargenPro siempre es en USD, sin importar la moneda en la que anotes tus insumos.</p>

          <p className="sub entrada" style={{ textAlign: 'center', fontSize: 12.5, marginBottom: 2 }}>Los dos planes empiezan con 7 días de prueba gratis — elige el que prefieras.</p>
          <div
            className={`plan recomendado entrada${planElegido === 'anual' ? ' seleccionado' : ''}`}
            role="button" tabIndex={0} aria-pressed={planElegido === 'anual'}
            onClick={() => setPlanElegido('anual')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setPlanElegido('anual') }}
          ><div className="inner">
            <span className="badge">MÁS POPULAR</span>
            <div className="nombre-plan">Anual</div>
            <div className="precio-plan"><PrecioAnualAnimado /> <span>/mes</span></div>
            <div className="nota-plan">Se cobra $71.88/año</div>
            <div className="ahorro">2 meses gratis</div>
          </div></div>
          <div
            className={`plan entrada${planElegido === 'mensual' ? ' seleccionado' : ''}`}
            role="button" tabIndex={0} aria-pressed={planElegido === 'mensual'}
            onClick={() => setPlanElegido('mensual')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setPlanElegido('mensual') }}
          >
            <div className="nombre-plan">Mensual</div>
            <div className="precio-plan">$7.99 <span>/mes</span></div>
            <div className="nota-plan">Se cobra mes a mes</div>
            <div className="ahorro ahorro-neutro">Cancelas cuando quieras</div>
          </div>

          <div className="timeline-trial entrada">
            <div className="punto-timeline"><div className="circulo activo">1</div><div className="texto"><strong>Hoy</strong><span>Pagas $0</span></div></div>
            <div className="linea-timeline" />
            <div className="punto-timeline"><div className="circulo">2</div><div className="texto"><strong>Día 6</strong><span>Te avisamos por correo</span></div></div>
            <div className="linea-timeline" />
            <div className="punto-timeline"><div className="circulo">3</div><div className="texto"><strong>Día 7</strong><span>Empieza tu plan</span></div></div>
          </div>
          <p className="sub entrada" style={{ textAlign: 'center', fontSize: '12.5px', marginTop: 10 }}>No te cobramos nada hoy. Cancela cuando quieras desde tu cuenta, en 1 toque.</p>
        </div>
        <div className="pantalla-footer">
          <p className="nota-plan-elegido">Vas a empezar con el plan {planElegido === 'anual' ? 'Anual ($5.99/mes)' : 'Mensual ($7.99/mes)'}</p>
          <button className="btn-cta" onClick={() => navigate('/login')}>Probar 7 días gratis →</button>
          <p className="nota-garantia">Garantía propia de MargenPro · 14 días</p>
          <button className="btn-texto" onClick={() => navigate('/login')}>Seguir con el plan gratis limitado</button>
        </div>
      </div>
    </PhoneFrame>
  )
}
