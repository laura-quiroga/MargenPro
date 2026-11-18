import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import './Landing.css'

const PRECIO_HEROE_FINAL = 84000

/** Dispositivo visual de firma propio, ligado al mecanismo bautizado "Radar de Ganancia"
 * (pedido por el revisor-visual en vez de los blobs de gradiente genéricos — ver
 * docs/revisiones/landing-veredicto.md). Mismo acento de marca, nada de color nuevo. */
function RadarFirma() {
  return (
    <svg viewBox="0 0 200 200" aria-hidden="true" style={{ width: '100%', height: '100%' }}>
      <circle cx="100" cy="100" r="88" fill="none" stroke="var(--accent)" strokeOpacity=".16" strokeWidth="1.5" strokeDasharray="3 7" />
      <circle cx="100" cy="100" r="60" fill="none" stroke="var(--accent)" strokeOpacity=".22" strokeWidth="1.5" strokeDasharray="3 7" />
      <circle cx="100" cy="100" r="32" fill="none" stroke="var(--accent)" strokeOpacity=".28" strokeWidth="1.5" strokeDasharray="3 7" />
      <line x1="100" y1="100" x2="166" y2="46" stroke="var(--accent)" strokeOpacity=".55" strokeWidth="2" strokeLinecap="round" />
      <circle cx="100" cy="100" r="4.5" fill="var(--accent)" fillOpacity=".65" />
      <circle cx="166" cy="46" r="4.5" fill="var(--accent)" fillOpacity=".75" />
    </svg>
  )
}

function PrecioHeroeAnimado() {
  const [valor, setValor] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValor(PRECIO_HEROE_FINAL)
      return
    }
    let inicio: number | null = null
    const duracion = 900
    let raf = 0
    const timeout = setTimeout(() => {
      function paso(ts: number) {
        if (inicio === null) inicio = ts
        const prog = Math.min((ts - inicio) / duracion, 1)
        const curr = Math.round(PRECIO_HEROE_FINAL * (1 - Math.pow(1 - prog, 3)))
        setValor(curr)
        if (prog < 1) raf = requestAnimationFrame(paso)
      }
      raf = requestAnimationFrame(paso)
    }, 250)
    return () => { clearTimeout(timeout); cancelAnimationFrame(raf) }
  }, [])

  return <span>${valor.toLocaleString('es-CO')}</span>
}

