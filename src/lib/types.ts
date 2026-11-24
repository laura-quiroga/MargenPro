export type UnidadInsumo = 'kg' | 'g' | 'L' | 'ml' | 'libra' | 'unidad' | 'docena' | 'paquete'
export type Moneda = 'COP' | 'MXN' | 'PEN' | 'USD'
export type CategoriaInsumo = 'ingrediente' | 'empaque' | 'adicional'
export type EstadoCotizacion = 'vendida' | 'pendiente' | 'rechazada'

export interface Insumo {
  id: string
  nombre: string
  unidad: UnidadInsumo
  precio: number
  unidadesQueTrae: number
  categoria: CategoriaInsumo
  stockDisponible?: number
  /** Cantidad y total pagado de la ÚLTIMA compra registrada (manual o por factura) — no se puede
   * calcular desde el precio/stock actuales, es un dato histórico aparte. */
  ultimaCompraCantidad?: number
  ultimaCompraTotal?: number
  /** En qué medida se registró esa última compra — puede ser distinta a `unidad` (ej. el insumo
   * se tasa en kg pero esa compra puntual se registró en gramos). */
  ultimaCompraMedida?: UnidadInsumo
  /** Última vez que se tocó el precio o el stock de este insumo — para avisar cuando llevan
   * muchos días sin actualizarse (el insumo puede haber subido de precio sin que se registre). */
  actualizadoEn?: string
}

export interface InsumoUsado {
  insumoId: string
  cantidadGramosOPiezas: number
}

/** Cuántas tandas de una subreceta ya existente se usan dentro de una receta final — 1 = toda la
 * tanda de esa subreceta, 0.5 = media tanda, etc. Solo una receta FINAL puede llevar esto; una
 * subreceta nunca lleva otra subreceta adentro (evita ciclos infinitos). */
export interface SubrecetaUsada {
  subrecetaId: string
  tandas: number
}

export interface Receta {
  id: string
  nombre: string
  margen: number
  horas: number
  unidades: number
  insumosUsados: InsumoUsado[]
  /** true = es una subreceta/adicional (solo lleva su costo, sin margen, nunca se cotiza sola).
   * false/undefined = es una receta final de verdad, la que se costea y se cotiza. */
  esSubreceta?: boolean
  /** Solo aplica a recetas finales — las subrecetas ya usadas para armarla. */
  subrecetasUsadas: SubrecetaUsada[]
  /** Solo aplica en modo sencillo: si esta receta cuenta tu tiempo (horas × tu valor/hora) dentro
   * del costo, o no. Se guarda por receta para que la elección sobreviva al editarla y para que
   * una cotización use el mismo costo que ya viste al calcular el precio. */
  incluirManoDeObraEnSencillo?: boolean
}

/** Un producto dentro de una cotización — una cotización puede tener varios (ej. hamburguesas +
 * galletas en un mismo pedido). */
export interface ItemCotizacion {
  recetaId?: string
  producto: string
  cantidad: number
  monto: number
}

export interface Cotizacion {
  id: string
  cliente: string
  /** Resumen de los productos (ej. "Hamburguesa, Galletas") — para mostrar en listas sin tener
   * que abrir el detalle. El detalle real de cada producto vive en `items`. */
  producto: string
  monto: number
  estado: EstadoCotizacion
  fecha: string
  createdAt: string
  /** Cuándo se marcó "vendida" de verdad (no cuándo se creó la cotización) — el ingreso de un
   * mes se cuenta con esta fecha, nunca con la de creación. Null mientras no esté vendida. */
  vendidaEn?: string
  recetaId?: string
  /** Cuántas unidades pidió el cliente (puede ser distinto del tamaño de tanda de la receta,
   * ej. receta rinde 5 y el cliente quiere 12). Si no está (cotizaciones viejas), se asume el
   * tamaño de tanda de la receta — así no se rompe nada ya guardado. */
  unidadesCotizadas?: number
  /** Siempre tiene al menos 1 — las cotizaciones de antes de esta función se arman con un solo
   * ítem sintético a partir de sus propios campos (producto/monto/recetaId/unidadesCotizadas). */
  items: ItemCotizacion[]
}

export interface ConfigNegocio {
  fijoPct: number
  variablePct: number
  valorHora: number
}

export const SIMBOLOS_MONEDA: Record<Moneda, string> = { COP: '$', MXN: '$', PEN: 'S/', USD: 'US$' }

/** Estilo de puntos/comas de cada moneda — México usa coma para miles y punto para decimales
 * (al revés que Colombia/Perú); formatear todo con 'es-CO' hacía que un precio en pesos
 * mexicanos se viera con el separador cambiado. */
export const LOCALE_MONEDA: Record<Moneda, string> = { COP: 'es-CO', MXN: 'es-MX', PEN: 'es-PE', USD: 'en-US' }
