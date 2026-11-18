import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../lib/appStore'
import { supabase } from '../../lib/supabaseClient'
import './Panorama.css'

function inicioDeMes(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
function inicioDeAnio(d = new Date()): Date {
  return new Date(d.getFullYear(), 0, 1)
}
const CLAVE_AVISO_PENDIENTES = 'margenpro_aviso_pendientes_visto'

export default function Panorama() {
  const navigate = useNavigate()
  const { cotizaciones, mesesMock, mesActualIdx, setMesActualIdx, gastoMesActual, money } = useAppStore()
  const mes = mesesMock[mesActualIdx]

  const inicioMesActual = inicioDeMes()
  // El ingreso del mes se cuenta con la fecha en que se VENDIÓ (vendidaEn), nunca con la fecha
  // en que se creó la cotización — antes se sumaban TODAS las vendidas de siempre, sin importar
  // el mes, lo que inflaba la ganancia mes tras mes.
  const vendidasEsteMes = cotizaciones.filter((c) => c.estado === 'vendida' && c.vendidaEn && new Date(c.vendidaEn) >= inicioMesActual)
  const ingreso = mes.esMesActual ? vendidasEsteMes.reduce((s, c) => s + c.monto, 0) : (mes.ingreso ?? 0)
  const vendidas = mes.esMesActual ? vendidasEsteMes.length : (mes.vendidas ?? 0)

  // Resumen del año — ganancia e inversión total, con datos reales (no solo el mes en curso).
  const [mostrarResumenAnual, setMostrarResumenAnual] = useState(false)
  const [gastoAnual, setGastoAnual] = useState<number | null>(null)
  useEffect(() => {
    if (!mostrarResumenAnual || gastoAnual !== null) return
    supabase.from('compras_insumo').select('total').gte('created_at', inicioDeAnio().toISOString()).then(({ data }) => {
      setGastoAnual((data ?? []).reduce((acc, f) => acc + Number(f.total), 0))
    })
  }, [mostrarResumenAnual, gastoAnual])
  const ingresoAnual = cotizaciones
    .filter((c) => c.estado === 'vendida' && c.vendidaEn && new Date(c.vendidaEn) >= inicioDeAnio())
    .reduce((s, c) => s + c.monto, 0)

  // Aviso de cotizaciones pendientes al iniciar el mes — solo dentro de la app (todavía no hay
  // correo transaccional conectado); se muestra una vez por mes, en los primeros días.
  const [avisoVisible, setAvisoVisible] = useState(false)
  useEffect(() => {
    const hoy = new Date()
    const claveMes = `${hoy.getFullYear()}-${hoy.getMonth() + 1}`
    if (hoy.getDate() > 5) return
    if (localStorage.getItem(CLAVE_AVISO_PENDIENTES) === claveMes) return
    const hayPendientesViejas = cotizaciones.some((c) => c.estado === 'pendiente' && new Date(c.createdAt) < inicioMesActual)
    if (hayPendientesViejas) setAvisoVisible(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cotizaciones])
  function cerrarAvisoPendientes() {
    const hoy = new Date()
    localStorage.setItem(CLAVE_AVISO_PENDIENTES, `${hoy.getFullYear()}-${hoy.getMonth() + 1}`)
    setAvisoVisible(false)
  }
  const pendientesViejas = cotizaciones.filter((c) => c.estado === 'pendiente' && new Date(c.createdAt) < inicioMesActual)
  // El mes actual usa el gasto REAL (suma de compras de insumos ya registradas) — los meses
  // anteriores siguen con su cifra de ejemplo hasta que haya historial real que mostrar.
  const gasto = mes.esMesActual ? gastoMesActual : mes.gasto
  const ganancia = ingreso - gasto
  const esPerdida = ganancia < 0

  return (
    <>
      <h2 className="titulo-seccion">Tu panorama</h2>
      <p className="sub-seccion">Lo que gastaste y lo que de verdad ganaste este mes.</p>

      {avisoVisible && pendientesViejas.length > 0 && (
        <div className="aviso-precio" style={{ marginBottom: 16 }}>
          <div className="chip-icono aviso" style={{ width: 36, height: 36 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4M12 17h.01" /><circle cx="12" cy="12" r="9" /></svg>
          </div>
          <div style={{ flex: 1 }}>
            <p>
              <strong>Tienes {pendientesViejas.length} cotización{pendientesViejas.length === 1 ? '' : 'es'} pendiente{pendientesViejas.length === 1 ? '' : 's'} de meses anteriores.</strong>{' '}
              Dales seguimiento — quizás ya puedes marcarlas como vendidas o rechazadas.
            </p>
            <button className="btn-texto" style={{ marginTop: 6, padding: 0 }} onClick={cerrarAvisoPendientes}>Ya las revisé</button>
          </div>
        </div>
      )}

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
            <div style={{ textAlign: 'right' }}><span>Gastaste en insumos</span><span className="num">{money(gasto)}</span></div>
          </div>
          <div className="detalle">
            <div><span>Cotizaciones vendidas</span><span className="num">{vendidas}</span></div>
          </div>
        </div>
      </div>

      <button className="tarjeta" style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: 16, cursor: 'pointer' }} onClick={() => setMostrarResumenAnual((v) => !v)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: 13.5 }}>Resumen de {new Date().getFullYear()}</span>
          <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{mostrarResumenAnual ? 'Ocultar ▲' : 'Ver ▼'}</span>
        </div>
        {mostrarResumenAnual && (
          <div className="campo-2" style={{ marginTop: 12 }}>
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-2)' }}>Ganancia total del año</p>
              <p style={{ fontWeight: 800, fontSize: 18, color: gastoAnual === null ? 'var(--text-2)' : (ingresoAnual - gastoAnual) < 0 ? 'var(--error)' : 'var(--accent)' }}>
                {gastoAnual === null ? 'Calculando…' : money(ingresoAnual - gastoAnual)}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 12, color: 'var(--text-2)' }}>Inversión total en insumos</p>
              <p style={{ fontWeight: 800, fontSize: 18 }}>{gastoAnual === null ? 'Calculando…' : money(gastoAnual)}</p>
            </div>
          </div>
        )}
      </button>

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
