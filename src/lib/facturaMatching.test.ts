import { describe, expect, it } from 'vitest'
import { emparejarInsumo, normalizarItemFactura } from './facturaMatching'
import type { Insumo } from './types'

describe('normalizarItemFactura', () => {
  it('convierte el precio TOTAL de la línea a precio por unidad (kg)', () => {
    const r = normalizarItemFactura({ cantidad: 25, precio: 62500, medida: 'kg' })
    expect(r.precioPorUnidad).toBe(2500)
  })
  it('acumula el stock en la unidad base (kg -> gramos)', () => {
    const r = normalizarItemFactura({ cantidad: 25, precio: 62500, medida: 'kg' })
    expect(r.stockSumado).toBe(25000)
  })
  it('no revienta con cantidad 0', () => {
    const r = normalizarItemFactura({ cantidad: 0, precio: 1000, medida: 'unidad' })
    expect(r.precioPorUnidad).toBe(1000)
  })
  it('calcula el precio por docena (no por pieza individual)', () => {
    const r = normalizarItemFactura({ cantidad: 2, precio: 28000, medida: 'docena' })
    expect(r.precioPorUnidad).toBe(14000)
    expect(r.stockSumado).toBe(2) // el stock de docena/paquete/unidad se cuenta en piezas de compra, no en huevos individuales
  })
  it('un paquete no convierte a gramos/ml — queda en piezas', () => {
    const r = normalizarItemFactura({ cantidad: 3, precio: 9000, medida: 'paquete' })
    expect(r.precioPorUnidad).toBe(3000)
    expect(r.stockSumado).toBe(3)
  })
  it('litros se comportan igual que kilos (base en mililitros)', () => {
    const r = normalizarItemFactura({ cantidad: 4, precio: 20000, medida: 'L' })
    expect(r.precioPorUnidad).toBe(5000)
    expect(r.stockSumado).toBe(4000)
  })
})

describe('emparejarInsumo', () => {
  const insumos: Insumo[] = [
    { id: 'a1', nombre: 'Harina de trigo', unidad: 'kg', precio: 2500, unidadesQueTrae: 1, categoria: 'ingrediente' },
    { id: 'a2', nombre: 'Azúcar blanca', unidad: 'kg', precio: 3000, unidadesQueTrae: 1, categoria: 'ingrediente' },
  ]

  it('empareja por nombre parecido sin acentos ni mayúsculas', () => {
    const r = emparejarInsumo('HARINA TRIGO X 25KG', 'Harina de trigo', insumos, [])
    expect(r.insumoId).toBe('a1')
    expect(r.porAlias).toBe(false)
  })

  it('prioriza un alias ya confirmado sobre la similitud de nombre', () => {
    const alias = [{ texto_factura: 'HARINA TRIGO X 25KG BULTO', insumo_id: 'a2' }]
    const r = emparejarInsumo('HARINA TRIGO X 25KG BULTO', 'Harina de trigo', insumos, alias)
    expect(r.insumoId).toBe('a2')
    expect(r.porAlias).toBe(true)
  })

  it('no propone ningún insumo si no hay nada parecido (mejor no adivinar)', () => {
    const r = emparejarInsumo('CAJA DE SERVILLETAS', 'Servilletas', insumos, [])
    expect(r.insumoId).toBeNull()
  })

  it('ignora un alias que apunta a un insumo ya borrado', () => {
    const alias = [{ texto_factura: 'ALGO RARO', insumo_id: 'id-que-ya-no-existe' }]
    const r = emparejarInsumo('ALGO RARO', 'Algo raro', insumos, alias)
    expect(r.porAlias).toBe(false)
  })
})
