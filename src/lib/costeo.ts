import type { ConfigNegocio, Insumo, InsumoUsado, UnidadInsumo } from './types'

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

export function convertirAGramos(cantidad: number, medida: string, nombreInsumo: string): number {
  if (medida === 'g') return cantidad
  const d = densidadPara(nombreInsumo)
  if (medida === 'taza') return cantidad * d.taza
  if (medida === 'cda') return cantidad * d.cda
  if (medida === 'cdta') return cantidad * d.cdta
  return cantidad
}

export interface ResultadoCosteo {
  unidades: number
  costoInsumos: number
  costoManoDeObra: number
  costoFijoAsignado: number
  costoVariableAsignado: number
  costoBase: number
  precioSugerido: number
  costoPorUnidad: number
  precioPorUnidad: number
  pctImposible: boolean
}

/**
 * Motor de costeo — ESPECIFICACIÓN CERRADA (idéntica a dev/app-interna.html). En "gastos
 * reales", costos fijos y variables son % de PRECIO (sacados por el usuario de un mes real
 * suyo en Configuración), no pesos repartidos por un volumen mensual estimado — eso fue una
 * fuente de confusión ya corregida. precio = costoDirecto / (1 − %fijos − %variables − %margen).
 */
export function calcularCostoReceta(
  insumos: Insumo[],
  insumosUsados: InsumoUsado[],
  margen: number,
  horas: number,
  unidades: number,
  modoReal: boolean,
  cfg: ConfigNegocio,
): ResultadoCosteo {
  const unidadesSeguras = unidades || 1
  let costoInsumos = 0
  insumosUsados.forEach((u) => {
    const ins = insumos.find((i) => i.id === u.insumoId)
    if (!ins) return
    costoInsumos += costoPorUnidadBase(ins.precio, ins.unidad, ins.unidadesQueTrae) * u.cantidadGramosOPiezas
  })
  const costoManoDeObra = (horas || 0) * cfg.valorHora
  const costoDirecto = costoInsumos + costoManoDeObra

  let precioSugerido: number
  let costoFijoAsignado = 0
  let costoVariableAsignado = 0
  let costoBase: number
  let pctImposible = false

  if (modoReal) {
    let pctOcupado = (cfg.fijoPct + cfg.variablePct + margen) / 100
    if (pctOcupado >= 0.97) {
      pctImposible = true
      pctOcupado = 0.97
    }
    precioSugerido = Math.round(costoDirecto / (1 - pctOcupado))
    costoFijoAsignado = Math.round((precioSugerido * cfg.fijoPct) / 100)
    costoVariableAsignado = Math.round((precioSugerido * cfg.variablePct) / 100)
    costoBase = costoDirecto + costoFijoAsignado + costoVariableAsignado
  } else {
    costoBase = Math.round(costoInsumos * 1.35)
    precioSugerido = Math.round(costoBase / (1 - margen / 100))
  }

  const precioPorUnidad = Math.round(precioSugerido / unidadesSeguras)

  return {
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
  }
}
