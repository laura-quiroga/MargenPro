import PaginaLegal from '../components/PaginaLegal'

export default function Reembolsos() {
  return (
    <PaginaLegal titulo="Política de Reembolsos" actualizado="20 de noviembre de 2026" hijoActual="Reembolsos">
      <p>
        Queremos que pruebes MargenPro con confianza. Esta política explica cuándo y cómo puedes
        pedir que te devolvamos tu dinero.
      </p>

      <h2>1. Prueba gratis de 7 días</h2>
      <p>
        Todos los planes de MargenPro empiezan con 7 días de prueba gratis. Durante ese período no
        se te cobra nada. Si cancelas antes de que termine, nunca se te cobra un solo peso.
      </p>

      <h2>2. Garantía del Primer Precio Real — 15 días</h2>
      <p>
        Si ya se te cobró y dentro de tus primeros <strong>15 días</strong> de suscripción pagada no
        tienes clara tu primera receta costeada con el precio justo, escríbenos a
        <strong> margenpro.soporte@gmail.com</strong> contándonos qué pasó, y te devolvemos tu dinero por
        completo. Sin preguntas ni trámites complicados.
      </p>

      <h2>3. Cómo se procesa el reembolso</h2>
      <p>
        Tu pago lo procesa <strong>Hotmart</strong>, así que el reembolso se tramita a través de su
        plataforma siguiendo su propio proceso y plazos de devolución a tu medio de pago. Nosotros
        aprobamos la solicitud de nuestro lado apenas la recibimos; el tiempo en que el dinero
        aparece de vuelta en tu tarjeta o cuenta depende de Hotmart y de tu banco.
      </p>
      <div className="legal-aviso">
        ⚠️ <strong>Nota para el equipo de MargenPro (control interno):</strong> esta garantía de 14
        días debe coincidir siempre con la ventana de reembolso configurada en el panel de producto
        de Hotmart. Si alguna vez se cambia este número aquí o en la landing, hay que cambiarlo
        también en Hotmart el mismo día — prometer más días de los que Hotmart tiene configurados
        genera reembolsos que Hotmart rechaza y el reclamo recae sobre nosotros.
      </div>

      <h2>4. Qué pasa con tu cuenta al reembolsarte</h2>
      <p>
        Cuando se confirma un reembolso o una devolución de cargo (chargeback), tu acceso a las
        funciones pagas de MargenPro se cancela. Tus datos no se borran automáticamente solo por
        eso — si además quieres eliminar tu cuenta y tu información, puedes hacerlo tú mismo desde
        Ajustes, o pedírnoslo por correo.
      </p>

      <h2>5. Si cancelas sin pedir reembolso</h2>
      <p>
        Cancelar tu suscripción (ver <a href="/como-cancelar">Cómo cancelar</a>) detiene la próxima
        renovación, pero no reembolsa automáticamente el período que ya pagaste — para eso aplica la
        garantía de la sección 2, dentro de sus 15 días.
      </p>

      <h2>6. Contacto</h2>
      <p>¿Quieres pedir un reembolso o tienes dudas? Escríbenos a <strong>margenpro.soporte@gmail.com</strong>.</p>
    </PaginaLegal>
  )
}
