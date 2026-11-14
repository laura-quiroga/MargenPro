import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Cake, Hamburger, Bread, ForkKnife, Receipt, PaperPlaneTilt, ClockCounterClockwise, ChartBar } from '@phosphor-icons/react'
import PhoneFrame from '../components/PhoneFrame'
import { Confetti, useConfeti } from '../components/Confetti'
import { Toast, useToast } from '../components/Toast'
import { costoPorUnidadBase } from '../lib/costeo'
import type { Moneda, UnidadInsumo } from '../lib/types'
import { SIMBOLOS_MONEDA } from '../lib/types'
import './Onboarding.css'

const TOTAL_PASOS = 7
const MAX_INSUMOS = 3

interface InsumoForm {
  nombre: string
  unidad: UnidadInsumo
  unidadesQueTrae: number
  precio: number
  moneda: Moneda
  cantidadUsada?: number
}

interface EjemploNegocio {
  insumos: Omit<InsumoForm, 'moneda'>[]
  productoNombre: string
  precioActual: number
}

const EJEMPLOS_NEGOCIO: Record<string, EjemploNegocio> = {
  reposteria: {
    insumos: [
      { nombre: 'Harina de trigo', precio: 12000, unidad: 'kg', unidadesQueTrae: 1, cantidadUsada: 600 },
      { nombre: 'Azúcar blanca', precio: 6000, unidad: 'kg', unidadesQueTrae: 1, cantidadUsada: 300 },
      { nombre: 'Mantequilla', precio: 18000, unidad: 'kg', unidadesQueTrae: 1, cantidadUsada: 200 },
    ],
    productoNombre: 'Torta de chocolate x 12 porciones', precioActual: 18000,
  },
  'comida-rapida': {
    insumos: [
      { nombre: 'Carne molida', precio: 22000, unidad: 'kg', unidadesQueTrae: 1, cantidadUsada: 150 },
      { nombre: 'Pan para hamburguesa', precio: 800, unidad: 'unidad', unidadesQueTrae: 1, cantidadUsada: 1 },
      { nombre: 'Queso cheddar', precio: 15000, unidad: 'kg', unidadesQueTrae: 1, cantidadUsada: 40 },
    ],
    productoNombre: 'Hamburguesa clásica x 1', precioActual: 9000,
  },
  panaderia: {
    insumos: [
      { nombre: 'Harina panadera', precio: 9000, unidad: 'kg', unidadesQueTrae: 1, cantidadUsada: 300 },
      { nombre: 'Levadura', precio: 4000, unidad: 'kg', unidadesQueTrae: 1, cantidadUsada: 8 },
    ],
    productoNombre: 'Pan artesanal x unidad', precioActual: 3500,
  },
  otro: {
    insumos: [
      { nombre: 'Insumo principal', precio: 15000, unidad: 'kg', unidadesQueTrae: 1, cantidadUsada: 400 },
      { nombre: 'Insumo secundario', precio: 8000, unidad: 'kg', unidadesQueTrae: 1, cantidadUsada: 150 },
    ],
    productoNombre: 'Tu producto estrella', precioActual: 12000,
  },
}

const TIPOS_NEGOCIO = [
  { id: 'reposteria', texto: 'Repostería y pastelería', Icono: Cake },
  { id: 'comida-rapida', texto: 'Comida rápida y street food', Icono: Hamburger },
  { id: 'panaderia', texto: 'Panadería artesanal', Icono: Bread },
  { id: 'otro', texto: 'Menús, catering u otro', Icono: ForkKnife },
]

