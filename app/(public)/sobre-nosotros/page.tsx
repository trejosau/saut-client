import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, HeartHandshake, Layers3, Scissors } from "lucide-react";

export const metadata: Metadata = {
  title: "La marca",
  description: "Conoce la visiÃ³n, el proceso y la forma de trabajar de SAUT Street Wear.",
};

const principles = [
  {
    icon: Layers3,
    title: "Prendas con intenciÃ³n",
    copy: "Elegimos siluetas, gramajes y colores que funcionan como una base sÃ³lida para cada diseÃ±o.",
  },
  {
    icon: Scissors,
    title: "ProducciÃ³n cuidada",
    copy: "Revisamos composiciÃ³n, colocaciÃ³n y acabado antes de que una pieza salga del taller.",
  },
  {
    icon: HeartHandshake,
    title: "AtenciÃ³n directa",
    copy: "AcompaÃ±amos pedidos y proyectos personalizados sin esconder el proceso detrÃ¡s de respuestas genÃ©ricas.",
  },
];

const steps = [
  { number: "01", title: "Elige", copy: "Encuentra un diseÃ±o del catÃ¡logo o empieza con una prenda limpia." },
  { number: "02", title: "Hazlo tuyo", copy: "Define modelo, color, talla, gramaje y los detalles grÃ¡ficos." },
  { number: "03", title: "Lo producimos", copy: "Validamos tu pedido, preparamos la pieza y coordinamos el envÃ­o." },
];

export default function SobreNosotrosPage() {
  return (
    <main className="w-full">
      <section className="relative min-h-[620px] overflow-hidden bg-charcoal text-white">
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
            <p className="text-xs font-extrabold uppercase text-primary">La marca</p>
            <h1 className="saut-display mt-3 text-[clamp(48px,8vw,96px)] leading-[.9] uppercase">
              Vestir una idea tambiÃ©n es hacerla real.
            </h1>
            <p className="mt-6 max-w-[56ch] text-base leading-7 text-white/74 sm:text-lg">
              SAUT crea streetwear y herramientas de personalizaciÃ³n para quienes buscan una pieza con identidad propia.
            </p>
          </div>
        </div>
      </section>

      <section className="saut-section bg-white">
        <div className="saut-container grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
          <div>
            <p className="saut-kicker">Por quÃ© existe SAUT</p>
            <h2 className="saut-heading max-w-[10ch]">No querÃ­amos otra marca genÃ©rica.</h2>
          </div>
          <div className="self-end text-lg leading-8 text-mute">
            <p>
              Nacimos de una idea simple: la ropa que mÃ¡s representa a alguien no siempre estÃ¡ esperando en un aparador.
              A veces hay que construirla.
            </p>
            <p className="mt-5">
              Por eso reunimos catÃ¡logo, producciÃ³n y personalizaciÃ³n en un mismo lugar. Puedes elegir una pieza lista o usar
              el estudio para crear la tuya desde cero.
            </p>
          </div>
        </div>
      </section>

      <section className="saut-section border-y border-hairline bg-hairline-soft">
        <div className="saut-container">
          <p className="saut-kicker">CÃ³mo trabajamos</p>
          <h2 className="saut-heading max-w-[12ch]">Criterio en cada decisiÃ³n.</h2>
          <div className="mt-12 grid gap-px bg-hairline md:grid-cols-3">
            {principles.map(({ icon: Icon, title, copy }) => (
              <article key={title} className="bg-hairline-soft p-6 sm:p-8">
                <Icon className="text-info" size={28} strokeWidth={1.7} />
                <h3 className="saut-display mt-8 text-2xl uppercase">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-mute">{copy}</p>
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
            <p className="max-w-[46ch] text-sm leading-6 text-mute">
              Sabes quÃ© estÃ¡s eligiendo, cÃ³mo se prepara y quÃ© sigue despuÃ©s.
            </p>
          </div>
          <ol className="mt-12 border-t border-hairline">
            {steps.map((step) => (
              <li key={step.number} className="grid gap-4 border-b border-hairline py-7 sm:grid-cols-[80px_1fr_1fr] sm:items-center">
                <span className="saut-display text-3xl text-info">{step.number}</span>
                <h3 className="saut-display text-3xl uppercase">{step.title}</h3>
                <p className="flex items-start gap-3 text-sm leading-6 text-mute">
                  <Check className="mt-1 shrink-0 text-info" size={17} /> {step.copy}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-primary py-14 text-ink">
        <div className="saut-container flex flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="saut-display max-w-[14ch] text-[clamp(36px,6vw,68px)] leading-[.94] uppercase">
            La siguiente pieza puede ser tuya.
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/catalogo" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-ink bg-ink px-6 text-xs font-black uppercase text-white transition hover:bg-charcoal">Ver catÃ¡logo</Link>
            <Link href="/personalizar" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-ink bg-transparent px-6 text-xs font-black uppercase text-ink transition hover:bg-soft-cloud/60">
              Crear diseÃ±o <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
