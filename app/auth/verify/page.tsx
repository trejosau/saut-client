"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { verifyEmailLogin } from "@/modules/auth/client/api";
import {
  clearPendingLogin,
  getPendingLogin,
  saveSession,
  syncServerSession,
  syncSessionFromServer,
} from "@/modules/auth/client/session";

function sanitizeReturnTo(rawValue: string | null): string {
  const trimmed = String(rawValue ?? "").trim();
  if (!trimmed) return "/";
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }
  return "/";
}

function VerifyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const provider = searchParams.get("provider")?.trim().toLowerCase() ?? "";
  const isGoogleTermsFlow = provider === "google";
  const returnTo = React.useMemo(
    () => sanitizeReturnTo(searchParams.get("return_to")),
    [searchParams]
  );

  const [code, setCode] = React.useState("");
  const [acceptTerms, setAcceptTerms] = React.useState(true);
  const [pendingEmail, setPendingEmail] = React.useState<string | null>(null);
  const [devCode, setDevCode] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (isGoogleTermsFlow) {
      void fetch("/api/auth/me", {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("No encontramos tu sesion de Google. Intenta de nuevo.");
          }
          return response.json() as Promise<{ primary_email?: string | null }>;
        })
        .then((payload) => {
          const email = payload.primary_email?.trim() ?? "";
          setPendingEmail(email || "Cuenta Google");
        })
        .catch((err: unknown) => {
          const msg =
            err instanceof Error ? err.message : "No encontramos tu sesion de Google.";
          setError(msg);
        });
      return;
    }

    const pending = getPendingLogin();
    if (!pending) {
      setError("Primero ingresa tu correo en el paso anterior.");
      return;
    }
    setPendingEmail(pending.email);
    const resolvedCode = (pending.code ?? "").replace(/\D/g, "").slice(0, 6);
    setDevCode(resolvedCode || null);
    if (resolvedCode.length === 6) {
      setCode(resolvedCode);
    }
  }, [isGoogleTermsFlow]);

  const canSubmit = isGoogleTermsFlow
    ? acceptTerms && !busy && Boolean(pendingEmail)
    : code.length === 6 && acceptTerms && !busy && Boolean(pendingEmail);

  const submit = async () => {
    if (!pendingEmail) {
      setError(
        isGoogleTermsFlow
          ? "No encontramos tu sesion de Google."
          : "Primero ingresa tu correo en el paso anterior."
      );
      return;
    }
    if (!acceptTerms) {
      setError("Debes aceptar los terminos y la privacidad.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (isGoogleTermsFlow) {
        await syncSessionFromServer(true);
        clearPendingLogin();
        router.push(returnTo);
        return;
      }

      const resp = await verifyEmailLogin(pendingEmail, code);
      await syncServerSession(resp);
      saveSession({ ...resp, email: resp.primary_email ?? pendingEmail });
      clearPendingLogin();
      router.push("/");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No pudimos continuar con tu acceso.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const changeEmail = () => {
    clearPendingLogin();
    router.push("/");
  };

  return (
    <main className="min-h-screen bg-[var(--surface)] text-(--text)">
      <div className="mx-auto max-w-xl px-5 py-12 sm:py-16">
        <div className="mb-8">
          <Link
            href="/"
            className="text-[12px] font-black uppercase tracking-[0.14em] text-(--muted) hover:text-(--text)"
          >
            {"<-"} Volver
          </Link>
          <h1 className="mt-3 text-[28px] font-black tracking-tight text-(--text)">
            {isGoogleTermsFlow ? "Completa tu registro" : "Verifica tu codigo"}
          </h1>
          <p className="mt-1 text-[14px] text-(--muted)">
            {isGoogleTermsFlow
              ? "Acepta terminos y privacidad para finalizar tu acceso con Google."
              : "Ingresa el codigo de 6 digitos y acepta los terminos para iniciar sesion."}
          </p>
        </div>

        <div className="rounded-[20px] border border-(--border) bg-(--surface-2) p-6 shadow-[0_24px_60px_rgba(8,10,13,.12)]">
          <div className="grid gap-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[12px] font-black uppercase tracking-[0.14em] text-(--muted)">
                  Correo
                </div>
                <div className="text-[16px] font-bold text-(--text)">
                  {pendingEmail ?? "Sin correo"}
                </div>
              </div>
              {!isGoogleTermsFlow ? (
                <button
                  type="button"
                  onClick={changeEmail}
                  className="text-[12px] font-black uppercase tracking-[0.14em] text-(--text) opacity-70 hover:opacity-100"
                >
                  Cambiar
                </button>
              ) : null}
            </div>

            {!isGoogleTermsFlow ? (
              <label className="grid gap-2">
                <span className="text-[12px] font-black uppercase tracking-[0.14em] text-(--muted)">
                  Codigo
                </span>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="123456"
                  className="
                    h-12 w-full rounded-[14px]
                    border border-(--border)
                    bg-(--surface)
                    px-4
                    text-[16px] font-semibold text-(--text)
                    placeholder:text-(--muted)
                    shadow-[0_14px_30px_rgba(8,10,13,.08)]
                    outline-none
                    focus-visible:ring-2 focus-visible:ring-[color:var(--saut-ring)]
                    tracking-[0.24em]
                  "
                />
              </label>
            ) : null}

            <label className="inline-flex items-start gap-3 text-[13px] text-(--text)">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-[4px] h-5 w-5 rounded border-(--border) text-(--saut-yellow)"
              />
              <span>
                Acepto los{" "}
                <Link href="/terminos" className="font-bold underline underline-offset-4">
                  terminos de servicio
                </Link>{" "}
                y la{" "}
                <Link href="/privacidad" className="font-bold underline underline-offset-4">
                  politica de privacidad
                </Link>
                .
              </span>
            </label>

            {!isGoogleTermsFlow && devCode ? (
              <div className="rounded-[12px] border border-(--border) bg-[rgba(233,226,196,.45)] px-4 py-3 text-[13px] text-(--text)">
                <div className="text-[12px] font-black uppercase tracking-[0.14em] text-(--muted)">
                  Codigo dev
                </div>
                <div className="mt-1 font-bold tracking-[0.24em]">{devCode}</div>
                <div className="text-[12px] text-(--muted)">
                  Solo visible en modo desarrollo.
                </div>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => void submit()}
              disabled={!canSubmit}
              className="
                h-12 w-full rounded-[999px]
                border border-(--border)
                bg-(--saut-yellow) text-(--saut-black)
                text-[12px] font-black tracking-[0.16em] uppercase
                shadow-[0_18px_40px_rgba(8,10,13,.16)]
                transition
                hover:bg-(--saut-blue) hover:text-white
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--saut-ring)]
                disabled:opacity-60 disabled:cursor-not-allowed
              "
            >
              {busy
                ? isGoogleTermsFlow
                  ? "Guardando..."
                  : "Verificando..."
                : "Continuar"}
            </button>

            {error ? (
              <div className="rounded-[12px] border border-[rgba(219,38,75,.28)] bg-[rgba(219,38,75,.10)] px-4 py-3 text-[12px] font-semibold text-(--text)">
                {error}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}

function VerifyPageFallback() {
  return (
    <main className="min-h-screen bg-[var(--surface)] text-(--text)">
      <div className="mx-auto max-w-xl px-5 py-12 sm:py-16">
        <div className="rounded-[20px] border border-(--border) bg-(--surface-2) p-6 shadow-[0_24px_60px_rgba(8,10,13,.12)]">
          <p className="text-[12px] font-black uppercase tracking-[0.14em] text-(--muted)">
            Verificando acceso
          </p>
          <p className="mt-2 text-[14px] text-(--text)">Cargando datos de verificacion...</p>
        </div>
      </div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <React.Suspense fallback={<VerifyPageFallback />}>
      <VerifyPageContent />
    </React.Suspense>
  );
}
