import { useState } from 'react'
import { convertirMedidaCompra, encontrarInsumoPorNombreExacto, etiquetaUnidad, formatearStock, medidasDeCompraPara, mismaFamiliaMedida, nombreCantidadUnidad, normalizarParaBuscar, precioPorUnidadDesdeCompra, stockBaseDesdeCantidad, stockEsBajo, useAppStore, valorInventario, valorStockInsumo } from '../../lib/appStore'
import type { Insumo } from '../../lib/types'
import { Toast, useToast } from '../../components/Toast'
import type { CategoriaInsumo, UnidadInsumo } from '../../lib/types'
import EscanearFactura from './EscanearFactura'
import './Insumos.css'

const CATEGORIAS: { valor: 'todos' | CategoriaInsumo; label: string }[] = [
  { valor: 'todos', label: 'Todos' },
  { valor: 'ingrediente', label: 'Ingredientes' },
  { valor: 'empaque', label: 'Empaques' },
  { valor: 'adicional', label: 'Adicionales' },
]

const UNIDADES: { valor: UnidadInsumo; label: string }[] = [
  { valor: 'kg', label: 'Kilo' },
  { valor: 'g', label: 'Gramo' },
  { valor: 'L', label: 'Litro' },
  { valor: 'ml', label: 'Mililitro' },
  { valor: 'libra', label: 'Libra' },
  { valor: 'unidad', label: 'Unidad / pieza' },
  { valor: 'docena', label: 'Docena' },
  { valor: 'paquete', label: 'Paquete' },
]

const IconoAviso = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4M12 17h.01" /><circle cx="12" cy="12" r="9" /></svg>
)
const IconoOk = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
)
const IconoVolver = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
)
const IconoInsumo = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" /></svg>
)
const IconoCamara = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h3l2-2h6l2 2h3v12H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
)
const IconoLapiz = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" /></svg>
)

function textoUltimaCompra(i: Insumo, money: (n: number) => string): string | null {
  if (!i.ultimaCompraCantidad || !i.ultimaCompraTotal) return null
  return `${i.ultimaCompraCantidad.toLocaleString('es-CO', { maximumFractionDigits: 2 })} ${etiquetaUnidad(i.ultimaCompraMedida ?? i.unidad)} · ${money(i.ultimaCompraTotal)}`
}

