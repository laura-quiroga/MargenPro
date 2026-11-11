import { useState } from 'react'
import { etiquetaUnidad, formatearStock, nombreCantidadUnidad, stockBaseDesdeCantidad, stockEsBajo, useAppStore } from '../../lib/appStore'
import { Toast, useToast } from '../../components/Toast'
import type { CategoriaInsumo, UnidadInsumo } from '../../lib/types'
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

export default function Insumos() {
  const { insumos, setInsumos, recetas, money } = useAppStore()
  const { toast, mostrarToast } = useToast()
  const [vista, setVista] = useState<'lista' | 'nuevo' | 'detalle'>('lista')
  const [filtro, setFiltro] = useState<'todos' | CategoriaInsumo>('todos')
  const [detalleId, setDetalleId] = useState<number | null>(null)

  const [nombre, setNombre] = useState('')
  const [categoria, setCategoria] = useState<CategoriaInsumo>('ingrediente')
  const [unidad, setUnidad] = useState<UnidadInsumo>('kg')
  const [precio, setPrecio] = useState('')
  const [unidadesQueTrae, setUnidadesQueTrae] = useState('1')
  const [stockInicial, setStockInicial] = useState('0')

  const [cantidadCompra, setCantidadCompra] = useState('')
  const [precioNuevo, setPrecioNuevo] = useState('')

  const esPieza = unidad === 'unidad' || unidad === 'docena' || unidad === 'paquete'

  function abrirNuevo() {
    setNombre('')
    setCategoria('ingrediente')
    setUnidad('kg')
    setPrecio('')
    setUnidadesQueTrae('1')
    setStockInicial('0')
    setVista('nuevo')
  }

  function guardarInsumoManual() {
    const nombreOk = nombre.trim()
    if (!nombreOk) { mostrarToast(<IconoAviso />, 'Ponle un nombre al insumo antes de guardar.'); return }
    const precioNum = parseFloat(precio)
    if (!precioNum || precioNum <= 0) { mostrarToast(<IconoAviso />, 'Escribe cuánto pagaste por este insumo.'); return }
    const unidadesQueTraeNum = Math.max(1, parseFloat(unidadesQueTrae) || 1)
    const stockNum = stockBaseDesdeCantidad(unidad, Math.max(0, parseFloat(stockInicial) || 0))
    const siguienteId = insumos.length ? Math.max(...insumos.map((i) => i.id)) + 1 : 0
    setInsumos((prev) => [...prev, { id: siguienteId, nombre: nombreOk, unidad, precio: precioNum, unidadesQueTrae: unidadesQueTraeNum, categoria, stockDisponible: stockNum }])
    setVista('lista')
    mostrarToast(<IconoOk />, 'Insumo guardado — ya puedes usarlo en tus recetas.')
  }

  function abrirDetalle(id: number) {
    setDetalleId(id)
    setCantidadCompra('')
    setPrecioNuevo('')
    setVista('detalle')
  }

  const insumoDetalle = detalleId !== null ? insumos.find((i) => i.id === detalleId) : undefined

  function guardarCompra() {
    if (!insumoDetalle) return
    const cantidad = parseFloat(cantidadCompra)
    if (!cantidad || cantidad <= 0) { mostrarToast(<IconoAviso />, 'Escribe cuánto compraste esta vez.'); return }
    const precioNum = parseFloat(precioNuevo)
    const idDetalle = insumoDetalle.id
    setInsumos((prev) => prev.map((i) => {
      if (i.id !== idDetalle) return i
      const nuevoStock = (typeof i.stockDisponible === 'number' ? i.stockDisponible : 0) + stockBaseDesdeCantidad(i.unidad, cantidad)
      return { ...i, stockDisponible: nuevoStock, precio: precioNum > 0 ? precioNum : i.precio }
    }))
    setVista('lista')
    mostrarToast(<IconoOk />, 'Listo — tu stock quedó actualizado.')
  }

  if (vista === 'nuevo') {
    return (
      <>
        <button className="btn-atras-sub" onClick={() => setVista('lista')}><IconoVolver />Insumos</button>
        <h2 className="titulo-seccion" style={{ fontSize: 19 }}>Agregar insumo</h2>
        <div className="campo">
          <label>Nombre</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Harina de trigo" />
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
          <label>¿Cuántos {nombreCantidadUnidad(unidad)} tienes ahora?</label>
          <p className="ayuda-campo">Así la app te avisa cuando se te esté acabando. Si no lo sabes, puedes dejarlo en 0 y lo registras después.</p>
          <input type="number" value={stockInicial} onChange={(e) => setStockInicial(e.target.value)} placeholder="Ej: 5" />
        </div>
        <button className="btn-cta" onClick={guardarInsumoManual}>Guardar insumo →</button>
        <Toast toast={toast} />
      </>
    )
  }

  if (vista === 'detalle' && insumoDetalle) {
    const stockTxt = formatearStock(insumoDetalle)
    const bajo = !!stockTxt && stockEsBajo(insumoDetalle, recetas)
    return (
      <>
        <button className="btn-atras-sub" onClick={() => setVista('lista')}><IconoVolver />Insumos</button>
        <h2 className="titulo-seccion" style={{ fontSize: 19 }}>{insumoDetalle.nombre}</h2>
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
          {bajo && <p className="formula-ganancia" style={{ color: 'var(--aviso)', fontWeight: 700 }}>Se te está acabando — considera comprar más pronto.</p>}
        </div>
        <h3 style={{ fontSize: 14, marginBottom: 10 }}>Registrar una nueva compra</h3>
        <p className="sub-seccion" style={{ marginTop: -6 }}>Esto SUMA a lo que ya tienes — no lo reemplaza.</p>
        <div className="campo">
          <label>¿Cuántos {nombreCantidadUnidad(insumoDetalle.unidad)} compraste esta vez?</label>
          <input type="number" value={cantidadCompra} onChange={(e) => setCantidadCompra(e.target.value)} placeholder="Ej: 5" />
        </div>
        <div className="campo">
          <label>¿Cuánto pagaste por esto?</label>
          <input type="number" value={precioNuevo} onChange={(e) => setPrecioNuevo(e.target.value)} placeholder="Déjalo igual si el precio no cambió" />
        </div>
        <button className="btn-cta" onClick={guardarCompra}>Sumar a mi stock →</button>
        <Toast toast={toast} />
      </>
    )
  }

  const lista = filtro === 'todos' ? insumos : insumos.filter((i) => i.categoria === filtro)

  return (
    <>
      <h2 className="titulo-seccion">Tus insumos</h2>
      <p className="sub-seccion">Lo que compras para producir — con su precio real.</p>
      <button className="btn-cta" style={{ marginBottom: 10 }} onClick={abrirNuevo}>+ Agregar insumo</button>
      <div className="fila-filtros" style={{ marginTop: 16 }}>
        {CATEGORIAS.map((c) => (
          <button key={c.valor} className={`filtro-chip${filtro === c.valor ? ' activo' : ''}`} onClick={() => setFiltro(c.valor)}>{c.label}</button>
        ))}
      </div>
      {!lista.length ? (
        <div className="vacio"><p>Todavía no registras insumos en esta categoría.</p></div>
      ) : (
        <div>
          {lista.map((i) => {
            const stockTxt = formatearStock(i)
            const bajo = !!stockTxt && stockEsBajo(i, recetas)
            return (
              <div className="item-lista" key={i.id} onClick={() => abrirDetalle(i.id)} style={{ cursor: 'pointer' }}>
                <div className="chip-icono"><IconoInsumo /></div>
                <div className="info">
                  <div className="nombre">{i.nombre}</div>
                  <div className="meta">
                    por {etiquetaUnidad(i.unidad)}{i.unidadesQueTrae > 1 ? ` (${i.unidadesQueTrae} und.)` : ''}
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
