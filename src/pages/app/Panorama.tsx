import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../lib/appStore'
import './Panorama.css'

export default function Panorama() {
  const navigate = useNavigate()
  const { cotizaciones, mesesMock, mesActualIdx, setMesActualIdx, money } = useAppStore()
  const mes = mesesMock[mesActualIdx]

  const ingreso = mes.esMesActual
    ? cotizaciones.filter((c) => c.estado === 'vendida').reduce((s, c) => s + c.monto, 0)
    : (mes.ingreso ?? 0)
  const vendidas = mes.esMesActual
    ? cotizaciones.filter((c) => c.estado === 'vendida').length
    : (mes.vendidas ?? 0)
  const ganancia = ingreso - mes.gasto
  const esPerdida = ganancia < 0

  return (
    <>
      <h2 className="titulo-seccion">Tu panorama</h2>
      <p className="sub-seccion">Lo que gastaste y lo que de verdad ganaste este mes.</p>

      <div className="heroe-mes">
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="label">{mes.label}</span>
            <div className="nav-mes">
              <button aria-label="Mes anterior" onClick={() => setMesActualIdx((i) => Math.min(mesesMock.length - 1, i + 1))}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <button aria-label="Mes siguiente" style={{ opacity: mesActualIdx === 0 ? 0.35 : 1 }} onClick={() => setMesActualIdx((i) => Math.max(0, i - 1))}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            </div>
          </div>
          <span className="label" style={{ display: 'block', marginTop: 14 }}>Ganancia real este mes</span>
          <div className={`ganancia${esPerdida ? ' es-perdida' : ''}`}>{esPerdida ? '-' : ''}{money(Math.abs(ganancia))}</div>
          <div className={`ganancia-estado${esPerdida ? ' es-perdida' : ' es-ganancia'}`}>
            {esPerdida ? (
              <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" /><path d="M12 9v4M12 17h.01" /></svg> Este mes gastaste más de lo que vendiste</>
            ) : (
              <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></svg> Vas ganando este mes</>
            )}
          </div>
          <p className="formula-ganancia">Ingresos por ventas − lo que gastaste en insumos = tu ganancia real</p>
          <div className="detalle">
            <div><span>Ingresos por ventas</span><span className="num">{money(ingreso)}</span></div>
            <div style={{ textAlign: 'right' }}><span>Gastaste en insumos</span><span className="num">{money(mes.gasto)}</span></div>
          </div>
          <div className="detalle">
            <div><span>Cotizaciones vendidas</span><span className="num">{vendidas}</span></div>
          </div>
        </div>
      </div>

      <div className="accesos-rapidos">
        <button className="acceso-rapido" onClick={() => navigate('/app/recetas', { state: { abrirConstructor: true } })}>
          <div className="chip-icono"><svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg></div>
          <div className="txt">Costear receta nueva</div>
        </button>
        <button className="acceso-rapido" onClick={() => navigate('/app/cotiza', { state: { abrirNueva: true } })}>
          <div className="chip-icono"><svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg></div>
          <div className="txt">Nueva cotización</div>
        </button>
      </div>

      <h3 style={{ fontSize: 14, marginBottom: 10 }}>Tus últimas cotizaciones</h3>
      <div>
        {cotizaciones.slice(0, 3).map((c, idx) => (
          <div className="item-lista" key={idx}>
            <div className="info"><div className="nombre">{c.cliente}</div><div className="meta">{c.producto}</div></div>
            <div className="cifra">{money(c.monto)}<span className="sub"><span className={`estado-pill ${c.estado}`} style={{ marginTop: 3 }}>{c.estado}</span></span></div>
          </div>
        ))}
      </div>
    </>
  )
}
