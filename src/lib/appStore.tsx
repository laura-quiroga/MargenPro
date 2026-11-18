import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ConfigNegocio, Cotizacion, Insumo, InsumoUsado, ItemCotizacion, Moneda, Receta, UnidadInsumo } from './types'
import { SIMBOLOS_MONEDA } from './types'
import { calcularCostoReceta, costoPorUnidadBase } from './costeo'
import { supabase } from './supabaseClient'

export interface UltimaCompra { cantidad: number; total: number; medida: UnidadInsumo }

function filaAInsumo(fila: Record<string, unknown>): Insumo {
  return {
    id: fila.id as string,
    nombre: fila.nombre as string,
    unidad: fila.unidad as Insumo['unidad'],
    precio: Number(fila.precio),
    unidadesQueTrae: Number(fila.unidades_que_trae),
    categoria: fila.categoria as Insumo['categoria'],
    stockDisponible: fila.stock_disponible === null || fila.stock_disponible === undefined ? undefined : Number(fila.stock_disponible),
    ultimaCompraCantidad: fila.ultima_compra_cantidad === null || fila.ultima_compra_cantidad === undefined ? undefined : Number(fila.ultima_compra_cantidad),
    ultimaCompraTotal: fila.ultima_compra_total === null || fila.ultima_compra_total === undefined ? undefined : Number(fila.ultima_compra_total),
    ultimaCompraMedida: fila.ultima_compra_medida ? (fila.ultima_compra_medida as Insumo['unidad']) : undefined,
  }
}

