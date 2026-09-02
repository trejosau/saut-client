"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Button, Checkbox, SelectField, TextAreaField, TextField } from "@/core/design-system";
import { FormErrorBag } from "@/core/design-system/feedback/FormErrorBag";
import { toFormErrorBag, type FormErrorBag as FormErrorBagState } from "@/core/design-system/feedback/form-errors";
import { useToast } from "@/core/design-system/feedback/ToastHost";
import type { SupportCase, SupportCaseDetail } from "@/modules/dashboard/support/server/api";

type ServerAction = (formData: FormData) => Promise<void>;

type SoporteActions = {
  updateSupportCaseStatusAction: ServerAction;
  addSupportMessageAction: ServerAction;
  registerSupportRefundAction: ServerAction;
};

type SoporteFormKey = "update-case-status" | "add-case-message" | "register-refund";

type SoporteDashboardClientProps = {
  cases: SupportCase[];
  casesTotal: number;
  focusedCase: SupportCaseDetail | null;
  actions: SoporteActions;
};

export function SoporteDashboardClient({
  cases,
  casesTotal,
  focusedCase,
  actions,
}: SoporteDashboardClientProps) {
  const router = useRouter();
  const toast = useToast();
  const [errorBagByForm, setErrorBagByForm] = useState<
    Partial<Record<SoporteFormKey, FormErrorBagState>>
  >({});

  const setFormErrorBag = (formKey: SoporteFormKey, bag: FormErrorBagState | null) => {
    setErrorBagByForm((previous) => {
      const next = { ...previous };
      if (!bag) {
        delete next[formKey];
      } else {
        next[formKey] = bag;
      }
      return next;
    });
  };

  const runAction = async (
    formKey: SoporteFormKey,
    action: ServerAction,
    formData: FormData,
    successMessage: string,
    fallbackError: string
  ) => {
    setFormErrorBag(formKey, null);
    try {
      await action(formData);
      setFormErrorBag(formKey, null);
      toast.success(successMessage);
      router.refresh();
    } catch (error) {
      const bag = toFormErrorBag(error, fallbackError);
      setFormErrorBag(formKey, bag);
      toast.error(bag.rawMessage);
    }
  };

  const submitForm =
    (
      formKey: SoporteFormKey,
      action: ServerAction,
      successMessage: string,
      fallbackError: string
    ) =>
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      await runAction(formKey, action, formData, successMessage, fallbackError);
    };

  return (
    <main className="w-full px-4 py-8 sm:px-8 lg:px-14">
      <section className="rounded-[22px] border border-hairline bg-[rgba(255,255,255,.38)] p-5 sm:p-6">
        <h1 className="text-[24px] sm:text-[30px] font-black uppercase tracking-[0.04em] text-ink">
          Soporte
        </h1>
        <p className="mt-2 text-[12px] text-[rgba(8,10,13,.7)]">
          Casos, mensajes, estado y registro de refund manual/auto (solo admin).
        </p>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-3">
        <article className="rounded-[18px] border border-hairline bg-[rgba(255,255,255,.45)] p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-ink">
            Cambiar estado de caso
          </p>
          <form
            onSubmit={submitForm(
              "update-case-status",
              actions.updateSupportCaseStatusAction,
              "Estado del caso actualizado.",
              "No se pudo actualizar el estado del caso."
            )}
            className="mt-3 space-y-2"
          >
            <FormErrorBag bag={errorBagByForm["update-case-status"] ?? null} />
            <TextField name="case_id" label="Case ID" labelClassName="sr-only" required placeholder="case_id" size="sm" inputClassName="font-mono text-[12px]" />
            <SelectField name="status" label="Estado" labelClassName="sr-only" defaultValue="in_review" size="sm" options={[{ value: "open", label: "open" }, { value: "in_review", label: "in_review" }, { value: "pending_customer", label: "pending_customer" }, { value: "resolved", label: "resolved" }, { value: "closed", label: "closed" }]} />
            <TextField name="note" label="Nota" labelClassName="sr-only" placeholder="nota (opcional)" size="sm" />
            <Checkbox name="notify_customer" value="true" label="Notificar al cliente" />
            <Button type="submit" size="sm" fullWidth variant="blue" shadow="none" className="text-[10px]">
              Actualizar estado
            </Button>
          </form>
        </article>

        <article className="rounded-[18px] border border-hairline bg-[rgba(255,255,255,.45)] p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-ink">
            Responder caso
          </p>
          <form
            onSubmit={submitForm(
              "add-case-message",
              actions.addSupportMessageAction,
              "Mensaje enviado al caso.",
              "No se pudo enviar el mensaje."
            )}
            className="mt-3 space-y-2"
          >
            <FormErrorBag bag={errorBagByForm["add-case-message"] ?? null} />
            <TextField name="case_id" label="Case ID" labelClassName="sr-only" required placeholder="case_id" size="sm" inputClassName="font-mono text-[12px]" />
            <TextAreaField name="message" label="Mensaje" labelClassName="sr-only" required rows={4} placeholder="Mensaje soporte/admin..." size="sm" textareaClassName="text-[12px]" />
            <Checkbox name="is_internal" value="true" label="Mensaje interno (no cliente)" />
            <Button type="submit" size="sm" fullWidth variant="primary" shadow="none" className="text-[10px]">
              Enviar mensaje
            </Button>
          </form>
        </article>

        <article className="rounded-[18px] border border-hairline bg-[rgba(255,255,255,.45)] p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-ink">
            Registrar refund (admin)
          </p>
          <form
            onSubmit={submitForm(
              "register-refund",
              actions.registerSupportRefundAction,
              "Refund registrado.",
              "No se pudo registrar el refund."
            )}
            className="mt-3 space-y-2"
          >
            <FormErrorBag bag={errorBagByForm["register-refund"] ?? null} />
            <TextField name="case_id" label="Case ID" labelClassName="sr-only" required placeholder="case_id" size="sm" inputClassName="font-mono text-[12px]" />
            <SelectField name="mode" label="Modo" labelClassName="sr-only" defaultValue="manual" size="sm" options={[{ value: "manual", label: "manual" }, { value: "auto", label: "auto" }]} />
            <TextField name="reason_code" label="Reason code" labelClassName="sr-only" required placeholder="reason_code (oversell, duplicated_charge...)" size="sm" />
            <TextField name="amount_mxn" label="Monto" labelClassName="sr-only" type="number" min={1} placeholder="amount_mxn (opcional)" size="sm" />
            <TextField name="notes" label="Notas" labelClassName="sr-only" placeholder="notas (opcional)" size="sm" />
            <Button type="submit" size="sm" fullWidth variant="danger" shadow="none" className="text-[10px]">
              Registrar refund
            </Button>
          </form>
        </article>
      </section>

      <section className="mt-8 rounded-[18px] border border-hairline bg-[rgba(255,255,255,.45)] p-4">
        <p className="text-[12px] font-black uppercase tracking-[0.12em] text-ink">
          Casos recientes ({casesTotal})
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-[11px]">
            <thead>
              <tr className="border-b border-hairline">
                <th className="px-2 py-2">Fecha</th>
                <th className="px-2 py-2">Case ID</th>
                <th className="px-2 py-2">Estado</th>
                <th className="px-2 py-2">Motivo</th>
                <th className="px-2 py-2">Pedido</th>
                <th className="px-2 py-2">Contacto</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((item) => (
                <tr key={item.id} className="border-b border-[rgba(0,0,0,.06)]">
                  <td className="px-2 py-2">{new Date(item.created_at).toLocaleString("es-MX")}</td>
                  <td className="px-2 py-2 font-mono">{item.id}</td>
                  <td className="px-2 py-2 uppercase">{item.status}</td>
                  <td className="px-2 py-2">{item.reason}</td>
                  <td className="px-2 py-2 font-mono">{item.linked_order_id ?? "-"}</td>
                  <td className="px-2 py-2">{item.contact_email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {focusedCase ? (
        <section className="mt-6 rounded-[18px] border border-hairline bg-[rgba(255,255,255,.45)] p-4">
          <p className="text-[12px] font-black uppercase tracking-[0.12em] text-ink">
            Caso foco: {focusedCase.case.id}
          </p>
          <p className="mt-1 text-[11px] text-[rgba(8,10,13,.68)]">
            Estado: {focusedCase.case.status} | Motivo: {focusedCase.case.reason}
          </p>
          <div className="mt-3 max-h-[320px] space-y-2 overflow-auto">
            {focusedCase.messages.map((message) => (
              <article key={message.id} className="rounded-[10px] border border-hairline bg-white/85 px-3 py-2 text-[11px]">
                <p className="font-black uppercase tracking-[0.08em]">
                  {message.sender_type} | {new Date(message.created_at).toLocaleString("es-MX")}
                </p>
                <p className="mt-1">{message.message}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

