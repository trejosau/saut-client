"use client";

import * as React from "react";
import { useToast } from "@/core/design-system/feedback/ToastHost";
import { Button, TextField } from "@/core/design-system";
import { requestJson } from "@/core/lib/api/fetcher";

export function NewsletterForm() {
    const toast = useToast();
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const form = event.currentTarget;
        const formData = new FormData(form);
        const email = String(formData.get("email") ?? "").trim();

        if (!email) {
            toast.warning("Escribe tu correo para suscribirte.");
            return;
        }

        setIsSubmitting(true);

        try {
            await requestJson<unknown>("/api/newsletter", { method: "POST", json: { email } });

            toast.success("Correo registrado correctamente.", "SuscripciÃ³n");
            form.reset();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "No se pudo registrar el correo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="mt-5 ml-auto flex w-full max-w-[520px] flex-col gap-2 sm:flex-row"
        >
            <TextField
                id="newsletter-email"
                name="email"
                type="email"
                label={undefined}
                required
                autoComplete="email"
                aria-describedby="newsletter-hint"
                aria-label="DirecciÃ³n de correo electrÃ³nico"
                placeholder="DirecciÃ³n de correo electrÃ³nico"
                wrapperClassName="min-w-0 flex-1"
                shellClassName="h-12 rounded-[8px] border-white/20 bg-white/10 px-4 text-white shadow-none"
                inputClassName="text-base text-white placeholder:text-white/46"
            />

            <span id="newsletter-hint" className="sr-only">
                RecibirÃ¡s novedades de productos y lanzamientos de SAUT.
            </span>

            <Button
                type="submit"
                disabled={isSubmitting}
                isLoading={isSubmitting}
                caps={false}
                shadow="none"
                size="md"
                className="h-12 shrink-0 rounded-[8px] border border-primary bg-primary px-6 text-xs font-black uppercase text-ink transition hover:border-white hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
                {isSubmitting ? "ENVIANDO" : "ENVIAR"}
            </Button>
        </form>
    );
}
