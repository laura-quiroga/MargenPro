import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAppStore } from '../../lib/appStore'
import { Toast, useToast } from '../../components/Toast'
import { Confetti, useConfeti } from '../../components/Confetti'
import type { EstadoCotizacion } from '../../lib/types'
import './Cotizaciones.css'

const FILTROS: { valor: 'todas' | EstadoCotizacion; label: string }[] = [
  { valor: 'todas', label: 'Todas' },
  { valor: 'vendida', label: 'Vendidas' },
  { valor: 'pendiente', label: 'Pendientes' },
  { valor: 'rechazada', label: 'Rechazadas' },
]

const IconoVolver = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
)
const IconoVendida = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M20 6L9 17l-5-5" /></svg>
)
const IconoPendiente = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
)
const IconoRechazada = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M18 6L6 18M6 6l12 12" /></svg>
)
const IconoWhatsapp = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
)
const IconoOk = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
)
const IconoReloj = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
)
const IconoX = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 12h8M12 8v8" transform="rotate(45 12 12)" /></svg>
)
const IconoAviso = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" /><path d="M12 9v4M12 17h.01" /></svg>
)

function iconoEstado(estado: EstadoCotizacion) {
  if (estado === 'vendida') return <IconoVendida />
  if (estado === 'pendiente') return <IconoPendiente />
  return <IconoRechazada />
}

const ETIQUETA_ESTADO: Record<EstadoCotizacion, string> = { vendida: 'Marcar vendida', pendiente: 'Marcar pendiente', rechazada: 'Marcar rechazada' }

