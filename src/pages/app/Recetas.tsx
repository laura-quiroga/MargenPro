import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAppStore } from '../../lib/appStore'
import { convertirAGramos } from '../../lib/costeo'
import { Toast, useToast } from '../../components/Toast'
import type { InsumoUsado } from '../../lib/types'
import './Recetas.css'

interface FilaInsumo {
  insumoId: number
  cantidad: string
  medida: 'g' | 'taza' | 'cda' | 'cdta' | 'pz'
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
  const { insumos, recetas, setRecetas, cfg, modoCalculo, money, costear } = useAppStore()
  const { toast, mostrarToast } = useToast()
  const location = useLocation()
  const [vista, setVista] = useState<'lista' | 'constructor'>('lista')

  const [editId, setEditId] = useState<number | null>(null)
  const [nombre, setNombre] = useState('')
  const [unidades, setUnidades] = useState('1')
  const [filas, setFilas] = useState<FilaInsumo[]>([])
  const [margen, setMargen] = useState(50)
  const [horas, setHoras] = useState('')
  const [resultado, setResultado] = useState<{ calc: ReturnType<typeof costear>; insumosUsados: InsumoUsado[]; margen: number; horas: number; unidades: number } | null>(null)

  function abrirConstructor() {
    setEditId(null)
    setNombre('')
    setUnidades('1')
    setFilas(insumos.length ? [{ insumoId: insumos[0].id, cantidad: '100', medida: 'g' }] : [])
    setMargen(50)
    setHoras('')
    setResultado(null)
    setVista('constructor')
  }

  function abrirEditar(id: number) {
    const r = recetas.find((x) => x.id === id)
    if (!r) return
    setEditId(id)
    setNombre(r.nombre)
    setUnidades(String(r.unidades))
    setFilas(r.insumosUsados.map((u) => {
      const ins = insumos.find((i) => i.id === u.insumoId)
      const esPeso = !!ins && (ins.unidad === 'kg' || ins.unidad === 'g')
      return { insumoId: u.insumoId, cantidad: String(u.cantidadGramosOPiezas), medida: esPeso ? 'g' : 'pz' }
    }))
    setMargen(r.margen)
    setHoras(r.horas ? String(r.horas) : '')
    setResultado({ calc: costear(r.insumosUsados, r.margen, r.horas, r.unidades), insumosUsados: r.insumosUsados, margen: r.margen, horas: r.horas, unidades: r.unidades })
    setVista('constructor')
  }

  useEffect(() => {
    if ((location.state as { abrirConstructor?: boolean } | null)?.abrirConstructor) abrirConstructor()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function agregarFila() {
    if (!insumos.length) return
    setFilas((prev) => [...prev, { insumoId: insumos[0].id, cantidad: '100', medida: 'g' }])
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
      const esPeso = ins && (ins.unidad === 'kg' || ins.unidad === 'g')
      const cantidadBase = esPeso ? convertirAGramos(cantidadNum, f.medida, ins!.nombre) : cantidadNum
      return { insumoId: f.insumoId, cantidadGramosOPiezas: cantidadBase }
    })
    const calc = costear(insumosUsados, margenNum, horasNum, unidadesNum)
    setResultado({ calc, insumosUsados, margen: margenNum, horas: horasNum, unidades: unidadesNum })
  }