function ordenarInsumos(lista: Insumo[]): Insumo[] {
  return [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
}

function filaARecetaBase(fila: Record<string, unknown>) {
  return {
    id: fila.id as string,
    nombre: fila.nombre as string,
    margen: Number(fila.margen),
    horas: Number(fila.horas),
    unidades: Number(fila.unidades),
  }
}

export function etiquetaUnidad(u: UnidadInsumo): string {
  return { kg: 'kg', g: 'g', L: 'L', ml: 'ml', libra: 'lb', unidad: 'c/u', docena: 'docena', paquete: 'paquete' }[u] || u
}

/** "Cuánto compraste/tienes" (en la unidad que el usuario eligió) a la unidad BASE de stock
 * que ya usan las recetas: gramos para kg, mililitros para L, piezas para todo lo demás. */
export function stockBaseDesdeCantidad(unidad: UnidadInsumo, cantidad: number): number {
  return unidad === 'kg' || unidad === 'L' ? cantidad * 1000 : cantidad
}

/** TODAS las medidas disponibles al registrar una compra — a elección libre del usuario, como
 * ya pasa al elegir medida de insumo en una receta: no todo se compra en kg/g, puede venir en
 * litros, mililitros, por paquete, por unidad... */
export function medidasDeCompraPara(_unidadInsumo: UnidadInsumo): UnidadInsumo[] {
  return ['kg', 'g', 'L', 'ml', 'libra', 'unidad', 'docena', 'paquete']
}

type FamiliaMedida = 'peso' | 'volumen' | 'pieza'
function familiaDeUnidad(u: UnidadInsumo): FamiliaMedida {
  if (u === 'kg' || u === 'g' || u === 'libra') return 'peso'
  if (u === 'L' || u === 'ml') return 'volumen'
  return 'pieza'
}

/** Si dos medidas son de la misma familia física (peso/volumen/pieza), se pueden convertir
 * solas; si no, hace falta que el usuario dé la equivalencia a mano (ej. "1 paquete = 500 g"). */
export function mismaFamiliaMedida(a: UnidadInsumo, b: UnidadInsumo): boolean {
  return familiaDeUnidad(a) === familiaDeUnidad(b)
}

const GRAMOS_POR_MEDIDA: Partial<Record<UnidadInsumo, number>> = { kg: 1000, g: 1, libra: 453.592, L: 1000, ml: 1 }

function piezasPorUnidad(u: UnidadInsumo, unidadesQueTrae: number): number {
  if (u === 'docena') return 12
  if (u === 'paquete') return unidadesQueTrae || 1
  return 1
}

/** Convierte una cantidad comprada en CUALQUIER medida de peso/volumen/pieza a la medida propia
 * del insumo — para que el usuario pueda registrar la compra tal como la hizo (ej. "500 g" o
 * "2 paquetes") aunque el insumo se tase distinto. Solo funciona dentro de la MISMA familia
 * física — si no (`mismaFamiliaMedida` da false), hace falta la equivalencia a mano. */
export function convertirMedidaCompra(cantidad: number, medidaElegida: UnidadInsumo, insumo: Pick<Insumo, 'unidad' | 'unidadesQueTrae'>): number {
  const unidadInsumo = insumo.unidad
  if (!mismaFamiliaMedida(medidaElegida, unidadInsumo)) return cantidad
  if (familiaDeUnidad(unidadInsumo) === 'pieza') {
    const piezasElegida = piezasPorUnidad(medidaElegida, insumo.unidadesQueTrae)
    const piezasInsumo = piezasPorUnidad(unidadInsumo, insumo.unidadesQueTrae)
    return (cantidad * piezasElegida) / piezasInsumo
  }
  const factorElegida = GRAMOS_POR_MEDIDA[medidaElegida] ?? 1
  const factorInsumo = GRAMOS_POR_MEDIDA[unidadInsumo] ?? 1
  return (cantidad * factorElegida) / factorInsumo
}

/** Convierte el TOTAL pagado en una compra nueva al precio por UNA unidad de compra — mismo
 * significado que ya usa `Insumo.precio` (precio por kg/L/g/ml/libra, o por paquete completo
 * si se compra por pieza/docena/paquete). Ej: insumo por kg, compraste 2kg y pagaste $10.000 →
 * precio por kg = 5.000. Insumo "caja x 6", compraste 12 piezas y pagaste $9.000 → precio por
 * caja = (9.000/12)×6 = 4.500. */
export function precioPorUnidadDesdeCompra(insumo: Pick<Insumo, 'unidad' | 'unidadesQueTrae'>, cantidadComprada: number, totalPagado: number): number {
  if (!cantidadComprada || cantidadComprada <= 0) return totalPagado
  const precioPorUnidadMinima = totalPagado / cantidadComprada
  const esPieza = insumo.unidad === 'unidad' || insumo.unidad === 'docena' || insumo.unidad === 'paquete'
  return esPieza ? precioPorUnidadMinima * (insumo.unidadesQueTrae || 1) : precioPorUnidadMinima
}

/** Cuánto vale ahora mismo lo que tienes guardado de un insumo (precio por unidad × stock). */
export function valorStockInsumo(ins: Pick<Insumo, 'precio' | 'unidad' | 'unidadesQueTrae' | 'stockDisponible'>): number {
  if (typeof ins.stockDisponible !== 'number') return 0
  return costoPorUnidadBase(ins.precio, ins.unidad, ins.unidadesQueTrae) * ins.stockDisponible
}

/** Cuánto tienes invertido en TODOS tus insumos ahora mismo. */
export function valorInventario(insumos: Insumo[]): number {
  return insumos.reduce((acc, i) => acc + valorStockInsumo(i), 0)
}

/** Para comparar nombres sin que mayúsculas/minúsculas o tildes hagan que algo parezca
 * distinto cuando es lo mismo (ej. buscar insumos, evitar duplicados). */
export function normalizarParaBuscar(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

/** ¿Ya existe un insumo con ESTE nombre exacto (sin importar mayúsculas/tildes)? Para no crear
 * duplicados sin querer (ej. "Cebolla" y "cebolla" terminando como 2 insumos distintos). */
export function encontrarInsumoPorNombreExacto(insumos: Insumo[], nombre: string): Insumo | undefined {
  const normalizado = normalizarParaBuscar(nombre)
  return insumos.find((i) => normalizarParaBuscar(i.nombre) === normalizado)
}

export function nombreCantidadUnidad(unidad: UnidadInsumo): string {
  switch (unidad) {
    case 'kg': return 'kilos'
    case 'g': return 'gramos'
    case 'L': return 'litros'
    case 'ml': return 'mililitros'
    case 'libra': return 'libras'
    default: return 'piezas individuales'
  }
}

export function formatearStock(ins: Insumo): string | null {
  if (typeof ins.stockDisponible !== 'number') return null
  if (ins.unidad === 'kg' || ins.unidad === 'L') {
    return (ins.stockDisponible / 1000).toLocaleString('es-CO', { maximumFractionDigits: 2 }) + ' ' + etiquetaUnidad(ins.unidad)
  }
  if (ins.unidad === 'g' || ins.unidad === 'ml') {
    return Math.round(ins.stockDisponible) + ' ' + etiquetaUnidad(ins.unidad)
  }
  return Math.round(ins.stockDisponible) + ' piezas'
}

export interface MesMock {
  label: string
  gasto: number
  esMesActual?: boolean
  ingreso?: number
  vendidas?: number
}

function fechaRelativa(iso: string): string {
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (dias <= 0) return 'hoy'
  if (dias === 1) return 'hace 1 día'
  return `hace ${dias} días`
}

function filaACotizacion(fila: Record<string, unknown>, filasItems: Record<string, unknown>[] = []): Cotizacion {
  const recetaId = fila.receta_id ? (fila.receta_id as string) : undefined
  const unidadesCotizadas = fila.unidades_cotizadas === null || fila.unidades_cotizadas === undefined ? undefined : Number(fila.unidades_cotizadas)
  const monto = Number(fila.monto)
  const producto = fila.producto as string
  // Las cotizaciones de antes de esta tabla no tienen filas en cotizacion_items — se arman con
  // UN solo ítem sintético a partir de sus propios campos, para que el resto del código (deshacer
  // inventario, el aviso de insumos que cambiaron de precio) no tenga que distinguir casos.
  const items: ItemCotizacion[] = filasItems.length
    ? filasItems.map((it) => ({
        recetaId: it.receta_id ? (it.receta_id as string) : undefined,
        producto: it.producto as string,
        cantidad: Number(it.cantidad),
        monto: Number(it.monto),
      }))
    : [{ recetaId, producto, cantidad: unidadesCotizadas ?? 1, monto }]
  return {
    id: fila.id as string,
    cliente: fila.cliente as string,
    producto,
    monto,
    estado: fila.estado as Cotizacion['estado'],
    fecha: fechaRelativa(fila.created_at as string),
    createdAt: fila.created_at as string,
    vendidaEn: fila.vendida_en ? (fila.vendida_en as string) : undefined,
    recetaId,
    unidadesCotizadas,
    items,
  }
}

const MESES_INICIALES: MesMock[] = [
  { label: 'Noviembre 2026', gasto: 120000, esMesActual: true },
  { label: 'Octubre 2026', ingreso: 177500, gasto: 210000, vendidas: 4 },
]

interface AppContextValue {
  insumos: Insumo[]
  recetas: Receta[]
  cargandoRecetas: boolean
  guardarRecetaNueva: (datos: Omit<Receta, 'id'>) => Promise<boolean>
  actualizarRecetaExistente: (id: string, datos: Omit<Receta, 'id'>) => Promise<boolean>
  cotizaciones: Cotizacion[]
  cargandoCotizaciones: boolean
  crearCotizacion: (datos: { cliente: string; telefono?: string; items: ItemCotizacion[] }) => Promise<boolean>
  cambiarEstadoCotizacion: (id: string, nuevoEstado: Cotizacion['estado']) => Promise<boolean>
  cfg: ConfigNegocio
  modoCalculo: 'simple' | 'real'
  moneda: Moneda
  mesesMock: MesMock[]
  mesActualIdx: number
  setMesActualIdx: React.Dispatch<React.SetStateAction<number>>
  /** Cuánto se ha gastado de verdad en insumos ESTE mes (suma real de compras registradas,
   * manuales y por factura) — reemplaza el número fijo que había antes en Panorama. */
  gastoMesActual: number
  money: (n: number) => string
  costear: (insumosUsados: Receta['insumosUsados'], margen: number, horas: number, unidades: number) => ReturnType<typeof calcularCostoReceta>
  /** Para cotizaciones cuando el usuario SÍ quiere incluir sus gastos fijos/variables —
   * sin importar el modo elegido en Ajustes, para poder comparar a propósito con/sin ellos. */
  costearReal: (insumosUsados: Receta['insumosUsados'], margen: number, horas: number, unidades: number) => ReturnType<typeof calcularCostoReceta>
  /** Lo mismo pero forzando el cálculo SIMPLE — para cuando el usuario elige cotizar sin sus
   * gastos fijos/variables, sin importar el modo elegido en Ajustes. */
  costearSimple: (insumosUsados: Receta['insumosUsados'], margen: number, horas: number, unidades: number) => ReturnType<typeof calcularCostoReceta>
  /** Descuenta (signo -1) o devuelve (signo +1) del inventario los insumos de TODOS los
   * productos de la cotización vendida/corregida — una cotización puede tener varios. */
  ajustarInventarioPorVenta: (items: ItemCotizacion[], signo: 1 | -1) => string[]
  cargandoInsumos: boolean
  /** Guarda un insumo nuevo en Supabase. Devuelve el insumo creado (con su id real) o null si falló. */
  agregarInsumo: (datos: Omit<Insumo, 'id'>) => Promise<Insumo | null>
  /** Registra una compra: suma al stock, opcionalmente actualiza el precio, y deja constancia
   * de cuánto se compró y pagó esta vez (para mostrar "tu última compra"). */
  registrarCompraInsumo: (id: string, stockSumado: number, precioNuevo?: number, ultimaCompra?: UltimaCompra) => Promise<boolean>
  /** Corrige el nombre de un insumo ya guardado (ej. un error de tipeo) — no crea uno nuevo. */
  actualizarNombreInsumo: (id: string, nuevoNombre: string) => Promise<boolean>
  /** Borra un insumo para siempre. Si está en uso en alguna receta, la base de datos lo rechaza
   * a propósito (no se puede deshacer una receta rota) — se devuelve un mensaje claro. */
  eliminarInsumo: (id: string) => Promise<{ ok: boolean; error?: string }>
  confirmarItemFactura: (insumoId: string, textoFactura: string, precioNuevo: number, stockSumado: number, facturaId: string, ultimaCompra?: UltimaCompra) => Promise<boolean>
  crearInsumoDesdeFactura: (datos: Omit<Insumo, 'id'>, textoFactura: string) => Promise<boolean>
  cerrarFacturaEscaneada: (facturaId: string, estado: 'confirmada' | 'descartada', imagenPath: string | null) => Promise<void>
  deshacerFactura: (facturaId: string) => Promise<boolean>
  logoNegocio: string | null
  nombreNegocio: string
  lineaAtencion: string
  cargandoConfig: boolean
  /** Guarda TODA la configuración del negocio de una vez en Supabase (reemplaza el guardado
   * anterior en localStorage — así no se pierde al cambiar de aparato o borrar el navegador). */
  guardarConfigNegocio: (datos: { cfg: ConfigNegocio; modoCalculo: 'simple' | 'real'; moneda: Moneda; nombreNegocio: string; lineaAtencion: string; logoNegocio: string | null }) => Promise<boolean>
}

const AppContext = createContext<AppContextValue | null>(null)

function umbralStockBajo(ins: Insumo, recetas: Receta[]): number {
  let usoTipico = 0
  recetas.forEach((r) => {
    r.insumosUsados.forEach((u) => {
      if (u.insumoId === ins.id) usoTipico = Math.max(usoTipico, u.cantidadGramosOPiezas)
    })
  })
  if (usoTipico > 0) return usoTipico
  return ins.unidad === 'kg' || ins.unidad === 'g' || ins.unidad === 'L' || ins.unidad === 'ml' ? 200 : 2
}

export function stockEsBajo(ins: Insumo, recetas: Receta[]): boolean {
  return typeof ins.stockDisponible === 'number' && ins.stockDisponible <= umbralStockBajo(ins, recetas)
}

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [cargandoInsumos, setCargandoInsumos] = useState(true)
  const [recetas, setRecetas] = useState<Receta[]>([])
  const [cargandoRecetas, setCargandoRecetas] = useState(true)
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([])
  const [cargandoCotizaciones, setCargandoCotizaciones] = useState(true)
  const [cfg, setCfg] = useState<ConfigNegocio>({ fijoPct: 20, variablePct: 0, valorHora: 8000 })
  const [modoCalculo, setModoCalculo] = useState<'simple' | 'real'>('simple')
  const [moneda, setMoneda] = useState<Moneda>('COP')
  const [mesActualIdx, setMesActualIdx] = useState(0)
  const [logoNegocio, setLogoNegocioState] = useState<string | null>(null)
  const [nombreNegocio, setNombreNegocioState] = useState<string>('MargenPro')
  const [lineaAtencion, setLineaAtencionState] = useState<string>('')
  const [cargandoConfig, setCargandoConfig] = useState(true)
  const [comprasMes, setComprasMes] = useState<{ total: number }[]>([])

  useEffect(() => {
    let activo = true
    async function cargarInsumos() {
      const { data, error } = await supabase.from('insumos').select('*')
      if (!activo) return
      if (!error && data) setInsumos(ordenarInsumos(data.map(filaAInsumo)))
      setCargandoInsumos(false)
    }
    async function cargarRecetas() {
      const { data: recetasData, error } = await supabase.from('recetas').select('*')
      if (!activo) return
      if (error || !recetasData) { setCargandoRecetas(false); return }
      const ids = recetasData.map((r) => r.id)
      const usosPorReceta: Record<string, InsumoUsado[]> = {}
      if (ids.length) {
        const { data: usos } = await supabase.from('receta_insumos').select('*').in('receta_id', ids)
        usos?.forEach((u) => {
          const lista = usosPorReceta[u.receta_id] ?? (usosPorReceta[u.receta_id] = [])
          lista.push({ insumoId: u.insumo_id, cantidadGramosOPiezas: Number(u.cantidad_base) })
        })
      }
      if (!activo) return
      setRecetas(recetasData.map((r) => ({ ...filaARecetaBase(r), insumosUsados: usosPorReceta[r.id] ?? [] })))
      setCargandoRecetas(false)
    }
    async function cargarCotizaciones() {
      const { data, error } = await supabase.from('cotizaciones').select('*').order('created_at', { ascending: false })
      if (!activo) return
      if (error || !data) { setCargandoCotizaciones(false); return }
      const ids = data.map((c) => c.id)
      const itemsPorCotizacion: Record<string, Record<string, unknown>[]> = {}
      if (ids.length) {
        const { data: items } = await supabase.from('cotizacion_items').select('*').in('cotizacion_id', ids)
        items?.forEach((it) => {
          const lista = itemsPorCotizacion[it.cotizacion_id] ?? (itemsPorCotizacion[it.cotizacion_id] = [])
          lista.push(it)
        })
      }
      if (!activo) return
      setCotizaciones(data.map((c) => filaACotizacion(c, itemsPorCotizacion[c.id] ?? [])))
      setCargandoCotizaciones(false)
    }
    async function cargarConfig() {
      const { data } = await supabase.from('config_negocio').select('*').maybeSingle()
      if (!activo) return
      if (data) {
        setCfg({ fijoPct: Number(data.fijo_pct), variablePct: Number(data.variable_pct), valorHora: Number(data.valor_hora) })
        setModoCalculo(data.modo_calculo as 'simple' | 'real')
        setMoneda(data.moneda as Moneda)
        setNombreNegocioState(data.nombre_negocio as string)
        setLineaAtencionState((data.linea_atencion as string) ?? '')
        setLogoNegocioState((data.logo_negocio_url as string) ?? null)
      }
      setCargandoConfig(false)
    }
    async function cargarComprasMes() {
      const inicioMes = new Date()
      inicioMes.setUTCDate(1)
      inicioMes.setUTCHours(0, 0, 0, 0)
      const { data, error } = await supabase.from('compras_insumo').select('total').gte('created_at', inicioMes.toISOString())
      if (!activo) return
      if (!error && data) setComprasMes(data as { total: number }[])
    }
    cargarInsumos()
    cargarRecetas()
    cargarCotizaciones()
    cargarConfig()
    cargarComprasMes()
    const { data: listener } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === 'SIGNED_IN' || evento === 'SIGNED_OUT') { cargarInsumos(); cargarRecetas(); cargarCotizaciones(); cargarConfig(); cargarComprasMes() }
    })
    return () => { activo = false; listener.subscription.unsubscribe() }
  }, [])

  async function agregarInsumo(datos: Omit<Insumo, 'id'>): Promise<Insumo | null> {
    const { data: userData } = await supabase.auth.getUser()
    const usuario = userData.user
    if (!usuario) return null
    const { data, error } = await supabase.from('insumos').insert({
      user_id: usuario.id,
      nombre: datos.nombre,
      unidad: datos.unidad,
      precio: datos.precio,
      unidades_que_trae: datos.unidadesQueTrae,
      categoria: datos.categoria,
      stock_disponible: datos.stockDisponible ?? null,
      ultima_compra_cantidad: datos.ultimaCompraCantidad ?? null,
      ultima_compra_total: datos.ultimaCompraTotal ?? null,
      ultima_compra_medida: datos.ultimaCompraMedida ?? null,
    }).select().single()
    if (error || !data) return null
    const nuevo = filaAInsumo(data)
    setInsumos((prev) => ordenarInsumos([...prev, nuevo]))
    return nuevo
  }

  async function registrarCompraInsumo(id: string, stockSumado: number, precioNuevo?: number, ultimaCompra?: UltimaCompra, origen: 'manual' | 'factura' = 'manual'): Promise<boolean> {
    const actual = insumos.find((i) => i.id === id)
    if (!actual) return false
    const nuevoStock = (typeof actual.stockDisponible === 'number' ? actual.stockDisponible : 0) + stockSumado
    const payload: Record<string, unknown> = { stock_disponible: nuevoStock }
    if (precioNuevo && precioNuevo > 0) payload.precio = precioNuevo
    if (ultimaCompra) {
      payload.ultima_compra_cantidad = ultimaCompra.cantidad
      payload.ultima_compra_total = ultimaCompra.total
      payload.ultima_compra_medida = ultimaCompra.medida
    }
    const { data, error } = await supabase.from('insumos').update(payload).eq('id', id).select().single()
    if (error || !data) return false
    setInsumos((prev) => prev.map((i) => (i.id === id ? filaAInsumo(data) : i)))
    if (ultimaCompra) await registrarCompraEnLog(id, ultimaCompra.cantidad, ultimaCompra.total, origen)
    return true
  }

  async function actualizarNombreInsumo(id: string, nuevoNombre: string): Promise<boolean> {
    const nombreOk = nuevoNombre.trim()
    if (!nombreOk) return false
    const { data, error } = await supabase.from('insumos').update({ nombre: nombreOk }).eq('id', id).select().single()
    if (error || !data) return false
    setInsumos((prev) => ordenarInsumos(prev.map((i) => (i.id === id ? filaAInsumo(data) : i))))
    return true
  }

  async function eliminarInsumo(id: string): Promise<{ ok: boolean; error?: string }> {
    const { error } = await supabase.from('insumos').delete().eq('id', id)
    if (error) {
      if (error.code === '23503') return { ok: false, error: 'Este insumo está en uso en una o más recetas — quítalo de esas recetas antes de eliminarlo.' }
      return { ok: false, error: 'No pudimos eliminar el insumo. Intenta de nuevo.' }
    }
    setInsumos((prev) => prev.filter((i) => i.id !== id))
    return { ok: true }
  }

  /** Deja constancia de CADA compra con su fecha — es lo que permite calcular "cuánto gastaste
   * en insumos este mes" de verdad en Panorama (antes era un número fijo que nunca cambiaba). */
  async function registrarCompraEnLog(insumoId: string, cantidad: number, total: number, origen: 'manual' | 'factura', facturaId?: string): Promise<void> {
    const { data: userData } = await supabase.auth.getUser()
    const usuario = userData.user
    if (!usuario) return
    const { error } = await supabase.from('compras_insumo').insert({
      user_id: usuario.id, insumo_id: insumoId, cantidad, total, origen, factura_id: facturaId ?? null,
    })
    if (!error) setComprasMes((prev) => [...prev, { total }])
  }

  /** Aplica UN ítem confirmado de una factura escaneada: actualiza precio+stock del insumo
   * (reusa registrarCompraInsumo), deja rastro en insumo_precio_historial (lo que permite
   * Deshacer) y aprende el texto de la factura como alias para la próxima vez. NUNCA toca
   * cotizaciones — eso lo decide el usuario aparte, mirando la lista de afectadas. */
  async function confirmarItemFactura(insumoId: string, textoFactura: string, precioNuevo: number, stockSumado: number, facturaId: string, ultimaCompra?: UltimaCompra): Promise<boolean> {
    const { data: userData } = await supabase.auth.getUser()
    const usuario = userData.user
    if (!usuario) return false
    const actual = insumos.find((i) => i.id === insumoId)
    if (!actual) return false
    const ok = await registrarCompraInsumo(insumoId, stockSumado, precioNuevo, ultimaCompra, 'factura')
    if (!ok) return false
    await supabase.from('insumo_precio_historial').insert({
      user_id: usuario.id, insumo_id: insumoId, precio_anterior: actual.precio, precio_nuevo: precioNuevo, origen: 'factura', factura_id: facturaId,
    })
    await supabase.from('insumo_alias').upsert(
      { user_id: usuario.id, insumo_id: insumoId, texto_factura: textoFactura },
      { onConflict: 'user_id,texto_factura' },
    )
    return true
  }

  /** Crea un insumo NUEVO a partir de un ítem de factura que no coincidía con ninguno existente. */
  async function crearInsumoDesdeFactura(datos: Omit<Insumo, 'id'>, textoFactura: string): Promise<boolean> {
    const nuevo = await agregarInsumo(datos)
    if (!nuevo) return false
    const { data: userData } = await supabase.auth.getUser()
    const usuario = userData.user
    if (usuario) {
      await supabase.from('insumo_alias').upsert(
        { user_id: usuario.id, insumo_id: nuevo.id, texto_factura: textoFactura },
        { onConflict: 'user_id,texto_factura' },
      )
    }
    // Es dinero real que se acaba de gastar (venía de una factura escaneada) — cuenta para
    // "cuánto gastaste en insumos este mes" en Panorama.
    if (datos.ultimaCompraCantidad && datos.ultimaCompraTotal) {
      await registrarCompraEnLog(nuevo.id, datos.ultimaCompraCantidad, datos.ultimaCompraTotal, 'factura')
    }
    return true
  }

  /** Marca la factura como confirmada o descartada y borra la foto de Storage (ya no hace falta
   * conservarla — minimización de datos). */
  async function cerrarFacturaEscaneada(facturaId: string, estado: 'confirmada' | 'descartada', imagenPath: string | null): Promise<void> {
    await supabase.from('facturas_escaneadas').update({ estado }).eq('id', facturaId)
    if (imagenPath) await supabase.storage.from('facturas-temporales').remove([imagenPath])
  }

  /** Deshace los cambios de precio de una factura ya confirmada, usando su historial —
   * respeta cotizaciones (nunca las toca, ni siquiera al deshacer). */
  async function deshacerFactura(facturaId: string): Promise<boolean> {
    const { data: historial, error } = await supabase
      .from('insumo_precio_historial').select('*').eq('factura_id', facturaId)
    if (error || !historial) return false
    for (const fila of historial) {
      await supabase.from('insumos').update({ precio: fila.precio_anterior }).eq('id', fila.insumo_id)
    }
    const { data: insumosFrescos } = await supabase.from('insumos').select('*')
    if (insumosFrescos) setInsumos(insumosFrescos.map(filaAInsumo))
    await supabase.from('facturas_escaneadas').update({ deshecho_en: new Date().toISOString() }).eq('id', facturaId)
    return true
  }

  async function guardarRecetaNueva(datos: Omit<Receta, 'id'>): Promise<boolean> {
    const { data: userData } = await supabase.auth.getUser()
    const usuario = userData.user
    if (!usuario) return false
    const { data, error } = await supabase.from('recetas').insert({
      user_id: usuario.id, nombre: datos.nombre, margen: datos.margen, horas: datos.horas, unidades: datos.unidades,
    }).select().single()
    if (error || !data) return false
    if (datos.insumosUsados.length) {
      const filas = datos.insumosUsados.map((u) => ({ receta_id: data.id, insumo_id: u.insumoId, cantidad_base: u.cantidadGramosOPiezas }))
      const { error: errorUsos } = await supabase.from('receta_insumos').insert(filas)
      if (errorUsos) return false
    }
    setRecetas((prev) => [...prev, { ...filaARecetaBase(data), insumosUsados: datos.insumosUsados }])
    return true
  }

  async function actualizarRecetaExistente(id: string, datos: Omit<Receta, 'id'>): Promise<boolean> {
    const { error } = await supabase.from('recetas').update({
      nombre: datos.nombre, margen: datos.margen, horas: datos.horas, unidades: datos.unidades,
    }).eq('id', id)
    if (error) return false
    await supabase.from('receta_insumos').delete().eq('receta_id', id)
    if (datos.insumosUsados.length) {
      const filas = datos.insumosUsados.map((u) => ({ receta_id: id, insumo_id: u.insumoId, cantidad_base: u.cantidadGramosOPiezas }))
      const { error: errorUsos } = await supabase.from('receta_insumos').insert(filas)
      if (errorUsos) return false
    }
    setRecetas((prev) => prev.map((r) => (r.id === id ? { id, ...datos } : r)))
    return true
  }

  /** Una cotización puede tener VARIOS productos (ej. hamburguesas + galletas en un mismo
   * pedido) — se guarda un resumen en `cotizaciones` (nombre combinado, total) y el detalle
   * real en `cotizacion_items`, uno por producto. */
  async function crearCotizacion(datos: { cliente: string; telefono?: string; items: ItemCotizacion[] }): Promise<boolean> {
    if (!datos.items.length) return false
    const { data: userData } = await supabase.auth.getUser()
    const usuario = userData.user
    if (!usuario) return false
    const montoTotal = datos.items.reduce((acc, it) => acc + it.monto, 0)
    const productoResumen = datos.items.map((it) => it.producto).join(', ')
    const unItem = datos.items.length === 1 ? datos.items[0] : null
    const { data, error } = await supabase.from('cotizaciones').insert({
      user_id: usuario.id,
      receta_id: unItem?.recetaId ?? null,
      cliente: datos.cliente,
      producto: productoResumen,
      telefono: datos.telefono ?? null,
      monto: montoTotal,
      estado: 'pendiente',
      unidades_cotizadas: unItem?.cantidad ?? null,
    }).select().single()
    if (error || !data) return false
    const filasItems = datos.items.map((it) => ({
      user_id: usuario.id, cotizacion_id: data.id, receta_id: it.recetaId ?? null, producto: it.producto, cantidad: it.cantidad, monto: it.monto,
    }))
    const { error: errorItems } = await supabase.from('cotizacion_items').insert(filasItems)
    if (errorItems) return false
    setCotizaciones((prev) => [filaACotizacion(data, filasItems), ...prev])
    return true
  }

  async function cambiarEstadoCotizacion(id: string, nuevoEstado: Cotizacion['estado']): Promise<boolean> {
    // "vendida_en" es la fecha real de venta — el ingreso de un mes se cuenta con esta fecha,
    // nunca con la de creación de la cotización. Se limpia si se corrige y deja de estar vendida.
    const vendidaEn = nuevoEstado === 'vendida' ? new Date().toISOString() : null
    const { error } = await supabase.from('cotizaciones').update({ estado: nuevoEstado, vendida_en: vendidaEn }).eq('id', id)
    if (error) return false
    setCotizaciones((prev) => prev.map((c) => (c.id === id ? { ...c, estado: nuevoEstado, vendidaEn: vendidaEn ?? undefined } : c)))
    return true
  }

  const money = (n: number) => `${SIMBOLOS_MONEDA[moneda] || '$'}${Math.round(n).toLocaleString('es-CO')}`

  const costear: AppContextValue['costear'] = (insumosUsados, margen, horas, unidades) =>
    calcularCostoReceta(insumos, insumosUsados, margen, horas, unidades, modoCalculo === 'real', cfg)

  const costearReal: AppContextValue['costearReal'] = (insumosUsados, margen, horas, unidades) =>
    calcularCostoReceta(insumos, insumosUsados, margen, horas, unidades, true, cfg)

  const costearSimple: AppContextValue['costearSimple'] = (insumosUsados, margen, horas, unidades) =>
    calcularCostoReceta(insumos, insumosUsados, margen, horas, unidades, false, cfg)

  /** Guarda TODA la configuración del negocio de una vez — reemplaza lo que había antes en
   * localStorage, así no se pierde al cambiar de aparato o borrar datos del navegador. */
  async function guardarConfigNegocio(datos: { cfg: ConfigNegocio; modoCalculo: 'simple' | 'real'; moneda: Moneda; nombreNegocio: string; lineaAtencion: string; logoNegocio: string | null }): Promise<boolean> {
    const { data: userData } = await supabase.auth.getUser()
    const usuario = userData.user
    if (!usuario) return false
    const { error } = await supabase.from('config_negocio').upsert({
      user_id: usuario.id,
      fijo_pct: datos.cfg.fijoPct,
      variable_pct: datos.cfg.variablePct,
      valor_hora: datos.cfg.valorHora,
      modo_calculo: datos.modoCalculo,
      moneda: datos.moneda,
      nombre_negocio: datos.nombreNegocio,
      linea_atencion: datos.lineaAtencion,
      logo_negocio_url: datos.logoNegocio,
    }, { onConflict: 'user_id' })
    if (error) return false
    setCfg(datos.cfg)
    setModoCalculo(datos.modoCalculo)
    setMoneda(datos.moneda)
    setNombreNegocioState(datos.nombreNegocio)
    setLineaAtencionState(datos.lineaAtencion)
    setLogoNegocioState(datos.logoNegocio)
    return true
  }

  function ajustarInventarioPorVenta(items: ItemCotizacion[], signo: 1 | -1): string[] {
    const insumosBajos: string[] = []
    const copia = insumos.map((i) => ({ ...i }))
    const cambiados: Insumo[] = []
    items.forEach((item) => {
      const receta = item.recetaId ? recetas.find((r) => r.id === item.recetaId) : recetas.find((r) => r.nombre === item.producto)
      if (!receta) return
      // Si el cliente pidió una cantidad distinta al tamaño de tanda de la receta (ej. receta
      // rinde 5 y pidió 12), el descuento de inventario se escala proporcionalmente — si no, se
      // descontaría siempre lo de UNA tanda sin importar cuánto se vendió de verdad.
      const multiplicador = item.cantidad && receta.unidades > 0 ? item.cantidad / receta.unidades : 1
      receta.insumosUsados.forEach((u) => {
        const ins = copia.find((i) => i.id === u.insumoId)
        if (!ins || typeof ins.stockDisponible !== 'number') return
        ins.stockDisponible += signo * u.cantidadGramosOPiezas * multiplicador
        if (!cambiados.includes(ins)) cambiados.push(ins)
      })
    })
    if (signo < 0) {
      cambiados.forEach((ins) => { if (stockEsBajo(ins, recetas)) insumosBajos.push(ins.nombre) })
    }
    if (cambiados.length) {
      setInsumos(copia)
      cambiados.forEach((ins) => {
        supabase.from('insumos').update({ stock_disponible: ins.stockDisponible }).eq('id', ins.id).then(() => {})
      })
    }
    return insumosBajos
  }

  const value = useMemo<AppContextValue>(() => ({
    insumos,
    recetas,
    cargandoRecetas,
    guardarRecetaNueva,
    actualizarRecetaExistente,
    cotizaciones,
    cargandoCotizaciones,
    crearCotizacion,
    cambiarEstadoCotizacion,
    cfg,
    modoCalculo,
    moneda,
    mesesMock: MESES_INICIALES,
    mesActualIdx, setMesActualIdx,
    gastoMesActual: comprasMes.reduce((acc, c) => acc + c.total, 0),
    money,
    costear,
    costearReal,
    costearSimple,
    ajustarInventarioPorVenta,
    cargandoInsumos,
    agregarInsumo,
    registrarCompraInsumo,
    actualizarNombreInsumo,
    eliminarInsumo,
    confirmarItemFactura,
    crearInsumoDesdeFactura,
    cerrarFacturaEscaneada,
    deshacerFactura,
    logoNegocio,
    nombreNegocio,
    lineaAtencion,
    cargandoConfig,
    guardarConfigNegocio,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [insumos, recetas, cargandoRecetas, cotizaciones, cargandoCotizaciones, cfg, modoCalculo, moneda, mesActualIdx, cargandoInsumos, logoNegocio, nombreNegocio, lineaAtencion, cargandoConfig, comprasMes])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppStore() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppStore debe usarse dentro de <AppStoreProvider>')
  return ctx
}
