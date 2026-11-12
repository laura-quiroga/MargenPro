import { useNavigate } from 'react-router-dom'
import PhoneFrame from '../components/PhoneFrame'
import './Paywall.css'

export default function Paywall() {
  const navigate = useNavigate()

  return (
    <PhoneFrame onBack={() => navigate('/onboarding')}>
      <div className="paywall">
        <div className="pantalla-contenido entrada">
          <div className="paso-indicador" style={{ textAlign: 'center' }}>Tu primer costeo está listo</div>
          <h2 style={{ fontSize: 21, textAlign: 'center', marginBottom: 4 }}>Asegura tu <span className="acento">ganancia real</span> en cada producto</h2>
          <p className="sub" style={{ textAlign: 'center', fontSize: '13.5px', marginBottom: 4 }}>Sin recetas limitadas, y con tus precios actualizándose solos cuando suban tus insumos.</p>

          <div className="stack-valor">
            <div className="linea"><span>Recetas y cotizaciones ilimitadas</span><span>$96</span></div>
            <div className="linea"><span>Escanea una factura y tus precios se actualizan solos</span><span>$30</span></div>
            <div className="linea"><span>Manda cotizaciones con tu logo en 30 segundos</span><span>$20</span></div>
            <div className="total"><span>Valor total</span><span><span className="tachado">$146</span> hoy $5.99/mes</span></div>
          </div>
          <p className="nota-moneda">Este precio de MargenPro siempre es en USD, sin importar la moneda en la que anotes tus insumos.</p>

          <div className="plan recomendado"><div className="inner">
            <span className="badge">MÁS POPULAR</span>
            <div className="nombre-plan">Anual</div>
            <div className="precio-plan">$5.99 <span>/mes</span></div>
            <div className="nota-plan">Se cobra $71.88/año</div>
            <div className="ahorro">2 meses gratis</div>
          </div></div>
          <div className="plan">
            <div className="nombre-plan">Mensual</div>
            <div className="precio-plan">$7.99 <span>/mes</span></div>
            <div className="nota-plan">Se cobra mes a mes · cancelas cuando quieras</div>
          </div>

          <div className="timeline-trial">
            <div className="punto-timeline"><div className="circulo activo">1</div><div className="texto"><strong>Hoy</strong><span>Pagas $0</span></div></div>
            <div className="linea-timeline" />
            <div className="punto-timeline"><div className="circulo">2</div><div className="texto"><strong>Día 6</strong><span>Te avisamos por correo</span></div></div>
            <div className="linea-timeline" />
            <div className="punto-timeline"><div className="circulo">3</div><div className="texto"><strong>Día 7</strong><span>Empieza tu plan</span></div></div>
          </div>
          <p className="sub" style={{ textAlign: 'center', fontSize: '12.5px', marginTop: 10 }}>No te cobramos nada hoy. Cancela cuando quieras desde tu cuenta, en 1 toque.</p>
        </div>
        <div className="pantalla-footer">
          <button className="btn-cta" onClick={() => navigate('/login')}>Probar 7 días gratis →</button>
          <button className="btn-texto" onClick={() => navigate('/login')}>Seguir con el plan gratis limitado</button>
        </div>
      </div>
    </PhoneFrame>
  )
}
