import type { ConfigNegocio, Insumo, InsumoUsado, Receta, SubrecetaUsada, UnidadInsumo } from './types'

/** Redondea el precio que se le COBRA al cliente hacia arriba, al múltiplo de $50 más cercano
 * (ej. $31.013 → $31.050) — nunca hacia abajo, para no perder margen. Solo se usa en el precio
 * final que ve y paga el cliente, nunca en el costo interno de una receta. */
export function redondearPrecioVenta(monto: number): number {
  return Math.ceil(monto / 50) * 50
}

/** Costo de 1 unidad BASE (1 gramo, 1 ml, 1 pieza o 1 libra) según cómo se compró el insumo. */
export function costoPorUnidadBase(precioCompra: number, unidad: UnidadInsumo, unidadesQueTrae: number): number {
  switch (unidad) {
    case 'kg': return precioCompra / 1000
    case 'g': return precioCompra
    case 'L': return precioCompra / 1000
    case 'ml': return precioCompra
    case 'libra': return precioCompra
    case 'unidad': return precioCompra / (unidadesQueTrae || 1)
    case 'docena': return precioCompra / (unidadesQueTrae || 12)
    case 'paquete': return precioCompra / (unidadesQueTrae || 1)
    default: return precioCompra / 1000
  }
}

const DENSIDADES: Record<string, { taza: number; cda: number; cdta: number }> = {
  'harina': { taza: 120, cda: 7.5, cdta: 2.5 },
  'azucar blanca': { taza: 200, cda: 12.5, cdta: 4 },
  'azucar morena': { taza: 220, cda: 13.5, cdta: 4.5 },
  'azucar': { taza: 200, cda: 12.5, cdta: 4 },
  'mantequilla': { taza: 227, cda: 14, cdta: 4.7 },
  'aceite': { taza: 218, cda: 13.6, cdta: 4.5 },
  'leche': { taza: 240, cda: 15, cdta: 5 },
  'agua': { taza: 240, cda: 15, cdta: 5 },
  'cacao': { taza: 90, cda: 5.6, cdta: 1.9 },
  'chocolate en polvo': { taza: 90, cda: 5.6, cdta: 1.9 },
  'sal': { taza: 288, cda: 18, cdta: 6 },
  'polvo de hornear': { taza: 192, cda: 12, cdta: 4.5 },
}
const DENSIDAD_GENERICA = { taza: 200, cda: 12.5, cdta: 4.2 }

function densidadPara(nombreInsumo: string) {
  const clave = Object.keys(DENSIDADES).find((k) => nombreInsumo.toLowerCase().includes(k))
  return clave ? DENSIDADES[clave] : DENSIDAD_GENERICA
}

/** Gramos que tiene 1 libra — para convertir recetas que mezclan gramos y libras del mismo
 * insumo (ej. insumo tasado en libras pero la receta lo usa en gramos). */
export const GRAMOS_POR_LIBRA = 453.592

export function convertirAGramos(cantidad: number, medida: string, nombreInsumo: string): number {
  if (medida === 'g') return cantidad
  if (medida === 'libra') return cantidad * GRAMOS_POR_LIBRA
  const d = densidadPara(nombreInsumo)
  if (medida === 'taza') return cantidad * d.taza
  if (medida === 'cda') return cantidad * d.cda
  if (medida === 'cdta') return cantidad * d.cdta
  return cantidad
}

/** El costo de una subreceta/adicional — SOLO suma sus insumos, nunca lleva margen, mano de obra
 * ni gastos fijos/variables. Esto es "cuánto me cuesta prepararla", no "cuánto la cobro" (una
 * subreceta nunca se cotiza sola). */
export function calcularCostoSubreceta(insumos: Insumo[], insumosUsados: InsumoUsado[]): number {
  let costo = 0
  insumosUsados.forEach((u) => {
    const ins = insumos.find((i) => i.id === u.insumoId)
    if (!ins) return
    costo += costoPorUnidadBase(ins.precio, ins.unidad, ins.unidadesQueTrae) * u.cantidadGramosOPiezas
  })
  return costo
}