export default function Cotizaciones() {
  const { recetas, cotizaciones, setCotizaciones, money, costear, ajustarInventarioPorVenta } = useAppStore()
  const { toast, mostrarToast } = useToast()
  const { piezas, lanzar } = useConfeti()
  const location = useLocation()
  const [vista, setVista] = useState<'lista' | 'nueva'>('lista')
  const [filtro, setFiltro] = useState<'todas' | EstadoCotizacion>('todas')

  const [cliente, setCliente] = useState('')
  const [producto, setProducto] = useState('')
  const [confettiIdx, setConfettiIdx] = useState<number | null>(null)

  function abrirNueva() {
    setCliente('')
    setProducto(recetas[0]?.nombre ?? '')
    setVista('nueva')
  }

  useEffect(() => {
    if ((location.state as { abrirNueva?: boolean } | null)?.abrirNueva) abrirNueva()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function crearCotizacion() {
    const clienteFinal = cliente.trim() || 'Tu cliente'
    const receta = recetas.find((r) => r.nombre === producto)
    const monto = receta ? costear(receta.insumosUsados, receta.margen, receta.horas, receta.unidades).precioSugerido : 20000
    setCotizaciones((prev) => [{ cliente: clienteFinal, producto, monto, estado: 'pendiente', fecha: 'hoy' }, ...prev])
    setVista('lista')
    mostrarToast(<IconoReloj />, `Anotado. Te recordamos hacerle seguimiento a ${clienteFinal} en 2 días.`)
  }

  function cambiarEstado(idx: number, nuevoEstado: EstadoCotizacion) {
    const estadoAnterior = cotizaciones[idx].estado
    const productoCotizado = cotizaciones[idx].producto
    setCotizaciones((prev) => prev.map((c, i) => (i === idx ? { ...c, estado: nuevoEstado } : c)))
    if (estadoAnterior === nuevoEstado) return
    let insumosBajos: string[] = []
    if (nuevoEstado === 'vendida') {
      insumosBajos = ajustarInventarioPorVenta(productoCotizado, -1)
    } else if (estadoAnterior === 'vendida') {
      ajustarInventarioPorVenta(productoCotizado, 1)
    }
    if (nuevoEstado === 'vendida') {
      setConfettiIdx(idx)
      lanzar()
      mostrarToast(<IconoOk />, '¡Vendida! Esta es tu ganancia real de hoy.')
      if (insumosBajos.length) {
        setTimeout(() => mostrarToast(<IconoAviso />, `Se te está acabando: ${insumosBajos.join(', ')}.`), 4000)
      }
    } else if (nuevoEstado === 'rechazada') {
      mostrarToast(<IconoX />, 'Este cliente dijo que no — pero tu precio sigue siendo justo. Sigue cotizando.')
    }
  }

  const listaFiltrada = cotizaciones
    .map((c, idx) => ({ c, idx }))
    .filter(({ c }) => filtro === 'todas' || c.estado === filtro)

  if (vista === 'nueva') {
    return (
      <>
        <button className="btn-atras-sub" onClick={() => setVista('lista')}><IconoVolver />Cotizaciones</button>
        <h2 className="titulo-seccion" style={{ fontSize: 19 }}>Nueva cotización</h2>
        {!recetas.length ? (
          <div className="vacio"><p>Primero costea una receta en la pestaña Recetas — así puedes cotizarla.</p></div>
        ) : (
          <>
            <div className="campo">
              <label>Nombre del cliente</label>
              <input value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Ej: Juliana Restrepo" />
            </div>
            <div className="campo">
              <label>¿Qué le vas a cobrar?</label>
              <select value={producto} onChange={(e) => setProducto(e.target.value)}>
                {recetas.map((r) => <option key={r.id} value={r.nombre}>{r.nombre}</option>)}
              </select>
            </div>
            <div className="tarjeta" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 12, color: 'var(--text-2)' }}>Tu logo (ejemplo)</p>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--accent)', margin: '10px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--on-accent)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>M</div>
              <p style={{ fontWeight: 700 }}>MargenPro Repostería</p>
              <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 6 }}>Cotización lista para enviar por WhatsApp</p>
            </div>
            <button className="btn-cta" onClick={crearCotizacion}><IconoWhatsapp />Revisar y enviar por WhatsApp</button>
          </>
        )}
        <Toast toast={toast} />
      </>
    )
  }

  return (
    <>
      <h2 className="titulo-seccion">Cotizaciones</h2>
      <p className="sub-seccion">Lo que le has cotizado a tus clientes.</p>
      <button className="btn-cta" style={{ marginBottom: 14 }} onClick={abrirNueva}>+ Nueva cotización</button>
      <div className="fila-filtros">
        {FILTROS.map((f) => (
          <button key={f.valor} className={`filtro-chip${filtro === f.valor ? ' activo' : ''}`} onClick={() => setFiltro(f.valor)}>{f.label}</button>
        ))}
      </div>
      {!listaFiltrada.length ? (
        <div className="vacio"><p>No hay cotizaciones en este filtro.</p></div>
      ) : (
        <div>
          {listaFiltrada.map(({ c, idx }) => (
            <div className="tarjeta" key={idx}>
              {confettiIdx === idx && <Confetti piezas={piezas} />}
              <div className="tarjeta-fila" style={{ marginBottom: 10 }}>
                <div className={`chip-icono${c.estado === 'rechazada' ? ' error' : c.estado === 'pendiente' ? ' aviso' : ''}`}>{iconoEstado(c.estado)}</div>
                <div className="info"><div className="nombre">{c.cliente}</div><div className="meta">{c.producto} · {c.fecha}</div></div>
                <div className="cifra">{money(c.monto)}</div>
              </div>
              <span className={`estado-pill ${c.estado}`}>{c.estado}</span>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                {(['vendida', 'pendiente', 'rechazada'] as EstadoCotizacion[]).filter((e) => e !== c.estado).map((e) => (
                  <button key={e} className="btn-secundario" style={{ margin: 0, ...(e === 'rechazada' ? { borderColor: 'rgb(var(--error-tint)/.4)', color: 'var(--error)' } : {}) }} onClick={() => cambiarEstado(idx, e)}>
                    {ETIQUETA_ESTADO[e]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <Toast toast={toast} />
    </>
  )
}
