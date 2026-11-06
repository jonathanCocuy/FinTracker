import Link from "next/link"
import { PiggyBank } from "lucide-react"

export const metadata = { title: "Términos y Condiciones – FlowX" }

export default function TermsPage() {
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
          <h1 className="text-3xl font-bold tracking-tight">Términos y Condiciones</h1>
          <p className="text-sm text-muted-foreground mt-2">Última actualización: noviembre 2026</p>
        </div>

        <Section title="1. Aceptación de los términos">
          <p>
            Al crear una cuenta y usar FlowX (&ldquo;la Aplicación&rdquo;), aceptas estos Términos y Condiciones en su totalidad.
            Si no estás de acuerdo con alguna parte, no debes usar la Aplicación.
          </p>
        </Section>

        <Section title="2. Descripción del servicio">
          <p>
            FlowX es una herramienta de seguimiento financiero personal que te permite registrar tus cuentas,
            transacciones, presupuestos y metas. <strong>FlowX no es una entidad financiera, banco, cooperativa
            ni asesor financiero.</strong> La Aplicación no presta servicios financieros regulados y no está
            supervisada por la Superintendencia Financiera de Colombia ni por ningún organismo equivalente.
          </p>
          <p className="mt-2">
            Toda la información que ves en FlowX proviene directamente de los datos que tú ingresas. No nos
            conectamos a tus cuentas bancarias reales ni accedemos a información de entidades financieras.
          </p>
        </Section>

        <Section title="3. Registro y cuenta">
          <ul className="list-disc pl-5 space-y-1">
            <li>Debes tener al menos 18 años para crear una cuenta.</li>
            <li>Eres responsable de mantener la confidencialidad de tu contraseña.</li>
            <li>Debes proporcionar información veraz al registrarte.</li>
            <li>Una cuenta es de uso personal y no puede cederse a terceros.</li>
            <li>Puedes eliminar tu cuenta en cualquier momento desde Perfil → Eliminar cuenta.</li>
          </ul>
        </Section>

        <Section title="4. Foto de perfil (opcional)">
          <p>
            La foto de perfil es completamente <strong>opcional</strong>. Si decides subir una imagen, confirmas que:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Tienes los derechos sobre esa imagen o cuentas con autorización para usarla.</li>
            <li>No contiene material inapropiado, ilegal o que viole derechos de terceros.</li>
          </ul>
          <p className="mt-2">
            Puedes cambiar o eliminar tu foto de perfil en cualquier momento. Al eliminar tu cuenta, la imagen
            también será eliminada de nuestros servidores.
          </p>
        </Section>

        <Section title="5. Uso aceptable">
          <p>Queda prohibido:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Usar la Aplicación para actividades ilegales, incluyendo lavado de activos o evasión fiscal.</li>
            <li>Intentar acceder a cuentas de otros usuarios.</li>
            <li>Realizar ingeniería inversa, copiar o redistribuir el software.</li>
            <li>Sobrecargar intencionalmente los servidores (ataques de denegación de servicio).</li>
          </ul>
        </Section>

        <Section title="6. Exactitud de los datos">
          <p>
            FlowX muestra únicamente los datos que tú introduces. No verificamos ni validamos la exactitud de
            la información financiera que registres. <strong>Las cifras mostradas no constituyen un estado financiero
            oficial</strong> y no deben usarse como tal para efectos tributarios, contables o legales.
          </p>
        </Section>

        <Section title="7. Disponibilidad del servicio">
          <p>
            Nos esforzamos por mantener la Aplicación disponible las 24 horas, pero no garantizamos disponibilidad
            ininterrumpida. Pueden ocurrir interrupciones por mantenimiento, actualizaciones o fallos de los
            proveedores de infraestructura (Supabase, Vercel). No somos responsables de pérdidas causadas por
            indisponibilidad del servicio.
          </p>
        </Section>

        <Section title="8. Limitación de responsabilidad">
          <p>
            FlowX se proporciona &ldquo;tal cual&rdquo; sin garantías de ningún tipo. En ningún caso seremos responsables
            de daños directos, indirectos, incidentales o consecuentes derivados del uso o imposibilidad de
            uso de la Aplicación, incluyendo pérdidas de datos o decisiones financieras tomadas con base en
            la información mostrada.
          </p>
        </Section>

        <Section title="9. Modificaciones a los términos">
          <p>
            Podemos actualizar estos Términos periódicamente. Te notificaremos por correo electrónico con al menos
            15 días de anticipación ante cambios sustanciales. El uso continuado de la Aplicación tras la
            publicación de cambios constituye tu aceptación.
          </p>
        </Section>

        <Section title="10. Ley aplicable">
          <p>
            Estos Términos se rigen por las leyes de la República de Colombia. Cualquier controversia se resolverá
            ante los tribunales competentes de Colombia.
          </p>
        </Section>

        <Section title="11. Contacto">
          <p>
            Para cualquier consulta sobre estos Términos, escríbenos a:{" "}
            <a href="mailto:soporte@flowx.app" className="text-primary underline underline-offset-2">
              soporte@flowx.app
            </a>
          </p>
        </Section>

        <div className="pt-4 border-t border-border/40">
          <Link href="/privacy" className="text-primary text-sm underline underline-offset-2">
            Ver Política de Privacidad →
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
