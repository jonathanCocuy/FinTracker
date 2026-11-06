import Link from "next/link"
import { PiggyBank } from "lucide-react"

export const metadata = { title: "Política de Privacidad – FlowX" }

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/40 px-6 py-4 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <PiggyBank className="h-5 w-5 text-primary-foreground" fill="currentColor" />
          </div>
          <span className="font-bold text-lg">FlowX</span>
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Política de Privacidad y Tratamiento de Datos Personales</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Última actualización: noviembre 2026 · Ley 1581 de 2012 y Decreto 1377 de 2013 (Colombia)
          </p>
        </div>

        <Section title="1. Responsable del tratamiento">
          <p>
            El responsable del tratamiento de los datos personales recolectados a través de FlowX es el desarrollador
            de la Aplicación. Para ejercer tus derechos o hacer consultas, escríbenos a:{" "}
            <a href="mailto:soporte@flowx.app" className="text-primary underline underline-offset-2">
              soporte@flowx.app
            </a>
          </p>
        </Section>

        <Section title="2. Datos que recolectamos">
          <p>Recolectamos únicamente los datos que tú nos proporcionas voluntariamente:</p>
          <table className="w-full text-xs mt-3 border border-border/40 rounded-lg overflow-hidden">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left p-2.5 font-semibold">Dato</th>
                <th className="text-left p-2.5 font-semibold">Obligatorio</th>
                <th className="text-left p-2.5 font-semibold">Finalidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              <tr>
                <td className="p-2.5">Nombre completo</td>
                <td className="p-2.5">Sí</td>
                <td className="p-2.5">Personalizar la experiencia en la app</td>
              </tr>
              <tr>
                <td className="p-2.5">Correo electrónico</td>
                <td className="p-2.5">Sí</td>
                <td className="p-2.5">Autenticación, recuperación de contraseña y comunicaciones</td>
              </tr>
              <tr>
                <td className="p-2.5">Contraseña</td>
                <td className="p-2.5">Sí</td>
                <td className="p-2.5">Control de acceso (almacenada en hash, nunca en texto plano)</td>
              </tr>
              <tr>
                <td className="p-2.5">Foto de perfil</td>
                <td className="p-2.5">No (opcional)</td>
                <td className="p-2.5">Personalización visual de la cuenta</td>
              </tr>
              <tr>
                <td className="p-2.5">Datos financieros (cuentas, transacciones, presupuestos, metas)</td>
                <td className="p-2.5">No (ingresados por el usuario)</td>
                <td className="p-2.5">Funcionalidad principal de seguimiento financiero</td>
              </tr>
              <tr>
                <td className="p-2.5">Moneda base y preferencias</td>
                <td className="p-2.5">No</td>
                <td className="p-2.5">Personalizar el formato de visualización</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-3">
            <strong>No recolectamos</strong> números de tarjetas, datos bancarios reales, documentos de identidad
            ni información biométrica.
          </p>
        </Section>

        <Section title="3. Finalidades del tratamiento">
          <p>Usamos tus datos exclusivamente para:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Crear y gestionar tu cuenta de usuario.</li>
            <li>Almacenar y mostrarte tu información financiera personal.</li>
            <li>Enviarte correos transaccionales (confirmación de registro, recuperación de contraseña).</li>
            <li>Notificarte cambios importantes en la Aplicación o en estas políticas.</li>
            <li>Mejorar la Aplicación mediante análisis de uso agregado y anónimo.</li>
          </ul>
          <p className="mt-2">
            <strong>No vendemos, alquilamos ni compartimos tus datos personales con terceros</strong> con fines
            comerciales o publicitarios.
          </p>
        </Section>

        <Section title="4. Foto de perfil (datos especiales)">
          <p>
            La carga de foto de perfil es <strong>completamente voluntaria</strong>. Al subir una imagen:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Autorizas expresamente su almacenamiento en nuestros servidores (Supabase Storage).</li>
            <li>La imagen es visible únicamente para ti dentro de la Aplicación.</li>
            <li>Puedes eliminarla en cualquier momento desde tu perfil.</li>
            <li>Al eliminar tu cuenta, la imagen es borrada permanentemente.</li>
          </ul>
        </Section>

        <Section title="5. Terceros que procesan tus datos">
          <p>
            Para operar la Aplicación usamos los siguientes proveedores de confianza. Cada uno aplica sus
            propias políticas de seguridad y privacidad:
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>
              <strong>Supabase</strong> (autenticación, base de datos, almacenamiento de archivos) —
              los datos se almacenan en servidores seguros con cifrado en tránsito y en reposo.
              <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 ml-1">Ver política</a>
            </li>
            <li>
              <strong>Vercel</strong> (alojamiento web) — procesa solicitudes HTTP pero no almacena datos personales.
              <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 ml-1">Ver política</a>
            </li>
            <li>
              <strong>open.er-api.com</strong> (tasas de cambio) — recibe solo la solicitud de tasas, sin datos personales del usuario.
            </li>
          </ul>
        </Section>

        <Section title="6. Seguridad de los datos">
          <ul className="list-disc pl-5 space-y-1">
            <li>Las contraseñas se almacenan usando hashing seguro (nunca en texto plano).</li>
            <li>Toda comunicación entre tu dispositivo y nuestros servidores usa cifrado TLS/HTTPS.</li>
            <li>Los datos en la base de datos están cifrados en reposo.</li>
            <li>Cada usuario solo puede acceder a sus propios datos (Row Level Security en Supabase).</li>
          </ul>
        </Section>

        <Section title="7. Retención de datos">
          <p>
            Conservamos tus datos mientras tu cuenta esté activa. Si eliminas tu cuenta, todos tus datos personales
            y financieros son borrados de forma permanente e irreversible dentro de los 30 días siguientes a la
            solicitud. Los registros de auditoría pueden conservarse hasta 90 días adicionales por razones de
            seguridad.
          </p>
        </Section>

        <Section title="8. Tus derechos (Ley 1581 de 2012)">
          <p>Como titular de los datos tienes derecho a:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Conocer</strong> qué datos tuyos tenemos almacenados.</li>
            <li><strong>Actualizar</strong> tus datos desde la sección de Perfil en la app.</li>
            <li><strong>Rectificar</strong> información inexacta o incompleta.</li>
            <li><strong>Suprimir</strong> tus datos eliminando tu cuenta desde Perfil → Eliminar cuenta.</li>
            <li><strong>Revocar</strong> la autorización de tratamiento en cualquier momento (lo que implicará la eliminación de tu cuenta).</li>
            <li><strong>Presentar quejas</strong> ante la Superintendencia de Industria y Comercio (SIC) si consideras que tus derechos han sido vulnerados.</li>
          </ul>
          <p className="mt-2">
            Para ejercer cualquiera de estos derechos, escríbenos a{" "}
            <a href="mailto:soporte@flowx.app" className="text-primary underline underline-offset-2">
              soporte@flowx.app
            </a>{" "}
            y responderemos dentro de los 10 días hábiles siguientes.
          </p>
        </Section>

        <Section title="9. Menores de edad">
          <p>
            FlowX no está dirigido a menores de 18 años. No recolectamos conscientemente datos de menores.
            Si detectas que un menor ha creado una cuenta, contáctanos para eliminarla de inmediato.
          </p>
        </Section>

        <Section title="10. Cambios a esta política">
          <p>
            Podemos actualizar esta Política periódicamente. Cuando los cambios sean sustanciales, te
            notificaremos por correo electrónico con al menos 15 días de anticipación. La versión vigente
            siempre estará disponible en esta página.
          </p>
        </Section>

        <Section title="11. Contacto y quejas">
          <p>
            Para consultas sobre privacidad:{" "}
            <a href="mailto:soporte@flowx.app" className="text-primary underline underline-offset-2">
              soporte@flowx.app
            </a>
          </p>
          <p className="mt-1">
            Para quejas ante la autoridad:{" "}
            <a href="https://www.sic.gov.co" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
              Superintendencia de Industria y Comercio (SIC)
            </a>
          </p>
        </Section>

        <div className="pt-4 border-t border-border/40">
          <Link href="/terms" className="text-primary text-sm underline underline-offset-2">
            Ver Términos y Condiciones →
          </Link>
        </div>
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-1">{children}</div>
    </section>
  )
}
