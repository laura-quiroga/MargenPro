import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAppStore } from '../../lib/appStore'
import { redondearPrecioVenta } from '../../lib/costeo'
import { Toast, useToast } from '../../components/Toast'
import InfoTooltip from '../../components/InfoTooltip'
import { Confetti, useConfeti } from '../../components/Confetti'
import { generarImagenCotizacion } from '../../lib/imagenCotizacion'
import { logEvent } from '../../lib/eventos'
import type { EstadoCotizacion, ItemCotizacion } from '../../lib/types'
import './Cotizaciones.css'

function fechaCotizacionTexto() {
  return `Cotización del ${new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}`
}

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
const IconoQuitar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
)
const IconoPapelera = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0l-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6" /><path d="M10 11v6M14 11v6" /></svg>
)

function iconoEstado(estado: EstadoCotizacion) {
  if (estado === 'vendida') return <IconoVendida />
  if (estado === 'pendiente') return <IconoPendiente />
  return <IconoRechazada />
}

const ETIQUETA_ESTADO: Record<EstadoCotizacion, string> = { vendida: 'Marcar vendida', pendiente: 'Marcar pendiente', rechazada: 'Marcar rechazada' }

const MENSAJE_VENTA = '✨ ¡La mejor calidad al mejor precio!'

interface ItemPreview {
  recetaId?: string
  producto: string
  cantidad: number
  monto: number
}

interface PreviewCotizacion {
  items: ItemPreview[]
  total: number
}

interface FilaCotizacion {
  producto: string
  cantidad: string
}