export default function Insumos() {
  const { insumos, cargandoInsumos, agregarInsumo, registrarCompraInsumo, actualizarNombreInsumo, eliminarInsumo, recetas, money } = useAppStore()
  const { toast, mostrarToast } = useToast()
  const [vista, setVista] = useState<'lista' | 'nuevo' | 'detalle' | 'factura'>('lista')
  const [filtro, setFiltro] = useState<'todos' | CategoriaInsumo>('todos')
  const [detalleId, setDetalleId] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const [nombre, setNombre] = useState('')
  const [sugerenciasAbiertas, setSugerenciasAbiertas] = useState(false)
  const [categoria, setCategoria] = useState<CategoriaInsumo>('ingrediente')
  const [unidad, setUnidad] = useState<UnidadInsumo>('kg')
  const [precio, setPrecio] = useState('')
  const [unidadesQueTrae, setUnidadesQueTrae] = useState('1')
  const [stockInicial, setStockInicial] = useState('')

  const [editandoNombre, setEditandoNombre] = useState(false)
  const [nombreEditado, setNombreEditado] = useState('')
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false)
  const [eliminando, setEliminando] = useState(false)

  const [cantidadCompra, setCantidadCompra] = useState('')
  const [medidaCompra, setMedidaCompra] = useState<UnidadInsumo>('kg')
  const [equivalenciaCompra, setEquivalenciaCompra] = useState('')
  const [precioNuevo, setPrecioNuevo] = useState('')

  const esPieza = unidad === 'unidad' || unidad === 'docena' || unidad === 'paquete'

  function abrirNuevo() {
    setNombre('')
    setCategoria('ingrediente')
    setUnidad('kg')
    setPrecio('')
    setUnidadesQueTrae('1')
    setStockInicial('')
    setVista('nuevo')
  }

  async function guardarInsumoManual() {
    const nombreOk = nombre.trim()
    if (!nombreOk) { mostrarToast(<IconoAviso />, 'Ponle un nombre al insumo antes de guardar.'); return }
    // No importa si lo escribieron en mayúscula, minúscula o con tildes distintas — si ya existe
    // ese insumo, NO se crea uno repetido: se manda directo a registrar la compra ahí.
    const existente = encontrarInsumoPorNombreExacto(insumos, nombreOk)
    if (existente) {
      mostrarToast(<IconoAviso />, `Ya tienes "${existente.nombre}" — te llevamos ahí para sumar esta compra.`)
      abrirDetalle(existente.id)
      return
    }
    const precioNum = parseFloat(precio)
    if (!precioNum || precioNum <= 0) { mostrarToast(<IconoAviso />, 'Escribe cuánto pagaste por este insumo.'); return }
    const unidadesQueTraeNum = Math.max(1, parseFloat(unidadesQueTrae) || 1)
    const stockNum = stockBaseDesdeCantidad(unidad, Math.max(0, parseFloat(stockInicial) || 0))
    setGuardando(true)
    const ok = await agregarInsumo({ nombre: nombreOk, unidad, precio: precioNum, unidadesQueTrae: unidadesQueTraeNum, categoria, stockDisponible: stockNum })
    setGuardando(false)
    if (!ok) { mostrarToast(<IconoAviso />, 'No pudimos guardar el insumo. Intenta de nuevo.'); return }
    setVista('lista')
    mostrarToast(<IconoOk />, 'Insumo guardado — ya puedes usarlo en tus recetas.')
  }

  function abrirDetalle(id: string) {
    setDetalleId(id)
    setCantidadCompra('')
    setPrecioNuevo('')
    setEquivalenciaCompra('')
    setEditandoNombre(false)
    setConfirmandoEliminar(false)
    const ins = insumos.find((i) => i.id === id)
    setMedidaCompra(ins ? ins.unidad : 'kg')
    setVista('detalle')
  }

  async function eliminarEsteInsumo() {
    if (!insumoDetalle) return
    setEliminando(true)
    const resultado = await eliminarInsumo(insumoDetalle.id)
    setEliminando(false)
    if (!resultado.ok) { mostrarToast(<IconoAviso />, resultado.error || 'No pudimos eliminar el insumo.'); setConfirmandoEliminar(false); return }
    setVista('lista')
    mostrarToast(<IconoOk />, 'Insumo eliminado.')
  }

  async function guardarNombreEditado() {
    if (!insumoDetalle) return
    const nombreOk = nombreEditado.trim()
    if (!nombreOk) { mostrarToast(<IconoAviso />, 'El nombre no puede quedar vacío.'); return }
    const otroIgual = encontrarInsumoPorNombreExacto(insumos.filter((i) => i.id !== insumoDetalle.id), nombreOk)
    if (otroIgual) { mostrarToast(<IconoAviso />, `Ya tienes otro insumo llamado "${otroIgual.nombre}" — usa un nombre distinto.`); return }
    setGuardando(true)
    const ok = await actualizarNombreInsumo(insumoDetalle.id, nombreOk)
    setGuardando(false)
    if (!ok) { mostrarToast(<IconoAviso />, 'No pudimos actualizar el nombre. Intenta de nuevo.'); return }
    setEditandoNombre(false)
    mostrarToast(<IconoOk />, 'Nombre actualizado.')
  }

  const insumoDetalle = detalleId !== null ? insumos.find((i) => i.id === detalleId) : undefined
  const opcionesMedida = insumoDetalle ? medidasDeCompraPara(insumoDetalle.unidad) : []
  const coincideFamilia = insumoDetalle ? mismaFamiliaMedida(medidaCompra, insumoDetalle.unidad) : true

  function cantidadEnUnidadDelInsumo(cantidad: number): number {
    if (!insumoDetalle) return cantidad
    if (coincideFamilia) return convertirMedidaCompra(cantidad, medidaCompra, insumoDetalle)
    return cantidad * (parseFloat(equivalenciaCompra) || 0)
  }

  async function guardarCompra() {
    if (!insumoDetalle) return
    const cantidadEscrita = parseFloat(cantidadCompra)
    if (!cantidadEscrita || cantidadEscrita <= 0) { mostrarToast(<IconoAviso />, 'Escribe cuánto compraste esta vez.'); return }
    if (!coincideFamilia && !(parseFloat(equivalenciaCompra) > 0)) { mostrarToast(<IconoAviso />, `Escribe a cuántos ${etiquetaUnidad(insumoDetalle.unidad)} equivale 1 ${etiquetaUnidad(medidaCompra)}.`); return }
    // El usuario puede registrar la compra en la medida que de verdad usó (ej. gramos aunque el
    // insumo se tase en kg, o paquetes/piezas aunque se tase en peso) — se convierte a la medida
    // propia del insumo solo para el cálculo.
    const cantidadEnUnidadInsumo = cantidadEnUnidadDelInsumo(cantidadEscrita)
    const totalEscrito = parseFloat(precioNuevo)
    const precioPorUnidad = totalEscrito > 0 ? precioPorUnidadDesdeCompra(insumoDetalle, cantidadEnUnidadInsumo, totalEscrito) : undefined
    // Si no escribió un precio nuevo (el precio no cambió), igual dejamos constancia de esta
    // compra con el precio que ya tenía, para que "tu última compra" siempre esté al día.
    const totalParaHistorial = totalEscrito > 0 ? totalEscrito : cantidadEnUnidadInsumo * insumoDetalle.precio
    setGuardando(true)
    const ok = await registrarCompraInsumo(insumoDetalle.id, stockBaseDesdeCantidad(insumoDetalle.unidad, cantidadEnUnidadInsumo), precioPorUnidad, { cantidad: cantidadEscrita, total: totalParaHistorial, medida: medidaCompra })
    setGuardando(false)
    if (!ok) { mostrarToast(<IconoAviso />, 'No pudimos registrar la compra. Intenta de nuevo.'); return }
    setVista('lista')
    if (precioPorUnidad && precioPorUnidad !== insumoDetalle.precio) {
      const subio = precioPorUnidad > insumoDetalle.precio
      mostrarToast(<IconoOk />, `Listo — tu stock quedó actualizado. El precio ${subio ? 'subió' : 'bajó'}: ${money(insumoDetalle.precio)} → ${money(precioPorUnidad)} por ${etiquetaUnidad(insumoDetalle.unidad)}.`)
    } else {
      mostrarToast(<IconoOk />, 'Listo — tu stock quedó actualizado.')
    }
  }

  const cantidadCompraNum = parseFloat(cantidadCompra) || 0
  const totalPagadoNum = parseFloat(precioNuevo) || 0
  const previewPrecioNuevo = insumoDetalle && cantidadCompraNum > 0 && totalPagadoNum > 0 && (coincideFamilia || parseFloat(equivalenciaCompra) > 0)
    ? precioPorUnidadDesdeCompra(insumoDetalle, cantidadEnUnidadDelInsumo(cantidadCompraNum), totalPagadoNum)
    : null

  if (vista === 'factura') {
    return <EscanearFactura onVolver={() => setVista('lista')} />
  }

  if (vista === 'nuevo') {
    const textoBuscado = normalizarParaBuscar(nombre.trim())
    const sugerenciasNombre = textoBuscado ? insumos.filter((i) => normalizarParaBuscar(i.nombre).includes(textoBuscado)).slice(0, 8) : []
    return (
      <>
        <button className="btn-atras-sub" onClick={() => setVista('lista')}><IconoVolver />Insumos</button>
        <h2 className="titulo-seccion" style={{ fontSize: 19 }}>Agregar insumo</h2>
        <div className="campo" style={{ position: 'relative' }}>
          <label>Nombre</label>
          <input value={nombre}
            onFocus={() => setSugerenciasAbiertas(true)}
            onBlur={() => setTimeout(() => setSugerenciasAbiertas(false), 150)}
            onChange={(e) => { setNombre(e.target.value); setSugerenciasAbiertas(true) }}
            placeholder="Ej: Harina de trigo" />
          {sugerenciasAbiertas && textoBuscado && (
            <div className="lista-sugerencias">
              {sugerenciasNombre.length ? sugerenciasNombre.map((i) => (
                <button key={i.id} type="button"
                  onMouseDown={() => { setSugerenciasAbiertas(false); mostrarToast(<IconoAviso />, `Ya tienes "${i.nombre}" — te llevamos ahí para sumar esta compra.`); abrirDetalle(i.id) }}>
                  {i.nombre}
                </button>
              )) : <div className="sin-resultados">No tienes ningún insumo parecido — este sí sería nuevo.</div>}
            </div>
          )}
        </div>
        <div className="campo">
          <label>Tipo</label>
          <select value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaInsumo)}>
            <option value="ingrediente">Ingrediente</option>
            <option value="empaque">Empaque</option>
            <option value="adicional">Adicional (salsas, toppings, decoración)</option>
          </select>
        </div>
        <div className="campo-2">
          <div className="campo">
            <label>Unidad de compra</label>
            <select value={unidad} onChange={(e) => setUnidad(e.target.value as UnidadInsumo)}>
              {UNIDADES.map((u) => <option key={u.valor} value={u.valor}>{u.label}</option>)}
            </select>
          </div>
          <div className="campo">
            <label>Precio que pagaste</label>
            <input type="number" value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="Ej: 12000" />
          </div>
        </div>
        {esPieza && (
          <div className="campo">
            <label>¿Cuántas piezas trae esa compra?</label>
            <input type="number" value={unidadesQueTrae} onChange={(e) => setUnidadesQueTrae(e.target.value)} />
          </div>
        )}
        <div className="campo">
          <label>¿Cuántos {nombreCantidadUnidad(unidad)} compraste esta vez?</label>
          <p className="ayuda-campo">Así la app te avisa cuando se te esté acabando. Si no lo sabes, puedes dejarlo vacío y lo registras después.</p>
          <input type="number" value={stockInicial} onChange={(e) => setStockInicial(e.target.value)} placeholder="Ej: 5" />
        </div>
        <button className="btn-cta" onClick={guardarInsumoManual} disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar insumo →'}</button>
        <Toast toast={toast} />
      </>
    )
  }

  if (vista === 'detalle' && insumoDetalle) {
    const stockTxt = formatearStock(insumoDetalle)
    const bajo = !!stockTxt && stockEsBajo(insumoDetalle, recetas)
    const ultimaCompraTxt = textoUltimaCompra(insumoDetalle, money)
    return (
      <>
        <button className="btn-atras-sub" onClick={() => setVista('lista')}><IconoVolver />Insumos</button>
        {editandoNombre ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 10 }}>
            <div className="campo" style={{ margin: 0, flex: 1 }}>
              <input value={nombreEditado} onChange={(e) => setNombreEditado(e.target.value)} autoFocus />
            </div>
            <button className="btn-secundario" style={{ margin: 0, width: 'auto', flexShrink: 0 }} onClick={guardarNombreEditado} disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <h2 className="titulo-seccion" style={{ fontSize: 19, marginBottom: 0 }}>{insumoDetalle.nombre}</h2>
            <button aria-label="Editar nombre" onClick={() => { setNombreEditado(insumoDetalle.nombre); setEditandoNombre(true) }}
              style={{ background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer', padding: 4, display: 'flex' }}>
              <IconoLapiz />
            </button>
          </div>
        )}
        <div className="tarjeta" style={{ marginBottom: 16 }}>
          <div className="campo-2">
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-2)' }}>Precio actual</p>
              <p style={{ fontWeight: 800, fontSize: 17 }}>{money(insumoDetalle.precio)} / {etiquetaUnidad(insumoDetalle.unidad)}</p>
            </div>
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-2)' }}>Tienes ahora</p>
              <p style={{ fontWeight: 800, fontSize: 17 }}>{stockTxt || 'sin registrar'}</p>
            </div>
          </div>
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--sunken)' }}>
            <p style={{ fontSize: 12, color: 'var(--text-2)' }}>Valor total de lo que tienes</p>
            <p style={{ fontWeight: 800, fontSize: 17 }}>{money(valorStockInsumo(insumoDetalle))}</p>
          </div>
          {ultimaCompraTxt && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--sunken)' }}>
              <p style={{ fontSize: 12, color: 'var(--text-2)' }}>Tu última compra</p>
              <p style={{ fontWeight: 800, fontSize: 17 }}>{ultimaCompraTxt}</p>
            </div>
          )}
          {bajo && <p className="formula-ganancia" style={{ color: 'var(--aviso)', fontWeight: 700 }}>Se te está acabando — considera comprar más pronto.</p>}
        </div>
        <h3 style={{ fontSize: 14, marginBottom: 10 }}>Registrar una nueva compra</h3>
        <p className="sub-seccion" style={{ marginTop: -6 }}>Esto SUMA a lo que ya tienes — no lo reemplaza.</p>
        <div className="campo-2">
          <div className="campo">
            <label>¿Cuánto compraste esta vez?</label>
            <input type="number" value={cantidadCompra} onChange={(e) => setCantidadCompra(e.target.value)} placeholder="Ej: 500" />
          </div>
          <div className="campo">
            <label>Medida</label>
            <select value={medidaCompra} onChange={(e) => { setMedidaCompra(e.target.value as UnidadInsumo); setEquivalenciaCompra('') }}>
              {opcionesMedida.map((m) => <option key={m} value={m}>{etiquetaUnidad(m)}</option>)}
            </select>
          </div>
        </div>
        {!coincideFamilia && (
          <div className="campo">
            <label>¿A cuántos {etiquetaUnidad(insumoDetalle.unidad)} equivale 1 {etiquetaUnidad(medidaCompra)}?</label>
            <p className="ayuda-campo">Tu insumo se mide en {etiquetaUnidad(insumoDetalle.unidad)} — como compraste por {etiquetaUnidad(medidaCompra)}, dinos la equivalencia para calcular bien el costo.</p>
            <input type="number" value={equivalenciaCompra} onChange={(e) => setEquivalenciaCompra(e.target.value)} placeholder="Ej: 0.5" />
          </div>
        )}
        <div className="campo">
          <label>¿Cuánto pagaste por esto?</label>
          <p className="ayuda-campo">El total que pagaste por esta compra — la app calcula sola cuánto te sale por {etiquetaUnidad(insumoDetalle.unidad)}.</p>
          <input type="number" value={precioNuevo} onChange={(e) => setPrecioNuevo(e.target.value)} placeholder="Déjalo vacío si el precio no cambió" />
        </div>
        {previewPrecioNuevo !== null && (
          <p className="formula-ganancia" style={{ marginTop: -10, marginBottom: 16, fontWeight: 700, color: previewPrecioNuevo === insumoDetalle.precio ? 'var(--text-2)' : previewPrecioNuevo > insumoDetalle.precio ? 'var(--error)' : 'var(--accent)' }}>
            Eso es {money(previewPrecioNuevo)} por {etiquetaUnidad(insumoDetalle.unidad)} — antes {money(insumoDetalle.precio)}
            {previewPrecioNuevo === insumoDetalle.precio ? ' (sigue igual).' : previewPrecioNuevo > insumoDetalle.precio ? ' (subió).' : ' (bajó).'}
          </p>
        )}
        <button className="btn-cta" onClick={guardarCompra} disabled={guardando}>{guardando ? 'Guardando…' : 'Sumar a mi stock →'}</button>
        {confirmandoEliminar ? (
          <div className="tarjeta" style={{ marginTop: 16, borderColor: 'rgb(var(--error-tint)/.4)' }}>
            <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>¿Eliminar "{insumoDetalle.nombre}" para siempre?</p>
            <p className="ayuda-campo" style={{ marginBottom: 12 }}>Esto no se puede deshacer. Si lo usas en alguna receta, no te dejaremos eliminarlo — primero tendrías que quitarlo de ahí.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-secundario" style={{ margin: 0, width: 'auto', flex: 1 }} onClick={() => setConfirmandoEliminar(false)}>Cancelar</button>
              <button className="btn-secundario" style={{ margin: 0, width: 'auto', flex: 1, borderColor: 'rgb(var(--error-tint)/.4)', color: 'var(--error)' }} onClick={eliminarEsteInsumo} disabled={eliminando}>{eliminando ? 'Eliminando…' : 'Sí, eliminar'}</button>
            </div>
          </div>
        ) : (
          <button className="btn-texto" style={{ marginTop: 10, color: 'var(--error)' }} onClick={() => setConfirmandoEliminar(true)}>Eliminar este insumo</button>
        )}
        <Toast toast={toast} />
      </>
    )
  }

  const lista = (filtro === 'todos' ? insumos : insumos.filter((i) => i.categoria === filtro))
    .slice()
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

  const insumosBajos = insumos.filter((i) => !!formatearStock(i) && stockEsBajo(i, recetas))

  return (
    <>
      <h2 className="titulo-seccion">Tus insumos</h2>
      <p className="sub-seccion">Lo que compras para producir — con su precio real.</p>
      {insumosBajos.length > 0 && (
        <div className="aviso-precio">
          <div className="chip-icono aviso" style={{ width: 36, height: 36 }}><IconoAviso /></div>
          <div>
            <p>
              <strong>Se te {insumosBajos.length === 1 ? 'está acabando' : 'están acabando'}:</strong>{' '}
              {insumosBajos.map((i) => i.nombre).join(', ')}.
            </p>
          </div>
        </div>
      )}
      {!cargandoInsumos && insumos.length > 0 && (
        <div className="tarjeta" style={{ marginBottom: 14, padding: '12px 16px' }}>
          <p style={{ fontSize: 12, color: 'var(--text-2)' }}>Tienes invertido ahora</p>
          <p style={{ fontWeight: 800, fontSize: 20 }}>{money(valorInventario(insumos))} en insumos</p>
        </div>
      )}
      <button className="btn-cta" style={{ marginBottom: 10 }} onClick={abrirNuevo}>+ Agregar insumo</button>
      <button className="btn-secundario" style={{ marginBottom: 10 }} onClick={() => setVista('factura')}><IconoCamara />Escanear factura</button>
      <div className="fila-filtros" style={{ marginTop: 16 }}>
        {CATEGORIAS.map((c) => (
          <button key={c.valor} className={`filtro-chip${filtro === c.valor ? ' activo' : ''}`} onClick={() => setFiltro(c.valor)}>{c.label}</button>
        ))}
      </div>
      {cargandoInsumos ? (
        <div className="vacio"><p>Cargando tus insumos…</p></div>
      ) : !lista.length ? (
        <div className="vacio"><p>Todavía no registras insumos en esta categoría.</p></div>
      ) : (
        <div>
          {lista.map((i) => {
            const stockTxt = formatearStock(i)
            const bajo = !!stockTxt && stockEsBajo(i, recetas)
            const ultimaCompraTxt = textoUltimaCompra(i, money)
            return (
              <div className="item-lista" key={i.id} onClick={() => abrirDetalle(i.id)} style={{ cursor: 'pointer' }}>
                <div className="chip-icono"><IconoInsumo /></div>
                <div className="info">
                  <div className="nombre">{i.nombre}</div>
                  <div className="meta">
                    {ultimaCompraTxt ? `Última compra: ${ultimaCompraTxt}` : `por ${etiquetaUnidad(i.unidad)}${i.unidadesQueTrae > 1 ? ` (${i.unidadesQueTrae} und.)` : ''}`}
                    {stockTxt && <> · <span style={bajo ? { color: 'var(--aviso)', fontWeight: 700 } : undefined}>quedan {stockTxt}{bajo ? ' — se está acabando' : ''}</span></>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      <Toast toast={toast} />
    </>
  )
}
