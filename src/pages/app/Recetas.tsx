import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { normalizarParaBuscar, useAppStore } from '../../lib/appStore'
import { convertirAGramos, GRAMOS_POR_LIBRA } from '../../lib/costeo'
import { logEvent } from '../../lib/eventos'
import { Toast, useToast } from '../../components/Toast'
import type { Insumo, InsumoUsado } from '../../lib/types'
import './Recetas.css'

type MedidaFila = 'g' | 'ml' | 'libra' | 'pz' | 'taza' | 'cda' | 'cdta'

interface FilaInsumo {
  insumoId: string
  textoBusqueda: string
  cantidad: string
  medida: MedidaFila
  /** Solo se usa (y se pide en pantalla) cuando la medida elegida no coincide con la familia
   * natural del insumo — ej: el insumo se compra por peso pero aquí se quiere usar por piezas. */
  equivalencia: string
}

const ETIQUETA_MEDIDA: Record<MedidaFila, string> = { g: 'gramos', ml: 'mililitros', libra: 'libras', pz: 'piezas', taza: 'tazas', cda: 'cucharadas', cdta: 'cucharaditas' }

/** Las medidas "medibles" (peso/volumen, convertibles por una constante fija o una densidad
 * aproximada) vs. las "de conteo" (piezas sueltas, sin ninguna conversión física posible) — se
 * usan para saber si hace falta pedir una equivalencia a mano. La libra es peso, igual que el
 * kilo o el gramo — NUNCA necesita equivalencia para pasar a gramos, se convierte sola. */
function familiaDeMedida(m: MedidaFila): 'medible' | 'conteo' {
  return m === 'pz' ? 'conteo' : 'medible'
}
function familiaNaturalInsumo(ins: Insumo | undefined): 'medible' | 'conteo' {
  if (!ins) return 'conteo'
  return ins.unidad === 'kg' || ins.unidad === 'g' || ins.unidad === 'L' || ins.unidad === 'ml' || ins.unidad === 'libra' ? 'medible' : 'conteo'
}
function medidaInicialPara(ins: Insumo | undefined): MedidaFila {
  if (!ins) return 'pz'
  if (ins.unidad === 'kg' || ins.unidad === 'g') return 'g'
  if (ins.unidad === 'L' || ins.unidad === 'ml') return 'ml'
  if (ins.unidad === 'libra') return 'libra'
  return 'pz'
}
/** Cómo se llama la unidad BASE en la que ya se guarda el stock/precio de este insumo —
 * para preguntar la equivalencia en esos términos. */
function etiquetaBaseInsumo(ins: Insumo | undefined): string {
  if (!ins) return 'unidad'
  if (ins.unidad === 'kg' || ins.unidad === 'g') return 'gramos'
  if (ins.unidad === 'L' || ins.unidad === 'ml') return 'mililitros'
  if (ins.unidad === 'libra') return 'libras'
  return 'piezas'
}

const IconoAviso = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4M12 17h.01" /><circle cx="12" cy="12" r="9" /></svg>
)
const IconoOk = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
)
const IconoVolver = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
)
const IconoQuitar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
)
const IconoReceta = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>
)

