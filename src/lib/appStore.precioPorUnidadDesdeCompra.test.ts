import { describe, expect, it } from 'vitest'
import { precioPorUnidadDesdeCompra } from './appStore'

describe('precioPorUnidadDesdeCompra', () => {
  it('insumo por gramos: compraste 1000g y pagaste 10.400 → 10.4/g (subió respecto a 10/g)', () => {
    expect(precioPorUnidadDesdeCompra({ unidad: 'g', unidadesQueTrae: 1 }, 1000, 10400)).toBeCloseTo(10.4, 2)
  })
  it('insumo por kilos: compraste 2kg y pagaste 10.000 → 5.000/kg', () => {
    expect(precioPorUnidadDesdeCompra({ unidad: 'kg', unidadesQueTrae: 1 }, 2, 10000)).toBe(5000)
  })
  it('insumo por pieza con unidadesQueTrae (caja x 6): compraste 12 piezas y pagaste 9.000 → 4.500 por caja', () => {
    expect(precioPorUnidadDesdeCompra({ unidad: 'paquete', unidadesQueTrae: 6 }, 12, 9000)).toBe(4500)
  })
  it('sin cantidad válida, devuelve el total tal cual (no divide por cero)', () => {
    expect(precioPorUnidadDesdeCompra({ unidad: 'g', unidadesQueTrae: 1 }, 0, 5000)).toBe(5000)
  })
})
