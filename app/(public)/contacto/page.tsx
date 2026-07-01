import type { Metadata } from "next";
import Link from "next/link";
import { Clock3, Mail, MessageSquareText } from "lucide-react";

import { sendContactMessageAction } from "./actions";
import { ContactoForm } from "./ContactoForm";

const inputClassName =
  "mt-2 min-h-12 w-full rounded-[6px] border border-(--border) bg-white px-4 py-3 text-base text-(--text) placeholder:text-[rgba(8,10,13,.42)] outline-none transition focus:border-(--saut-blue) focus:ring-2 focus:ring-[rgba(5,122,168,.16)]";

const labelClassName = "text-xs font-extrabold uppercase text-(--saut-navy)";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Contacta a SAUT para resolver dudas, cotizar o compartir una idea.",
};

export default function ContactoPage() {
  return (
    <main className="w-full">
      <header className="bg-(--saut-navy) py-14 text-white sm:py-20">
        <div className="saut-container">
          <p className="text-xs font-extrabold uppercase text-(--saut-yellow)">Contacto SAUT</p>
          <h1 className="saut-display mt-3 max-w-[12ch] text-[clamp(48px,8vw,96px)] leading-[.9] uppercase">
            Hablemos de tu idea.
          </h1>
          <p className="mt-6 max-w-[58ch] text-base leading-7 text-white/68 sm:text-lg">
            Resolvemos dudas de pedidos, producción y proyectos especiales. Cuéntanos qué necesitas.
          </p>
        </div>
      </header>

      <section className="saut-section bg-(--bg)">
        <div className="saut-container grid gap-10 lg:grid-cols-[.82fr_1.18fr] lg:gap-16">
          <div>
            <p className="saut-kicker">Atención directa</p>
            <h2 className="saut-heading max-w-[11ch]">Te respondemos con claridad.</h2>
            <div className="mt-10 grid gap-7 border-t border-(--border) pt-7">
              <div className="flex gap-4">
                <Mail className="shrink-0 text-(--saut-blue)" size={23} />
                <div>
                  <h3 className="text-sm font-extrabold uppercase">Respuesta por correo</h3>
                  <p className="mt-1 text-sm leading-6 text-(--muted)">Usaremos tu email únicamente para dar seguimiento a tu mensaje.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <MessageSquareText className="shrink-0 text-(--saut-blue)" size={23} />
                <div>
                  <h3 className="text-sm font-extrabold uppercase">Comparte referencias</h3>
                  <p className="mt-1 text-sm leading-6 text-(--muted)">Adjunta imágenes cuando ayuden a explicar un diseño o acabado.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Clock3 className="shrink-0 text-(--saut-blue)" size={23} />
                <div>
                  <h3 className="text-sm font-extrabold uppercase">Seguimiento humano</h3>
                  <p className="mt-1 text-sm leading-6 text-(--muted)">Revisamos cada caso antes de responder.</p>
                </div>
              </div>
            </div>
          </div>

          <ContactoForm
            action={sendContactMessageAction}
            inputClassName={inputClassName}
            labelClassName={labelClassName}
          />
        </div>
      </section>

      <section className="border-t border-(--border) bg-white py-12">
        <div className="saut-container flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="saut-display text-3xl uppercase">¿Prefieres empezar diseñando?</p>
          <Link href="/personalizar" className="saut-button saut-button--primary self-start sm:self-auto">Abrir estudio</Link>
        </div>
      </section>
    </main>
  );
}