  function guardarReceta() {
    if (!resultado) return
    const nombreFinal = nombre.trim() || 'Mi producto'
    if (editId !== null) {
      setRecetas((prev) => prev.map((r) => (r.id === editId
        ? { ...r, nombre: nombreFinal, margen: resultado.margen, horas: resultado.horas, unidades: resultado.unidades, insumosUsados: resultado.insumosUsados }
        : r)))
      setVista('lista')
      mostrarToast(<IconoOk />, 'Receta actualizada.')
      return
    }
    const siguienteId = recetas.length ? Math.max(...recetas.map((r) => r.id)) + 1 : 0
    setRecetas((prev) => [...prev, { id: siguienteId, nombre: nombreFinal, margen: resultado.margen, horas: resultado.horas, unidades: resultado.unidades, insumosUsados: resultado.insumosUsados }])
    setVista('lista')
    mostrarToast(<IconoOk />, 'Receta guardada — ya puedes cotizarla.')
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
          const esPeso = ins && (ins.unidad === 'kg' || ins.unidad === 'g')
          return (
            <div className="insumo-chip" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }} key={idx}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select style={{ flex: 1.4, padding: '9px 8px', borderRadius: 9, border: '1.5px solid var(--sunken)', background: 'var(--surface)', fontSize: 12.5 }}
                  value={f.insumoId} onChange={(e) => actualizarFila(idx, { insumoId: parseInt(e.target.value, 10) })}>
                  {insumos.map((i) => <option key={i.id} value={i.id}>{i.nombre}</option>)}
                </select>
                <input type="number" value={f.cantidad} onChange={(e) => actualizarFila(idx, { cantidad: e.target.value })}
                  style={{ width: 64, padding: '9px 8px', borderRadius: 9, border: '1.5px solid var(--sunken)', background: 'var(--surface)', fontSize: 12.5 }} />
                {esPeso ? (
                  <select style={{ flex: 1, padding: '9px 6px', borderRadius: 9, border: '1.5px solid var(--sunken)', background: 'var(--surface)', fontSize: 12.5 }}
                    value={f.medida} onChange={(e) => actualizarFila(idx, { medida: e.target.value as FilaInsumo['medida'] })}>
                    <option value="g">gramos</option>
                    <option value="taza">tazas</option>
                    <option value="cda">cucharadas</option>
                    <option value="cdta">cucharaditas</option>
                  </select>
                ) : (
                  <select style={{ flex: 1, padding: '9px 6px', borderRadius: 9, border: '1.5px solid var(--sunken)', background: 'var(--surface)', fontSize: 12.5 }} disabled value="pz">
                    <option value="pz">piezas</option>
                  </select>
                )}
                <button onClick={() => quitarFila(idx)} aria-label="Quitar"><IconoQuitar /></button>
              </div>
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
          <div className="txt"><div className="n">¿Cuántas horas te toma hacerla?</div><div className="d">Solo si activaste "gastos reales" en Configuración</div></div>
        </div>
        <input type="number" value={horas} onChange={(e) => setHoras(e.target.value)} placeholder="Ej: 2"
          style={{ width: '100%', padding: '13px 15px', borderRadius: 12, border: '1.5px solid var(--sunken)', background: 'var(--surface)', color: 'var(--text-1)', fontSize: 14.5, marginBottom: 16 }} />

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
                <div className="fila"><span>Tu parte de arriendo y gastos fijos ({cfg.fijoPct}%)</span><span>{money(resultado.calc.costoFijoAsignado)}</span></div>
                {cfg.variablePct > 0 && (
                  <div className="fila"><span>Otros gastos ({cfg.variablePct}%)</span><span>{money(resultado.calc.costoVariableAsignado)}</span></div>
                )}
                <div className="fila total"><span>Costo real de esta receta ({resultado.unidades} {resultado.unidades > 1 ? 'unidades' : 'unidad'})</span><span>{money(resultado.calc.costoBase)}</span></div>
                <p className="formula-ganancia">Tu arriendo y tus otros gastos se cobran como % de tu precio (lo configuras en Ajustes) — no según cuánto vendas al mes, así el precio no cambia de una tanda a otra.</p>
                {resultado.calc.pctImposible && (
                  <p className="formula-ganancia" style={{ color: 'var(--error)', fontWeight: 700 }}>Tus porcentajes configurados no caben en un precio real — este número está forzado para no romperse. Baja el % de gastos fijos, el de otros gastos, o el margen.</p>
                )}
              </div>
            )}
          </div>
        )}
        {resultado && (
          <button className="btn-secundario" style={{ borderStyle: 'solid' }} onClick={guardarReceta}>{editId !== null ? 'Guardar cambios' : 'Guardar receta'}</button>
        )}
        <Toast toast={toast} />
      </>
    )
  }

  return (
    <>
      <h2 className="titulo-seccion">Tus recetas</h2>
      <p className="sub-seccion">Cada una con su costo real y el precio sugerido.</p>
      <button className="btn-cta" style={{ marginBottom: 14 }} onClick={abrirConstructor}>+ Costear receta nueva</button>
      {!recetas.length ? (
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
