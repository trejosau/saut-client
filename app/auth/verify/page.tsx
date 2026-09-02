"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Button, Checkbox, TextField } from "@/core/design-system";
import { errorMessage } from "@/core/lib/api/errors";
import { requestJson } from "@/core/lib/api/fetcher";
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
      void requestJson<{ primary_email?: string | null }>("/api/auth/me", {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
      })
        .then((payload) => {
          const email = payload.primary_email?.trim() ?? "";
          setPendingEmail(email || "Cuenta Google");
        })
        .catch((err: unknown) => setError(errorMessage(err, "No encontramos tu sesion de Google.")));
      return;
    }

    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      const pending = getPendingLogin();
      if (!pending) {
        setError("Primero ingresa tu correo en el paso anterior.");
        return;
      }
      setPendingEmail(pending.email);
      const resolvedCode = (pending.code ?? "").replace(/\D/g, "").slice(0, 6);
      setDevCode(resolvedCode || null);
      if (resolvedCode.length === 6) setCode(resolvedCode);
    });
    return () => { cancelled = true; };
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
    <main className="min-h-screen bg-canvas text-ink">
      <div className="mx-auto max-w-xl px-5 py-12 sm:py-16">
        <div className="mb-8">
          <Link
            href="/"
            className="text-[12px] font-black uppercase tracking-[0.14em] text-mute hover:text-ink"
          >
            {"<-"} Volver
          </Link>
          <h1 className="mt-3 text-[28px] font-black tracking-tight text-ink">
            {isGoogleTermsFlow ? "Completa tu registro" : "Verifica tu codigo"}
          </h1>
          <p className="mt-1 text-[14px] text-mute">
            {isGoogleTermsFlow
              ? "Acepta terminos y privacidad para finalizar tu acceso con Google."
              : "Ingresa el codigo de 6 digitos y acepta los terminos para iniciar sesion."}
          </p>
        </div>

        <div className="rounded-[20px] border border-hairline bg-soft-cloud p-6 shadow-[0_24px_60px_rgba(8,10,13,.12)]">
          <div className="grid gap-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[12px] font-black uppercase tracking-[0.14em] text-mute">
                  Correo
                </div>
                <div className="text-[16px] font-bold text-ink">
                  {pendingEmail ?? "Sin correo"}
                </div>
              </div>
              {!isGoogleTermsFlow ? (
                <Button type="button" variant="link" size="fit" caps className="px-0 text-[12px] opacity-70 hover:opacity-100" onClick={changeEmail}>
                  Cambiar
                </Button>
              ) : null}
            </div>

            {!isGoogleTermsFlow ? (
              <TextField
                label="Codigo"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="123456"
                inputClassName="text-[16px] tracking-[0.24em]"
              />
            ) : null}

            <Checkbox
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              label={<>
                Acepto los{" "}
                <Link href="/terminos" className="font-bold underline underline-offset-4">
                  terminos de servicio
                </Link>{" "}
                y la{" "}
                <Link href="/privacidad" className="font-bold underline underline-offset-4">
                  politica de privacidad
                </Link>
                .
              </>}
              wrapperClassName="text-[13px]"
            />

            {!isGoogleTermsFlow && devCode ? (
              <div className="rounded-[12px] border border-hairline bg-[rgba(233,226,196,.45)] px-4 py-3 text-[13px] text-ink">
                <div className="text-[12px] font-black uppercase tracking-[0.14em] text-mute">
                  Codigo dev
                </div>
                <div className="mt-1 font-bold tracking-[0.24em]">{devCode}</div>
                <div className="text-[12px] text-mute">
                  Solo visible en modo desarrollo.
                </div>
              </div>
            ) : null}

            <Button type="button" variant="primary" size="md" fullWidth onClick={() => void submit()} disabled={!canSubmit} isLoading={busy}>
              {busy
                ? isGoogleTermsFlow
                  ? "Guardando..."
                  : "Verificando..."
                : "Continuar"}
            </Button>

            {error ? (
              <div className="rounded-[12px] border border-[rgba(219,38,75,.28)] bg-[rgba(219,38,75,.10)] px-4 py-3 text-[12px] font-semibold text-ink">
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
    <main className="min-h-screen bg-canvas text-ink">
      <div className="mx-auto max-w-xl px-5 py-12 sm:py-16">
        <div className="rounded-[20px] border border-hairline bg-soft-cloud p-6 shadow-[0_24px_60px_rgba(8,10,13,.12)]">
          <p className="text-[12px] font-black uppercase tracking-[0.14em] text-mute">
            Verificando acceso
          </p>
          <p className="mt-2 text-[14px] text-ink">Cargando datos de verificacion...</p>
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
