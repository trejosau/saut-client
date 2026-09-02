"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

import { useCart } from "@/core/cart";
import type { CartItem, CartPrintArea } from "@/core/cart/context";
import { Button, RadioControl, SelectField, TextField } from "@/core/design-system";
import { useToast } from "@/core/design-system/feedback/ToastHost";
import { getSession } from "@/modules/auth/client/session";
import {
  cancelPaymentAttempt,
  confirmPaymentAttempt,
  createCheckoutSession,
  createPaymentAttempt,
  type CartItemResponse,
  type CheckoutAddress,
  type CheckoutSessionResponse,
  getOrder,
  getOrderByCheckout,
  type OrderResponse,
  type PaymentAttemptResponse,
  selectCheckoutShippingQuote,
} from "@/modules/commerce/client/api";
import {
  getOrCreateGuestCartSessionId,
  syncLocalCartToBackend,
} from "@/modules/commerce/client/cart-sync";
import {
  buildOrderCode,
  migrateGuestLinkedOrdersToAccount,
  upsertLinkedOrder,
} from "@/modules/orders/client/storage";

const HOSTED_PAYMENT_METHODS = ["Tarjeta", "Google Pay", "Apple Pay", "Link"];

const CONTACT_PREFIX_OPTIONS = [
  {
    value: "MX",
    label: "Mexico +52",
    dialCode: "+52",
    placeholder: "871 123 4567",
  },
  {
    value: "US",
    label: "USA +1",
    dialCode: "+1",
    placeholder: "555 123 4567",
  },
  {
    value: "CA",
    label: "Canada +1",
    dialCode: "+1",
    placeholder: "416 555 0199",
  },
] as const;

const COUNTRY_OPTIONS = [
  { value: "MX", label: "Mexico" },
  { value: "US", label: "Estados Unidos" },
  { value: "CA", label: "Canada" },
];

const ADDRESS_AUTOCOMPLETE_OPTIONS = [
  {
    value: "torreon-centro",
    label: "Av. Morelos 124, Centro, Torreon",
    helper: "Coahuila, Mexico",
    line1: "Av. Morelos 124",
    line2: "Centro",
    city: "Torreon",
    state: "Coahuila",
    postal_code: "27000",
    country: "MX",
    reference: "Entre Colon y Acuna",
  },
  {
    value: "torreon-las-trojes",
    label: "Blvd. Independencia 3810, Residencial Las Trojes",
    helper: "Torreon, Mexico",
    line1: "Blvd. Independencia 3810",
    line2: "Residencial Las Trojes",
    city: "Torreon",
    state: "Coahuila",
    postal_code: "27010",
    country: "MX",
    reference: "Frente a plaza comercial",
  },
  {
    value: "dallas-elm",
    label: "2100 Elm St, Downtown Dallas",
    helper: "Texas, USA",
    line1: "2100 Elm St",
    line2: "Downtown Dallas",
    city: "Dallas",
    state: "Texas",
    postal_code: "75201",
    country: "US",
    reference: "Lobby reception",
  },
  {
    value: "toronto-queen",
    label: "458 Queen St W, Fashion District",
    helper: "Toronto, Canada",
    line1: "458 Queen St W",
    line2: "Fashion District",
    city: "Toronto",
    state: "Ontario",
    postal_code: "M5V 2A8",
    country: "CA",
    reference: "Unit 4B",
  },
] as const;

type CheckoutStep = "address" | "payment";

