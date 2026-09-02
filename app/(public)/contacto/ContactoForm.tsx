"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Button, FileUpload, TextAreaField, TextField } from "@/core/design-system";
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
      className="rounded-[8px] border border-hairline bg-white p-5 shadow-[0_18px_40px_rgba(8,10,13,.08)] sm:p-7"
    >
      <div className="grid gap-4">
        <FormErrorBag bag={errorBag} />
        <TextField
            id="contact-email"
            name="email"
            type="email"
            label="Correo electrÃ³nico"
            labelClassName={labelClassName}
            required
            autoComplete="email"
            placeholder="tu@email.com"
            shellClassName={inputClassName}
            inputClassName="text-base"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
              id="contact-name"
              name="name"
              type="text"
              label="Nombre"
              labelClassName={labelClassName}
              autoComplete="name"
              placeholder="Tu nombre"
              shellClassName={inputClassName}
              inputClassName="text-base"
          />

          <TextField
              id="contact-phone"
              name="phone"
              type="tel"
              label="NÃºmero (opcional)"
              labelClassName={labelClassName}
              autoComplete="tel"
              placeholder="+52 000 000 0000"
              shellClassName={inputClassName}
              inputClassName="text-base"
          />
        </div>

        <TextAreaField
            id="contact-message"
            name="message"
            label="Mensaje"
            labelClassName={labelClassName}
            required
            rows={5}
            placeholder="Escribe aquÃ­ tu mensaje..."
            shellClassName={inputClassName}
            textareaClassName="text-base"
        />

        <FileUpload
            id="contact-images"
            name="images"
            label="ImÃ¡genes (opcional)"
            labelClassName={labelClassName}
            acceptedTypes={["image/*"]}
            multiple
            description="Formatos recomendados: JPG, PNG o WEBP."
            className="mt-2"
        />

        <div className="mt-1 flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            disabled={isSubmitting}
            isLoading={isSubmitting}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-ink bg-primary px-6 text-xs font-black uppercase text-ink transition hover:bg-primary/90 disabled:cursor-wait disabled:opacity-60"
          >
            {isSubmitting ? "Enviando..." : "Enviar mensaje"}
          </Button>
          <p className="text-[11px] text-mute">
            NÃºmero e imÃ¡genes son opcionales.
          </p>
        </div>
      </div>
    </form>
  );
}

