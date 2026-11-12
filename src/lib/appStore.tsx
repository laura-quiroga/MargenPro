import { createContext, useContext, useMemo, useState } from 'react'
import type { ConfigNegocio, Cotizacion, Insumo, Moneda, Receta, UnidadInsumo } from './types'
import { SIMBOLOS_MONEDA } from './types'
import { calcularCostoReceta } from './costeo'

export function etiquetaUnidad(u: UnidadInsumo): string {
  return { kg: 'kg', g: 'g', L: 'L', ml: 'ml', libra: 'lb', unidad: 'c/u', docena: 'docena', paquete: 'paquete' }[u] || u
}

/** "Cuánto compraste/tienes" (en la unidad que el usuario eligió) a la unidad BASE de stock
 * que ya usan las recetas: gramos para kg, mililitros para L, piezas para todo lo demás. */
export function stockBaseDesdeCantidad(unidad: UnidadInsumo, cantidad: number): number {
  return unidad === 'kg' || unidad === 'L' ? cantidad * 1000 : cantidad
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

// Datos de ejemplo — ESPECIFICACIÓN CERRADA, idénticos a dev/app-interna.html
// (la app nunca se enseña vacía — 32-DEL-MVP-AL-PRODUCTO).
const INSUMOS_INICIALES: Insumo[] = [
  { id: 0, nombre: 'Harina de trigo', unidad: 'kg', precio: 12000, unidadesQueTrae: 1, categoria: 'ingrediente', stockDisponible: 2500 },
  { id: 1, nombre: 'Azúcar blanca', unidad: 'kg', precio: 6000, unidadesQueTrae: 1, categoria: 'ingrediente', stockDisponible: 900 },
  { id: 2, nombre: 'Mantequilla', unidad: 'kg', precio: 18000, unidadesQueTrae: 1, categoria: 'ingrediente', stockDisponible: 700 },
  { id: 3, nombre: 'Chocolate en polvo', unidad: 'kg', precio: 24000, unidadesQueTrae: 1, categoria: 'ingrediente', stockDisponible: 500 },
  { id: 4, nombre: 'Huevos', unidad: 'docena', precio: 14000, unidadesQueTrae: 12, categoria: 'ingrediente', stockDisponible: 18 },
  { id: 5, nombre: 'Cajas para torta', unidad: 'unidad', precio: 2800, unidadesQueTrae: 1, categoria: 'empaque', stockDisponible: 20 },
  { id: 6, nombre: 'Chispas de chocolate (topping)', unidad: 'kg', precio: 16000, unidadesQueTrae: 1, categoria: 'adicional', stockDisponible: 400 },
]

const RECETAS_INICIALES: Receta[] = [
  { id: 0, nombre: 'Torta de chocolate x 12 porciones', margen: 40, horas: 0, unidades: 12, insumosUsados: [{ insumoId: 0, cantidadGramosOPiezas: 600 }, { insumoId: 1, cantidadGramosOPiezas: 300 }, { insumoId: 2, cantidadGramosOPiezas: 200 }] },
  { id: 1, nombre: 'Brownies x 20', margen: 40, horas: 0, unidades: 20, insumosUsados: [{ insumoId: 3, cantidadGramosOPiezas: 400 }, { insumoId: 2, cantidadGramosOPiezas: 150 }, { insumoId: 1, cantidadGramosOPiezas: 200 }] },
  { id: 2, nombre: 'Pan de queso x 24', margen: 35, horas: 0, unidades: 24, insumosUsados: [{ insumoId: 0, cantidadGramosOPiezas: 500 }, { insumoId: 4, cantidadGramosOPiezas: 6 }, { insumoId: 2, cantidadGramosOPiezas: 100 }] },
]

const COTIZACIONES_INICIALES: Cotizacion[] = [
  { cliente: 'Ana Martínez', producto: 'Torta de chocolate x 12 porciones', monto: 28350, estado: 'vendida', fecha: 'hace 2 días' },
  { cliente: 'Carlos Pérez', producto: 'Brownies x 20', monto: 30375, estado: 'pendiente', fecha: 'hace 1 día' },
  { cliente: 'Lucía Gómez', producto: 'Torta de chocolate x 12 porciones', monto: 28350, estado: 'rechazada', fecha: 'hace 4 días' },
  { cliente: 'Pedro Ramírez', producto: 'Brownies x 20', monto: 30375, estado: 'vendida', fecha: 'hace 5 días' },
  { cliente: 'Marta Silva', producto: 'Torta de chocolate x 12 porciones', monto: 28350, estado: 'vendida', fecha: 'hace 6 días' },
  { cliente: 'Diana Ríos', producto: 'Brownies x 20', monto: 30375, estado: 'vendida', fecha: 'hace 9 días' },
  { cliente: 'Camilo Ortiz', producto: 'Pan de queso x 24', monto: 19980, estado: 'vendida', fecha: 'hace 12 días' },
  { cliente: 'Sofía Castro', producto: 'Torta de chocolate x 12 porciones', monto: 28350, estado: 'vendida', fecha: 'hace 15 días' },
  { cliente: 'Esteban Rojas', producto: 'Brownies x 20', monto: 30375, estado: 'vendida', fecha: 'hace 18 días' },
  { cliente: 'Pedro Ruiz', producto: 'Pan de queso x 24', monto: 30740, estado: 'pendiente', fecha: 'hoy' },
]

const MESES_INICIALES: MesMock[] = [
  { label: 'Noviembre 2026', gasto: 120000, esMesActual: true },
  { label: 'Octubre 2026', ingreso: 177500, gasto: 210000, vendidas: 4 },
]

interface AppContextValue {
  insumos: Insumo[]
  setInsumos: React.Dispatch<React.SetStateAction<Insumo[]>>
  recetas: Receta[]
  setRecetas: React.Dispatch<React.SetStateAction<Receta[]>>
  cotizaciones: Cotizacion[]
  setCotizaciones: React.Dispatch<React.SetStateAction<Cotizacion[]>>
  cfg: ConfigNegocio
  setCfg: React.Dispatch<React.SetStateAction<ConfigNegocio>>
  modoCalculo: 'simple' | 'real'
  setModoCalculo: React.Dispatch<React.SetStateAction<'simple' | 'real'>>
  moneda: Moneda
  setMoneda: React.Dispatch<React.SetStateAction<Moneda>>
  mesesMock: MesMock[]
  mesActualIdx: number
  setMesActualIdx: React.Dispatch<React.SetStateAction<number>>
  money: (n: number) => string
  costear: (insumosUsados: Receta['insumosUsados'], margen: number, horas: number, unidades: number) => ReturnType<typeof calcularCostoReceta>
  /** Para cotizaciones: SIEMPRE con gastos fijos/variables reales, sin importar el modo elegido
   * en Ajustes — así el precio que se le manda al cliente nunca deja al negocio en pérdida. */
  costearReal: (insumosUsados: Receta['insumosUsados'], margen: number, horas: number, unidades: number) => ReturnType<typeof calcularCostoReceta>
  /** Descuenta (signo -1) o devuelve (signo +1) del inventario los insumos de la receta vendida/corregida. */
  ajustarInventarioPorVenta: (nombreProducto: string, signo: 1 | -1) => string[]
  logoNegocio: string | null
  setLogoNegocio: (logo: string | null) => void
}

const AppContext = createContext<AppContextValue | null>(null)

const CLAVE_LOGO_NEGOCIO = 'margenpro-logo-negocio'

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
  const [insumos, setInsumos] = useState<Insumo[]>(INSUMOS_INICIALES)
  const [recetas, setRecetas] = useState<Receta[]>(RECETAS_INICIALES)
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>(COTIZACIONES_INICIALES)
  const [cfg, setCfg] = useState<ConfigNegocio>({ fijoPct: 20, variablePct: 0, valorHora: 8000 })
  const [modoCalculo, setModoCalculo] = useState<'simple' | 'real'>('simple')
  const [moneda, setMoneda] = useState<Moneda>('COP')
  const [mesActualIdx, setMesActualIdx] = useState(0)
  const [logoNegocio, setLogoNegocioState] = useState<string | null>(() => {
    try { return localStorage.getItem(CLAVE_LOGO_NEGOCIO) } catch { return null }
  })

  const money = (n: number) => `${SIMBOLOS_MONEDA[moneda] || '$'}${Math.round(n).toLocaleString('es-CO')}`

  const costear: AppContextValue['costear'] = (insumosUsados, margen, horas, unidades) =>
    calcularCostoReceta(insumos, insumosUsados, margen, horas, unidades, modoCalculo === 'real', cfg)

  const costearReal: AppContextValue['costearReal'] = (insumosUsados, margen, horas, unidades) =>
    calcularCostoReceta(insumos, insumosUsados, margen, horas, unidades, true, cfg)

  function setLogoNegocio(logo: string | null) {
    setLogoNegocioState(logo)
    try {
      if (logo) localStorage.setItem(CLAVE_LOGO_NEGOCIO, logo)
      else localStorage.removeItem(CLAVE_LOGO_NEGOCIO)
    } catch {
      // localStorage puede no estar disponible (modo privado); el logo sigue funcionando en esta sesión.
    }
  }

  function ajustarInventarioPorVenta(nombreProducto: string, signo: 1 | -1): string[] {
    const receta = recetas.find((r) => r.nombre === nombreProducto)
    if (!receta) return []
    const insumosBajos: string[] = []
    setInsumos((prev) => {
      const copia = prev.map((i) => ({ ...i }))
      receta.insumosUsados.forEach((u) => {
        const ins = copia.find((i) => i.id === u.insumoId)
        if (!ins || typeof ins.stockDisponible !== 'number') return
        ins.stockDisponible += signo * u.cantidadGramosOPiezas
        if (signo < 0 && stockEsBajo(ins, recetas)) insumosBajos.push(ins.nombre)
      })
      return copia
    })
    return insumosBajos
  }

  const value = useMemo<AppContextValue>(() => ({
    insumos, setInsumos,
    recetas, setRecetas,
    cotizaciones, setCotizaciones,
    cfg, setCfg,
    modoCalculo, setModoCalculo,
    moneda, setMoneda,
    mesesMock: MESES_INICIALES,
    mesActualIdx, setMesActualIdx,
    money,
    costear,
    costearReal,
    ajustarInventarioPorVenta,
    logoNegocio, setLogoNegocio,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [insumos, recetas, cotizaciones, cfg, modoCalculo, moneda, mesActualIdx, logoNegocio])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppStore() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppStore debe usarse dentro de <AppStoreProvider>')
  return ctx
}