const PREGUNTAS_PROBLEMA = [
  { icono: <path d="M12 6v6l4 2M12 3a9 9 0 100 18 9 9 0 000-18z" />, texto: '¿Llegas a fin de mes y no sabes si tu negocio (tortas, comida rápida, catering) ganó o perdió?' },
  { icono: <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />, texto: '¿Te da pánico subirle el precio a un producto por miedo a perder al cliente?' },
  { icono: <path d="M3 3v18h18M7 14l4-4 3 3 5-6" />, texto: '¿Subieron tus insumos y no sabes cómo recalcular tus precios sin volverte loco?' },
  { icono: <><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></>, texto: '¿Un pedido grande o un catering te paraliza porque no sabes cuánto cobrarle?' },
  { icono: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M8 4v5" /></>, texto: '¿Odias abrir el Excel porque las fórmulas se rompen y terminas frustrado en minutos?' },
]

const PASOS_SOLUCION = [
  { icono: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="M21 15l-5-5L5 21" /></>, titulo: 'Registra o fotografía tus insumos', texto: 'Anota el precio de lo que compras, o solo toma una foto del recibo.' },
  { icono: <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" />, titulo: 'El Radar calcula tu costo real', texto: 'Arma tu receta y mira el costo exacto de producirla, al instante.' },
  { icono: <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />, titulo: 'Te dice cuánto cobrar', texto: 'Elige tu margen de ganancia y recibe el precio justo, sea un postre, un combo o un pedido de catering.' },
]

const TABS_MINI = [
  { label: 'Panorama', activo: true, icono: <><path d="M3 10.5L12 3l9 7.5" /><path d="M5 9.5V21h5v-6h4v6h5V9.5" /></> },
  { label: 'Insumos', activo: false, icono: <><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></> },
  { label: 'Recetas', activo: false, icono: <><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></> },
  { label: 'Cotiza', activo: false, icono: <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /> },
  { label: 'Ajustes', activo: false, icono: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 008.6 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H2a2 2 0 010-4h.09A1.65 1.65 0 003.6 8.6a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H8a1.65 1.65 0 001-1.51V2a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V8a1.65 1.65 0 001.51 1H22a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></> },
]

const CARRUSEL_APP = [
  { icono: <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />, nombre: 'Costeo', dato: '$8.100 · 40% ganancia', label: 'Tu primer precio calculado' },
  { icono: <><rect x="5" y="2" width="14" height="20" rx="2" /><path d="M9 7h6M9 11h6M9 15h3" /></>, nombre: 'Escaneo', dato: 'Facturas escaneadas', label: 'Ingredientes y precios siempre al día' },
  { icono: <><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></>, nombre: 'Cotización', dato: '$54.500 enviada', label: 'Tu cotización lista para enviar' },
  { icono: <path d="M3 3v18h18M7 15l3-3 3 2 5-6" />, nombre: 'Resumen', dato: '+$680.000 este mes', label: 'Tu mes, en números claros' },
]

const FAQ = [
  { q: '¿Necesito saber de tecnología o matemáticas para usar esto?', a: 'No. Escribes el nombre y precio de lo que compras, o le tomas una foto al recibo y la app hace el resto.' },
  { q: '¿Y si pago y no me sirve?', a: 'Tienes 7 días de prueba antes de que te cobremos algo, y la Garantía del Primer Precio Real si aun así no te sirve.' },
  { q: 'Ya probé Excel y apps de notas y las abandono a los pocos días', a: 'MargenPro está hecha para usarse con una mano mientras trabajas en tu cocina o tu local — sin fórmulas que se rompan.' },
  { q: 'Mis ingredientes cambian de precio cada semana en mi país, ¿se adapta?', a: 'Sí: registras TUS precios reales. Cuando uno sube, actualizas ese insumo y todas tus recetas se recalculan solas.' },
  { q: '¿Es seguro pagar?', a: 'El pago se procesa por Hotmart, una plataforma reconocida en Latinoamérica. Nunca guardamos tu tarjeta dentro de la app.' },
  { q: 'Vender comida desde casa o un local pequeño no es un negocio serio, es solo algo informal', a: 'Organizas tus números como cualquier negocio real — y hasta mandas cotizaciones profesionales con tu logo, vendas tortas, hamburguesas o catering.' },
]

function Carrusel() {
  const [activo, setActivo] = useState(0)
  const item = CARRUSEL_APP[activo]

  function irA(i: number) {
    setActivo(Math.max(0, Math.min(CARRUSEL_APP.length - 1, i)))
  }

  return (
    <div className="carrusel-wrap">
      <button type="button" className="carrusel-flecha izq" aria-label="Ver anterior" disabled={activo === 0} onClick={() => irA(activo - 1)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
      </button>
      <div className="carrusel-tarjeta" key={item.nombre}>
        <div className="chip-icono-grande"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" strokeWidth="1.6">{item.icono}</svg></div>
        <span className="nombre">{item.nombre}</span>
        <span className="dato">{item.dato}</span>
        <p className="label">{item.label}</p>
      </div>
      <button type="button" className="carrusel-flecha der" aria-label="Ver siguiente" disabled={activo === CARRUSEL_APP.length - 1} onClick={() => irA(activo + 1)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
      </button>
      <div className="dots">
        {CARRUSEL_APP.map((_, i) => (
          <button type="button" key={i} aria-label={`Ver ${CARRUSEL_APP[i].nombre}`} className={i === activo ? 'activo' : ''} onClick={() => irA(i)} />
        ))}
      </div>
    </div>
  )
}

/** Agrega la clase "visto" a un elemento la PRIMERA vez que entra en pantalla al hacer scroll
 * — dispara la animación de entrada con stagger definida en Landing.css (.aparece.visto). */
function useAparecerAlScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [visto, setVisto] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entrada]) => {
      if (entrada.isIntersecting) { setVisto(true); obs.disconnect() }
    }, { threshold: 0.15 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return { ref, visto }
}

function FaqItem({ q, a, abiertoInicial }: { q: string; a: string; abiertoInicial: boolean }) {
  const [abierto, setAbierto] = useState(abiertoInicial)
  return (
    <div className={`faq-item ${abierto ? 'abierto' : ''}`}>
      <button className="faq-q" onClick={() => setAbierto((v) => !v)}>
        {q}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      <div className="faq-a">{a}</div>
    </div>
  )
}

export default function Landing() {
  const [stickyVisible, setStickyVisible] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)
  const ofertaRef = useRef<HTMLDivElement>(null)
  const ctaFinalRef = useRef<HTMLDivElement>(null)

  const problemaScroll = useAparecerAlScroll<HTMLDivElement>()
  const agitacionScroll = useAparecerAlScroll<HTMLDivElement>()
  const solucionScroll = useAparecerAlScroll<HTMLDivElement>()
  const ofertaScroll = useAparecerAlScroll<HTMLDivElement>()
  const garantiaScroll = useAparecerAlScroll<HTMLDivElement>()
  const faqScroll = useAparecerAlScroll<HTMLDivElement>()

  useEffect(() => {
    function actualizar() {
      const hero = heroRef.current?.getBoundingClientRect()
      const oferta = ofertaRef.current?.getBoundingClientRect()
      const ctaFinal = ctaFinalRef.current?.getBoundingClientRect()
      if (!hero || !oferta || !ctaFinal) return
      const pasoHero = hero.bottom < 0
      const cercaOfertaOCta =
        (oferta.top < window.innerHeight && oferta.bottom > 0) ||
        (ctaFinal.top < window.innerHeight && ctaFinal.bottom > 0)
      setStickyVisible(pasoHero && !cercaOfertaOCta)
    }
    window.addEventListener('scroll', actualizar)
    actualizar()
    return () => window.removeEventListener('scroll', actualizar)
  }, [])

  return (
    <div className="landing">
      <header className="top">
        <div className="wrap topbar">
          <div className="logo"><img className="mark" src="/isotipo.svg" alt="MargenPro" /> MargenPro</div>
          <Link className="entrar" to="/login">Entrar</Link>
        </div>
      </header>

      {/* 1. HERO */}
      <section className="hero" id="hero" ref={heroRef}>
        <div className="radar-firma" aria-hidden="true"><RadarFirma /></div>
        <div className="wrap hero-grid">
          <div>
            <h1 className="entrada">El precio justo para tu negocio, con <span className="acento">ganancia real</span></h1>
            <p className="sub entrada">Tortas, hamburguesas o catering: el <strong>Radar de Ganancia</strong> calcula tu costo real y te dice cuánto cobrar — sin Excel, sin miedo.</p>
            <Link className="btn-cta entrada" to="/onboarding">Calcular mi primer precio gratis →</Link>
            <div className="social-proof entrada">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round"><path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" /></svg>
              Pruébalo gratis con tu primera receta — sin tarjeta, sin compromiso
            </div>
          </div>
          <div className="hero-visual entrada">
            <div className="telefono-frame">
              <div className="status"><span>9:41</span><span>●●●●</span></div>
              <div className="pantalla">
                <div className="heroe-tarjeta">
                  <div>
                    <div className="paso-indicador">Paso 3 de 3</div>
                    <div className="receta-nombre">Torta de chocolate · 12 porciones</div>
                    <div className="precio-heroe"><PrecioHeroeAnimado /><span className="sm">precio sugerido por unidad</span></div>
                    <div className="fila-dato"><span>Costo real</span><span>$48.000</span></div>
                    <div className="fila-dato"><span>Tu ganancia</span><span style={{ color: 'var(--accent)', fontWeight: 700 }}>43%</span></div>
                  </div>
                </div>
                <div className="heroe-reciente">
                  <div className="titulo">Cotizaciones recientes</div>
                  <div className="fila">
                    <div><div className="nombre">Torta de chocolate</div><div className="meta">Valentina R.</div></div>
                    <span className="estado vendida">Vendida</span>
                  </div>
                  <div className="fila">
                    <div><div className="nombre">Combo hamburguesa x10</div><div className="meta">Catering Luna</div></div>
                    <span className="estado pendiente">Pendiente</span>
                  </div>
                  <div className="fila">
                    <div><div className="nombre">Pan de yuca x50</div><div className="meta">Doña Marta</div></div>
                    <span className="estado vendida">Vendida</span>
                  </div>
                </div>
                <div className="tabbar-mini">
                  {TABS_MINI.map((t) => (
                    <div key={t.label} className={`tab-mini${t.activo ? ' activo' : ''}`}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{t.icono}</svg>
                      <span>{t.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PROBLEMA */}
      <section className="elevado" id="problema">
        <div className={`wrap aparece${problemaScroll.visto ? ' visto' : ''}`} ref={problemaScroll.ref}>
          <div className="kicker">¿Te suena?</div>
          <h2>Lo que te quita el sueño cada fin de mes</h2>
          <div className="preguntas">
            {PREGUNTAS_PROBLEMA.map((p, i) => (
              <div className="pregunta-card" key={i}>
                <div className="chip-icono"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">{p.icono}</svg></div>
                <p>{p.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. AGITACION */}
      <section className="hundido" id="agitacion">
        <div className={`wrap aparece${agitacionScroll.visto ? ' visto' : ''}`} ref={agitacionScroll.ref}>
          <div className="kicker">La cuenta real</div>
          <h2>Lo que te está costando <span className="acento">no saberlo</span></h2>
          <ul className="agitacion-lista">
            <li>
              <div className="chip-icono" style={{ width: 36, height: 36, borderRadius: 10 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
              </div>
              <span>Cada semana que cobras <strong>a ojo</strong> puede estar regalando parte de tu ganancia sin darte cuenta.</span>
            </li>
            <li>
              <div className="chip-icono" style={{ width: 36, height: 36, borderRadius: 10 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round"><path d="M12 6v6l4 2" /><circle cx="12" cy="12" r="9" /></svg>
              </div>
              <span>En un año, eso puede ser <span className="acento" style={{ fontWeight: 800 }}>meses enteros de trabajo</span> que ya hiciste — y que nadie te pagó.</span>
            </li>
            <li>
              <div className="chip-icono" style={{ width: 36, height: 36, borderRadius: 10 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round"><path d="M12 2a7 7 0 00-7 7c0 3 2 4 2 7h10c0-3 2-4 2-7a7 7 0 00-7-7z" /><path d="M9 21h6" /></svg>
              </div>
              <span>Mientras tanto, sigues cargando la ansiedad de acostarte sin saber si hoy trabajaste gratis.</span>
            </li>
          </ul>
          <div className="contraste">
            <div className="caja">
              <div className="label">Hoy</div>
              <p>Horas trabajando en tu cocina o tu local, sin saber si te quedó algo al final del mes.</p>
            </div>
            <div className="caja futuro">
              <div className="label">En 6 meses, si nada cambia</div>
              <p>El mismo cansancio — con 6 meses menos y las mismas dudas.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SOLUCION */}
      <section id="solucion">
        <div className="blob" aria-hidden="true" />
        <div className={`wrap aparece${solucionScroll.visto ? ' visto' : ''}`} ref={solucionScroll.ref}>
          <div className="kicker">Cómo funciona</div>
          <h2>Tu precio justo, <span className="acento">calculado en segundos</span></h2>
          <p className="sub">No te faltan ventas — te falta ver lo que de verdad te cuesta cada receta. El <strong>Radar de Ganancia</strong> lo calcula por ti y te dice cuánto cobrar para ganar de verdad.</p>
          <div className="pasos">
            {PASOS_SOLUCION.map((p, i) => (
              <div className="paso" key={i}>
                <div className="paso-top">
                  <div className="num">{i + 1}</div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round">{p.icono}</svg>
                </div>
                <h3>{p.titulo}</h3>
                <p>{p.texto}</p>
              </div>
            ))}
          </div>
          <div className="antes-despues">
            <div className="caja antes"><div className="label">Antes</div><p>Calculabas a ojo y cruzabas los dedos.</p></div>
            <div className="caja despues"><div className="label">Después</div><p>Sabes exactamente cuánto cobrar, con la ganancia que tú decidiste.</p></div>
          </div>
        </div>
      </section>

      {/* 5. LA APP POR DENTRO */}
      <section className="elevado" id="app-por-dentro">
        <div className="blob" aria-hidden="true" />
        <div className="wrap">
          <div className="kicker">La app por dentro</div>
          <h2>Esto es lo que vas a <span className="acento">ver y usar</span></h2>
          <Carrusel />
          <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 14 }}>Vistas ilustrativas de la app.</p>
          <div style={{ textAlign: 'center', marginTop: 30 }}><Link className="btn-cta" to="/onboarding">Calcular mi primer precio gratis →</Link></div>
        </div>
      </section>

      {/* 6. OFERTA */}
      <section id="oferta" ref={ofertaRef}>
        <div className="radar-firma" aria-hidden="true"><RadarFirma /></div>
        <div className={`wrap aparece${ofertaScroll.visto ? ' visto' : ''}`} ref={ofertaScroll.ref}>
          <div className="kicker">Precio</div>
          <h2>Empieza gratis. Sigue por <span className="acento">menos de $0.20 al día</span></h2>
          <div className="stack-valor">
            <div className="linea"><span>MargenPro completo con el Radar de Ganancia (12 meses)</span><span>$96</span></div>
            <div className="linea"><span>Escaneo de facturas con IA (30 al mes)</span><span>$30</span></div>
            <div className="linea"><span>Cotizaciones profesionales con tu logo por WhatsApp</span><span>$20</span></div>
            <div className="total"><span>Valor total al año</span><span><span className="tachado">$146</span> hoy $71.88/año</span></div>
          </div>
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-2)', marginBottom: 14 }}>Los dos planes empiezan con 7 días de prueba gratis — no pagas nada hoy, elijas el que elijas.</p>
          <div className="planes">
            <div className="plan recomendado"><div className="inner">
              <span className="badge">MÁS POPULAR</span>
              <div className="nombre-plan">Anual</div>
              <div className="precio-plan">$5.99 <span>/mes</span></div>
              <div className="nota-plan">Se cobra $71.88/año</div>
              <div className="ahorro">2 meses gratis</div>
              <ul className="features-plan">
                <li><span className="check-custom">✓</span> Recetas e insumos ilimitados</li>
                <li><span className="check-custom">✓</span> Escaneo de facturas con IA (30/mes)</li>
                <li><span className="check-custom">✓</span> Cotizaciones por WhatsApp con tu logo</li>
                <li><span className="check-custom">✓</span> Resumen mensual de ganancia real</li>
              </ul>
              <Link className="btn-cta" to="/onboarding">Empezar mis 7 días gratis</Link>
            </div></div>
            <div className="plan">
              <div className="nombre-plan">Mensual</div>
              <div className="precio-plan">$7.99 <span>/mes</span></div>
              <div className="nota-plan">Se cobra mes a mes</div>
              <div className="ahorro" style={{ opacity: 0 }}>—</div>
              <ul className="features-plan">
                <li><span className="check-custom">✓</span> Recetas e insumos ilimitados</li>
                <li><span className="check-custom">✓</span> Escaneo de facturas con IA (30/mes)</li>
                <li><span className="check-custom">✓</span> Cotizaciones por WhatsApp con tu logo</li>
                <li><span className="check-custom">✓</span> Cancelas cuando quieras</li>
              </ul>
              <Link className="elegir-mensual" to="/onboarding">Elegir mensual →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* 7. GARANTIA */}
      <section className="elevado" id="garantia">
        <div className={`wrap aparece${garantiaScroll.visto ? ' visto' : ''}`} ref={garantiaScroll.ref}>
          <div className="garantia-box">
            <div className="escudo"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--on-accent)" strokeWidth="2"><path d="M12 2l8 4v6c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6l8-4z" /><path d="M9 12l2 2 4-4" /></svg></div>
            <div>
              <h3>La Garantía del Primer Precio Real</h3>
              <p>Si ya pagaste y en tus primeros 14 días no tienes clara tu primera receta costeada con el precio justo, escribes un correo y te devolvemos todo. <strong>Sin preguntas.</strong></p>
              <div className="piso">Garantía propia de MargenPro · 14 días</div>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: 26 }}><Link className="btn-cta" to="/onboarding">Calcular mi primer precio gratis →</Link></div>
        </div>
      </section>

      {/* 8. FAQ */}
      <section id="faq">
        <div className={`wrap aparece${faqScroll.visto ? ' visto' : ''}`} style={{ maxWidth: 760 }} ref={faqScroll.ref}>
          <div className="kicker">Preguntas frecuentes</div>
          <h2>Antes de que lo decidas</h2>
          <div>
            {FAQ.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} abiertoInicial={i === 0} />)}
          </div>
        </div>
      </section>

      {/* 9. CTA FINAL */}
      <section id="cta-final" ref={ctaFinalRef}>
        <div className="cta-final">
          <h2>Imagina cerrar el mes <span className="acento">sabiendo cuánto ganaste</span></h2>
          <p className="pacing">Terminas de preparar tu producto, lo armas en la app, y en segundos ya sabes cuánto cobrar — sin dudas, sin culpa, sin regalar tu trabajo.</p>
          <Link className="btn-cta" to="/onboarding">Calcular mi primer precio gratis →</Link>
          <div className="recap">Garantía del Primer Precio Real · 7 días de prueba antes de pagar</div>
          <p className="ps">PS: MargenPro convierte tus recetas en precios con ganancia real gracias al Radar de Ganancia. Hoy entras con 7 días de prueba — no te cobramos nada hasta el día 7, y te avisamos antes con la fecha y el monto exactos — más la Garantía del Primer Precio Real.</p>
        </div>
      </section>

      {/* 10. FOOTER */}
      <footer>
        <div className="wrap">
          <div className="footer-links">
            <Link to="/privacidad">Privacidad</Link>
            <Link to="/terminos">Términos y Condiciones</Link>
            <Link to="/reembolsos">Reembolsos</Link>
            <Link to="/aviso-ia">Aviso de uso de IA</Link>
          </div>
          <div className="footer-meta">MargenPro · soporte@margenpro.app</div>
        </div>
      </footer>

      <div className={`sticky-cta ${stickyVisible ? 'visible' : ''}`}>
        <Link className="btn-cta" to="/onboarding">Calcular mi primer precio gratis</Link>
      </div>
    </div>
  )
}
