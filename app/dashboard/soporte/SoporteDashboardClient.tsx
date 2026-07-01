"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

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
      <section className="rounded-[22px] border border-(--border) bg-[rgba(255,255,255,.38)] p-5 sm:p-6">
        <h1 className="text-[24px] sm:text-[30px] font-black uppercase tracking-[0.04em] text-(--text)">
          Soporte
        </h1>
        <p className="mt-2 text-[12px] text-[rgba(8,10,13,.7)]">
          Casos, mensajes, estado y registro de refund manual/auto (solo admin).
        </p>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-3">
        <article className="rounded-[18px] border border-(--border) bg-[rgba(255,255,255,.45)] p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-(--text)">
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
            <input name="case_id" required placeholder="case_id" className="h-10 w-full rounded-[10px] border border-(--border) bg-white/85 px-3 text-[12px] font-mono" />
            <select name="status" defaultValue="in_review" className="h-10 w-full rounded-[10px] border border-(--border) bg-white/85 px-3 text-[12px]">
              <option value="open">open</option>
              <option value="in_review">in_review</option>
              <option value="pending_customer">pending_customer</option>
              <option value="resolved">resolved</option>
              <option value="closed">closed</option>
            </select>
            <input name="note" placeholder="nota (opcional)" className="h-10 w-full rounded-[10px] border border-(--border) bg-white/85 px-3 text-[12px]" />
            <label className="inline-flex items-center gap-2 text-[11px]">
              <input type="checkbox" name="notify_customer" value="true" />
              Notificar al cliente
            </label>
            <button type="submit" className="h-10 w-full rounded-[10px] bg-[rgba(12,128,175,.16)] px-3 text-[10px] font-black uppercase tracking-[0.12em] text-(--saut-navy)">
              Actualizar estado
            </button>
          </form>
        </article>

        <article className="rounded-[18px] border border-(--border) bg-[rgba(255,255,255,.45)] p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-(--text)">
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
            <input name="case_id" required placeholder="case_id" className="h-10 w-full rounded-[10px] border border-(--border) bg-white/85 px-3 text-[12px] font-mono" />
            <textarea name="message" required rows={4} placeholder="Mensaje soporte/admin..." className="w-full rounded-[10px] border border-(--border) bg-white/85 px-3 py-2 text-[12px]" />
            <label className="inline-flex items-center gap-2 text-[11px]">
              <input type="checkbox" name="is_internal" value="true" />
              Mensaje interno (no cliente)
            </label>
            <button type="submit" className="h-10 w-full rounded-[10px] bg-(--saut-yellow) px-3 text-[10px] font-black uppercase tracking-[0.12em]">
              Enviar mensaje
            </button>
          </form>
        </article>

        <article className="rounded-[18px] border border-(--border) bg-[rgba(255,255,255,.45)] p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-(--text)">
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
            <input name="case_id" required placeholder="case_id" className="h-10 w-full rounded-[10px] border border-(--border) bg-white/85 px-3 text-[12px] font-mono" />
            <select name="mode" defaultValue="manual" className="h-10 w-full rounded-[10px] border border-(--border) bg-white/85 px-3 text-[12px]">
              <option value="manual">manual</option>
              <option value="auto">auto</option>
            </select>
            <input name="reason_code" required placeholder="reason_code (oversell, duplicated_charge...)" className="h-10 w-full rounded-[10px] border border-(--border) bg-white/85 px-3 text-[12px]" />
            <input name="amount_mxn" type="number" min={1} placeholder="amount_mxn (opcional)" className="h-10 w-full rounded-[10px] border border-(--border) bg-white/85 px-3 text-[12px]" />
            <input name="notes" placeholder="notas (opcional)" className="h-10 w-full rounded-[10px] border border-(--border) bg-white/85 px-3 text-[12px]" />
            <button type="submit" className="h-10 w-full rounded-[10px] bg-[rgba(168,43,43,.14)] px-3 text-[10px] font-black uppercase tracking-[0.12em] text-[rgb(120,24,24)]">
              Registrar refund
            </button>
          </form>
        </article>
      </section>

      <section className="mt-8 rounded-[18px] border border-(--border) bg-[rgba(255,255,255,.45)] p-4">
        <p className="text-[12px] font-black uppercase tracking-[0.12em] text-(--text)">
          Casos recientes ({casesTotal})
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-[11px]">
            <thead>
              <tr className="border-b border-(--border)">
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
        <section className="mt-6 rounded-[18px] border border-(--border) bg-[rgba(255,255,255,.45)] p-4">
          <p className="text-[12px] font-black uppercase tracking-[0.12em] text-(--text)">
            Caso foco: {focusedCase.case.id}
          </p>
          <p className="mt-1 text-[11px] text-[rgba(8,10,13,.68)]">
            Estado: {focusedCase.case.status} | Motivo: {focusedCase.case.reason}
          </p>
          <div className="mt-3 max-h-[320px] space-y-2 overflow-auto">
            {focusedCase.messages.map((message) => (
              <article key={message.id} className="rounded-[10px] border border-(--border) bg-white/85 px-3 py-2 text-[11px]">
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