const OPCIONES_DOLOR = [
  { id: 'a-ojo', texto: 'A ojo o copiando a la competencia', respuesta: 'Vamos a cambiar eso ahora mismo.', icono: <><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" /><circle cx="12" cy="12" r="3" /></> },
  { id: 'cuadernos', texto: 'En cuadernos o notas de papel', respuesta: 'Dile adiós a la libreta manchada de aceite.', icono: <><path d="M4 4h13a2 2 0 012 2v14a2 2 0 01-2 2H4z" /><path d="M4 4v18M8 9h7M8 13h7" /></> },
  { id: 'excel', texto: 'En hojas de Excel que se enredan', respuesta: 'Tranquilo/a, vamos a dejar atrás las fórmulas que se rompen.', icono: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18M15 3v18" /></> },
  { id: 'no-se', texto: 'No estoy seguro/a de si gano o pierdo', respuesta: 'Eso termina hoy: en un minuto lo vas a saber con certeza.', icono: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 015 .5c0 1.5-2.5 1.8-2.5 3.5" /><path d="M12 17h.01" /></> },
]

const TOUR = [
  { nombre: 'Escaneo', label: 'Ingredientes y precios siempre al día', Icono: Receipt },
  { nombre: 'Cotización', label: 'Lista para enviar por WhatsApp', Icono: PaperPlaneTilt },
  { nombre: 'Historial', label: 'Vendida, pendiente o rechazada', Icono: ClockCounterClockwise },
  { nombre: 'Resumen', label: 'Tu mes, en números claros', Icono: ChartBar },
]

function etiquetaCantidadPara(unidad: UnidadInsumo) {
  if (unidad === 'kg' || unidad === 'g') return '¿Cuántos gramos usas'
  if (unidad === 'L' || unidad === 'ml') return '¿Cuántos mililitros usas'
  if (unidad === 'libra') return '¿Cuántas libras usas'
  return '¿Cuántas piezas usas'
}

function iconoCheck() {
  return <svg viewBox="0 0 24 24" fill="none" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
}

export default function Onboarding() {
  const navigate = useNavigate()
  const [paso, setPaso] = useState(1)
  const [tipoNegocio, setTipoNegocio] = useState<string | null>(null)
  const [dolorElegido, setDolorElegido] = useState<string | null>(null)
  const [respuestaDolor, setRespuestaDolor] = useState<string | null>(null)
  const [moneda, setMoneda] = useState<Moneda>('COP')
  const [insumos, setInsumos] = useState<InsumoForm[]>([])
  const [form, setForm] = useState<InsumoForm>({ nombre: '', unidad: 'kg', unidadesQueTrae: 1, precio: 0, moneda: 'COP' })
  const [recetaNombre, setRecetaNombre] = useState('')
  const [precioActual, setPrecioActual] = useState(0)
  const [margen, setMargen] = useState(40)
  const [usoInsumos, setUsoInsumos] = useState<number[]>([])
  const [resultado, setResultado] = useState<{ costoBase: number; precioSugerido: number } | null>(null)
  const { piezas, lanzar } = useConfeti()
  const { toast, mostrarToast } = useToast()
  const simbolo = SIMBOLOS_MONEDA[moneda]

  const siguientePasoTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  function irA(n: number) {
    setPaso(n)
    window.scrollTo(0, 0)
  }

  function elegirTipoNegocio(tipo: string) {
    setTipoNegocio(tipo)
    const ej = EJEMPLOS_NEGOCIO[tipo] || EJEMPLOS_NEGOCIO.otro
    // Los insumos los agrega el cliente desde cero — nada precargado, ni como chip ni en
    // el formulario. Solo se adapta el nombre/precio de ejemplo del PRODUCTO (paso 5).
    setInsumos([])
    setForm({ nombre: '', unidad: 'kg', unidadesQueTrae: 1, precio: 0, moneda })
    setRecetaNombre(ej.productoNombre)
    setPrecioActual(ej.precioActual)
    clearTimeout(siguientePasoTimer.current)
    siguientePasoTimer.current = setTimeout(() => irA(3), 300)
  }

  function elegirDolor(id: string, respuesta: string) {
    setDolorElegido(id)
    setRespuestaDolor(respuesta)
    clearTimeout(siguientePasoTimer.current)
    siguientePasoTimer.current = setTimeout(() => irA(4), 1100)
  }

  function cambiarUnidad(unidad: UnidadInsumo) {
    setForm((f) => ({ ...f, unidad, unidadesQueTrae: unidad === 'docena' ? 12 : f.unidadesQueTrae }))
  }

  function agregarInsumo() {
    if (insumos.length >= MAX_INSUMOS) return
    if (!form.precio) {
      mostrarToast(<svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2"><path d="M12 9v4M12 17h.01" /><circle cx="12" cy="12" r="9" /></svg>, 'Escribe el precio de compra antes de agregarlo.')
      return
    }
    setInsumos((prev) => [...prev, form])
    setForm({ nombre: '', unidad: 'kg', unidadesQueTrae: 1, precio: 0, moneda })
    mostrarToast(<svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>, 'Insumo agregado.')
  }

  function editarInsumo(idx: number) {
    const ins = insumos[idx]
    setInsumos((prev) => prev.filter((_, i) => i !== idx))
    setForm(ins)
    setMoneda(ins.moneda)
  }

  function quitarInsumo(idx: number) {
    setInsumos((prev) => prev.filter((_, i) => i !== idx))
  }

  function seguirAReceta() {
    if (!insumos.length) {
      mostrarToast(<svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2"><path d="M12 9v4M12 17h.01" /><circle cx="12" cy="12" r="9" /></svg>, 'Agrega al menos un insumo antes de seguir.')
      return
    }
    setUsoInsumos(insumos.map((i) => i.cantidadUsada ?? (i.unidad === 'unidad' || i.unidad === 'docena' || i.unidad === 'paquete' ? 1 : 100)))
    irA(5)
  }

  function volverDeReceta() {
    const ultimo = insumos[insumos.length - 1]
    if (ultimo) {
      setInsumos((prev) => prev.slice(0, -1))
      setForm(ultimo)
    }
    irA(4)
  }

  function calcularYMostrar() {
    let costoInsumo = 0
    insumos.forEach((ins, idx) => {
      const cantidadUsada = usoInsumos[idx] || 0
      costoInsumo += costoPorUnidadBase(ins.precio, ins.unidad, ins.unidadesQueTrae) * cantidadUsada
    })
    const costoBase = Math.round(costoInsumo + costoInsumo * 0.35)
    const precioSugerido = Math.round(costoBase / (1 - margen / 100))
    setResultado({ costoBase, precioSugerido })
    if (precioActual && precioActual >= precioSugerido) {
      // Se retrasa hasta que termine el fundido de entrada de la pantalla (.entrada, 450ms) —
      // si no, el confeti cae mientras la pantalla todavía está apareciendo y se ve apagado.
      setTimeout(() => lanzar(14), 480)
    }
    irA(6)
  }

  function comparacion() {
    if (!resultado || !precioActual) return null
    const { costoBase, precioSugerido } = resultado
    if (precioActual <= costoBase) {
      const diferencia = costoBase - precioActual
      return {
        clase: 'es-error',
        icono: <><path d="M12 9v4M12 17h.01" /><circle cx="12" cy="12" r="9" /></>,
        texto: `Con ${simbolo}${precioActual.toLocaleString('es-CO')} estás perdiendo ${simbolo}${diferencia.toLocaleString('es-CO')} en cada uno — por eso al final del mes la plata no alcanza.`,
      }
    }
    if (precioActual < precioSugerido) {
      const margenReal = Math.round(((precioActual - costoBase) / precioActual) * 100)
      return {
        clase: 'es-aviso',
        icono: <><path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" /><path d="M12 9v4M12 17h.01" /></>,
        texto: `Con ${simbolo}${precioActual.toLocaleString('es-CO')} tu ganancia real es solo del ${margenReal}% — no estás perdiendo, pero puedes ganar más.`,
      }
    }
    const margenReal2 = Math.round(((precioActual - costoBase) / precioActual) * 100)
    return {
      clase: 'es-exito',
      icono: <path d="M20 6L9 17l-5-5" />,
      texto: `¡Vas bien! Con ${simbolo}${precioActual.toLocaleString('es-CO')} ya tienes una ganancia real del ${margenReal2}%.`,
    }
  }

  const cmp = paso === 6 ? comparacion() : null

  return (
    <PhoneFrame onBack={paso > 1 ? () => (paso === 5 ? volverDeReceta() : irA(paso - 1)) : undefined} progreso={{ actual: paso, total: TOTAL_PASOS }}>
      <div className="onboarding">
        {paso === 1 && (
          <>
            <div className="pantalla-contenido entrada" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 18 }}>
              <div className="chip-icono grande" style={{ margin: '0 auto' }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" /><circle cx="12" cy="12" r="4" /></svg>
              </div>
              <h1>Conocerás el precio <span className="acento">real</span> de tu producto en menos de 2 minutos</h1>
              <p className="sub">Nada de fórmulas ni matemática: tú escribes, MargenPro calcula.</p>
              <div className="lista-promesa">
                <div className="fila"><span className="check-custom">{iconoCheck()}</span> Sin tarjeta, sin crear cuenta todavía</div>
                <div className="fila"><span className="check-custom">{iconoCheck()}</span> Con tu ganancia real, no a ojo</div>
                <div className="fila"><span className="check-custom">{iconoCheck()}</span> Con un producto tuyo real</div>
              </div>
            </div>
            <div className="pantalla-footer"><button className="btn-cta" onClick={() => irA(2)}>Empezar →</button></div>
          </>
        )}

        {paso === 2 && (
          <div className="pantalla-contenido entrada">
            <h2 style={{ fontSize: 21, marginBottom: 6, textAlign: 'center' }}>¿Qué tipo de negocio lideras hoy?</h2>
            <p className="sub" style={{ fontSize: '13.5px', marginBottom: 18, textAlign: 'center', marginLeft: 'auto', marginRight: 'auto' }}>Así tus ejemplos van a ser de tu propio rubro, no genéricos.</p>
            <div className="opciones-lista">
              {TIPOS_NEGOCIO.map((t) => (
                <button key={t.id} className={`opcion-grande${tipoNegocio === t.id ? ' elegida' : ''}`} onClick={() => elegirTipoNegocio(t.id)}>
                  <div className="chip-icono"><t.Icono size={24} weight="duotone" /></div>
                  <span className="texto">{t.texto}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {paso === 3 && (
          dolorElegido === null ? (
            <div className="pantalla-contenido entrada">
              <h2 style={{ fontSize: 21, marginBottom: 6, textAlign: 'center' }}>¿Cómo calculas tus precios hoy?</h2>
              <p className="sub" style={{ fontSize: '13.5px', marginBottom: 18, textAlign: 'center', marginLeft: 'auto', marginRight: 'auto' }}>No hay respuesta mala — por eso estás aquí.</p>
              <div className="opciones-lista">
                {OPCIONES_DOLOR.map((d) => (
                  <button key={d.id} className="opcion-grande" onClick={() => elegirDolor(d.id, d.respuesta)}>
                    <div className="chip-icono"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{d.icono}</svg></div>
                    <span className="texto">{d.texto}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="respuesta-empatica">
              <div className="chip-icono grande"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" /></svg></div>
              <p>{respuestaDolor}</p>
              <button className="btn-cta" style={{ marginTop: 6 }} onClick={() => irA(4)}>Continuar →</button>
            </div>
          )
        )}

        {paso === 4 && (
          <>
            <div className="pantalla-contenido entrada">
              <h2 style={{ fontSize: 22, marginBottom: 6, textAlign: 'center' }}>¿Qué compraste para producir?</h2>
              <p className="sub" style={{ fontSize: 14, marginBottom: 22, textAlign: 'center', marginLeft: 'auto', marginRight: 'auto' }}>Un insumo real tuyo — harina, carne, empaques, lo que sea. Lo puedes editar después.</p>
              {insumos.length < MAX_INSUMOS && (
                <>
                  <div className="campo">
                    <label htmlFor="insumoNombre">Nombre del insumo</label>
                    <input id="insumoNombre" value={form.nombre} placeholder="Ej: Harina de trigo" onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />
                  </div>
                  <div className="campo">
                    <label htmlFor="insumoUnidad">¿Cómo lo compraste?</label>
                    <select id="insumoUnidad" value={form.unidad} onChange={(e) => cambiarUnidad(e.target.value as UnidadInsumo)}>
                      <option value="kg">Kilo (kg)</option>
                      <option value="g">Gramo (g)</option>
                      <option value="L">Litro (L)</option>
                      <option value="ml">Mililitro (ml)</option>
                      <option value="unidad">Unidad / pieza</option>
                      <option value="docena">Docena</option>
                      <option value="libra">Libra</option>
                      <option value="paquete">Paquete / caja</option>
                    </select>
                  </div>
                  {(form.unidad === 'docena' || form.unidad === 'paquete') && (
                    <div className="campo">
                      <label htmlFor="insumoUnidadesTrae">¿Cuántas unidades trae?</label>
                      <input id="insumoUnidadesTrae" type="number" value={form.unidadesQueTrae || ''} onChange={(e) => { const raw = e.target.value; setForm((f) => ({ ...f, unidadesQueTrae: raw === '' ? 0 : parseFloat(raw) || 0 })) }} />
                    </div>
                  )}
                  <label htmlFor="insumoPrecio" style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-2)', marginBottom: 7 }}>Precio de compra</label>
                  <div className="campo-con-moneda">
                    <div className="campo-prefijo"><span>{simbolo}</span>
                      <input id="insumoPrecio" type="number" placeholder="12000" value={form.precio || ''} onChange={(e) => setForm((f) => ({ ...f, precio: parseFloat(e.target.value) || 0 }))} />
                    </div>
                    <select className="selector-moneda" value={moneda} onChange={(e) => { setMoneda(e.target.value as Moneda); setForm((f) => ({ ...f, moneda: e.target.value as Moneda })) }}>
                      <option value="COP">COP</option>
                      <option value="MXN">MXN</option>
                      <option value="PEN">PEN</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                  <p className="nota-moneda">Detectamos tu moneda por tu país — puedes cambiarla. Esto es solo para TUS insumos; el precio de MargenPro siempre se cobra en USD.</p>
                </>
              )}
              <div>
                {insumos.map((ins, idx) => (
                  <div className="insumo-chip" key={idx}>
                    <span className="nombre">{ins.nombre}</span>
                    <span className="precio">{SIMBOLOS_MONEDA[ins.moneda]}{Math.round(ins.precio).toLocaleString('es-CO')}</span>
                    <button type="button" className="editar-insumo" aria-label="Editar insumo" onClick={() => editarInsumo(idx)}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" /></svg>
                    </button>
                    <button type="button" className="quitar-insumo" aria-label="Quitar insumo" onClick={() => quitarInsumo(idx)}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
              {insumos.length < MAX_INSUMOS && (
                <button type="button" className="btn-agregar-insumo" onClick={agregarInsumo}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                  Agregar insumo {insumos.length > 0 ? `(${insumos.length}/${MAX_INSUMOS})` : ''}
                </button>
              )}
            </div>
            <div className="pantalla-footer">
              <button className="btn-cta" onClick={seguirAReceta}>Seguir →</button>
            </div>
          </>
        )}

        {paso === 5 && (
          <>
            <div className="pantalla-contenido entrada">
              <h2 style={{ fontSize: 22, marginBottom: 6, textAlign: 'center' }}>Ahora arma tu producto</h2>
              <p className="sub" style={{ fontSize: 14, marginBottom: 18, textAlign: 'center', marginLeft: 'auto', marginRight: 'auto' }}>¿Cuánto usas de cada insumo, y qué margen de ganancia quieres?</p>
              <div className="campo">
                <label htmlFor="recetaNombre">Nombre del producto</label>
                <input id="recetaNombre" value={recetaNombre} placeholder="Ej: Torta de chocolate x 12 porciones" onChange={(e) => setRecetaNombre(e.target.value)} />
              </div>
              {insumos.map((ins, idx) => (
                <div className="campo" key={idx}>
                  <label htmlFor={`usoInsumo${idx}`}>{etiquetaCantidadPara(ins.unidad)} de <strong>{ins.nombre}</strong>?</label>
                  <input id={`usoInsumo${idx}`} type="number" value={usoInsumos[idx] || ''} onChange={(e) => {
                    const raw = e.target.value
                    const v = raw === '' ? 0 : parseFloat(raw) || 0
                    setUsoInsumos((prev) => { const copia = [...prev]; copia[idx] = v; return copia })
                  }} />
                </div>
              ))}
              <div className="campo campo-prefijo">
                <label htmlFor="precioActual">¿Cuánto cobras HOY por esto?</label>
                <span>{simbolo}</span>
                <input id="precioActual" type="number" placeholder="18000" value={precioActual || ''} onChange={(e) => setPrecioActual(parseFloat(e.target.value) || 0)} />
              </div>
              <div className="slider-wrap">
                <div className="paso-indicador" style={{ marginBottom: 4 }}>Margen de ganancia que quieres</div>
                <div className="slider-valor">{margen}%</div>
                <input type="range" min={10} max={70} value={margen} onChange={(e) => setMargen(parseInt(e.target.value, 10))} />
              </div>
            </div>
            <div className="pantalla-footer">
              <button className="btn-cta" onClick={calcularYMostrar}>Calcular mi precio →</button>
            </div>
          </>
        )}

        {paso === 6 && resultado && (
          <>
            <div className="pantalla-contenido entrada" style={{ alignItems: 'center', textAlign: 'center', gap: 8, justifyContent: 'center' }}>
              <div className="paso-indicador" style={{ textAlign: 'center' }}>Tu primer costeo</div>
              <h2 style={{ fontSize: 20, textAlign: 'center', marginBottom: 4 }}>{recetaNombre}</h2>
              {cmp && (
                <div className={`comparacion-actual ${cmp.clase}`}>
                  {cmp.clase === 'es-exito' && <Confetti piezas={piezas} />}
                  <div className="fila-cmp">
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{cmp.icono}</svg>
                    <p>{cmp.texto}</p>
                  </div>
                </div>
              )}
              <div className="heroe-tarjeta"><div>
                <div className="precio-heroe">{simbolo}{resultado.precioSugerido.toLocaleString('es-CO')}<span className="sm">precio sugerido por unidad</span></div>
                <div className="fila-dato"><span>Costo real</span><span>{simbolo}{resultado.costoBase.toLocaleString('es-CO')}</span></div>
                <div className="fila-dato"><span>Tu ganancia</span><span style={{ color: 'var(--accent)', fontWeight: 700 }}>{margen}%</span></div>
              </div></div>
              <p className="sub" style={{ textAlign: 'center', marginTop: 16, fontSize: '13.5px' }}>Así de simple es cada vez — y esto fue con datos reales tuyos.</p>
            </div>
            <div className="pantalla-footer"><button className="btn-cta" onClick={() => irA(7)}>Ver qué más hace MargenPro →</button></div>
          </>
        )}

        {paso === 7 && (
          <>
            <div className="pantalla-contenido entrada">
              <h2 style={{ fontSize: 21, marginBottom: 4, textAlign: 'center' }}>Esto es lo que vas a <span className="acento">ver y usar</span></h2>
              <p className="sub" style={{ fontSize: '13.5px', marginBottom: 6, textAlign: 'center', marginLeft: 'auto', marginRight: 'auto' }}>Vistas ilustrativas — la app real está en construcción.</p>
              <div className="tour-grid">
                {TOUR.map((t) => (
                  <div className="tour-card" key={t.nombre}>
                    <div className="chip-icono"><t.Icono size={24} weight="duotone" /></div>
                    <div className="nombre">{t.nombre}</div>
                    <p>{t.label}</p>
                  </div>
                ))}
              </div>
              <p className="sub" style={{ textAlign: 'center', marginTop: 18, fontSize: 13, maxWidth: '78%', marginLeft: 'auto', marginRight: 'auto' }}>Esto y mucho más podrás encontrar en <strong>MargenPro</strong>.</p>
            </div>
            <div className="pantalla-footer"><button className="btn-cta" onClick={() => navigate('/paywall')}>Quiero usar todo esto →</button></div>
          </>
        )}
      </div>
      <Toast toast={toast} />
    </PhoneFrame>
  )
}
