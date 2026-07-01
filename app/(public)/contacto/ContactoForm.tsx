"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { FormErrorBag } from "@/core/design-system/feedback/FormErrorBag";
import { toFormErrorBag, type FormErrorBag as FormErrorBagState } from "@/core/design-system/feedback/form-errors";
import { useToast } from "@/core/design-system/feedback/ToastHost";

type ContactoFormProps = {
  action: (formData: FormData) => Promise<void>;
  inputClassName: string;
  labelClassName: string;
};

export function ContactoForm({ action, inputClassName, labelClassName }: ContactoFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [errorBag, setErrorBag] = useState<FormErrorBagState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setErrorBag(null);
    setIsSubmitting(true);
    try {
      await action(formData);
      setErrorBag(null);
      toast.success("Mensaje enviado correctamente.");
      form.reset();
      router.refresh();
    } catch (error) {
      const bag = toFormErrorBag(error, "No se pudo enviar tu mensaje.");
      setErrorBag(bag);
      toast.error(bag.rawMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      aria-busy={isSubmitting}
      className="rounded-[8px] border border-(--border) bg-white p-5 shadow-[0_18px_40px_rgba(8,10,13,.08)] sm:p-7"
    >
      <div className="grid gap-4">
        <FormErrorBag bag={errorBag} />
        <div>
          <label htmlFor="contact-email" className={labelClassName}>
            Correo electrónico
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="tu@email.com"
            className={inputClassName}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="contact-name" className={labelClassName}>
              Nombre
            </label>
            <input
              id="contact-name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Tu nombre"
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="contact-phone" className={labelClassName}>
              Número (opcional)
            </label>
            <input
              id="contact-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+52 000 000 0000"
              className={inputClassName}
            />
          </div>
        </div>

        <div>
          <label htmlFor="contact-message" className={labelClassName}>
            Mensaje
          </label>
          <textarea
            id="contact-message"
            name="message"
            required
            rows={5}
            placeholder="Escribe aquí tu mensaje..."
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="contact-images" className={labelClassName}>
            Imágenes (opcional)
          </label>
          <input
            id="contact-images"
            name="images"
            type="file"
            accept="image/*"
            multiple
            className="mt-2 block min-h-12 w-full rounded-[6px] border border-(--border) bg-(--surface-2) px-3 py-2 text-sm text-(--muted) file:mr-3 file:rounded-[5px] file:border file:border-(--saut-black) file:bg-(--saut-yellow) file:px-3 file:py-2 file:text-[10px] file:font-black file:uppercase file:text-(--saut-black) hover:file:bg-(--saut-blue) hover:file:text-white"
          />
          <p className="mt-2 text-[11px] text-(--muted)">
            Formatos recomendados: JPG, PNG o WEBP.
          </p>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="saut-button saut-button--primary disabled:cursor-wait disabled:opacity-60"
          >
            {isSubmitting ? "Enviando..." : "Enviar mensaje"}
          </button>
          <p className="text-[11px] text-(--muted)">
            Número e imágenes son opcionales.
          </p>
        </div>
      </div>
    </form>
  );
}

