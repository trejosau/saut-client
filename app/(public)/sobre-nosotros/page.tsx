import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, HeartHandshake, Layers3, Scissors } from "lucide-react";

export const metadata: Metadata = {
  title: "La marca",
  description: "Conoce la visión, el proceso y la forma de trabajar de SAUT Street Wear.",
};

const principles = [
  {
    icon: Layers3,
    title: "Prendas con intención",
    copy: "Elegimos siluetas, gramajes y colores que funcionan como una base sólida para cada diseño.",
  },
  {
    icon: Scissors,
    title: "Producción cuidada",
    copy: "Revisamos composición, colocación y acabado antes de que una pieza salga del taller.",
  },
  {
    icon: HeartHandshake,
    title: "Atención directa",
    copy: "Acompañamos pedidos y proyectos personalizados sin esconder el proceso detrás de respuestas genéricas.",
  },
];

const steps = [
  { number: "01", title: "Elige", copy: "Encuentra un diseño del catálogo o empieza con una prenda limpia." },
  { number: "02", title: "Hazlo tuyo", copy: "Define modelo, color, talla, gramaje y los detalles gráficos." },
  { number: "03", title: "Lo producimos", copy: "Validamos tu pedido, preparamos la pieza y coordinamos el envío." },
];

export default function SobreNosotrosPage() {
  return (
    <main className="w-full">
      <section className="relative min-h-[620px] overflow-hidden bg-(--saut-navy) text-white">
        <Image
          src="/landing-banner.webp"
          alt="SAUT Street Wear, marca mexicana de streetwear"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[82%_center] sm:object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,59,81,.94)_0%,rgba(2,59,81,.76)_42%,rgba(2,59,81,.12)_76%,transparent_100%)]" />
        <div className="saut-container relative flex min-h-[620px] items-end py-14 sm:items-center">
          <div className="max-w-[680px]">
            <p className="text-xs font-extrabold uppercase text-(--saut-yellow)">La marca</p>
            <h1 className="saut-display mt-3 text-[clamp(48px,8vw,96px)] leading-[.9] uppercase">
              Vestir una idea también es hacerla real.
            </h1>
            <p className="mt-6 max-w-[56ch] text-base leading-7 text-white/74 sm:text-lg">
              SAUT crea streetwear y herramientas de personalización para quienes buscan una pieza con identidad propia.
            </p>
          </div>
        </div>
      </section>

      <section className="saut-section bg-white">
        <div className="saut-container grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
          <div>
            <p className="saut-kicker">Por qué existe SAUT</p>
            <h2 className="saut-heading max-w-[10ch]">No queríamos otra marca genérica.</h2>
          </div>
          <div className="self-end text-lg leading-8 text-(--muted)">
            <p>
              Nacimos de una idea simple: la ropa que más representa a alguien no siempre está esperando en un aparador.
              A veces hay que construirla.
            </p>
            <p className="mt-5">
              Por eso reunimos catálogo, producción y personalización en un mismo lugar. Puedes elegir una pieza lista o usar
              el estudio para crear la tuya desde cero.
            </p>
          </div>
        </div>
      </section>

      <section className="saut-section border-y border-(--border) bg-(--surface-3)">
        <div className="saut-container">
          <p className="saut-kicker">Cómo trabajamos</p>
          <h2 className="saut-heading max-w-[12ch]">Criterio en cada decisión.</h2>
          <div className="mt-12 grid gap-px bg-(--border) md:grid-cols-3">
            {principles.map(({ icon: Icon, title, copy }) => (
              <article key={title} className="bg-(--surface-3) p-6 sm:p-8">
                <Icon className="text-(--saut-blue)" size={28} strokeWidth={1.7} />
                <h3 className="saut-display mt-8 text-2xl uppercase">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-(--muted)">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="saut-section bg-white">
        <div className="saut-container">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="saut-kicker">Del clic a tu puerta</p>
              <h2 className="saut-heading">Un proceso claro</h2>
            </div>
            <p className="max-w-[46ch] text-sm leading-6 text-(--muted)">
              Sabes qué estás eligiendo, cómo se prepara y qué sigue después.
            </p>
          </div>
          <ol className="mt-12 border-t border-(--border)">
            {steps.map((step) => (
              <li key={step.number} className="grid gap-4 border-b border-(--border) py-7 sm:grid-cols-[80px_1fr_1fr] sm:items-center">
                <span className="saut-display text-3xl text-(--saut-blue)">{step.number}</span>
                <h3 className="saut-display text-3xl uppercase">{step.title}</h3>
                <p className="flex items-start gap-3 text-sm leading-6 text-(--muted)">
                  <Check className="mt-1 shrink-0 text-(--saut-blue)" size={17} /> {step.copy}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-(--saut-yellow) py-14 text-(--saut-black)">
        <div className="saut-container flex flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="saut-display max-w-[14ch] text-[clamp(36px,6vw,68px)] leading-[.94] uppercase">
            La siguiente pieza puede ser tuya.
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/catalogo" className="saut-button saut-button--dark">Ver catálogo</Link>
            <Link href="/personalizar" className="saut-button saut-button--ghost">
              Crear diseño <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
