export type UnidadInsumo = 'kg' | 'g' | 'L' | 'ml' | 'libra' | 'unidad' | 'docena' | 'paquete'
export type Moneda = 'COP' | 'MXN' | 'PEN' | 'USD'
export type CategoriaInsumo = 'ingrediente' | 'empaque' | 'adicional'
export type EstadoCotizacion = 'vendida' | 'pendiente' | 'rechazada'

export interface Insumo {
  id: number
  nombre: string
  unidad: UnidadInsumo
  precio: number
  unidadesQueTrae: number
  categoria: CategoriaInsumo
  stockDisponible?: number
}

export interface InsumoUsado {
  insumoId: number
  cantidadGramosOPiezas: number
}

export interface Receta {
  id: number
  nombre: string
  margen: number
  horas: number
  unidades: number
  insumosUsados: InsumoUsado[]
}

export interface Cotizacion {
  cliente: string
  producto: string
  monto: number
  estado: EstadoCotizacion
  fecha: string
}

export interface ConfigNegocio {
  fijoPct: number
  variablePct: number
  valorHora: number
}

export const SIMBOLOS_MONEDA: Record<Moneda, string> = { COP: '$', MXN: '$', PEN: 'S/', USD: 'US$' }
