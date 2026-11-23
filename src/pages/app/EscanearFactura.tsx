import { useRef, useState } from 'react'
import { useAppStore } from '../../lib/appStore'
import { etiquetaUnidad } from '../../lib/appStore'
import { calcularCostoReceta } from '../../lib/costeo'
import { emparejarInsumo, normalizarItemFactura } from '../../lib/facturaMatching'
import { crearFacturaEscaneada, escanearFactura, subirFotoFactura, type ItemFactura } from '../../lib/ai/vision'
import { supabase } from '../../lib/supabaseClient'
import { logEvent } from '../../lib/eventos'
import { Toast, useToast } from '../../components/Toast'
import type { CategoriaInsumo, UnidadInsumo } from '../../lib/types'
import { LOCALE_MONEDA } from '../../lib/types'

const IconoVolver = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
)
const IconoAviso = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4M12 17h.01" /><circle cx="12" cy="12" r="9" /></svg>
)
const IconoOk = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
)
const IconoCamara = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h3l2-2h6l2 2h3v12H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
)
const IconoQuitar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
)
const IconoDeshacer = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14l-4-4 4-4" /><path d="M5 10h10a5 5 0 0 1 0 10h-1" /></svg>
)

const CATEGORIAS_FACTURA: { valor: CategoriaInsumo; label: string }[] = [
  { valor: 'ingrediente', label: 'Ingrediente' },
  { valor: 'empaque', label: 'Empaque' },
  { valor: 'adicional', label: 'Adicional' },
]

interface ItemEditable extends ItemFactura {
  insumoId: string | null
  crearNuevo: boolean
  omitir: boolean
  categoria: CategoriaInsumo
}

type Paso = 'elegir' | 'procesando' | 'revisar' | 'resumen'