type DetailedCartLine = {
  local: CartItem;
  remote?: CartItemResponse;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type DetailLine = {
  label: string;
  value: string;
};

type PaymentStepCardProps = {
  attempt: PaymentAttemptResponse;
  checkoutSession: CheckoutSessionResponse;
  currentAddress: CheckoutAddress;
  email: string;
  phone: string;
  busy: boolean;
  onBack: () => void;
  onFinalize: (attemptId: string, checkoutId: string) => Promise<void>;
  onError: (message: string | null) => void;
};

function money(value: number): string {
  try {
    return value.toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch {
    return String(value);
  }
}

function normalizeText(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePhoneDigits(value: string | null | undefined): string {
  return normalizeText(value).replace(/[^\d]/g, "");
}

function isBlank(value: string | null | undefined): boolean {
  return normalizeText(value).length === 0;
}

function formatItemType(itemType: string): string {
  return itemType === "customized" ? "Personalizado" : "Predisenado";
}

function formatModelLabel(value: string): string {
  const normalized = normalizeText(value).replace(/[_-]/g, " ");
  if (!normalized) return "";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function selectionValue(item: CartItem, label: string): string | undefined {
  const found = item.selections.find(
    (selection) =>
      normalizeText(selection.label).toLowerCase() === label.trim().toLowerCase()
  );
  return found?.value;
}

function sameText(left: string, right: string): boolean {
  return normalizeText(left).toLowerCase() === normalizeText(right).toLowerCase();
}

function pushDetailLine(lines: DetailLine[], label: string, value: string) {
  const normalizedLabel = normalizeText(label);
  const normalizedValue = normalizeText(value);
  if (!normalizedLabel || !normalizedValue) return;
  if (
    lines.some((line) => normalizeText(line.label).toLowerCase() === normalizedLabel.toLowerCase())
  ) {
    return;
  }
  lines.push({ label: normalizedLabel, value: normalizedValue });
}

function snapshotRecord(snapshot: unknown): Record<string, unknown> | null {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    return null;
  }
  return snapshot as Record<string, unknown>;
}

function snapshotText(snapshot: Record<string, unknown> | null, key: string): string {
  const value = snapshot?.[key];
  return typeof value === "string" ? value : "";
}

function snapshotNumber(snapshot: Record<string, unknown> | null, key: string): number {
  const value = snapshot?.[key];
  return Number.isFinite(value) ? Number(value) : 0;
}

function shippingProviderLooksMock(checkoutSession: CheckoutSessionResponse | null): boolean {
  const provider = normalizeText(checkoutSession?.shipping_provider ?? "").toLowerCase();
  return provider.includes("mock");
}

function buildDetailLines(line: DetailedCartLine): DetailLine[] {
  const detailLines: DetailLine[] = [];
  const snapshot = snapshotRecord(line.local.customizerSnapshot);
  const remoteModel = formatModelLabel(
    line.remote?.garment_model ?? snapshotText(snapshot, "garment_model")
  );
  const remoteFit = formatModelLabel(line.remote?.fit ?? snapshotText(snapshot, "fit"));
  const typeLabel = normalizeText(selectionValue(line.local, "Tipo") ?? remoteModel);
  const designLabel = normalizeText(
    selectionValue(line.local, "Diseno") ?? snapshotText(snapshot, "design_title")
  );
  const colorLabel = normalizeText(line.remote?.color ?? snapshotText(snapshot, "color"));
  const sizeLabel = normalizeText(
    line.remote?.size ?? snapshotText(snapshot, "size")
  ).toUpperCase();
  const grammage = line.remote?.grammage_g ?? snapshotNumber(snapshot, "grammage_g");

  pushDetailLine(detailLines, "Tipo", formatModelLabel(typeLabel));
  pushDetailLine(detailLines, "Color", colorLabel);
  pushDetailLine(detailLines, "Talla", sizeLabel);
  pushDetailLine(detailLines, "Gramaje", grammage > 0 ? `${grammage} g` : "");
  pushDetailLine(detailLines, "Diseno", designLabel);

  if (remoteModel && !sameText(remoteModel, typeLabel) && !sameText(remoteModel, remoteFit)) {
    pushDetailLine(detailLines, "Modelo", remoteModel);
  }

  if (
    remoteFit &&
    !sameText(remoteFit, typeLabel) &&
    !sameText(remoteFit, remoteModel)
  ) {
    pushDetailLine(detailLines, "Fit", remoteFit);
  }

  return detailLines;
}

function composePhoneNumber(prefixValue: string, phone: string): string {
  const option =
    CONTACT_PREFIX_OPTIONS.find((item) => item.value === prefixValue) ?? CONTACT_PREFIX_OPTIONS[0];
  const digits = normalizePhoneDigits(phone);
  return digits ? `${option.dialCode}${digits}` : option.dialCode;
}

function areaToStyle(area?: CartPrintArea): React.CSSProperties {
  if (!area) {
    return {
      left: "0%",
      top: "0%",
      width: "100%",
      height: "100%",
    };
  }

  return {
    left: `${area.xPct}%`,
    top: `${area.yPct}%`,
    width: `${area.wPct}%`,
    height: `${area.hPct}%`,
  };
}

function shippingLabel(checkoutSession: CheckoutSessionResponse | null): string {
  if (!checkoutSession) return "Envio por confirmar";
  if (checkoutSession.shipping_method === "local") return "Entrega local";
  if (checkoutSession.shipping_method === "national") return "Envio nacional";
  return "Entrega";
}

function shippingTypeLabel(checkoutSession: CheckoutSessionResponse | null): string {
  if (!checkoutSession) return "Por definir";
  if (checkoutSession.shipping_method === "local") return "Local";
  if (checkoutSession.shipping_method === "national") return "Nacional";
  return "Entrega";
}

function formatQuoteLabel(checkoutSession: CheckoutSessionResponse | null): string {
  if (!checkoutSession) return "Pendiente";
  const parts = [
    normalizeText(checkoutSession.shipping_provider),
    normalizeText(checkoutSession.shipping_service),
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" / ") : shippingLabel(checkoutSession);
}

function buildPaymentErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

function CheckoutItemPreview({ item }: { item: CartItem }) {
  const frontBase = item.imageFrontSrc || item.imageSrc;
  const backBase = item.imageBackSrc || item.imageFrontSrc || item.imageSrc;
  const hasBackFace =
    Boolean(item.imageBackOverlaySrc) || normalizeText(backBase) !== normalizeText(frontBase);

  return (
    <div className="group/preview relative h-[110px] w-[84px] shrink-0 overflow-hidden rounded-[20px] border border-[rgba(8,10,13,.08)] bg-[linear-gradient(180deg,rgba(5,122,168,.08)_0%,rgba(255,217,66,.16)_100%)] shadow-[0_12px_24px_rgba(8,10,13,.07)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,.65),transparent_58%)]" />

      <div className="relative h-full w-full">
        <div
          className={[
            "absolute inset-0 transition-all duration-500 ease-out",
            hasBackFace
              ? "opacity-100 group-hover/preview:scale-[1.02] group-hover/preview:opacity-0"
              : "opacity-100",
          ].join(" ")}
        >
          <img
            src={frontBase}
            alt={item.name}
            className="h-full w-full object-contain transition-transform duration-500 ease-out group-hover/preview:scale-[1.04]"
            loading="lazy"
            decoding="async"
          />
          {item.imageFrontOverlaySrc ? (
            <div className="absolute" style={areaToStyle(item.frontPrintArea)}>
              <img
                src={item.imageFrontOverlaySrc}
                alt={`${item.name} frontal`}
                className="h-full w-full object-contain"
                loading="lazy"
                decoding="async"
              />
            </div>
          ) : null}
          <span className="absolute left-2 top-2 rounded-full bg-[rgba(8,10,13,.7)] px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-white">
            Frente
          </span>
        </div>

        {hasBackFace ? (
          <div className="absolute inset-0 opacity-0 transition-all duration-500 ease-out group-hover/preview:scale-[1.02] group-hover/preview:opacity-100">
            <img
              src={backBase}
              alt={`${item.name} trasera`}
              className="h-full w-full object-contain transition-transform duration-500 ease-out group-hover/preview:scale-[1.04]"
              loading="lazy"
              decoding="async"
            />
            {item.imageBackOverlaySrc ? (
              <div className="absolute" style={areaToStyle(item.backPrintArea)}>
                <img
                  src={item.imageBackOverlaySrc}
                  alt={`${item.name} trasera`}
                  className="h-full w-full object-contain"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            ) : null}
            <span className="absolute left-2 top-2 rounded-full bg-[rgba(8,10,13,.7)] px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-white">
              Espalda
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function PaymentStepCard({
  attempt,
  checkoutSession,
  currentAddress,
  email,
  phone,
  busy,
  onBack,
  onFinalize,
  onError,
}: PaymentStepCardProps) {
  const [localBusy, setLocalBusy] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | null>(null);
  const checkoutUrl = normalizeText(attempt.checkout_url ?? "");
  const isHostedStripe = attempt.provider === "stripe";
  const addressSummary = [
    currentAddress.line1,
    currentAddress.line2 ?? "",
    [currentAddress.city, currentAddress.state].filter(Boolean).join(", "),
    currentAddress.postal_code,
  ]
    .map((value) => normalizeText(value))
    .filter(Boolean)
    .join(" / ");

  const handleOpenHostedCheckout = React.useCallback(() => {
    if (typeof window === "undefined") {
      const nextError = "No se pudo abrir Stripe Checkout desde este contexto.";
      setLocalError(nextError);
      onError(nextError);
      return;
    }

    if (!checkoutUrl) {
      const nextError = "Stripe no devolvio la URL del checkout hosted.";
      setLocalError(nextError);
      onError(nextError);
      return;
    }

    setLocalBusy(true);
    setLocalError(null);
    onError(null);
    window.location.assign(checkoutUrl);
  }, [checkoutUrl, onError]);

  const handleMockConfirm = React.useCallback(async () => {
    setLocalBusy(true);
    setLocalError(null);
    onError(null);
    try {
      await onFinalize(attempt.id, checkoutSession.id);
    } catch (paymentError) {
      const nextError = buildPaymentErrorMessage(
        paymentError,
        "No se pudo completar el pago."
      );
      setLocalError(nextError);
      onError(nextError);
    } finally {
      setLocalBusy(false);
    }
  }, [attempt.id, checkoutSession.id, onError, onFinalize]);

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1.16fr)_minmax(240px,.84fr)]">
      <div className="rounded-[26px] border border-[rgba(12,128,175,.18)] bg-[linear-gradient(160deg,rgba(255,255,255,.96)_0%,rgba(12,128,175,.08)_100%)] p-4 shadow-[0_24px_48px_rgba(8,10,13,.08)] sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-charcoal">
              Pago seguro
            </p>
            <h3 className="mt-2 text-[22px] font-black uppercase tracking-[0.06em] text-ink">
              {isHostedStripe ? "Te llevamos a Stripe Checkout" : "Confirmacion final"}
            </h3>
            <p className="mt-2 max-w-2xl text-[13px] text-mute">
              {isHostedStripe
                ? "El pago ya no se captura aqui. Abres la pagina segura de Stripe y alla eliges tarjeta, Google Pay, Apple Pay o Link. Cuando regreses confirmamos la orden."
                : "En desarrollo puedes cerrar la compra sin salir del sitio para seguir validando el flujo completo."}
            </p>
          </div>

          <span className="rounded-full border border-[rgba(12,128,175,.18)] bg-white/88 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-charcoal">
            {isHostedStripe ? "Stripe Checkout" : "Stripe mock"}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {HOSTED_PAYMENT_METHODS.map((method) => (
            <span
              key={method}
              className="rounded-full border border-[rgba(8,10,13,.08)] bg-white/92 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-ink"
            >
              {method}
            </span>
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[18px] border border-[rgba(8,10,13,.08)] bg-white/90 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-mute">
              Contacto
            </p>
            <p className="mt-2 text-[13px] font-black text-ink">{email}</p>
            <p className="mt-1 text-[12px] text-mute">{phone}</p>
          </div>
          <div className="rounded-[18px] border border-[rgba(8,10,13,.08)] bg-white/90 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-mute">
              Tipo de entrega
            </p>
            <p className="mt-2 text-[13px] font-black text-ink">
              {shippingTypeLabel(checkoutSession)}
            </p>
            <p className="mt-1 text-[12px] text-mute">
              {formatQuoteLabel(checkoutSession)}
            </p>
          </div>
        </div>

        <div className="mt-3 rounded-[20px] border border-[rgba(8,10,13,.08)] bg-white/92 p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-mute">
            Direccion confirmada
          </p>
          <p className="mt-2 text-[12px] leading-6 text-ink">{addressSummary}</p>
        </div>

        {localError ? (
          <div className="mt-4 rounded-[16px] border border-[rgba(168,43,43,.28)] bg-[rgba(168,43,43,.08)] px-4 py-3 text-[12px] text-[rgb(110,24,24)]">
            {localError}
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onBack}
            disabled={busy || localBusy}
            className="h-11 rounded-[999px] bg-white/88 text-[11px]"
          >
            Volver al paso 1
          </Button>

          {isHostedStripe ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              fullWidth
              onClick={handleOpenHostedCheckout}
              disabled={busy || localBusy || !checkoutUrl}
              className="h-11 rounded-[999px] text-[11px]"
            >
              {localBusy ? "Abriendo Stripe..." : "Ir a Stripe Checkout"}
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="sm"
              fullWidth
              onClick={() => void handleMockConfirm()}
              disabled={busy || localBusy}
              className="h-11 rounded-[999px] text-[11px]"
            >
              {busy || localBusy ? "Procesando..." : "Confirmar pago mock"}
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="rounded-[22px] border border-[rgba(8,10,13,.08)] bg-[rgba(255,255,255,.9)] p-3 shadow-[0_18px_34px_rgba(8,10,13,.05)]">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-mute">
            Flujo
          </p>
          <div className="mt-3 space-y-2 text-[12px] text-mute">
            <div className="rounded-[16px] border border-[rgba(8,10,13,.08)] bg-white/92 px-3 py-2">
              1. Confirmas contacto, direccion y envio.
            </div>
            <div className="rounded-[16px] border border-[rgba(8,10,13,.08)] bg-white/92 px-3 py-2">
              2. Entras a Stripe Checkout para elegir como pagar.
            </div>
            <div className="rounded-[16px] border border-[rgba(8,10,13,.08)] bg-white/92 px-3 py-2">
              3. Al volver, capturamos pago y generamos la orden.
            </div>
          </div>
        </div>

        <div className="rounded-[22px] border border-[rgba(8,10,13,.08)] bg-[rgba(255,255,255,.9)] p-3 shadow-[0_18px_34px_rgba(8,10,13,.05)]">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-mute">
            Total a cobrar
          </p>
          <p className="mt-2 text-[28px] font-black tracking-[0.03em] text-ink">
            ${money(checkoutSession.total_mxn)}
          </p>
          <p className="mt-2 text-[12px] text-mute">
            Stripe mostrara el cargo final con las opciones de pago disponibles para el dispositivo del cliente.
          </p>
        </div>
      </div>
    </div>
  );
}

function CheckoutExperienceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { items, subtotal, clear } = useCart();
  const [accountId, setAccountId] = React.useState<string | null>(null);
  const [email, setEmail] = React.useState("sau@gmail.com");
  const [phonePrefix, setPhonePrefix] = React.useState("MX");
  const [phone, setPhone] = React.useState("8711234567");
  const [addressSuggestionId, setAddressSuggestionId] = React.useState("torreon-centro");
  const [line1, setLine1] = React.useState("Av. Morelos 124");
  const [line2, setLine2] = React.useState("Centro");
  const [city, setCity] = React.useState("Torreon");
  const [stateName, setStateName] = React.useState("Coahuila");
  const [postalCode, setPostalCode] = React.useState("27000");
  const [country, setCountry] = React.useState("MX");
  const [reference, setReference] = React.useState("Entre Colon y Acuna");
  const [currentStep, setCurrentStep] = React.useState<CheckoutStep>("address");
  const [checkoutSession, setCheckoutSession] =
    React.useState<CheckoutSessionResponse | null>(null);
  const [paymentAttempt, setPaymentAttempt] =
    React.useState<PaymentAttemptResponse | null>(null);
  const [selectedQuoteId, setSelectedQuoteId] = React.useState("");
  const [busyPreparing, setBusyPreparing] = React.useState(false);
  const [busyQuote, setBusyQuote] = React.useState(false);
  const [busyPaymentSetup, setBusyPaymentSetup] = React.useState(false);
  const [busyPaying, setBusyPaying] = React.useState(false);
  const [busyResolvingReturn, setBusyResolvingReturn] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  const prepareRequestSeqRef = React.useRef(0);
  const checkoutInputSignatureRef = React.useRef<string | null>(null);
  const hostedReturnHandledRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!error) return;
    toast.error(error);
  }, [error, toast]);

  React.useEffect(() => {
    if (!message) return;
    toast.success(message);
  }, [message, toast]);

  React.useEffect(() => {
    const session = getSession();
    queueMicrotask(() => setAccountId(session?.accountId ?? null));
    if (session?.accountId) {
      migrateGuestLinkedOrdersToAccount(session.accountId);
    }
  }, []);

  const paymentAttemptParam = normalizeText(searchParams.get("payment_attempt"));
  const checkoutIdParam = normalizeText(searchParams.get("checkout_id"));
  const checkoutFlowParam = normalizeText(searchParams.get("checkout"));
  const hasHostedReturnParams = paymentAttemptParam.length > 0 && checkoutIdParam.length > 0;
  const normalizedPhone = React.useMemo(
    () => composePhoneNumber(phonePrefix, phone),
    [phone, phonePrefix]
  );

  const currentAddress = React.useMemo<CheckoutAddress>(
    () => ({
      line1: normalizeText(line1),
      line2: normalizeText(line2) || undefined,
      city: normalizeText(city),
      state: normalizeText(stateName),
      postal_code: normalizeText(postalCode),
      country: normalizeText(country) || "MX",
      reference: normalizeText(reference) || undefined,
    }),
    [city, country, line1, line2, postalCode, reference, stateName]
  );

  const hasCompleteCheckoutInput =
    items.length > 0 &&
    !isBlank(email) &&
    normalizePhoneDigits(phone).length >= 7 &&
    !isBlank(currentAddress.line1) &&
    !isBlank(currentAddress.city) &&
    !isBlank(currentAddress.state) &&
    !isBlank(currentAddress.postal_code) &&
    !isBlank(currentAddress.country);

  const inputSignature = React.useMemo(
    () =>
      [
        normalizeText(email),
        normalizedPhone,
        currentAddress.line1,
        currentAddress.line2 ?? "",
        currentAddress.city,
        currentAddress.state,
        currentAddress.postal_code,
        currentAddress.country ?? "",
        currentAddress.reference ?? "",
        items
          .map((item) => `${item.lineId}:${item.key}:${item.quantity}:${item.unitPrice}`)
          .join("|"),
      ].join("||"),
    [currentAddress, email, items, normalizedPhone]
  );

  React.useEffect(() => {
    if (checkoutInputSignatureRef.current === null) {
      checkoutInputSignatureRef.current = inputSignature;
      return;
    }

    if (checkoutInputSignatureRef.current === inputSignature) {
      return;
    }

    checkoutInputSignatureRef.current = inputSignature;

    if (!checkoutSession && !paymentAttempt && currentStep === "address") {
      return;
    }

    queueMicrotask(() => {
      setCurrentStep("address");
      setCheckoutSession(null);
      setPaymentAttempt(null);
      setSelectedQuoteId("");
      setError(null);
      setMessage(null);
    });
  }, [checkoutSession, currentStep, inputSignature, paymentAttempt]);

  const validateCheckoutInput = React.useCallback(() => {
    if (items.length === 0) {
      throw new Error("Tu carrito esta vacio.");
    }
    if (isBlank(email)) {
      throw new Error("Correo es obligatorio.");
    }
    if (normalizePhoneDigits(phone).length < 7) {
      throw new Error("Telefono invalido.");
    }
    if (isBlank(currentAddress.line1)) {
      throw new Error("Direccion (linea 1) es obligatoria.");
    }
    if (isBlank(currentAddress.city)) {
      throw new Error("Ciudad es obligatoria.");
    }
    if (isBlank(currentAddress.state)) {
      throw new Error("Estado es obligatorio.");
    }
    if (isBlank(currentAddress.postal_code)) {
      throw new Error("Codigo postal es obligatorio.");
    }
  }, [currentAddress, email, items.length, phone]);

  const prepareCheckout = React.useCallback(async () => {
    validateCheckoutInput();

    const seq = ++prepareRequestSeqRef.current;
    setBusyPreparing(true);
    setError(null);
    setMessage(null);

    try {
      const remoteCart = await syncLocalCartToBackend({
        localItems: items,
        accountId,
        guestSessionId: getOrCreateGuestCartSessionId(),
      });

      let created = await createCheckoutSession({
        cart_id: remoteCart.id,
        email: normalizeText(email),
        phone: normalizedPhone,
        address: currentAddress,
        selected_quote_id: selectedQuoteId || undefined,
      });

      if (
        created.shipping_method === "national" &&
        selectedQuoteId &&
        selectedQuoteId !== created.shipping_quote_id
      ) {
        created = await selectCheckoutShippingQuote(created.id, selectedQuoteId);
      }

      if (prepareRequestSeqRef.current === seq) {
        setCheckoutSession(created);
        setSelectedQuoteId(created.shipping_quote_id ?? "");
      }

      return created;
    } catch (checkoutError) {
      if (prepareRequestSeqRef.current === seq) {
        setError(
          checkoutError instanceof Error
            ? checkoutError.message
            : "No se pudo recalcular checkout."
        );
      }
      throw checkoutError;
    } finally {
      if (prepareRequestSeqRef.current === seq) {
        setBusyPreparing(false);
      }
    }
  }, [
    accountId,
    currentAddress,
    email,
    items,
    normalizedPhone,
    selectedQuoteId,
    validateCheckoutInput,
  ]);

  const persistOrderLink = React.useCallback(
    (order: OrderResponse) => {
      upsertLinkedOrder({
        order_id: order.id,
        order_code: buildOrderCode(order.id),
        email: order.email,
        account_id: accountId,
        status: order.status,
        shipping_method: order.shipping_method,
        tracking_number: order.tracking_number ?? null,
        total_mxn: order.total_mxn,
      });
    },
    [accountId]
  );

  const finalizeConfirmedAttempt = React.useCallback(
    async (attemptId: string, checkoutId: string) => {
      setBusyPaying(true);
      setError(null);
      setMessage(null);

      try {
        const confirmed = await confirmPaymentAttempt(attemptId);

        if (confirmed.refunded_oversell) {
          throw new Error(
            "Pago revertido por oversell. No se genero pedido; revisa stock y reintenta."
          );
        }

        const resolvedOrderId = confirmed.order_id ?? null;
        const order = resolvedOrderId
          ? await getOrder(resolvedOrderId)
          : await getOrderByCheckout(checkoutId);

        persistOrderLink(order);
        clear();
        setCurrentStep("address");
        setCheckoutSession(null);
        setPaymentAttempt(null);
        setSelectedQuoteId("");
        setMessage(`Pago confirmado. Pedido ${order.id} creado.`);

        router.push(`/mis-ordenes?order=${encodeURIComponent(order.id)}`);
      } catch (paymentError) {
        const nextError = buildPaymentErrorMessage(
          paymentError,
          "No se pudo completar el pago."
        );
        setError(nextError);
        throw paymentError;
      } finally {
        setBusyPaying(false);
      }
    },
    [clear, persistOrderLink, router]
  );

  React.useEffect(() => {
    if (checkoutFlowParam !== "cancel") {
      return;
    }

    if (paymentAttemptParam) {
      void cancelPaymentAttempt(paymentAttemptParam).catch(() => undefined);
    }

    queueMicrotask(() => {
      setCurrentStep("address");
      setError(null);
      setMessage("Pago cancelado en Stripe. Liberamos la reserva y tu carrito sigue intacto.");
    });
    void router.replace("/checkout");
  }, [checkoutFlowParam, paymentAttemptParam, router]);

  React.useEffect(() => {
    if (!hasHostedReturnParams) {
      hostedReturnHandledRef.current = null;
      return;
    }

    const returnKey = `${paymentAttemptParam}:${checkoutIdParam}`;
    if (hostedReturnHandledRef.current === returnKey) {
      return;
    }

    hostedReturnHandledRef.current = returnKey;
    setBusyResolvingReturn(true);
    setCurrentStep("payment");
    setError(null);
    setMessage("Verificando pago en Stripe...");

    void finalizeConfirmedAttempt(paymentAttemptParam, checkoutIdParam)
      .catch(() => {
        void router.replace("/checkout");
      })
      .finally(() => {
        setBusyResolvingReturn(false);
      });
  }, [
    checkoutIdParam,
    finalizeConfirmedAttempt,
    hasHostedReturnParams,
    paymentAttemptParam,
    router,
  ]);

  const handleContinueToPayment = React.useCallback(async () => {
    setBusyPaymentSetup(true);
    setError(null);
    setMessage(null);

    try {
      const session = checkoutSession ?? (await prepareCheckout());
      const attempt = await createPaymentAttempt(session.id, {
        return_origin:
          typeof window === "undefined" ? undefined : window.location.origin,
      });

      if (attempt.provider === "stripe" && isBlank(attempt.checkout_url ?? "")) {
        throw new Error("Stripe no devolvio la URL del checkout hosted.");
      }

      setPaymentAttempt(attempt);
      setCurrentStep("payment");
    } catch (paymentSetupError) {
      setError(
        paymentSetupError instanceof Error
          ? paymentSetupError.message
          : "No se pudo preparar el pago."
      );
    } finally {
      setBusyPaymentSetup(false);
    }
  }, [checkoutSession, prepareCheckout]);

  const handleSelectQuote = React.useCallback(
    async (quoteId: string) => {
      setSelectedQuoteId(quoteId);
      setPaymentAttempt(null);

      if (!checkoutSession || checkoutSession.shipping_method !== "national") {
        return;
      }

      setBusyQuote(true);
      setError(null);
      setMessage(null);
      try {
        const updated = await selectCheckoutShippingQuote(checkoutSession.id, quoteId);
        setCheckoutSession(updated);
      } catch (quoteError) {
        setError(
          quoteError instanceof Error
            ? quoteError.message
            : "No se pudo cambiar la paqueteria."
        );
      } finally {
        setBusyQuote(false);
      }
    },
    [checkoutSession]
  );

  const handleBackToAddress = React.useCallback(() => {
    setCurrentStep("address");
    setPaymentAttempt(null);
    setError(null);
  }, []);

  const handleAddressSuggestionChange = React.useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const nextValue = event.target.value;
      setAddressSuggestionId(nextValue);

      const selected = ADDRESS_AUTOCOMPLETE_OPTIONS.find((item) => item.value === nextValue);
      if (!selected) return;

      setLine1(selected.line1);
      setLine2(selected.line2);
      setCity(selected.city);
      setStateName(selected.state);
      setPostalCode(selected.postal_code);
      setCountry(selected.country);
      setReference(selected.reference);
    },
    []
  );

  const summarySubtotal = checkoutSession?.subtotal_mxn ?? subtotal;
  const summaryShipping = checkoutSession?.shipping_cost_mxn ?? 0;
  const summaryTotal = checkoutSession?.total_mxn ?? summarySubtotal + summaryShipping;
  const isNational = checkoutSession?.shipping_method === "national";
  const isLocal = checkoutSession?.shipping_method === "local";

  const detailedLines = React.useMemo<DetailedCartLine[]>(
    () =>
      items.map((localItem, index) => {
        const remote = checkoutSession?.items[index];
        const quantity = remote?.quantity ?? localItem.quantity;
        const unitPrice = remote?.unit_price_mxn ?? localItem.unitPrice;
        const lineTotal = remote?.line_total_mxn ?? quantity * unitPrice;

        return {
          local: localItem,
          remote,
          quantity,
          unitPrice,
          lineTotal,
        };
      }),
    [checkoutSession, items]
  );
  const stepOffset = currentStep === "payment" ? "-100%" : "0%";

  if (busyResolvingReturn || hasHostedReturnParams) {
    return (
      <main className="w-full px-4 py-8 sm:px-8 lg:px-14">
        <section className="mx-auto max-w-3xl rounded-[28px] border border-hairline bg-[linear-gradient(160deg,rgba(255,255,255,.94)_0%,rgba(12,128,175,.08)_100%)] p-6 shadow-[0_24px_56px_rgba(8,10,13,.08)]">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-charcoal">
            Stripe Checkout
          </p>
          <h1 className="mt-3 text-[26px] font-black uppercase tracking-[0.06em] text-ink">
            Verificando tu pago
          </h1>
          <p className="mt-3 text-[13px] leading-6 text-mute">
            Estamos confirmando la transaccion, validando stock y preparando la orden.
          </p>
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-[rgba(8,10,13,.08)]">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-primary" />
          </div>
        </section>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="w-full px-4 py-8 sm:px-8 lg:px-14">
        <section className="mx-auto max-w-3xl rounded-[22px] border border-hairline bg-[rgba(255,255,255,.45)] p-6">
          <h1 className="text-[24px] font-black uppercase tracking-[0.06em] text-ink">
            Checkout
          </h1>
          <p className="mt-2 text-[13px] text-mute">
            Tu carrito esta vacio. Agrega productos del catalogo o del personalizador.
          </p>
          <Link
            href="/catalogo"
            className="mt-5 inline-flex h-10 items-center justify-center rounded-[999px] border border-hairline bg-primary px-4 text-[11px] font-black uppercase tracking-[0.14em] text-ink"
          >
            Ir al catalogo
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="w-full px-3 py-5 sm:px-6 sm:py-6 lg:px-10">
      <section className="mx-auto grid max-w-[1580px] gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,.8fr)]">
        <article className="rounded-[30px] border border-hairline bg-[linear-gradient(180deg,rgba(255,255,255,.76)_0%,rgba(255,255,255,.5)_100%)] p-4 shadow-[0_24px_56px_rgba(8,10,13,.08)] backdrop-blur-[12px] sm:p-5 lg:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-charcoal">
                Paso {currentStep === "address" ? "1" : "2"} de 2
              </p>
              <h1 className="mt-2 text-[26px] font-black uppercase tracking-[0.06em] text-ink">
                {currentStep === "address" ? "Direccion y contacto" : "Pago en Stripe"}
              </h1>
              <p className="mt-2 max-w-2xl text-[13px] text-mute">
                {currentStep === "address"
                  ? "Primero confirmas contacto, direccion y envio. Cuando todo cuadra, el bloque se desliza y pasas directo al pago."
                  : "El pago ocurre fuera del sitio, en la pagina segura de Stripe Checkout con tarjeta, wallets y metodos compatibles."}
              </p>
            </div>

            <div className="rounded-[22px] border border-[rgba(12,128,175,.16)] bg-[rgba(12,128,175,.08)] px-3 py-2 text-right shadow-[0_16px_32px_rgba(12,128,175,.08)]">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-charcoal">
                Total listo
              </p>
              <p className="mt-1 text-[24px] font-black tracking-[0.03em] text-ink">
                ${money(summaryTotal)}
              </p>
              <p className="mt-1 text-[11px] text-mute">
                {shippingTypeLabel(checkoutSession)} / {formatQuoteLabel(checkoutSession)}
              </p>
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-[18px] border border-[rgba(168,43,43,.3)] bg-[rgba(168,43,43,.08)] px-3 py-2 text-[12px] text-[rgb(110,24,24)]">
              {error}
            </div>
          ) : null}

          {message ? (
            <div className="mt-4 rounded-[18px] border border-[rgba(12,128,175,.28)] bg-[rgba(12,128,175,.1)] px-3 py-2 text-[12px] text-charcoal">
              {message}
            </div>
          ) : null}

          <div className="mt-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleBackToAddress}
                className={[
                  "flex items-center justify-between rounded-[20px] border px-4 py-3 text-left transition",
                  currentStep === "address"
                    ? "border-[rgba(12,128,175,.28)] bg-[rgba(12,128,175,.1)] shadow-[0_20px_40px_rgba(12,128,175,.08)]"
                    : "border-hairline bg-white/78 hover:-translate-y-[1px] hover:shadow-[0_18px_32px_rgba(8,10,13,.06)]",
                ].join(" ")}
              >
                <span>
                  <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-charcoal">
                    Paso 1
                  </span>
                  <span className="mt-1 block text-[15px] font-black uppercase tracking-[0.06em] text-ink">
                    Contacto y entrega
                  </span>
                </span>
                <span className="rounded-full border border-hairline bg-white/88 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-ink">
                  Activo
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (paymentAttempt) {
                    setCurrentStep("payment");
                  }
                }}
                disabled={!paymentAttempt}
                className={[
                  "flex items-center justify-between rounded-[20px] border px-4 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60",
                  currentStep === "payment"
                    ? "border-[rgba(255,217,66,.42)] bg-[rgba(255,217,66,.16)] shadow-[0_20px_40px_rgba(255,217,66,.12)]"
                    : "border-hairline bg-white/78 hover:-translate-y-[1px] hover:shadow-[0_18px_32px_rgba(8,10,13,.06)]",
                ].join(" ")}
              >
                <span>
                  <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-charcoal">
                    Paso 2
                  </span>
                  <span className="mt-1 block text-[15px] font-black uppercase tracking-[0.06em] text-ink">
                    Pago en Stripe
                  </span>
                </span>
                <span className="rounded-full border border-hairline bg-white/88 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-ink">
                  {paymentAttempt ? "Listo" : "Pendiente"}
                </span>
              </button>
            </div>

            <div className="mt-3 overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)]"
                style={{ transform: `translateX(${stepOffset})` }}
              >
                <section className="min-w-full pr-0 sm:pr-1">
                  <div className="rounded-[26px] border border-[rgba(12,128,175,.22)] bg-[linear-gradient(180deg,rgba(12,128,175,.08)_0%,rgba(255,255,255,.92)_100%)] p-3 shadow-[0_20px_40px_rgba(8,10,13,.05)] sm:p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-charcoal">
                    Contacto
                  </p>
                  <h2 className="mt-1 text-[17px] font-black uppercase tracking-[0.06em] text-ink">
                    Direccion y envio
                  </h2>
                  <p className="mt-1 text-[12px] text-mute">
                    Completa contacto, direccion y tipo de entrega. Cuando sigues, este bloque se cierra y se desliza el paso 2.
                  </p>
                </div>
                <span className="rounded-full border border-hairline bg-white/82 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-ink">
                  {normalizedPhone}
                </span>
              </div>

              <div className="mt-4 grid gap-3">
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_minmax(0,1fr)]">
                  <TextField
                    size="sm"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Correo"
                    aria-label="Correo electrónico"
                    shellClassName="h-11 rounded-[16px] bg-white/90"
                    inputClassName="text-[13px]"
                  />
                  <SelectField
                    value={phonePrefix}
                    onChange={(event) => setPhonePrefix(event.target.value)}
                    options={CONTACT_PREFIX_OPTIONS.map((item) => ({
                      value: item.value,
                      label: item.label,
                    }))}
                    placeholder="Lada"
                    shellClassName="h-11 rounded-[16px] bg-white/90"
                  />
                  <TextField
                    size="sm"
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder={
                      CONTACT_PREFIX_OPTIONS.find((item) => item.value === phonePrefix)
                        ?.placeholder ?? "Telefono"
                    }
                    aria-label="Teléfono"
                    shellClassName="h-11 rounded-[16px] bg-white/90"
                    inputClassName="text-[13px]"
                  />
                </div>

                <SelectField
                  value={addressSuggestionId}
                  onChange={handleAddressSuggestionChange}
                  options={ADDRESS_AUTOCOMPLETE_OPTIONS.map((item) => ({
                    value: item.value,
                    label: `${item.label} / ${item.helper}`,
                  }))}
                  placeholder="Buscar direccion"
                  shellClassName="h-11 rounded-[16px] bg-white/92"
                />

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <TextField size="sm" value={line1} onChange={(event) => setLine1(event.target.value)} placeholder="Calle y numero" aria-label="Calle y número" shellClassName="h-11 rounded-[16px] bg-white/90" inputClassName="text-[13px]" wrapperClassName="sm:col-span-2 lg:col-span-2" />
                  <TextField size="sm" value={line2} onChange={(event) => setLine2(event.target.value)} placeholder="Colonia, depto o interior" aria-label="Colonia, departamento o interior" shellClassName="h-11 rounded-[16px] bg-white/90" inputClassName="text-[13px]" wrapperClassName="sm:col-span-2 lg:col-span-1" />
                  <TextField size="sm" value={city} onChange={(event) => setCity(event.target.value)} placeholder="Ciudad" aria-label="Ciudad" shellClassName="h-11 rounded-[16px] bg-white/90" inputClassName="text-[13px]" />
                  <TextField size="sm" value={stateName} onChange={(event) => setStateName(event.target.value)} placeholder="Estado" aria-label="Estado" shellClassName="h-11 rounded-[16px] bg-white/90" inputClassName="text-[13px]" />
                  <TextField size="sm" value={postalCode} onChange={(event) => setPostalCode(event.target.value)} placeholder="Codigo postal" aria-label="Código postal" shellClassName="h-11 rounded-[16px] bg-white/90" inputClassName="text-[13px]" />
                  <SelectField
                    value={country}
                    onChange={(event) => setCountry(event.target.value)}
                    options={COUNTRY_OPTIONS}
                    placeholder="Pais"
                    shellClassName="h-11 rounded-[16px] bg-white/92"
                  />
                  <TextField size="sm" value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Referencia" aria-label="Referencia" shellClassName="h-11 rounded-[16px] bg-white/90" inputClassName="text-[13px]" wrapperClassName="sm:col-span-2 lg:col-span-2" />
                </div>

                {checkoutSession ? (
                  <div className="rounded-[22px] border border-[rgba(12,128,175,.14)] bg-[linear-gradient(180deg,rgba(12,128,175,.08)_0%,rgba(255,255,255,.92)_100%)] p-3 shadow-[0_18px_34px_rgba(8,10,13,.05)]">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-charcoal">
                          Envio calculado
                        </p>
                        <p className="mt-1 text-[12px] text-mute">
                          Tipo de entrega: {shippingTypeLabel(checkoutSession)} / {formatQuoteLabel(checkoutSession)}
                        </p>
                      </div>
                      <span className="rounded-full border border-hairline bg-white/88 px-3 py-1 text-[11px] font-black text-ink">
                        ${money(checkoutSession.shipping_cost_mxn)}
                      </span>
                    </div>

                    {shippingProviderLooksMock(checkoutSession) ? (
                      <p className="mt-3 text-[11px] text-mute">
                        El proveedor sigue mockeado, pero el flujo ya queda alineado para conectarlo despues a Skydropx.
                      </p>
                    ) : null}

                    {isNational ? (
                      <div className="mt-3 grid gap-2">
                        {checkoutSession.shipping_quotes.map((quote) => (
                          <label
                            key={quote.quote_id}
                            className="group flex cursor-pointer items-center justify-between gap-3 rounded-[18px] border border-hairline bg-white/92 px-3 py-3 text-[12px] shadow-[0_14px_28px_rgba(8,10,13,.04)] transition hover:-translate-y-[1px] hover:shadow-[0_18px_30px_rgba(8,10,13,.08)]"
                          >
                            <span>
                              <span className="block font-black uppercase tracking-[0.1em] text-ink">
                                {quote.provider}
                              </span>
                              <span className="mt-1 block text-mute">
                                {quote.service} / {quote.eta_days} dias
                              </span>
                            </span>
                            <span className="flex items-center gap-3">
                              <span className="font-black text-charcoal">
                                ${money(quote.price_mxn)}
                              </span>
                              <RadioControl
                                name="shipping-quote"
                                size="sm"
                                checked={
                                  (selectedQuoteId || checkoutSession.shipping_quote_id) ===
                                  quote.quote_id
                                }
                                onChange={() => void handleSelectQuote(quote.quote_id)}
                                disabled={busyQuote || busyPaying || busyPaymentSetup}
                              />
                            </span>
                          </label>
                        ))}
                      </div>
                    ) : null}

                    {isLocal ? (
                      <div className="mt-4 rounded-[18px] border border-hairline bg-white/88 px-4 py-3 text-[12px] text-mute">
                        Tipo de entrega local detectado para {checkoutSession.address.city}. El costo queda congelado al pasar al paso 2.
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[11px] text-mute">
                    Al continuar se recalcula el checkout, se valida/reserva stock y solo entonces se habilita Stripe Checkout.
                  </p>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => void handleContinueToPayment()}
                    disabled={
                      !hasCompleteCheckoutInput ||
                      busyPreparing ||
                      busyQuote ||
                      busyPaymentSetup ||
                      busyPaying
                    }
                    isLoading={busyPreparing || busyPaymentSetup}
                    className="h-11 rounded-[999px] px-6 text-[11px]"
                  >
                    {busyPreparing || busyPaymentSetup
                      ? "Preparando paso 2..."
                      : "Continuar al paso 2"}
                  </Button>
                </div>
              </div>
                  </div>
                </section>

                <section className="min-w-full pl-0 sm:pl-1">
                  <div className="rounded-[26px] border border-[rgba(255,217,66,.26)] bg-[linear-gradient(180deg,rgba(255,217,66,.08)_0%,rgba(255,255,255,.94)_100%)] p-3 shadow-[0_20px_40px_rgba(8,10,13,.05)] sm:p-4">
                    {busyPaymentSetup && !paymentAttempt ? (
                      <div className="rounded-[22px] border border-hairline bg-white/84 px-4 py-5 text-[12px] text-mute">
                        Estamos preparando la sesion de Stripe Checkout...
                      </div>
                    ) : paymentAttempt && checkoutSession ? (
                      <PaymentStepCard
                        attempt={paymentAttempt}
                        checkoutSession={checkoutSession}
                        currentAddress={currentAddress}
                        email={email}
                        phone={normalizedPhone}
                        busy={busyPaying}
                        onBack={handleBackToAddress}
                        onFinalize={finalizeConfirmedAttempt}
                        onError={setError}
                      />
                    ) : (
                      <div className="rounded-[22px] border border-dashed border-hairline bg-white/84 px-4 py-5 text-[12px] text-mute">
                        Primero completa el paso 1 para generar el checkout hosted de Stripe con el total definitivo.
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </article>

        <aside className="h-fit rounded-[30px] border border-hairline bg-[linear-gradient(180deg,rgba(255,255,255,.78)_0%,rgba(255,255,255,.56)_100%)] p-4 shadow-[0_24px_56px_rgba(8,10,13,.08)] backdrop-blur-[12px] sm:p-5 lg:sticky lg:top-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[14px] font-black uppercase tracking-[0.14em] text-ink">
                Resumen
              </h2>
              <p className="mt-1 text-[11px] text-mute">
                {items.reduce((acc, item) => acc + item.quantity, 0)} items en el pedido
              </p>
            </div>
            <span className="rounded-full border border-hairline bg-white/82 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-ink">
              {currentStep === "payment" ? "Listo para cobrar" : checkoutSession ? "Cotizado" : "Previo"}
            </span>
          </div>

          <div className="mt-4 rounded-[20px] border border-hairline bg-[rgba(255,255,255,.88)] p-3 shadow-[0_16px_30px_rgba(8,10,13,.05)]">
            <div className="space-y-2 text-[12px]">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span className="font-black">${money(summarySubtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Envio</span>
                <span className="font-black">
                  {checkoutSession ? `$${money(summaryShipping)}` : "Pendiente"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-[11px] text-mute">
                <span>Tipo de entrega</span>
                <span className="text-right">{shippingTypeLabel(checkoutSession)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-[11px] text-mute">
                <span>Operador</span>
                <span className="text-right">{formatQuoteLabel(checkoutSession)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-[11px] text-mute">
                <span>Pago</span>
                <span className="text-right">
                  {currentStep === "payment" ? "Stripe Checkout" : "Pendiente"}
                </span>
              </div>
              <div className="mt-2 border-t border-hairline pt-2 text-[13px]">
                <div className="flex items-center justify-between">
                  <span className="font-black uppercase tracking-[0.08em]">Total</span>
                  <span className="font-black text-charcoal">
                    ${money(summaryTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 max-h-[56vh] space-y-2 overflow-auto pr-1">
            {detailedLines.map((line) => (
              <article
                key={line.local.lineId}
                className="group overflow-hidden rounded-[24px] border border-hairline bg-[rgba(255,255,255,.92)] p-3 shadow-[0_18px_34px_rgba(8,10,13,.05)] transition duration-300 hover:-translate-y-[2px] hover:shadow-[0_24px_44px_rgba(8,10,13,.1)]"
              >
                <div className="flex gap-3">
                  <CheckoutItemPreview item={line.local} />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-black uppercase tracking-[0.12em] text-ink">
                          {line.local.name}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="rounded-full border border-[rgba(12,128,175,.16)] bg-[rgba(12,128,175,.08)] px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-charcoal">
                            {formatItemType(line.remote?.item_type ?? "")}
                          </span>
                          <span className="rounded-full border border-hairline bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-ink">
                            {line.quantity} pieza{line.quantity > 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>

                      <div className="rounded-[18px] border border-[rgba(8,10,13,.08)] bg-white/88 px-3 py-2 text-right shadow-[0_8px_18px_rgba(8,10,13,.04)]">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-mute">
                          Total item
                        </p>
                        <p className="mt-1 text-[15px] font-black text-ink">
                          ${money(line.lineTotal)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {buildDetailLines(line)
                        .slice(0, 4)
                        .map((detail) => (
                        <div
                          key={`${line.local.lineId}-${detail.label}`}
                          className="rounded-[16px] border border-[rgba(8,10,13,.08)] bg-[rgba(248,249,251,.92)] px-2 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,.9)]"
                        >
                          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-mute">
                            {detail.label}
                          </p>
                          <p className="mt-1 text-[11px] font-black text-ink">
                            {detail.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <div className="rounded-[16px] border border-hairline bg-white/88 px-2 py-1.5 text-[11px]">
                        <span className="block font-black uppercase tracking-[0.12em] text-mute">
                          Unitario
                        </span>
                        <span className="mt-1 block font-black text-ink">
                          ${money(line.unitPrice)}
                        </span>
                      </div>
                      <div className="rounded-[16px] border border-hairline bg-white/88 px-2 py-1.5 text-[11px]">
                        <span className="block font-black uppercase tracking-[0.12em] text-mute">
                          Cantidad
                        </span>
                        <span className="mt-1 block font-black text-ink">
                          {line.quantity}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {line.remote?.custom_note ? (
                  <div className="mt-3 rounded-[14px] border border-hairline bg-[rgba(255,217,66,.14)] px-3 py-2 text-[11px] text-ink">
                    <span className="font-black uppercase tracking-[0.08em]">
                      Nota:
                    </span>{" "}
                    {line.remote.custom_note}
                  </div>
                ) : null}

                {line.remote?.improve_quality ? (
                  <div className="mt-2 rounded-[14px] border border-hairline bg-[rgba(12,128,175,.1)] px-3 py-2 text-[11px] text-charcoal">
                    Se solicito mejora de calidad para este item.
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}

export function CheckoutExperience() {
  return (
    <React.Suspense fallback={<div className="min-h-[40vh]" />}>
      <CheckoutExperienceContent />
    </React.Suspense>
  );
}
