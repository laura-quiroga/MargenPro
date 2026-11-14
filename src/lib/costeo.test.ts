import { describe, expect, it } from 'vitest'
import { costoPorUnidadBase, redondearPrecioVenta } from './costeo'

describe('costoPorUnidadBase', () => {
  it('convierte kilos a precio por gramo', () => {
    expect(costoPorUnidadBase(12000, 'kg', 1)).toBe(12)
  })
  it('reparte el precio de un paquete entre sus piezas', () => {
    expect(costoPorUnidadBase(14000, 'docena', 12)).toBeCloseTo(1166.67, 1)
  })
})

describe('redondearPrecioVenta', () => {
  it('redondea hacia arriba al múltiplo de 50 más cercano', () => {
    expect(redondearPrecioVenta(31013)).toBe(31050)
    expect(redondearPrecioVenta(44093)).toBe(44100)
  })
  it('un múltiplo exacto de 50 se queda igual', () => {
    expect(redondearPrecioVenta(31000)).toBe(31000)
  })
})
