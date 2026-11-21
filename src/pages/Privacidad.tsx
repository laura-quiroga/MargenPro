import PaginaLegal from '../components/PaginaLegal'

export default function Privacidad() {
  return (
    <PaginaLegal titulo="Política de Privacidad" actualizado="20 de noviembre de 2026" hijoActual="Privacidad">
      <p>
        Esta página explica, en español simple, qué datos recopila <strong>MargenPro</strong>,
        para qué los usamos, con quién los compartimos y cómo puedes eliminarlos. MargenPro es
        operado como persona natural desde Colombia. Para cualquier solicitud sobre tus datos,
        escribe a <strong>margenpro.soporte@gmail.com</strong> — si necesitas la identidad legal completa
        del responsable para un trámite formal, también puedes pedirla a ese mismo correo.
      </p>

      <h2>1. Qué datos recopilamos</h2>
      <p>Solo pedimos lo que la app necesita para funcionar:</p>
      <ul>
        <li><strong>Tu correo electrónico</strong> — para crear tu cuenta y enviarte el enlace de acceso.</li>
        <li><strong>Tu nombre</strong> (si lo escribes) — para personalizar tu cuenta y tus cotizaciones.</li>
        <li><strong>El nombre y logo de tu negocio</strong> (opcional) — para tus cotizaciones con tu marca.</li>
        <li><strong>Los datos que registras en la app</strong>: tus insumos, sus precios, tus recetas, tus cotizaciones y tus clientes (nombre y WhatsApp que tú escribes).</li>
        <li><strong>Fotos de tus facturas</strong>, si usas el escaneo con IA.</li>
        <li><strong>Datos de uso</strong>: qué acciones haces en la app (crear una receta, escanear una factura, etc.), para que la app funcione y para medir qué tan útil es.</li>
      </ul>
      <p>
        <strong>Nunca</strong> te pedimos tu número de tarjeta ni datos bancarios — eso lo procesa
        directamente Hotmart, la plataforma de pagos, y nunca pasa por nuestros servidores.
      </p>

      <h2>2. Para qué usamos tus datos</h2>
      <ul>
        <li>Darte acceso a tu cuenta y a tu información.</li>
        <li>Calcular el costo y precio sugerido de tus recetas.</li>
        <li>Leer el contenido de tus facturas escaneadas (con ayuda de un servicio de inteligencia artificial, ver sección 4).</li>
        <li>Enviarte correos sobre tu cuenta (acceso, avisos de tu suscripción).</li>
        <li>Mejorar la app a partir de cómo la usan nuestros usuarios, de forma agregada.</li>
      </ul>

      <h2>3. Con quién compartimos tus datos</h2>
      <p>No vendemos tus datos a nadie. Los compartimos únicamente con los proveedores que hacen posible que MargenPro funcione, cada uno con una función concreta:</p>
      <table className="legal-tabla">
        <thead><tr><th>Proveedor</th><th>Para qué lo usamos</th></tr></thead>
        <tbody>
          <tr><td><strong>Supabase</strong></td><td>Guarda tu cuenta, tu contraseña/enlace de acceso, y todos los datos de tu negocio (insumos, recetas, cotizaciones) y tus fotos de factura.</td></tr>
          <tr><td><strong>Anthropic (modelo Claude)</strong></td><td>Lee el contenido de las fotos de factura que escaneas, para extraer los productos y precios automáticamente. Ver sección 4.</td></tr>
          <tr><td><strong>Vercel</strong></td><td>Aloja la aplicación web que usas en tu navegador.</td></tr>
          <tr><td><strong>Hotmart</strong></td><td>Procesa tu pago y tu suscripción — ellos ven tus datos de pago, nosotros no.</td></tr>
          <tr><td><strong>Google</strong></td><td>Solo si eliges "Continuar con Google" para entrar a tu cuenta.</td></tr>
        </tbody>
      </table>
      <p>No usamos redes publicitarias ni herramientas de analítica de terceros (como Google Analytics o Meta Pixel) — las estadísticas de uso que medimos son propias, dentro de nuestros propios servidores.</p>

      <h2>4. Tus datos y la inteligencia artificial</h2>
      <p>
        Cuando escaneas una factura, la foto y su contenido se envían a Anthropic (un proveedor de
        inteligencia artificial con sede en Estados Unidos) para identificar automáticamente los
        productos, cantidades y precios. Esto es una <strong>transferencia internacional de datos</strong>:
        tu información sale de tu país hacia servidores en EE. UU. para ese procesamiento puntual.
      </p>
      <div className="legal-aviso">
        ⚠️ No incluyas en tus facturas, notas o campos de texto información sensible que no sea
        necesaria (datos médicos, contraseñas, números de documentos de otras personas). Usa la app
        solo para lo que está pensada: los datos de tu negocio.
      </div>
      <p>
        La inteligencia artificial puede equivocarse al leer una factura (un precio borroso, una
        letra difícil de leer). Por eso MargenPro siempre te muestra lo que detectó antes de guardarlo,
        para que tú confirmes o corrijas. Ver también nuestro <a href="/aviso-ia">Aviso de uso de IA</a>.
      </p>

      <h2>5. Cuánto tiempo guardamos tus datos</h2>
      <p>
        Mientras tu cuenta exista, guardamos tus datos para que la app funcione. Si eliminas tu
        cuenta, borramos tu información de forma permanente (ver sección 7) — con una excepción:
        si reportaste un error técnico, guardamos el mensaje del error sin ningún dato que te
        identifique, para poder seguir mejorando la app.
      </p>

      <h2>6. Tus derechos sobre tus datos</h2>
      <p>Como titular de tus datos (bajo la Ley 1581 de 2012 de Colombia y leyes equivalentes de otros países de Latinoamérica), tienes derecho a:</p>
      <ul>
        <li><strong>Conocer</strong> qué datos tenemos sobre ti.</li>
        <li><strong>Corregir</strong> datos que estén mal (puedes editarlos tú mismo dentro de la app).</li>
        <li><strong>Eliminar</strong> tu cuenta y todos tus datos (ver sección 7).</li>
        <li><strong>Oponerte</strong> al uso de tus datos, u objetar cómo los usamos.</li>
      </ul>
      <p>Para ejercer cualquiera de estos derechos, escribe a <strong>margenpro.soporte@gmail.com</strong>.</p>

      <h2>7. Cómo eliminar tu cuenta y tus datos</h2>
      <p>
        Puedes eliminar tu cuenta tú mismo, en cualquier momento, desde <strong>Ajustes → Eliminar mi cuenta</strong>
        dentro de la app. Al confirmarlo, se borran de forma permanente e inmediata: tu perfil, tus
        insumos, tus recetas, tus cotizaciones, tus fotos de factura y tu historial de uso. Esta
        acción no se puede deshacer.
      </p>
      <div className="legal-aviso">
        ⚠️ Eliminar tu cuenta en MargenPro <strong>no cancela tu suscripción en Hotmart</strong> —
        son dos sistemas distintos. Si quieres dejar de pagar, cancela primero tu suscripción (ver{' '}
        <a href="/como-cancelar">Cómo cancelar</a>) y después elimina tu cuenta.
      </div>

      <h2>8. Menores de edad</h2>
      <p>MargenPro está dirigida a personas mayores de 18 años que administran o quieren administrar un negocio. No está diseñada para ser usada por menores de edad, y no recopilamos intencionalmente datos de menores.</p>

      <h2>9. Cookies y almacenamiento local</h2>
      <p>
        MargenPro no usa cookies de publicidad ni de seguimiento de terceros. Usamos únicamente
        almacenamiento técnico esencial en tu navegador (para mantener tu sesión iniciada y
        recordar alguna preferencia tuya dentro de la app) — nada de esto se usa para rastrearte
        fuera de MargenPro, así que no necesitas un banner de cookies para esto.
      </p>

      <h2>10. Cambios a esta política</h2>
      <p>
        Si hacemos un cambio importante a esta política, te avisaremos por correo antes de que
        entre en vigencia — nunca cambiamos las reglas en silencio.
      </p>

      <h2>11. Contacto</h2>
      <p>¿Preguntas sobre tus datos o esta política? Escríbenos a <strong>margenpro.soporte@gmail.com</strong>.</p>
    </PaginaLegal>
  )
}