export interface ResultadoCosteo {
  unidades: number
  costoInsumos: number
  costoSubrecetas: number
  costoManoDeObra: number
  costoFijoAsignado: number
  costoVariableAsignado: number
  costoBase: number
  precioSugerido: number
  costoPorUnidad: number
  precioPorUnidad: number
  pctImposible: boolean
  /** true cuando gastos fijos + variables + margen ya suman 70% o más del precio — no es un
   * error (no se bloquea nada), es el aviso de "tu precio se está alejando del mercado". */
  pctAlto: boolean
}

/**
 * Motor de costeo — ESPECIFICACIÓN CERRADA (idéntica a dev/app-interna.html). En "gastos
 * reales", costos fijos y variables son % de PRECIO (sacados por el usuario de un mes real
 * suyo en Configuración), no pesos repartidos por un volumen mensual estimado — eso fue una
 * fuente de confusión ya corregida. precio = costoDirecto / (1 − %fijos − %variables − %margen).
 *
 * En "modo sencillo", el costo base es SOLO los insumos (y la mano de obra si el usuario prende
 * el interruptor opcional) — ya NO se usa un multiplicador fijo escondido (antes ×1,35): el
 * control de margen de la receta es el que de verdad decide el precio, en los dos modos.
 */
export function calcularCostoReceta(
  insumos: Insumo[],
  insumosUsados: InsumoUsado[],
  margen: number,
  horas: number,
  unidades: number,
  modoReal: boolean,
  cfg: ConfigNegocio,
  incluirManoDeObraEnSencillo = false,
  subrecetas: Receta[] = [],
  subrecetasUsadas: SubrecetaUsada[] = [],
): ResultadoCosteo {
  const unidadesSeguras = unidades || 1
  let costoInsumos = 0
  insumosUsados.forEach((u) => {
    const ins = insumos.find((i) => i.id === u.insumoId)
    if (!ins) return
    costoInsumos += costoPorUnidadBase(ins.precio, ins.unidad, ins.unidadesQueTrae) * u.cantidadGramosOPiezas
  })
  let costoSubrecetas = 0
  subrecetasUsadas.forEach((su) => {
    const sub = subrecetas.find((r) => r.id === su.subrecetaId)
    if (!sub) return
    costoSubrecetas += calcularCostoSubreceta(insumos, sub.insumosUsados) * (su.tandas || 0)
  })
  const costoManoDeObra = (horas || 0) * cfg.valorHora

  let precioSugerido: number
  let costoFijoAsignado = 0
  let costoVariableAsignado = 0
  let costoBase: number
  let pctImposible = false
  let pctAlto = false

  if (modoReal) {
    const costoDirecto = costoInsumos + costoSubrecetas + costoManoDeObra
    let pctOcupado = (cfg.fijoPct + cfg.variablePct + margen) / 100
    pctAlto = pctOcupado >= 0.7
    if (pctOcupado >= 0.97) {
      pctImposible = true
      pctOcupado = 0.97
    }
    precioSugerido = Math.round(costoDirecto / (1 - pctOcupado))
    costoFijoAsignado = Math.round((precioSugerido * cfg.fijoPct) / 100)
    costoVariableAsignado = Math.round((precioSugerido * cfg.variablePct) / 100)
    costoBase = costoDirecto + costoFijoAsignado + costoVariableAsignado
  } else {
    costoBase = costoInsumos + costoSubrecetas + (incluirManoDeObraEnSencillo ? costoManoDeObra : 0)
    precioSugerido = Math.round(costoBase / (1 - margen / 100))
  }

  const precioPorUnidad = Math.round(precioSugerido / unidadesSeguras)

  return {
    costoSubrecetas: Math.round(costoSubrecetas),
    unidades: unidadesSeguras,
    costoInsumos: Math.round(costoInsumos),
    costoManoDeObra: Math.round(costoManoDeObra),
    costoFijoAsignado,
    costoVariableAsignado,
    costoBase: Math.round(costoBase),
    precioSugerido,
    costoPorUnidad: Math.round(costoBase / unidadesSeguras),
    precioPorUnidad,
    pctImposible,
    pctAlto,
  }
}
