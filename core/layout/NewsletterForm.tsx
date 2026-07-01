"use client";

import * as React from "react";
import { useToast } from "@/core/design-system/feedback/ToastHost";

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
            const response = await fetch("/api/newsletter", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            if (!response.ok) {
                const payload = (await response.json().catch(() => null)) as
                    | { message?: string }
                    | null;
                throw new Error(payload?.message ?? "No se pudo registrar el correo.");
            }

            toast.success("Correo registrado correctamente.", "Suscripción");
            form.reset();
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : "No se pudo registrar el correo."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="mt-5 ml-auto flex w-full max-w-[520px] flex-col gap-2 sm:flex-row"
        >
            <label className="sr-only" htmlFor="newsletter-email">
                Dirección de correo electrónico
            </label>

            <input
                id="newsletter-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="Dirección de correo electrónico"
                className="h-12 min-w-0 flex-1 rounded-[8px] border border-white/20 bg-white/10 px-4 text-base text-white placeholder:text-white/46 outline-none transition focus:border-(--saut-yellow) focus:bg-white/14"
            />

            <button
                type="submit"
                disabled={isSubmitting}
                className="h-12 shrink-0 rounded-[8px] border border-(--saut-yellow) bg-(--saut-yellow) px-6 text-xs font-black uppercase text-(--saut-black) transition hover:border-white hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
                {isSubmitting ? "ENVIANDO" : "ENVIAR"}
            </button>
        </form>
    );
}