export default function Cotizaciones() {
  const { recetas: todasLasRecetas, cotizaciones, cargandoCotizaciones, crearCotizacion, cambiarEstadoCotizacion, eliminarCotizacion, money, costearReal, costearSimple, ajustarInventarioPorVenta, logoNegocio, nombreNegocio, lineaAtencion, plan } = useAppStore()
  // Una subreceta/adicional nunca se vende sola — solo las recetas completas se cotizan.
  const recetas = todasLasRecetas.filter((r) => !r.esSubreceta)
  const { toast, mostrarToast } = useToast()
  const { piezas, lanzar } = useConfeti()
  const location = useLocation()
  const [vista, setVista] = useState<'lista' | 'nueva' | 'revisar'>('lista')
  const [filtro, setFiltro] = useState<'todas' | EstadoCotizacion>('todas')

  const [cliente, setCliente] = useState('')
  const [filas, setFilas] = useState<FilaCotizacion[]>([])
  // Por defecto SÍ se incluyen los gastos fijos/variables (lo recomendado, para no vender a
  // pérdida) — el usuario lo puede apagar si quiere comparar o cotizar distinto.
  const [incluirGastosReales, setIncluirGastosReales] = useState(true)
  const [telefono, setTelefono] = useState('')
  const [preview, setPreview] = useState<PreviewCotizacion | null>(null)
  const [confettiIdx, setConfettiIdx] = useState<number | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [confirmandoEliminarIdx, setConfirmandoEliminarIdx] = useState<number | null>(null)

  function filaNuevaPara(nombreProducto: string): FilaCotizacion {
    const receta = recetas.find((r) => r.nombre === nombreProducto)
    return { producto: nombreProducto, cantidad: receta ? String(receta.unidades) : '' }
  }

  function abrirNueva() {
    setCliente('')
    const primeraReceta = recetas[0]
    setFilas(primeraReceta ? [filaNuevaPara(primeraReceta.nombre)] : [])
    setTelefono('')
    setVista('nueva')
  }

  function actualizarFila(idx: number, cambios: Partial<FilaCotizacion>) {
    setFilas((prev) => prev.map((f, i) => (i === idx ? { ...f, ...cambios } : f)))
  }

  function elegirProductoFila(idx: number, nombreNuevo: string) {
    // Al cambiar de producto, la cantidad vuelve al tamaño de tanda de ESA receta por defecto
    // — el usuario la puede cambiar después si el cliente quiere otra cantidad.
    actualizarFila(idx, filaNuevaPara(nombreNuevo))
  }

  function agregarFila() {
    const siguienteReceta = recetas.find((r) => !filas.some((f) => f.producto === r.nombre)) ?? recetas[0]
    if (siguienteReceta) setFilas((prev) => [...prev, filaNuevaPara(siguienteReceta.nombre)])
  }

  function quitarFila(idx: number) {
    setFilas((prev) => prev.filter((_, i) => i !== idx))
  }

  useEffect(() => {
    if ((location.state as { abrirNueva?: boolean } | null)?.abrirNueva) abrirNueva()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // El usuario decide con el botón si esta cotización incluye sus gastos fijos/variables o no
  // (sin importar el modo elegido en Ajustes) — así puede comparar a propósito. Se costea con
  // el tamaño de tanda PROPIO de cada receta (así los insumos usados son correctos) y luego se
  // escala el precio por unidad a la cantidad real que pidió el cliente — puede ser distinta al
  // tamaño de tanda (ej. la receta rinde 5 pero el cliente quiere 12). El monto de cada producto
  // se redondea hacia arriba al múltiplo de $50 más cercano, para un precio más fácil de cobrar.
  function calcularItems(): ItemPreview[] | null {
    const costearElegido = incluirGastosReales ? costearReal : costearSimple
    const items: ItemPreview[] = []
    for (const f of filas) {
      const cantidadNum = parseFloat(f.cantidad) || 0
      if (cantidadNum <= 0) return null
      const receta = recetas.find((r) => r.nombre === f.producto)
      const calc = receta ? costearElegido(receta.insumosUsados, receta.margen, receta.horas, receta.unidades, receta.incluirManoDeObraEnSencillo, receta.subrecetasUsadas) : null
      const precioPorUnidad = calc ? calc.precioPorUnidad : 20000
      items.push({ recetaId: receta?.id, producto: f.producto, cantidad: cantidadNum, monto: redondearPrecioVenta(Math.round(precioPorUnidad * cantidadNum)) })
    }
    return items
  }

  function irARevisar() {
    if (!cliente.trim()) { mostrarToast(<IconoAviso />, 'Escribe el nombre del cliente.'); return }
    const soloDigitos = telefono.replace(/\D/g, '')
    if (soloDigitos.length < 7) { mostrarToast(<IconoAviso />, 'Escribe el número de WhatsApp del cliente.'); return }
    const items = calcularItems()
    if (!items) { mostrarToast(<IconoAviso />, 'Escribe cuántas unidades quiere el cliente de cada producto.'); return }
    setPreview({ items, total: items.reduce((acc, it) => acc + it.monto, 0) })
    setVista('revisar')
  }

  async function enviarPorWhatsapp() {
    if (!preview || enviando) return
    setEnviando(true)
    const clienteFinal = cliente.trim() || 'Tu cliente'
    const soloDigitos = telefono.replace(/\D/g, '')
    const negocioFinal = nombreNegocio.trim() || 'MargenPro'
    const nombresProductos = preview.items.map((it) => it.producto).join(' y ')
    const notaContacto = lineaAtencion.trim() ? ` Si tienes alguna inquietud no dudes en contactarnos a nuestra línea de atención ${lineaAtencion.trim()} — será un gusto ayudarte.` : ''
    const mensaje = `Hola ${clienteFinal}! Te hablamos de ${negocioFinal}. Aquí tienes tu cotización de *${nombresProductos}*.${notaContacto} ${MENSAJE_VENTA}`

    // Se reserva la pestaña de WhatsApp ANTES de generar la imagen (que toma un instante) —
    // si se abre después de un await, los navegadores la bloquean por no verla como un clic directo.
    const ventanaWa = window.open('', '_blank')

    const blob = await generarImagenCotizacion({
      // El logo de marca es de los planes pagos — en el plan gratis la cotización sale sin logo.
      logo: plan === 'pro' ? logoNegocio : null,
      nombreNegocio: negocioFinal,
      cliente: clienteFinal,
      items: preview.items.map((it) => ({ etiqueta: it.cantidad > 1 ? `${it.producto} x${it.cantidad}` : it.producto, montoTexto: money(it.monto) })),
      totalTexto: money(preview.total),
      mensajeVenta: MENSAJE_VENTA,
      fechaTexto: fechaCotizacionTexto(),
    })

    const itemsParaGuardar: ItemCotizacion[] = preview.items.map((it) => ({ recetaId: it.recetaId, producto: it.producto, cantidad: it.cantidad, monto: it.monto }))
    await crearCotizacion({ cliente: clienteFinal, telefono: soloDigitos, items: itemsParaGuardar })
    void logEvent('cotizacion_creada')

    let compartidoNativo = false
    if (blob) {
      const archivo = new File([blob], 'cotizacion.png', { type: 'image/png' })
      const navegadorComparte = typeof navigator.canShare === 'function' && navigator.canShare({ files: [archivo] })
      if (navegadorComparte) {
        try {
          await navigator.share({ files: [archivo], text: mensaje })
          compartidoNativo = true
        } catch (err) {
          if ((err as Error)?.name === 'AbortError') compartidoNativo = true // el usuario canceló a propósito, no forzar el respaldo
        }
      }
      if (compartidoNativo) {
        ventanaWa?.close()
      } else {
        const url = URL.createObjectURL(blob)
        const enlace = document.createElement('a')
        enlace.href = url
        enlace.download = 'cotizacion.png'
        document.body.appendChild(enlace)
        enlace.click()
        enlace.remove()
        URL.revokeObjectURL(url)
        const waUrl = `https://wa.me/${soloDigitos}?text=${encodeURIComponent(mensaje)}`
        if (ventanaWa) ventanaWa.location.href = waUrl
        else window.open(waUrl, '_blank')
        mostrarToast(<IconoReloj />, `Descargamos la imagen de tu cotización — adjúntala en WhatsApp. Te recordamos seguir con ${clienteFinal} en 2 días.`)
      }
    } else {
      const waUrl = `https://wa.me/${soloDigitos}?text=${encodeURIComponent(mensaje)}`
      if (ventanaWa) ventanaWa.location.href = waUrl
      else window.open(waUrl, '_blank')
    }

    if (blob === null || compartidoNativo) {
      mostrarToast(<IconoReloj />, `Anotado. Te recordamos hacerle seguimiento a ${clienteFinal} en 2 días.`)
    }
    setVista('lista')
    setEnviando(false)
  }

  async function cambiarEstado(idx: number, nuevoEstado: EstadoCotizacion) {
    const cotizacion = cotizaciones[idx]
    const estadoAnterior = cotizacion.estado
    if (estadoAnterior === nuevoEstado) return
    const ok = await cambiarEstadoCotizacion(cotizacion.id, nuevoEstado)
    if (!ok) { mostrarToast(<IconoAviso />, 'No pudimos actualizar la cotización. Intenta de nuevo.'); return }
    let insumosBajos: string[] = []
    if (nuevoEstado === 'vendida') {
      insumosBajos = ajustarInventarioPorVenta(cotizacion.items, -1)
    } else if (estadoAnterior === 'vendida') {
      ajustarInventarioPorVenta(cotizacion.items, 1)
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

  async function eliminarCotizacionIdx(idx: number) {
    const cotizacion = cotizaciones[idx]
    const ok = await eliminarCotizacion(cotizacion.id)
    setConfirmandoEliminarIdx(null)
    if (!ok) { mostrarToast(<IconoAviso />, 'No pudimos eliminar esta cotización. Intenta de nuevo.'); return }
    mostrarToast(<IconoOk />, 'Cotización eliminada.')
  }

  const listaFiltrada = cotizaciones
    .map((c, idx) => ({ c, idx }))
    .filter(({ c }) => filtro === 'todas' || c.estado === filtro)

  if (vista === 'nueva') {
    function montoVivoFila(f: FilaCotizacion): number | null {
      const cantidadNum = parseFloat(f.cantidad) || 0
      if (cantidadNum <= 0) return null
      const receta = recetas.find((r) => r.nombre === f.producto)
      const calc = receta ? (incluirGastosReales ? costearReal : costearSimple)(receta.insumosUsados, receta.margen, receta.horas, receta.unidades, receta.incluirManoDeObraEnSencillo, receta.subrecetasUsadas) : null
      const precioPorUnidad = calc ? calc.precioPorUnidad : 20000
      return redondearPrecioVenta(Math.round(precioPorUnidad * cantidadNum))
    }
    const montosVivos = filas.map(montoVivoFila)
    const totalVivo = montosVivos.some((m) => m === null) ? null : montosVivos.reduce<number>((acc, m) => acc + (m ?? 0), 0)
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
            <div className="fila-config" style={{ marginBottom: 6 }}>
              <div className="txt"><div className="n">Incluir mis costos fijos y variables<InfoTooltip texto="Prendido: el precio de este pedido ya cubre tu arriendo, sueldo y demás gastos del mes — lo recomendado, para no cobrar de menos. Apagado: el precio solo cubre tus insumos y tu margen — útil solo si quieres comparar, no para cobrarle al cliente." /></div><div className="d">Para saber tu ganancia real de este pedido</div></div>
              <button className={`toggle-switch${incluirGastosReales ? ' on' : ''}`} onClick={() => setIncluirGastosReales((v) => !v)} aria-label="Incluir mis costos fijos y variables"><span /></button>
            </div>
            <p className="ayuda-campo" style={{ marginBottom: 16 }}>
              {incluirGastosReales
                ? 'Así sabes REALMENTE cuánto ganas con este precio, incluyendo lo que gastas en arriendo, sueldo y demás — para no vender a pérdida sin darte cuenta.'
                : 'Sin tus costos fijos y variables, este precio solo cubre los insumos y tu margen — puede no alcanzarte para cubrir arriendo, sueldo y demás. Actívalo para ver tu ganancia neta real.'}
            </p>
            <h3 style={{ fontSize: 14, marginBottom: 10 }}>¿Qué le vas a cobrar?</h3>
            {filas.map((f, idx) => (
              <div key={idx} className="insumo-chip" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  <select style={{ flex: '1 1 160px', minWidth: 0, padding: '9px 8px', borderRadius: 9, border: '1.5px solid var(--sunken)', background: 'var(--surface)', fontSize: 12.5 }}
                    value={f.producto} onChange={(e) => elegirProductoFila(idx, e.target.value)}>
                    {recetas.map((r) => <option key={r.id} value={r.nombre}>{r.nombre}</option>)}
                  </select>
                  <input type="number" value={f.cantidad} onChange={(e) => actualizarFila(idx, { cantidad: e.target.value })} placeholder="Cant."
                    style={{ width: 64, flexShrink: 0, padding: '9px 8px', borderRadius: 9, border: '1.5px solid var(--sunken)', background: 'var(--surface)', fontSize: 12.5 }} />
                  {filas.length > 1 && <button onClick={() => quitarFila(idx)} aria-label="Quitar producto"><IconoQuitar /></button>}
                </div>
                <p className="ayuda-campo" style={{ margin: 0 }}>
                  Rinde {recetas.find((r) => r.nombre === f.producto)?.unidades ?? 1} por tanda{montosVivos[idx] !== null ? ` — ${money(montosVivos[idx] as number)}` : ''}
                </p>
              </div>
            ))}
            {filas.length < recetas.length && (
              <button className="btn-secundario" onClick={agregarFila}>+ Agregar otro producto</button>
            )}
            {totalVivo !== null && (
              <div className="tarjeta" style={{ margin: '16px 0', padding: '12px 16px' }}>
                <p style={{ fontSize: 12, color: 'var(--text-2)' }}>Le vas a cobrar en total</p>
                <p style={{ fontWeight: 800, fontSize: 22 }}>{money(totalVivo)}</p>
              </div>
            )}
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
    return (
      <>
        <button className="btn-atras-sub" onClick={() => setVista('nueva')}><IconoVolver />Editar</button>
        <h2 className="titulo-seccion" style={{ fontSize: 19 }}>Así la va a ver tu cliente</h2>
        <div className="tarjeta-cotizacion">
          <img src={logoNegocio || '/isotipo.svg'} alt="Logo de tu negocio" className="logo-negocio" />
          <p className="nombre-negocio">{nombreNegocio.trim() || 'MargenPro'}</p>
          <div className="linea-cot"><span>Cliente</span><span>{cliente.trim() || 'Tu cliente'}</span></div>
          {preview.items.map((it, idx) => (
            <div className="linea-cot" key={idx}><span>{it.producto}{it.cantidad > 1 ? ` x${it.cantidad}` : ''}</span><span>{money(it.monto)}</span></div>
          ))}
          <div className="linea-cot total"><span>Total</span><span>{money(preview.total)}</span></div>
          <p className="mensaje-venta">{MENSAJE_VENTA}</p>
          <p className="fecha-cot">{fechaCotizacionTexto()}</p>
        </div>
        <button className="btn-cta" onClick={enviarPorWhatsapp} disabled={enviando}><IconoWhatsapp />{enviando ? 'Preparando…' : 'Enviar por WhatsApp'}</button>
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
      {cargandoCotizaciones ? (
        <div className="vacio"><p>Cargando tus cotizaciones…</p></div>
      ) : !listaFiltrada.length ? (
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
                <button aria-label="Eliminar cotización" style={{ flexShrink: 0, color: 'var(--text-2)' }} onClick={() => setConfirmandoEliminarIdx(idx)}><IconoPapelera /></button>
              </div>
              <span className={`estado-pill ${c.estado}`}>{c.estado}</span>
              {confirmandoEliminarIdx === idx ? (
                <div style={{ marginTop: 12 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>¿Eliminar esta cotización para siempre?</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-secundario" style={{ margin: 0, width: 'auto', flex: 1 }} onClick={() => setConfirmandoEliminarIdx(null)}>Cancelar</button>
                    <button className="btn-secundario" style={{ margin: 0, width: 'auto', flex: 1, borderColor: 'rgb(var(--error-tint)/.4)', color: 'var(--error)' }} onClick={() => eliminarCotizacionIdx(idx)}>Eliminar</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  {(['vendida', 'pendiente', 'rechazada'] as EstadoCotizacion[]).filter((e) => e !== c.estado).map((e) => (
                    <button key={e} className="btn-secundario" style={{ margin: 0, ...(e === 'rechazada' ? { borderColor: 'rgb(var(--error-tint)/.4)', color: 'var(--error)' } : {}) }} onClick={() => cambiarEstado(idx, e)}>
                      {ETIQUETA_ESTADO[e]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <Toast toast={toast} />
    </>
  )
}