export default function Recetas() {
  const { insumos, recetas, cargandoRecetas, guardarRecetaNueva, actualizarRecetaExistente, eliminarReceta, cfg, modoCalculo, money, costear, plan } = useAppStore()
  const navigate = useNavigate()
  const TOPE_RECETAS_GRATIS = 3
  const limiteRecetasAlcanzado = plan === 'gratis' && recetas.length >= TOPE_RECETAS_GRATIS
  const { toast, mostrarToast } = useToast()
  const location = useLocation()
  const [vista, setVista] = useState<'lista' | 'constructor'>('lista')

  const [editId, setEditId] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [nombre, setNombre] = useState('')
  const [unidades, setUnidades] = useState('1')
  const [filas, setFilas] = useState<FilaInsumo[]>([])
  const [margen, setMargen] = useState(50)
  const [horas, setHoras] = useState('')
  const [incluirManoDeObraSimple, setIncluirManoDeObraSimple] = useState(false)
  const [resultado, setResultado] = useState<{ calc: ReturnType<typeof costear>; insumosUsados: InsumoUsado[]; margen: number; horas: number; unidades: number } | null>(null)
  const [filaAbierta, setFilaAbierta] = useState<number | null>(null)

  function abrirConstructor() {
    if (limiteRecetasAlcanzado) {
      mostrarToast(<IconoAviso />, `El plan gratis permite hasta ${TOPE_RECETAS_GRATIS} recetas activas. Pásate a Pro para agregar recetas ilimitadas.`)
      return
    }
    setEditId(null)
    setNombre('')
    setUnidades('1')
    setFilas(insumos.length ? [{ insumoId: insumos[0].id, textoBusqueda: insumos[0].nombre, cantidad: '100', medida: medidaInicialPara(insumos[0]), equivalencia: '' }] : [])
    setMargen(50)
    setHoras('')
    setIncluirManoDeObraSimple(false)
    setResultado(null)
    setConfirmandoEliminar(false)
    setVista('constructor')
  }

  function abrirEditar(id: string) {
    const r = recetas.find((x) => x.id === id)
    if (!r) return
    setEditId(id)
    setNombre(r.nombre)
    setUnidades(String(r.unidades))
    setFilas(r.insumosUsados.map((u) => {
      const ins = insumos.find((i) => i.id === u.insumoId)
      return { insumoId: u.insumoId, textoBusqueda: ins?.nombre ?? '', cantidad: String(u.cantidadGramosOPiezas), medida: medidaInicialPara(ins), equivalencia: '' }
    }))
    setMargen(r.margen)
    setHoras(r.horas ? String(r.horas) : '')
    setIncluirManoDeObraSimple(false)
    setResultado({ calc: costear(r.insumosUsados, r.margen, r.horas, r.unidades, false), insumosUsados: r.insumosUsados, margen: r.margen, horas: r.horas, unidades: r.unidades })
    setConfirmandoEliminar(false)
    setVista('constructor')
  }

  async function eliminarEstaReceta() {
    if (editId === null) return
    setEliminando(true)
    const ok = await eliminarReceta(editId)
    setEliminando(false)
    if (!ok) { mostrarToast(<IconoAviso />, 'No pudimos eliminar la receta. Intenta de nuevo.'); setConfirmandoEliminar(false); return }
    setVista('lista')
    mostrarToast(<IconoOk />, 'Receta eliminada.')
  }

  useEffect(() => {
    if ((location.state as { abrirConstructor?: boolean } | null)?.abrirConstructor) abrirConstructor()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function agregarFila() {
    if (!insumos.length) return
    setFilas((prev) => [...prev, { insumoId: insumos[0].id, textoBusqueda: insumos[0].nombre, cantidad: '100', medida: medidaInicialPara(insumos[0]), equivalencia: '' }])
  }
  function quitarFila(idx: number) {
    setFilas((prev) => prev.filter((_, i) => i !== idx))
  }
  function actualizarFila(idx: number, cambios: Partial<FilaInsumo>) {
    setFilas((prev) => prev.map((f, i) => (i === idx ? { ...f, ...cambios } : f)))
  }

  function calcularReceta() {
    if (!filas.length) { mostrarToast(<IconoAviso />, 'Agrega al menos un insumo antes de calcular.'); return }
    const margenNum = margen
    const horasNum = Math.max(0, parseFloat(horas) || 0)
    const unidadesNum = Math.max(1, parseFloat(unidades) || 1)
    if (modoCalculo === 'real' && cfg.fijoPct + cfg.variablePct + margenNum >= 95) {
      mostrarToast(<IconoAviso />, `Entre tu arriendo/gastos fijos, tus otros gastos y tu margen suman ${cfg.fijoPct + cfg.variablePct + margenNum}% — eso ya casi no deja espacio para un precio real. Baja alguno en Ajustes o en el margen de esta receta.`)
    }
    const insumosUsados: InsumoUsado[] = filas.map((f) => {
      const ins = insumos.find((i) => i.id === f.insumoId)
      const cantidadNum = parseFloat(f.cantidad) || 0
      const coincide = familiaDeMedida(f.medida) === familiaNaturalInsumo(ins)
      let cantidadBase: number
      if (coincide) {
        if (familiaDeMedida(f.medida) === 'medible') {
          const gramos = convertirAGramos(cantidadNum, f.medida, ins?.nombre ?? '')
          // La base de un insumo tasado en libras es la LIBRA, no el gramo (mismo criterio que
          // ya usa costoPorUnidadBase) — si la receta lo usa en gramos, hay que volver a libras.
          cantidadBase = ins?.unidad === 'libra' ? gramos / GRAMOS_POR_LIBRA : gramos
        } else {
          cantidadBase = cantidadNum
        }
      } else {
        // Medida distinta a cómo se compra el insumo (ej: lo compras por peso pero aquí lo
        // usas por piezas) — se necesita la equivalencia que el usuario dio para convertir bien.
        cantidadBase = cantidadNum * (parseFloat(f.equivalencia) || 0)
      }
      return { insumoId: f.insumoId, cantidadGramosOPiezas: cantidadBase }
    })
    const calc = costear(insumosUsados, margenNum, horasNum, unidadesNum, incluirManoDeObraSimple)
    setResultado({ calc, insumosUsados, margen: margenNum, horas: horasNum, unidades: unidadesNum })
  }

  async function guardarReceta() {
    if (!resultado) return
    const nombreFinal = nombre.trim() || 'Mi producto'
    const datos = { nombre: nombreFinal, margen: resultado.margen, horas: resultado.horas, unidades: resultado.unidades, insumosUsados: resultado.insumosUsados }
    setGuardando(true)
    const ok = editId !== null ? await actualizarRecetaExistente(editId, datos) : await guardarRecetaNueva(datos)
    setGuardando(false)
    if (!ok) { mostrarToast(<IconoAviso />, 'No pudimos guardar la receta. Intenta de nuevo.'); return }
    if (editId === null) void logEvent('receta_creada')
    setVista('lista')
    mostrarToast(<IconoOk />, editId !== null ? 'Receta actualizada.' : 'Receta guardada — ya puedes cotizarla.')
  }

  if (vista === 'constructor') {
    return (
      <>
        <button className="btn-atras-sub" onClick={() => setVista('lista')}><IconoVolver />Recetas</button>
        <h2 className="titulo-seccion" style={{ fontSize: 19 }}>{editId !== null ? 'Editar receta' : 'Costea tu producto'}</h2>
        <div className="campo">
          <label>Nombre del producto</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Torta de vainilla x 10" />
        </div>
        <div className="campo">
          <label>¿Cuántas porciones o piezas salen de UNA tanda de esta receta?</label>
          <p className="ayuda-campo">Ej: 12 si una torta de esta receta siempre sale en 12 porciones, 10 si cada tanda rinde 10 hamburguesas.</p>
          <input type="number" value={unidades} onChange={(e) => setUnidades(e.target.value)} placeholder="Ej: 12" />
        </div>

        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 8 }}>Insumos que usas</label>
        {filas.map((f, idx) => {
          const ins = insumos.find((i) => i.id === f.insumoId)
          const necesitaEquivalencia = familiaDeMedida(f.medida) !== familiaNaturalInsumo(ins)
          const textoBuscado = normalizarParaBuscar(f.textoBusqueda.trim())
          const sugerencias = textoBuscado ? insumos.filter((i) => normalizarParaBuscar(i.nombre).includes(textoBuscado)).slice(0, 8) : []
          return (
            <div className="insumo-chip" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }} key={idx}>
              <div style={{ position: 'relative' }}>
                <input style={{ width: '100%', padding: '11px 10px', borderRadius: 9, border: '1.5px solid var(--sunken)', background: 'var(--surface)', fontSize: 15, textAlign: 'left' }}
                  placeholder="Escribe para buscar…"
                  value={f.textoBusqueda}
                  onFocus={() => setFilaAbierta(idx)}
                  onBlur={() => setTimeout(() => setFilaAbierta((actual) => (actual === idx ? null : actual)), 150)}
                  onChange={(e) => { actualizarFila(idx, { textoBusqueda: e.target.value }); setFilaAbierta(idx) }} />
                {filaAbierta === idx && textoBuscado && (
                  <div className="lista-sugerencias">
                    {sugerencias.length ? sugerencias.map((i) => (
                      <button key={i.id} type="button"
                        onMouseDown={() => {
                          actualizarFila(idx, { insumoId: i.id, textoBusqueda: i.nombre, medida: medidaInicialPara(i), equivalencia: '' })
                          setFilaAbierta(null)
                        }}>
                        {i.nombre}
                      </button>
                    )) : <div className="sin-resultados">No encontramos ningún insumo con ese nombre — revisa Insumos para ver cómo lo registraste.</div>}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="number" value={f.cantidad} onChange={(e) => actualizarFila(idx, { cantidad: e.target.value })}
                  style={{ width: 72, padding: '11px 10px', borderRadius: 9, border: '1.5px solid var(--sunken)', background: 'var(--surface)', fontSize: 15, textAlign: 'left' }} />
                <select style={{ flex: 1, padding: '11px 8px', borderRadius: 9, border: '1.5px solid var(--sunken)', background: 'var(--surface)', fontSize: 14 }}
                  value={f.medida} onChange={(e) => actualizarFila(idx, { medida: e.target.value as MedidaFila })}>
                  <option value="g">gramos</option>
                  <option value="ml">mililitros</option>
                  <option value="taza">tazas</option>
                  <option value="cda">cucharadas</option>
                  <option value="cdta">cucharaditas</option>
                  <option value="pz">piezas</option>
                  <option value="libra">libras</option>
                </select>
                <button onClick={() => quitarFila(idx)} aria-label="Quitar" style={{ flexShrink: 0 }}><IconoQuitar /></button>
              </div>
              {necesitaEquivalencia && (
                <div className="campo" style={{ marginTop: 2 }}>
                  <label style={{ fontSize: 11.5 }}>¿Cuántos {etiquetaBaseInsumo(ins)} tiene 1 {ETIQUETA_MEDIDA[f.medida].replace(/s$/, '')}?</label>
                  <input type="number" value={f.equivalencia} onChange={(e) => actualizarFila(idx, { equivalencia: e.target.value })}
                    placeholder="Ej: 20" style={{ padding: '9px 8px', borderRadius: 9, border: '1.5px solid var(--sunken)', background: 'var(--surface)', fontSize: 12.5 }} />
                </div>
              )}
            </div>
          )
        })}
        <button className="btn-secundario" onClick={agregarFila}>+ Agregar insumo</button>

        <div className="nota-estimado">
          <IconoAviso />
          Para harina, azúcar, mantequilla, aceite y leche puedes escribir en tazas o cucharadas en vez de gramos — es un estimado, ajústalo si lo sabes mejor.
        </div>

        <div className="slider-wrap">
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)' }}>Margen de ganancia que quieres</label>
          <div className="slider-valor">{margen}%</div>
          <input type="range" min={10} max={70} value={margen} onChange={(e) => setMargen(parseInt(e.target.value, 10))} />
        </div>

        <div className="fila-config" style={{ border: 'none', padding: '0 0 14px' }}>
          <div className="txt"><div className="n">¿Cuántas horas te toma hacerla?</div><div className="d">{modoCalculo === 'real' ? 'Se cuenta siempre, porque activaste "gastos reales" en Configuración' : 'Solo se cuenta si prendes la opción de abajo'}</div></div>
        </div>
        <input type="number" value={horas} onChange={(e) => setHoras(e.target.value)} placeholder="Ej: 2"
          style={{ width: '100%', padding: '13px 15px', borderRadius: 12, border: '1.5px solid var(--sunken)', background: 'var(--surface)', color: 'var(--text-1)', fontSize: 14.5, marginBottom: modoCalculo === 'real' ? 16 : 10 }} />

        {modoCalculo === 'simple' && (
          <div className="fila-config" style={{ marginBottom: 16 }}>
            <div className="txt"><div className="n">Incluir mi tiempo en este cálculo</div><div className="d">Apagado por defecto, para que el modo rápido siga siendo rápido</div></div>
            <button className={`toggle-switch${incluirManoDeObraSimple ? ' on' : ''}`} onClick={() => setIncluirManoDeObraSimple((v) => !v)} aria-label="Incluir mi tiempo en este cálculo"><span /></button>
          </div>
        )}

        <button className="btn-cta" onClick={calcularReceta}>Calcular precio →</button>

        {resultado && (
          <div className="resultado-mini">
            <div className="precio">{money(resultado.calc.precioSugerido)}</div>
            <div className="sub">precio sugerido · costo real {money(resultado.calc.costoBase)}</div>
            {resultado.unidades > 1 && (
              <div className="por-unidad">Por unidad: cuesta {money(resultado.calc.costoPorUnidad)} · cóbrala en <span>{money(resultado.calc.precioPorUnidad)}</span></div>
            )}
            {modoCalculo === 'real' && (
              <div className="desglose-costo">
                <div className="fila"><span>Insumos</span><span>{money(resultado.calc.costoInsumos)}</span></div>
                {resultado.calc.costoManoDeObra > 0 && (
                  <div className="fila"><span>Tu hora de trabajo</span><span>{money(resultado.calc.costoManoDeObra)}</span></div>
                )}
                <div className="fila"><span>Tu parte de arriendo y gastos fijos ({cfg.fijoPct}% · costo fijo)</span><span>{money(resultado.calc.costoFijoAsignado)}</span></div>
                {cfg.variablePct > 0 && (
                  <div className="fila"><span>Otros gastos ({cfg.variablePct}% · costo variable)</span><span>{money(resultado.calc.costoVariableAsignado)}</span></div>
                )}
                <div className="fila total"><span>Costo real de esta receta ({resultado.unidades} {resultado.unidades > 1 ? 'unidades' : 'unidad'})</span><span>{money(resultado.calc.costoBase)}</span></div>
                <p className="formula-ganancia">Tu arriendo y tus otros gastos se cobran como % de tu precio (lo configuras en Ajustes) — no según cuánto vendas al mes, así el precio no cambia de una tanda a otra.</p>
                {resultado.calc.pctImposible ? (
                  <p className="formula-ganancia" style={{ color: 'var(--error)', fontWeight: 700 }}>Tus porcentajes configurados no caben en un precio real — este número está forzado para no romperse. Baja el % de gastos fijos, el de otros gastos, o el margen.</p>
                ) : resultado.calc.pctAlto && (
                  <p className="formula-ganancia" style={{ color: 'var(--aviso)', fontWeight: 700 }}>⚠️ Con estos números, el {Math.round((cfg.fijoPct + cfg.variablePct + resultado.margen))}% de tu precio se va en gastos y margen — de cada $100 que cobres, menos de $30 te quedan para cubrir tus insumos y tu trabajo. Baja el margen de esta receta, o el % de gastos fijos/otros gastos en Ajustes, para que tu precio no se dispare por encima del mercado.</p>
                )}
              </div>
            )}
            {modoCalculo === 'simple' && incluirManoDeObraSimple && resultado.calc.costoManoDeObra > 0 && (
              <p className="formula-ganancia" style={{ marginTop: 10 }}>Incluye tu tiempo: {money(resultado.calc.costoManoDeObra)} de las {resultado.horas} horas que dijiste.</p>
            )}
          </div>
        )}
        {resultado && (
          <button className="btn-secundario" style={{ borderStyle: 'solid' }} onClick={guardarReceta} disabled={guardando}>
            {guardando ? 'Guardando…' : editId !== null ? 'Guardar cambios' : 'Guardar receta'}
          </button>
        )}
        {editId !== null && (
          confirmandoEliminar ? (
            <div className="tarjeta" style={{ marginTop: 16, borderColor: 'rgb(var(--error-tint)/.4)' }}>
              <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>¿Eliminar "{nombre}" para siempre?</p>
              <p className="ayuda-campo" style={{ marginBottom: 12 }}>Esto no se puede deshacer. Tus cotizaciones ya hechas con esta receta se quedan igual, solo quedan sin enlace a ella.</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-secundario" style={{ margin: 0, width: 'auto', flex: 1 }} onClick={() => setConfirmandoEliminar(false)}>Cancelar</button>
                <button className="btn-secundario" style={{ margin: 0, width: 'auto', flex: 1, borderColor: 'rgb(var(--error-tint)/.4)', color: 'var(--error)' }} onClick={eliminarEstaReceta} disabled={eliminando}>{eliminando ? 'Eliminando…' : 'Sí, eliminar'}</button>
              </div>
            </div>
          ) : (
            <button className="btn-texto" style={{ marginTop: 10, color: 'var(--error)' }} onClick={() => setConfirmandoEliminar(true)}>Eliminar esta receta</button>
          )
        )}
        <Toast toast={toast} />
      </>
    )
  }

  return (
    <>
      <h2 className="titulo-seccion">Tus recetas</h2>
      <p className="sub-seccion">Cada una con su costo real y el precio sugerido.</p>
      {limiteRecetasAlcanzado && (
        <div className="aviso-precio" style={{ marginBottom: 14 }}>
          <IconoAviso />
          <div>
            <p><strong>Llegaste a tus {TOPE_RECETAS_GRATIS} recetas gratis.</strong> Pásate a Pro para costear recetas ilimitadas.</p>
            <button className="btn-texto" style={{ marginTop: 4, padding: 0 }} onClick={() => navigate('/paywall')}>Ver planes</button>
          </div>
        </div>
      )}
      <button className="btn-cta" style={{ marginBottom: 14 }} onClick={abrirConstructor}>+ Costear receta nueva</button>
      {cargandoRecetas ? (
        <div className="vacio"><p>Cargando tus recetas…</p></div>
      ) : !recetas.length ? (
        <div className="vacio"><p>Todavía no costeas ninguna receta.</p></div>
      ) : (
        <div>
          {recetas.map((r) => {
            const c = costear(r.insumosUsados, r.margen, r.horas, r.unidades)
            return (
              <div className="item-lista" key={r.id} onClick={() => abrirEditar(r.id)} style={{ cursor: 'pointer' }}>
                <div className="chip-icono"><IconoReceta /></div>
                <div className="info">
                  <div className="nombre">{r.nombre}</div>
                  <div className="meta">costo real {money(c.costoBase)}{r.unidades > 1 ? ` · ${money(c.precioPorUnidad)} c/u` : ''}</div>
                </div>
                <div className="cifra">{money(c.precioSugerido)}<span className="sub">{r.margen}% ganancia</span></div>
              </div>
            )
          })}
        </div>
      )}
      <Toast toast={toast} />
    </>
  )
}
