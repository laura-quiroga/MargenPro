import type { ItemFactura } from './ai/vision'
import type { Insumo } from './types'
import { convertirMedidaCompra, precioPorUnidadDesdeCompra, stockBaseDesdeCantidad } from './appStore'

/** Convierte el ítem leído de la factura (precio TOTAL de esa línea) al precio por UNA unidad
 * de compra — mismo significado que ya usa `Insumo.precio` (precio por kg/L/docena/paquete/unidad,
 * nunca el total pagado por esta compra puntual). Ej: "25kg por $62.500" → precio=2.500.
 *
 * `insumoDestino` es el insumo YA EXISTENTE al que se le va a aplicar este ítem (si lo hay) —
 * la factura puede venir en una medida distinta a como el usuario tasa ese insumo (ej. factura
 * en kg, insumo guardado en gramos), así que hay que convertir ANTES de calcular precio/stock,
 * igual que ya hace "Registrar compra" en Insumos.tsx. Si se omite (insumo NUEVO), su propia
 * unidad va a ser la medida de la factura — no hace falta convertir nada. */
export function normalizarItemFactura(
  item: Pick<ItemFactura, 'cantidad' | 'precio' | 'medida'>,
  insumoDestino?: Pick<Insumo, 'unidad' | 'unidadesQueTrae'>,
): { precioPorUnidad: number; stockSumado: number } {
  const cantidadSegura = item.cantidad > 0 ? item.cantidad : 1
  if (!insumoDestino) {
    return {
      precioPorUnidad: item.precio / cantidadSegura,
      stockSumado: stockBaseDesdeCantidad(item.medida, item.cantidad),
    }
  }
  const cantidadEnUnidadInsumo = convertirMedidaCompra(cantidadSegura, item.medida, insumoDestino)
  return {
    precioPorUnidad: precioPorUnidadDesdeCompra(insumoDestino, cantidadEnUnidadInsumo, item.precio),
    stockSumado: stockBaseDesdeCantidad(insumoDestino.unidad, cantidadEnUnidadInsumo),
  }
}

function normalizarTexto(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // quita tildes
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Similitud simple por palabras en común (Jaccard sobre tokens) — suficiente para emparejar
 * nombres cortos de insumos sin traer una librería aparte. 0 = nada en común, 1 = idénticos. */
function similitud(a: string, b: string): number {
  const ta = new Set(normalizarTexto(a).split(' ').filter(Boolean))
  const tb = new Set(normalizarTexto(b).split(' ').filter(Boolean))
  if (!ta.size || !tb.size) return 0
  let comunes = 0
  ta.forEach((t) => { if (tb.has(t)) comunes++ })
  const union = new Set([...ta, ...tb]).size
  return comunes / union
}

export interface ResultadoEmparejamiento {
  insumoId: string | null
  confianza: number
  /** true si vino de un alias ya confirmado antes por el usuario (confianza total). */
  porAlias: boolean
}

const UMBRAL_CONFIABLE = 0.5

/** Busca a qué insumo del usuario corresponde este ítem: primero por alias ya confirmado,
 * si no por similitud de nombre. Por debajo del umbral, no propone ninguno (el usuario elige
 * a mano o crea un insumo nuevo) — mejor no adivinar que adivinar mal. */
export function emparejarInsumo(
  textoFactura: string,
  productoLeido: string,
  insumos: Insumo[],
  alias: { texto_factura: string; insumo_id: string }[],
): ResultadoEmparejamiento {
  const textoNormalizado = normalizarTexto(textoFactura)
  const aliasEncontrado = alias.find((a) => normalizarTexto(a.texto_factura) === textoNormalizado)
  if (aliasEncontrado && insumos.some((i) => i.id === aliasEncontrado.insumo_id)) {
    return { insumoId: aliasEncontrado.insumo_id, confianza: 1, porAlias: true }
  }

  let mejor: { id: string; score: number } | null = null
  for (const insumo of insumos) {
    const score = similitud(productoLeido, insumo.nombre)
    if (!mejor || score > mejor.score) mejor = { id: insumo.id, score }
  }
  if (mejor && mejor.score >= UMBRAL_CONFIABLE) {
    return { insumoId: mejor.id, confianza: mejor.score, porAlias: false }
  }
  return { insumoId: null, confianza: mejor?.score ?? 0, porAlias: false }
}