export default function EscanearFactura({ onVolver }: { onVolver: () => void }) {
  const { insumos, recetas, cotizaciones, cfg, modoCalculo, money, moneda, confirmarItemFactura, crearInsumoDesdeFactura, cerrarFacturaEscaneada, deshacerFactura } = useAppStore()
  const { toast, mostrarToast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const inputGaleriaRef = useRef<HTMLInputElement>(null)

  const [paso, setPaso] = useState<Paso>('elegir')
  const [facturaId, setFacturaId] = useState<string | null>(null)
  const [imagenPath, setImagenPath] = useState<string | null>(null)
  const [items, setItems] = useState<ItemEditable[]>([])
  const [confirmando, setConfirmando] = useState(false)
  const [deshaciendo, setDeshaciendo] = useState(false)
  const [resumen, setResumen] = useState<{ insumoId: string; nombre: string; costoAntes: number; costoDespues: number }[]>([])
  const [cambiosPrecio, setCambiosPrecio] = useState<{ insumoId: string; nombre: string; unidad: UnidadInsumo; precioAntes: number; precioDespues: number }[]>([])
  const [cotizacionesAfectadas, setCotizacionesAfectadas] = useState<string[]>([])

  async function alElegirArchivo(archivo: File | undefined) {
    if (!archivo) return
    if (!archivo.type.startsWith('image/')) { mostrarToast(<IconoAviso />, 'Ese archivo no es una imagen.'); return }
    if (archivo.size > 8 * 1024 * 1024) { mostrarToast(<IconoAviso />, 'La foto pesa mucho — toma una nueva o usa una de menos de 8 MB.'); return }
    setPaso('procesando')
    const { data: userData } = await supabase.auth.getUser()
    const usuario = userData.user
    if (!usuario) { mostrarToast(<IconoAviso />, 'Tu sesión expiró. Vuelve a entrar.'); setPaso('elegir'); return }

    const ruta = await subirFotoFactura(archivo, usuario.id)
    if (!ruta) { mostrarToast(<IconoAviso />, 'No pudimos subir la foto. Intenta de nuevo.'); setPaso('elegir'); return }
    setImagenPath(ruta)

    const id = await crearFacturaEscaneada(ruta)
    if (!id) { mostrarToast(<IconoAviso />, 'No pudimos registrar la factura. Intenta de nuevo.'); setPaso('elegir'); return }
    setFacturaId(id)

    const { data: alias } = await supabase.from('insumo_alias').select('texto_factura, insumo_id')
    const { items: leidos, error } = await escanearFactura(id)
    if (error || !leidos) {
      mostrarToast(<IconoAviso />, error || 'No pudimos leer la factura.')
      setPaso('elegir')
      return
    }
    const editables: ItemEditable[] = leidos.map((it) => {
      const productoLimpio = it.producto.trim()
      const match = emparejarInsumo(it.texto_original, productoLimpio, insumos, alias || [])
      const insumoCoincidente = match.insumoId ? insumos.find((i) => i.id === match.insumoId) : undefined
      return { ...it, producto: productoLimpio, insumoId: match.insumoId, crearNuevo: !match.insumoId, omitir: false, categoria: insumoCoincidente?.categoria ?? 'ingrediente' }
    })
    setItems(editables)
    setPaso('revisar')
  }

  function actualizarItem(idx: number, cambios: Partial<ItemEditable>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...cambios } : it)))
  }

  async function confirmarTodo() {
    if (!facturaId) return
    setConfirmando(true)

    // Precio NUEVO por insumo (id real, si ya existía) — se arma ANTES de guardar nada, así el
    // cálculo de "antes/después" no depende de que el estado ya se haya refrescado.
    const precioNuevoPorInsumo = new Map<string, number>()
    for (const item of items) {
      if (item.omitir || item.crearNuevo || !item.insumoId) continue
      const insumoExistente = insumos.find((i) => i.id === item.insumoId)
      if (!insumoExistente) continue
      precioNuevoPorInsumo.set(item.insumoId, normalizarItemFactura(item, insumoExistente).precioPorUnidad)
    }
    const idsQueVanACambiar = [...precioNuevoPorInsumo.keys()]
    const cambiosDePrecio = idsQueVanACambiar
      .map((insumoId) => {
        const ins = insumos.find((i) => i.id === insumoId)
        if (!ins) return null
        return { insumoId, nombre: ins.nombre, unidad: ins.unidad, precioAntes: ins.precio, precioDespues: precioNuevoPorInsumo.get(insumoId)! }
      })
      .filter((c): c is NonNullable<typeof c> => c !== null && c.precioAntes !== c.precioDespues)
    const recetasAfectadas = recetas.filter((r) => r.insumosUsados.some((u) => idsQueVanACambiar.includes(u.insumoId)))
    const insumosConPrecioNuevo = insumos.map((i) => (precioNuevoPorInsumo.has(i.id) ? { ...i, precio: precioNuevoPorInsumo.get(i.id)! } : i))
    const modoReal = modoCalculo === 'real'
    const comparacion = recetasAfectadas.map((r) => ({
      insumoId: r.id,
      nombre: r.nombre,
      costoAntes: calcularCostoReceta(insumos, r.insumosUsados, r.margen, r.horas, r.unidades, modoReal, cfg).costoBase,
      costoDespues: calcularCostoReceta(insumosConPrecioNuevo, r.insumosUsados, r.margen, r.horas, r.unidades, modoReal, cfg).costoBase,
    })).filter((c) => c.costoAntes !== c.costoDespues)

    for (const item of items) {
      if (item.omitir) continue
      const insumoExistente = !item.crearNuevo && item.insumoId ? insumos.find((i) => i.id === item.insumoId) : undefined
      const { precioPorUnidad, stockSumado } = normalizarItemFactura(item, insumoExistente)
      if (item.crearNuevo) {
        await crearInsumoDesdeFactura({
          nombre: item.producto.trim(), unidad: item.medida as UnidadInsumo, precio: precioPorUnidad,
          unidadesQueTrae: 1, categoria: item.categoria, stockDisponible: stockSumado,
          ultimaCompraCantidad: item.cantidad, ultimaCompraTotal: item.precio, ultimaCompraMedida: item.medida as UnidadInsumo,
        }, item.texto_original, facturaId)
      } else if (item.insumoId) {
        await confirmarItemFactura(item.insumoId, item.texto_original, precioPorUnidad, stockSumado, facturaId, { cantidad: item.cantidad, total: item.precio, medida: item.medida as UnidadInsumo })
      }
    }
    await cerrarFacturaEscaneada(facturaId, 'confirmada', imagenPath)
    void logEvent('factura_escaneada')

    // Por receta_id, no por nombre — así sigue funcionando aunque el usuario haya renombrado
    // la receta después de haberla cotizado. Revisa TODOS los productos de la cotización, no
    // solo uno — una cotización puede tener varios (ej. hamburguesas + galletas).
    const idsRecetasAfectadas = recetasAfectadas.map((r) => r.id)
    const afectadas = cotizaciones
      .filter((c) => (c.estado === 'pendiente' || c.estado === 'rechazada') && c.items.some((it) => it.recetaId && idsRecetasAfectadas.includes(it.recetaId)))
      .map((c) => `${c.cliente} — ${c.producto}`)

    setResumen(comparacion)
    setCambiosPrecio(cambiosDePrecio)
    setCotizacionesAfectadas(afectadas)
    setConfirmando(false)
    setPaso('resumen')
    mostrarToast(<IconoOk />, 'Listo — tus insumos quedaron actualizados.')
  }

  async function deshacerTodo() {
    if (!facturaId) return
    setDeshaciendo(true)
    const ok = await deshacerFactura(facturaId)
    setDeshaciendo(false)
    if (!ok) { mostrarToast(<IconoAviso />, 'No pudimos deshacer el escaneo. Intenta de nuevo.'); return }
    mostrarToast(<IconoOk />, 'Deshecho — tus insumos volvieron a su precio anterior.')
    onVolver()
  }

  if (paso === 'elegir') {
    return (
      <>
        <button className="btn-atras-sub" onClick={onVolver}><IconoVolver />Insumos</button>
        <h2 className="titulo-seccion" style={{ fontSize: 19 }}>Escanear factura</h2>
        <p className="sub-seccion">Toma una foto de tu recibo de compra — la IA lee los productos y precios por ti.</p>
        <div className="vacio" style={{ marginTop: 20 }}>
          <div className="chip-icono" style={{ width: 48, height: 48, margin: '0 auto 12px' }}><IconoCamara /></div>
          <p>Elige una foto clara, con buena luz, de tu factura o recibo.</p>
        </div>
        <input ref={inputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
          onChange={(e) => alElegirArchivo(e.target.files?.[0])} />
        <input ref={inputGaleriaRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={(e) => alElegirArchivo(e.target.files?.[0])} />
        <button className="btn-cta" onClick={() => inputRef.current?.click()} style={{ marginBottom: 10 }}>Tomar foto →</button>
        <button className="btn-secundario" onClick={() => inputGaleriaRef.current?.click()}>Elegir de la galería</button>
        <Toast toast={toast} />
      </>
    )
  }

  if (paso === 'procesando') {
    return (
      <>
        <h2 className="titulo-seccion" style={{ fontSize: 19 }}>Leyendo tu factura…</h2>
        <div className="vacio"><p>Esto toma unos segundos.</p></div>
      </>
    )
  }

  if (paso === 'revisar') {
    return (
      <>
        <button className="btn-atras-sub" onClick={onVolver}><IconoVolver />Insumos</button>
        <h2 className="titulo-seccion" style={{ fontSize: 19 }}>Revisa lo que encontramos</h2>
        <p className="sub-seccion">Ajusta lo que haga falta antes de confirmar — nada se guarda todavía.</p>
        <p style={{ fontSize: 11.5, color: 'var(--text-2)', marginTop: -6, marginBottom: 12 }}>
          Esto lo leyó una inteligencia artificial y puede equivocarse — revísalo antes de confirmar.{' '}
          <a href="/aviso-ia" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-2)' }}>Más info</a>
        </p>
        <div className="nota-estimado" style={{ marginBottom: 14 }}>
          <IconoAviso />
          Si un producto ya existe en tu inventario, escribe exactamente el mismo nombre — así se junta solo con el que ya tienes, en vez de crear uno repetido.
        </div>
        {items.map((item, idx) => (
          <div className="tarjeta" key={idx} style={{ marginBottom: 12, opacity: item.omitir ? 0.5 : 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div className="fila-filtros" style={{ margin: 0 }}>
                {CATEGORIAS_FACTURA.map((c) => (
                  <button key={c.valor} type="button" className={`filtro-chip${item.categoria === c.valor ? ' activo' : ''}`}
                    onClick={() => actualizarItem(idx, { categoria: c.valor })}>{c.label}</button>
                ))}
              </div>
              <button type="button" aria-label={item.omitir ? 'Incluir este producto de nuevo' : 'Quitar este producto'} onClick={() => actualizarItem(idx, { omitir: !item.omitir })}
                style={{ flexShrink: 0, marginLeft: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, border: '1.5px solid var(--sunken)', color: item.omitir ? 'var(--accent)' : 'var(--error)' }}>
                {item.omitir ? <IconoDeshacer /> : <IconoQuitar />}
              </button>
            </div>
            {item.omitir && <p className="sub-seccion" style={{ marginTop: -4, marginBottom: 10 }}>Omitido — no se va a guardar. Toca el botón de nuevo para incluirlo.</p>}
            <div className="campo-2">
              <div className="campo">
                <label>Producto</label>
                <input value={item.producto} onChange={(e) => actualizarItem(idx, { producto: e.target.value })} />
              </div>
              <div className="campo">
                <label>Confianza</label>
                <p style={{ fontWeight: 700, color: item.confianza >= 0.8 ? 'var(--accent)' : 'var(--aviso)', paddingTop: 10 }}>
                  {Math.round(item.confianza * 100)}%
                </p>
              </div>
            </div>
            <div className="campo-2">
              <div className="campo">
                <label>Cantidad</label>
                <input type="number" value={item.cantidad || ''} onChange={(e) => actualizarItem(idx, { cantidad: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="campo">
                <label>Unidad</label>
                <select value={item.medida} onChange={(e) => actualizarItem(idx, { medida: e.target.value as ItemFactura['medida'] })}>
                  {(['kg', 'g', 'L', 'ml', 'libra', 'unidad', 'docena', 'paquete'] as UnidadInsumo[]).map((u) => (
                    <option key={u} value={u}>{etiquetaUnidad(u)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="campo">
              <label>Precio total de esta línea</label>
              <input type="number" value={item.precio || ''} onChange={(e) => actualizarItem(idx, { precio: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="campo">
              <label>¿A cuál de tus insumos corresponde?</label>
              <select
                value={item.crearNuevo ? '__nuevo__' : item.insumoId ?? '__nuevo__'}
                onChange={(e) => {
                  if (e.target.value === '__nuevo__') actualizarItem(idx, { crearNuevo: true, insumoId: null })
                  else actualizarItem(idx, { insumoId: e.target.value, crearNuevo: false })
                }}
              >
                <option value="__nuevo__">+ Crear insumo nuevo</option>
                {insumos.map((i) => <option key={i.id} value={i.id}>{i.nombre}</option>)}
              </select>
            </div>
          </div>
        ))}
        <button className="btn-cta" onClick={confirmarTodo} disabled={confirmando}>
          {confirmando ? 'Guardando…' : 'Confirmar y actualizar insumos →'}
        </button>
        <Toast toast={toast} />
      </>
    )
  }

  // paso === 'resumen'
  return (
    <>
      <h2 className="titulo-seccion" style={{ fontSize: 19 }}>Listo</h2>
      <p className="sub-seccion">Tus insumos ya quedaron al día.</p>
      {cambiosPrecio.length > 0 && (
        <div className="tarjeta" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, marginBottom: 10 }}>Insumos que cambiaron de precio</h3>
          {cambiosPrecio.map((c) => {
            const subio = c.precioDespues > c.precioAntes
            return (
              <div key={c.insumoId} className="fila-dato" style={{ marginBottom: 6 }}>
                <span>{c.nombre} <span style={{ color: 'var(--text-2)', fontWeight: 400 }}>({subio ? 'subió' : 'bajó'})</span></span>
                <span style={{ color: subio ? 'var(--error)' : 'var(--accent)', fontWeight: 700 }}>
                  {money(c.precioAntes)} → {money(c.precioDespues)} / {etiquetaUnidad(c.unidad)}
                </span>
              </div>
            )
          })}
        </div>
      )}
      {resumen.length > 0 && (
        <div className="tarjeta" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, marginBottom: 10 }}>Recetas que cambiaron de costo</h3>
          {resumen.map((r) => (
            <div key={r.insumoId} className="fila-dato" style={{ marginBottom: 6 }}>
              <span>{r.nombre}</span>
              <span style={{ color: r.costoDespues > r.costoAntes ? 'var(--error)' : 'var(--accent)', fontWeight: 700 }}>
                {Math.round(r.costoAntes).toLocaleString(LOCALE_MONEDA[moneda])} → {Math.round(r.costoDespues).toLocaleString(LOCALE_MONEDA[moneda])}
              </span>
            </div>
          ))}
        </div>
      )}
      {cotizacionesAfectadas.length > 0 && (
        <div className="aviso-precio" style={{ marginBottom: 16 }}>
          <div className="chip-icono aviso" style={{ width: 36, height: 36 }}><IconoAviso /></div>
          <div>
            <p><strong>Estas cotizaciones pendientes usan un insumo que acaba de cambiar de precio:</strong> {cotizacionesAfectadas.join(', ')}.</p>
            <p style={{ marginTop: 6, fontSize: 12.5 }}>No las tocamos solas — revísalas tú en Cotizaciones y decide si las actualizas.</p>
          </div>
        </div>
      )}
      <button className="btn-cta" onClick={onVolver}>Volver a Insumos →</button>
      <button className="btn-texto" onClick={deshacerTodo} disabled={deshaciendo} style={{ marginTop: 10 }}>
        {deshaciendo ? 'Deshaciendo…' : '¿Te equivocaste? Deshacer este escaneo'}
      </button>
      <Toast toast={toast} />
    </>
  )
}
