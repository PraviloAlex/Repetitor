import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../i18n/I18nContext";

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 0 40px" }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          background: "none",
          border: "none",
          color: "var(--primary)",
          fontSize: 15,
          cursor: "pointer",
          padding: "0 0 16px",
        }}
      >
        ← {t("lesson_back")}
      </button>

      <h1 className="screen-title">Política de Privacidad</h1>
      <p className="screen-sub">Última actualización: mayo de 2026</p>

      <Section title="1. Quiénes somos">
        Durillo es una aplicación web educativa para niños de 6° y 7° grado orientada a la preparación
        matemática para el ingreso a la escuela secundaria en Argentina. Operamos como desarrollador
        independiente sin fines comerciales de terceros.
      </Section>

      <Section title="2. Datos que recopilamos">
        Durillo <strong>no recopila datos personales identificables</strong>. Toda la información se
        almacena localmente en el dispositivo del usuario (localStorage del navegador) y nunca se
        transmite a servidores externos.
        <br />
        <br />
        Los datos almacenados localmente incluyen progreso de sesiones de estudio, precisión por tema,
        racha de días consecutivos y configuraciones de preferencia (idioma, PIN familiar, tiempo diario).
        Estos datos permanecen en el dispositivo y pueden borrarse en cualquier momento limpiando el
        almacenamiento del navegador.
      </Section>

      <Section title="3. Datos de menores">
        La aplicación está diseñada para ser utilizada por niños bajo supervisión de un adulto responsable.
        No solicitamos nombre, apellido, correo electrónico, número de teléfono ni ningún otro dato personal
        del menor ni del adulto. El PIN familiar es generado y almacenado localmente; no lo conocemos ni
        tenemos acceso a él.
      </Section>

      <Section title="4. Pagos">
        Los pagos se procesan a través de Mercado Pago. Durillo no almacena ni procesa datos de tarjetas de
        crédito ni información bancaria. Al realizar un pago, el usuario acepta los términos y condiciones
        de Mercado Pago. Una vez confirmado el pago, el acceso premium se activa manualmente mediante un
        código que se envía al comprador.
      </Section>

      <Section title="5. Cookies y rastreo">
        Durillo no utiliza cookies de terceros, píxeles de seguimiento ni herramientas de análisis externas.
        No mostramos publicidad de ningún tipo dentro de la aplicación.
      </Section>

      <Section title="6. Compartir información">
        No vendemos, alquilamos ni compartimos ningún dato con terceros. La función "Compartir por WhatsApp"
        genera un texto en el dispositivo del usuario; Durillo no accede al contenido de los mensajes enviados.
      </Section>

      <Section title="7. Seguridad">
        Dado que todos los datos se almacenan localmente en el dispositivo, la seguridad depende del propio
        dispositivo del usuario. Recomendamos proteger el dispositivo con contraseña o PIN del sistema operativo.
      </Section>

      <Section title="8. Derechos del usuario">
        Podés eliminar todos los datos de Durillo en cualquier momento borrando el almacenamiento local del
        navegador (Configuración del navegador → Privacidad → Borrar datos del sitio). No es necesario
        contactarnos para hacerlo.
      </Section>

      <Section title="9. Cambios en esta política">
        Podemos actualizar esta política ocasionalmente. La fecha de última actualización se muestra al inicio
        de este documento. El uso continuado de la aplicación implica la aceptación de los cambios.
      </Section>

      <Section title="10. Contacto">
        Para preguntas sobre privacidad, podés contactarnos a través del canal de soporte indicado en el punto
        de venta donde adquiriste el acceso.
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 6px" }}>{title}</h2>
      <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--text)", margin: 0 }}>{children}</p>
    </section>
  );
}
