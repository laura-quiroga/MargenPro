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

const MENSAJE_VENTA = '✨ ¡La mejor calidad al mejor precio!'

interface PreviewCotizacion {
  monto: number
  precioPorUnidad: number
  unidades: number
}

export default function Cotizaciones() {
  const { recetas, cotizaciones, setCotizaciones, money, costearReal, ajustarInventarioPorVenta, logoNegocio, nombreNegocio, lineaAtencion } = useAppStore()
  const { toast, mostrarToast } = useToast()
  const { piezas, lanzar } = useConfeti()
  const location = useLocation()
  const [vista, setVista] = useState<'lista' | 'nueva' | 'revisar'>('lista')
  const [filtro, setFiltro] = useState<'todas' | EstadoCotizacion>('todas')

  const [cliente, setCliente] = useState('')
  const [producto, setProducto] = useState('')
  const [telefono, setTelefono] = useState('')
  const [preview, setPreview] = useState<PreviewCotizacion | null>(null)
  const [confettiIdx, setConfettiIdx] = useState<number | null>(null)

  function abrirNueva() {
    setCliente('')
    setProducto(recetas[0]?.nombre ?? '')
    setTelefono('')
    setVista('nueva')
  }

  useEffect(() => {
    if ((location.state as { abrirNueva?: boolean } | null)?.abrirNueva) abrirNueva()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function irARevisar() {
    if (!cliente.trim()) { mostrarToast(<IconoAviso />, 'Escribe el nombre del cliente.'); return }
    const soloDigitos = telefono.replace(/\D/g, '')
    if (soloDigitos.length < 7) { mostrarToast(<IconoAviso />, 'Escribe el número de WhatsApp del cliente.'); return }
    const receta = recetas.find((r) => r.nombre === producto)
    // Siempre con gastos reales (costearReal), nunca el modo simple de Ajustes: lo que se le
    // cobra al cliente tiene que cubrir de verdad los gastos fijos/variables del negocio.
    const calc = receta ? costearReal(receta.insumosUsados, receta.margen, receta.horas, receta.unidades) : null
    setPreview({ monto: calc ? calc.precioSugerido : 20000, precioPorUnidad: calc ? calc.precioPorUnidad : 0, unidades: calc ? calc.unidades : 1 })
    setVista('revisar')
  }

  function enviarPorWhatsapp() {
    if (!preview) return
    const clienteFinal = cliente.trim() || 'Tu cliente'
    const soloDigitos = telefono.replace(/\D/g, '')
    setCotizaciones((prev) => [{ cliente: clienteFinal, producto, monto: preview.monto, estado: 'pendiente', fecha: 'hoy' }, ...prev])
    const negocioFinal = nombreNegocio.trim() || 'MargenPro'
    const notaContacto = lineaAtencion.trim() ? ` Si tienes alguna inquietud no dudes en contactarnos a nuestra línea de atención ${lineaAtencion.trim()} — será un gusto ayudarte.` : ''
    const mensaje = `Hola ${clienteFinal}! Te hablamos de ${negocioFinal}. Aquí tienes tu cotización de *${producto}*: ${money(preview.monto)}.${notaContacto} ${MENSAJE_VENTA}`
    window.open(`https://wa.me/${soloDigitos}?text=${encodeURIComponent(mensaje)}`, '_blank')
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
            <div className="campo">
              <label>Número de WhatsApp del cliente</label>
              <p className="ayuda-campo">Con el indicativo del país, solo números. Ej: 573001234567</p>
              <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Ej: 573001234567" />
            </div>
            <button className="btn-cta" onClick={irARevisar}>Revisar cotización →</button>
          </>
        )}
        <Toast toast={toast} />
      </>
    )
  }

  if (vista === 'revisar' && preview) {
    const fechaHoy = new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
    return (
      <>
        <button className="btn-atras-sub" onClick={() => setVista('nueva')}><IconoVolver />Editar</button>
        <h2 className="titulo-seccion" style={{ fontSize: 19 }}>Así la va a ver tu cliente</h2>
        <div className="tarjeta-cotizacion">
          <img src={logoNegocio || '/isotipo.svg'} alt="Logo de tu negocio" className="logo-negocio" />
          <p className="nombre-negocio">{nombreNegocio.trim() || 'MargenPro'}</p>
          <div className="linea-cot"><span>Cliente</span><span>{cliente.trim() || 'Tu cliente'}</span></div>
          <div className="linea-cot"><span>Producto</span><span>{producto}</span></div>
          {preview.unidades > 1 && (
            <div className="linea-cot"><span>Precio por porción</span><span>{money(preview.precioPorUnidad)}</span></div>
          )}
          <div className="linea-cot total"><span>Total</span><span>{money(preview.monto)}</span></div>
          <p className="mensaje-venta">{MENSAJE_VENTA}</p>
          <p className="fecha-cot">Cotización del {fechaHoy}</p>
        </div>
        <button className="btn-cta" onClick={enviarPorWhatsapp}><IconoWhatsapp />Enviar por WhatsApp</button>
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
