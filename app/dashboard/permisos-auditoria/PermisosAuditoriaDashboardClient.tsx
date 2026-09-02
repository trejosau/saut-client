"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { DashboardModal, SelectField, TextField } from "@/core/design-system";
import { FormErrorBag } from "@/core/design-system/feedback/FormErrorBag";
import { toFormErrorBag, type FormErrorBag as FormErrorBagState } from "@/core/design-system/feedback/form-errors";
import { useToast } from "@/core/design-system/feedback/ToastHost";
import type {
  AccountAccess,
  AdminAccountSummary,
  AdminPermissionCatalogItem,
  AdminRoleCatalogItem,
  AuditLogItem,
} from "@/modules/dashboard/security/server/api";

type ServerAction = (formData: FormData) => Promise<void>;

type PermisosActions = {
  assignRoleAction: ServerAction;
  removeRoleAction: ServerAction;
  upsertPermissionOverrideAction: ServerAction;
  removePermissionOverrideAction: ServerAction;
  updateAccountStatusAction: ServerAction;
};

type PermisosFormKey =
  | "assign-role"
  | "remove-role"
  | "upsert-override"
  | "remove-override"
  | "set-status";

type Props = {
  audit: AuditLogItem[];
  meAccess: AccountAccess | null;
  accounts: AdminAccountSummary[];
  rolesCatalog: AdminRoleCatalogItem[];
  permissionsCatalog: AdminPermissionCatalogItem[];
  actions: PermisosActions;
};

type AuditRange = "all" | "24h" | "7d" | "30d" | "custom";

const PAGE_SIZE_OPTIONS = [10, 20, 40];

function dt(value?: string | null) {
  if (!value) return "Sin registro";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Sin registro";
  return parsed.toLocaleString("es-MX");
}

function statusNorm(value: string) {
  return value.trim().toUpperCase();
}

function statusLabel(value: string) {
  const status = statusNorm(value);
  if (status === "ACTIVE") return "Activo";
  if (status === "BLOCKED") return "Bloqueado";
  if (status === "SUSPENDED") return "Suspendido";
  if (status === "DISABLED") return "Deshabilitado";
  return status || "Sin estado";
}

function statusClass(value: string) {
  const status = statusNorm(value);
  if (status === "ACTIVE") return "border-[rgba(16,95,24,.30)] bg-[rgba(93,185,90,.16)] text-[rgb(16,95,24)]";
  if (status === "BLOCKED") return "border-[rgba(122,23,33,.30)] bg-[rgba(220,67,87,.15)] text-[rgb(122,23,33)]";
  if (status === "SUSPENDED") return "border-[rgba(206,150,21,.34)] bg-[rgba(206,150,21,.16)] text-[rgb(135,95,9)]";
  return "border-[rgba(8,10,13,.20)] bg-[rgba(8,10,13,.08)] text-[rgba(8,10,13,.72)]";
}

function accountName(account: AdminAccountSummary) {
  return account.display_name?.trim() || account.primary_email?.trim() || "Usuario sin nombre";
}

function accountSub(account: AdminAccountSummary) {
  return account.primary_email?.trim() || `Actor: ${account.actor_type}`;
}

function toggleStatus(value: string): "ACTIVE" | "BLOCKED" {
  return statusNorm(value) === "ACTIVE" ? "BLOCKED" : "ACTIVE";
}

function rangeStart(range: AuditRange): number | null {
  const now = Date.now();
  if (range === "24h") return now - 24 * 60 * 60 * 1000;
  if (range === "7d") return now - 7 * 24 * 60 * 60 * 1000;
  if (range === "30d") return now - 30 * 24 * 60 * 60 * 1000;
  return null;
}

const miniBtnBase = "inline-flex min-h-[28px] items-center justify-center rounded-full border border-hairline bg-soft-cloud px-2.5 text-[9px] font-black uppercase tracking-wider text-ink transition hover:border-info disabled:opacity-50 disabled:cursor-not-allowed";
const miniBtnDanger = "inline-flex min-h-[28px] items-center justify-center rounded-full border border-sale/40 bg-sale/12 px-2.5 text-[9px] font-black uppercase tracking-wider text-sale-deep transition";
const miniBtnActive = "inline-flex min-h-[28px] items-center justify-center rounded-full border border-info/40 bg-info/12 px-2.5 text-[9px] font-black uppercase tracking-wider text-charcoal transition";

export function PermisosAuditoriaDashboardClient({
  audit,
  meAccess,
  accounts,
  rolesCatalog,
  permissionsCatalog,
  actions,
}: Props) {
  const router = useRouter();
  const toast = useToast();

  const [errorBagByForm, setErrorBagByForm] = useState<Partial<Record<PermisosFormKey, FormErrorBagState>>>({});

  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.account_id ?? "");
  const [userSearch, setUserSearch] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState("all");
  const [userRoleFilter, setUserRoleFilter] = useState("all");

  const [roleCode, setRoleCode] = useState(rolesCatalog[0]?.code ?? "");
  const [permissionKey, setPermissionKey] = useState(
    permissionsCatalog[0] ? `${permissionsCatalog[0].screen}:${permissionsCatalog[0].action}` : ""
  );
  const [overrideEffect, setOverrideEffect] = useState<"allow" | "deny">("allow");
  const [overrideReason, setOverrideReason] = useState("");

  const [auditSearch, setAuditSearch] = useState("");
  const [auditUserFilter, setAuditUserFilter] = useState("all");
  const [auditModuleFilter, setAuditModuleFilter] = useState("all");
  const [auditActionFilter, setAuditActionFilter] = useState("all");
  const [auditRange, setAuditRange] = useState<AuditRange>("7d");
  const [auditFrom, setAuditFrom] = useState("");
  const [auditTo, setAuditTo] = useState("");
  const [auditPageSize, setAuditPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [auditPage, setAuditPage] = useState(1);

  const [userModalAccountId, setUserModalAccountId] = useState("");
  const [auditModalId, setAuditModalId] = useState("");

  const accountById = useMemo(() => new Map(accounts.map((item) => [item.account_id, item])), [accounts]);
  const safeSelectedAccountId = useMemo(() => {
    if (selectedAccountId && accountById.has(selectedAccountId)) return selectedAccountId;
    return accounts[0]?.account_id ?? "";
  }, [accountById, accounts, selectedAccountId]);
  const effectiveRoleCode = roleCode || rolesCatalog[0]?.code || "";
  const effectivePermissionKey =
    permissionKey ||
    (permissionsCatalog[0]
      ? `${permissionsCatalog[0].screen}:${permissionsCatalog[0].action}`
      : "");

  useEffect(() => {
    if (!userModalAccountId && !auditModalId) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setUserModalAccountId("");
        setAuditModalId("");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [auditModalId, userModalAccountId]);

  const selectedAccount = safeSelectedAccountId
    ? accountById.get(safeSelectedAccountId) ?? null
    : null;

  const filteredAccounts = useMemo(() => {
    const query = userSearch.trim().toLowerCase();
    return accounts.filter((account) => {
      if (userStatusFilter !== "all" && statusNorm(account.status) !== userStatusFilter) return false;
      if (userRoleFilter !== "all" && !account.roles.includes(userRoleFilter)) return false;
      if (!query) return true;
      const source = [accountName(account), account.primary_email ?? "", account.actor_type, account.roles.join(" ")]
        .join(" ")
        .toLowerCase();
      return source.includes(query);
    });
  }, [accounts, userRoleFilter, userSearch, userStatusFilter]);

  const auditModules = useMemo(
    () => Array.from(new Set(audit.map((item) => item.resource_type))).sort((a, b) => a.localeCompare(b, "es-MX")),
    [audit]
  );
  const auditActions = useMemo(
    () => Array.from(new Set(audit.map((item) => item.action))).sort((a, b) => a.localeCompare(b, "es-MX")),
    [audit]
  );

  const filteredAudit = useMemo(() => {
    const query = auditSearch.trim().toLowerCase();
    const fromPreset = rangeStart(auditRange);
    const fromCustom = auditRange === "custom" && auditFrom ? new Date(auditFrom).getTime() : null;
    const toCustom = auditRange === "custom" && auditTo ? new Date(auditTo).getTime() : null;

    return audit.filter((item) => {
      if (auditUserFilter !== "all" && item.account_id !== auditUserFilter) return false;
      if (auditModuleFilter !== "all" && item.resource_type !== auditModuleFilter) return false;
      if (auditActionFilter !== "all" && item.action !== auditActionFilter) return false;

      const at = new Date(item.created_at).getTime();
      if (fromPreset && at < fromPreset) return false;
      if (fromCustom && !Number.isNaN(fromCustom) && at < fromCustom) return false;
      if (toCustom && !Number.isNaN(toCustom) && at > toCustom) return false;

      if (!query) return true;
      const actor = item.account_id ? accountById.get(item.account_id) ?? null : null;
      const haystack = [
        item.action,
        item.resource_type,
        item.resource_id ?? "",
        item.reason ?? "",
        item.actor_type,
        actor ? accountName(actor) : "",
        actor?.primary_email ?? "",
        JSON.stringify(item.payload ?? {}),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [
    accountById,
    audit,
    auditActionFilter,
    auditFrom,
    auditModuleFilter,
    auditRange,
    auditSearch,
    auditTo,
    auditUserFilter,
  ]);

  const totalAuditPages = Math.max(1, Math.ceil(filteredAudit.length / auditPageSize));
  const currentAuditPage = Math.min(auditPage, totalAuditPages);

  const pagedAudit = useMemo(() => {
    const start = (currentAuditPage - 1) * auditPageSize;
    return filteredAudit.slice(start, start + auditPageSize);
  }, [auditPageSize, currentAuditPage, filteredAudit]);

  const selectedUserAudit = useMemo(() => {
    if (!selectedAccount) return [];
    return audit.filter((item) => item.account_id === selectedAccount.account_id).slice(0, 8);
  }, [audit, selectedAccount]);

  const userModalAccount = userModalAccountId ? accountById.get(userModalAccountId) ?? null : null;
  const userModalAudit = useMemo(() => {
    if (!userModalAccount) return [];
    return audit.filter((item) => item.account_id === userModalAccount.account_id).slice(0, 30);
  }, [audit, userModalAccount]);

  const auditModalItem = useMemo(() => (auditModalId ? audit.find((item) => item.id === auditModalId) ?? null : null), [audit, auditModalId]);
  const auditModalActor = auditModalItem?.account_id ? accountById.get(auditModalItem.account_id) ?? null : null;

  const setFormErrorBag = (formKey: PermisosFormKey, bag: FormErrorBagState | null) => {
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
    formKey: PermisosFormKey,
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

  const runRoleAction = async (formKey: "assign-role" | "remove-role", action: ServerAction) => {
    if (!selectedAccount) return;
    if (!effectiveRoleCode) {
      toast.error("Selecciona un rol antes de continuar.");
      return;
    }
    const formData = new FormData();
    formData.set("account_id", selectedAccount.account_id);
    formData.set("role_code", effectiveRoleCode);
    await runAction(
      formKey,
      action,
      formData,
      formKey === "assign-role" ? "Rol asignado correctamente." : "Rol removido correctamente.",
      formKey === "assign-role" ? "No se pudo asignar el rol." : "No se pudo remover el rol."
    );
  };

  const runStatusToggle = async (account: AdminAccountSummary) => {
    const next = toggleStatus(account.status);
    const formData = new FormData();
    formData.set("account_id", account.account_id);
    formData.set("status", next);
    formData.set("reason", next === "BLOCKED" ? "Bloqueo desde panel de permisos" : "Reactivacion desde panel de permisos");
    await runAction(
      "set-status",
      actions.updateAccountStatusAction,
      formData,
      next === "BLOCKED" ? "Usuario bloqueado." : "Usuario reactivado.",
      "No se pudo actualizar el estado del usuario."
    );
  };

  const runOverrideAction = async (formKey: "upsert-override" | "remove-override", action: ServerAction) => {
    if (!selectedAccount) return;
    const [screen, actionValue] = effectivePermissionKey.split(":");
    if (!screen || !actionValue) {
      toast.error("Selecciona una pantalla y accion validas.");
      return;
    }

    const formData = new FormData();
    formData.set("account_id", selectedAccount.account_id);
    formData.set("screen", screen);
    formData.set("action", actionValue);
    if (formKey === "upsert-override") {
      formData.set("effect", overrideEffect);
      if (overrideReason.trim()) formData.set("reason", overrideReason.trim());
    }

    await runAction(
      formKey,
      action,
      formData,
      formKey === "upsert-override" ? "Override guardado." : "Override removido.",
      formKey === "upsert-override" ? "No se pudo guardar el override." : "No se pudo remover el override."
    );
  };

  return (
    <main className="rounded-md border border-hairline bg-soft-cloud/90 w-full px-4 py-6 sm:px-7 lg:px-12">
      <section className="rounded-[20px] border border-hairline bg-[rgba(255,255,255,.58)] p-4 sm:p-5">
        <h1 className="text-[24px] font-black uppercase tracking-[0.04em] text-ink sm:text-[30px]">
          Permisos y Auditoria
        </h1>
        <p className="mt-1 text-[12px] text-[rgba(8,10,13,.64)]">
          Gestion por usuario, control por pantalla y accion, y bitacora de cambios criticos.
        </p>
        {meAccess ? (
          <p className="mt-2 text-[11px] text-[rgba(8,10,13,.6)]">
            Tu sesion: {meAccess.actor_type} · {meAccess.roles.join(", ") || "sin roles"}
          </p>
        ) : null}
      </section>

      <section className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <article className="rounded-[18px] border border-hairline bg-[rgba(255,255,255,.62)] p-3.5">
          <header className="mb-3">
            <h2 className="text-[12px] font-black uppercase tracking-[0.12em] text-ink">
              Usuarios ({filteredAccounts.length})
            </h2>
          </header>

          <div className="grid gap-2 sm:grid-cols-3">
            <TextField label="Búsqueda de usuarios" labelClassName="sr-only" value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Buscar por nombre, correo o rol" size="sm" wrapperClassName="sm:col-span-2" inputClassName="text-[11px]" />
            <SelectField label="Estado de usuario" labelClassName="sr-only" value={userStatusFilter} onChange={(event) => setUserStatusFilter(event.target.value)} size="sm" options={[{ value: "all", label: "Todos los estados" }, { value: "ACTIVE", label: "Activos" }, { value: "BLOCKED", label: "Bloqueados" }, { value: "SUSPENDED", label: "Suspendidos" }, { value: "DISABLED", label: "Deshabilitados" }]} />
            <SelectField label="Rol de usuario" labelClassName="sr-only" value={userRoleFilter} onChange={(event) => setUserRoleFilter(event.target.value)} size="sm" wrapperClassName="sm:col-span-3" options={[{ value: "all", label: "Todos los roles" }, ...rolesCatalog.map((role) => ({ value: role.code, label: `${role.name} (${role.code})` }))]} />
          </div>

          <div className="mt-3 max-h-[62vh] space-y-2 overflow-auto pr-1">
            {filteredAccounts.length > 0 ? (
              filteredAccounts.map((account) => {
                const isSelected = selectedAccount?.account_id === account.account_id;
                const willBlock = toggleStatus(account.status) === "BLOCKED";
                return (
                  <article
                    key={account.account_id}
                    className={`rounded-[12px] border p-2.5 transition ${
                      isSelected
                        ? "border-[rgba(5,122,168,.48)] bg-[rgba(232,246,255,.88)]"
                        : "border-[rgba(8,10,13,.12)] bg-white/86"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedAccountId(account.account_id)}
                      className="w-full text-left"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-black uppercase tracking-[0.08em] text-ink">
                            {accountName(account)}
                          </p>
                          <p className="truncate text-[11px] text-[rgba(8,10,13,.62)]">{accountSub(account)}</p>
                        </div>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] ${statusClass(account.status)}`}
                        >
                          {statusLabel(account.status)}
                        </span>
                      </div>
                    </button>

                    <div className="mt-2 flex flex-wrap gap-1">
                      {account.roles.length > 0 ? (
                        account.roles.map((role) => (
                          <span
                            key={`${account.account_id}-${role}`}
                            className="rounded-full border border-[rgba(8,10,13,.12)] bg-white/90 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] text-[rgba(8,10,13,.68)]"
                          >
                            {role}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-[rgba(8,10,13,.56)]">Sin roles asignados</span>
                      )}
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setUserModalAccountId(account.account_id)}
                        className={miniBtnBase}
                      >
                        Ver usuario
                      </button>
                      <button
                        type="button"
                        onClick={() => void runStatusToggle(account)}
                        className={willBlock ? miniBtnDanger : miniBtnActive}
                      >
                        {willBlock ? "Bloquear" : "Activar"}
                      </button>
                    </div>
                  </article>
                );
              })
            ) : (
              <p className="rounded-[12px] border border-[rgba(8,10,13,.12)] bg-white/84 p-3 text-[11px] text-[rgba(8,10,13,.62)]">
                No hay usuarios con esos filtros.
              </p>
            )}
          </div>
        </article>

        <article className="rounded-[18px] border border-hairline bg-[rgba(255,255,255,.62)] p-3.5">
          <header>
            <h2 className="text-[12px] font-black uppercase tracking-[0.12em] text-ink">
              Gestion de acceso
            </h2>
          </header>

          {selectedAccount ? (
            <section className="mt-3 space-y-3">
              <article className="rounded-[12px] border border-[rgba(8,10,13,.12)] bg-white/90 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-[13px] font-black uppercase tracking-[0.08em] text-ink">{accountName(selectedAccount)}</p>
                    <p className="text-[11px] text-[rgba(8,10,13,.62)]">{accountSub(selectedAccount)}</p>
                  </div>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] ${statusClass(selectedAccount.status)}`}
                  >
                    {statusLabel(selectedAccount.status)}
                  </span>
                </div>
                <p className="mt-2 text-[10px] text-[rgba(8,10,13,.58)]">Ultimo acceso: {dt(selectedAccount.last_login_at)}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selectedAccount.roles.length > 0 ? (
                    selectedAccount.roles.map((role) => (
                      <span
                        key={`selected-${role}`}
                        className="rounded-full border border-[rgba(8,10,13,.12)] bg-[rgba(255,255,255,.92)] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] text-[rgba(8,10,13,.7)]"
                      >
                        {role}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-[rgba(8,10,13,.56)]">Sin roles activos</span>
                  )}
                </div>
              </article>

              <article className="rounded-[12px] border border-[rgba(8,10,13,.12)] bg-white/90 p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[rgba(8,10,13,.62)]">Cambiar roles</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                  <SelectField label="Rol" labelClassName="sr-only" value={effectiveRoleCode} onChange={(event) => setRoleCode(event.target.value)} size="sm" options={rolesCatalog.map((role) => ({ value: role.code, label: `${role.name} (${role.code})` }))} />
                  <button
                    type="button"
                    onClick={() => void runRoleAction("assign-role", actions.assignRoleAction)}
                    className={miniBtnActive}
                  >
                    Agregar
                  </button>
                  <button
                    type="button"
                    onClick={() => void runRoleAction("remove-role", actions.removeRoleAction)}
                    className={miniBtnBase}
                  >
                    Remover
                  </button>
                </div>
                <FormErrorBag bag={errorBagByForm["assign-role"] ?? null} className="mt-2" />
                <FormErrorBag bag={errorBagByForm["remove-role"] ?? null} className="mt-2" />
              </article>

              <article className="rounded-[12px] border border-[rgba(8,10,13,.12)] bg-white/90 p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[rgba(8,10,13,.62)]">
                  Control por pantalla y accion
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <SelectField label="Permiso" labelClassName="sr-only" value={effectivePermissionKey} onChange={(event) => setPermissionKey(event.target.value)} size="sm" wrapperClassName="sm:col-span-2" options={permissionsCatalog.map((permission) => { const value = `${permission.screen}:${permission.action}`; return { value, label: `${permission.screen} / ${permission.action}` }; })} />
                  <SelectField label="Efecto" labelClassName="sr-only" value={overrideEffect} onChange={(event) => setOverrideEffect(event.target.value === "deny" ? "deny" : "allow")} size="sm" options={[{ value: "allow", label: "allow" }, { value: "deny", label: "deny" }]} />
                  <TextField label="Motivo" labelClassName="sr-only" value={overrideReason} onChange={(event) => setOverrideReason(event.target.value)} placeholder="Motivo (opcional)" size="sm" inputClassName="text-[11px]" />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void runOverrideAction("upsert-override", actions.upsertPermissionOverrideAction)}
                    className={miniBtnActive}
                  >
                    Aplicar override
                  </button>
                  <button
                    type="button"
                    onClick={() => void runOverrideAction("remove-override", actions.removePermissionOverrideAction)}
                    className={miniBtnBase}
                  >
                    Remover override
                  </button>
                  {selectedUserAudit.length > 0 ? (
                    selectedUserAudit.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => setAuditModalId(item.id)}
                        className="w-full rounded-[10px] border border-[rgba(8,10,13,.12)] bg-white/88 p-2 text-left transition hover:border-[rgba(5,122,168,.36)]"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[10px] font-black uppercase tracking-[0.08em] text-ink">{item.action}</p>
                          <p className="text-[10px] text-[rgba(8,10,13,.6)]">{dt(item.created_at)}</p>
                        </div>
                        <p className="mt-0.5 text-[11px] text-[rgba(8,10,13,.66)]">{item.resource_type}</p>
                      </button>
                    ))
                  ) : (
                    <p className="text-[11px] text-[rgba(8,10,13,.58)]">No hay eventos de auditoria para este usuario.</p>
                  )}
                </div>
              </article>
            </section>
          ) : (
            <p className="mt-3 rounded-[12px] border border-[rgba(8,10,13,.12)] bg-white/84 p-3 text-[11px] text-[rgba(8,10,13,.62)]">
              Selecciona un usuario para gestionar permisos y estado.
            </p>
          )}
        </article>
      </section>

      <section className="mt-4 rounded-[18px] border border-hairline bg-[rgba(255,255,255,.62)] p-3.5">
        <header className="mb-3">
          <h2 className="text-[12px] font-black uppercase tracking-[0.12em] text-ink">Audit log ({filteredAudit.length})</h2>
        </header>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
          <TextField label="Búsqueda de auditoría" labelClassName="sr-only" value={auditSearch} onChange={(event) => { setAuditSearch(event.target.value); setAuditPage(1); }} placeholder="Buscar por usuario, accion, motivo o payload" size="sm" wrapperClassName="sm:col-span-2 xl:col-span-2" inputClassName="text-[11px]" />
          <SelectField label="Usuario" labelClassName="sr-only" value={auditUserFilter} onChange={(event) => { setAuditUserFilter(event.target.value); setAuditPage(1); }} size="sm" options={[{ value: "all", label: "Todos los usuarios" }, ...accounts.map((account) => ({ value: account.account_id, label: accountName(account) }))]} />
          <SelectField label="Módulo" labelClassName="sr-only" value={auditModuleFilter} onChange={(event) => { setAuditModuleFilter(event.target.value); setAuditPage(1); }} size="sm" options={[{ value: "all", label: "Toda la app" }, ...auditModules.map((resource) => ({ value: resource, label: resource }))]} />
          <SelectField label="Acción" labelClassName="sr-only" value={auditActionFilter} onChange={(event) => { setAuditActionFilter(event.target.value); setAuditPage(1); }} size="sm" options={[{ value: "all", label: "Todas las acciones" }, ...auditActions.map((action) => ({ value: action, label: action }))]} />
          <SelectField label="Rango" labelClassName="sr-only" value={auditRange} onChange={(event) => { setAuditRange(event.target.value as AuditRange); setAuditPage(1); }} size="sm" options={[{ value: "all", label: "Todo el historico" }, { value: "24h", label: "Ultimas 24 horas" }, { value: "7d", label: "Ultimos 7 dias" }, { value: "30d", label: "Ultimos 30 dias" }, { value: "custom", label: "Rango personalizado" }]} />

          {auditRange === "custom" ? (
            <>
              <TextField label="Desde" labelClassName="sr-only" type="datetime-local" value={auditFrom} onChange={(event) => { setAuditFrom(event.target.value); setAuditPage(1); }} size="sm" wrapperClassName="xl:col-span-3" inputClassName="text-[11px]" />
              <TextField label="Hasta" labelClassName="sr-only" type="datetime-local" value={auditTo} onChange={(event) => { setAuditTo(event.target.value); setAuditPage(1); }} size="sm" wrapperClassName="xl:col-span-2" inputClassName="text-[11px]" />
            </>
          ) : null}
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-[rgba(8,10,13,.58)]">Click en cualquier registro para ver detalle completo.</p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.08em] text-[rgba(8,10,13,.58)]">Por pagina</span>
            <SelectField label="Tamaño de página" labelClassName="sr-only" value={String(auditPageSize)} onChange={(event) => { setAuditPageSize(Number(event.target.value)); setAuditPage(1); }} size="sm" options={PAGE_SIZE_OPTIONS.map((size) => ({ value: String(size), label: String(size) }))} wrapperClassName="w-20" />
          </div>
        </div>

        <div className="mt-3 grid gap-2">
          {pagedAudit.length > 0 ? (
            pagedAudit.map((item) => {
              const actor = item.account_id ? accountById.get(item.account_id) ?? null : null;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setAuditModalId(item.id)}
                  className="rounded-[12px] border border-[rgba(8,10,13,.12)] bg-white/88 p-3 text-left transition hover:border-[rgba(5,122,168,.38)] hover:bg-[rgba(242,249,255,.92)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[11px] font-black uppercase tracking-[0.09em] text-ink">{item.action}</p>
                    <p className="text-[10px] text-[rgba(8,10,13,.58)]">{dt(item.created_at)}</p>
                  </div>
                  <p className="mt-1 text-[12px] text-[rgba(8,10,13,.72)]">{actor ? accountName(actor) : item.actor_type}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-[10px] text-[rgba(8,10,13,.58)]">
                    <span>Modulo: {item.resource_type}</span>
                    <span>Motivo: {item.reason || "Sin motivo"}</span>
                  </div>
                </button>
              );
            })
          ) : (
            <p className="rounded-[12px] border border-[rgba(8,10,13,.12)] bg-white/84 p-3 text-[11px] text-[rgba(8,10,13,.62)]">
              No hay registros con esos filtros.
            </p>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] text-[rgba(8,10,13,.56)]">Pagina {currentAuditPage} de {totalAuditPages}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAuditPage(Math.max(1, currentAuditPage - 1))}
              disabled={currentAuditPage <= 1}
              className={miniBtnBase}
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setAuditPage(Math.min(totalAuditPages, currentAuditPage + 1))}
              disabled={currentAuditPage >= totalAuditPages}
              className={miniBtnBase}
            >
              Siguiente
            </button>
          </div>
        </div>
      </section>
      <DashboardModal
        open={!!userModalAccount}
        title={userModalAccount ? accountName(userModalAccount) : "Detalle de usuario"}
        subtitle={userModalAccount ? "Actividad y acceso del usuario" : undefined}
        onClose={() => setUserModalAccountId("")}
      >
        {userModalAccount ? (
          <section className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <article className="rounded-[10px] border border-[rgba(8,10,13,.12)] bg-white/90 p-2.5">
                <p className="text-[10px] font-black uppercase tracking-[0.09em] text-[rgba(8,10,13,.58)]">Estado</p>
                <p className="mt-1 text-[15px] font-black text-ink">{statusLabel(userModalAccount.status)}</p>
              </article>
              <article className="rounded-[10px] border border-[rgba(8,10,13,.12)] bg-white/90 p-2.5">
                <p className="text-[10px] font-black uppercase tracking-[0.09em] text-[rgba(8,10,13,.58)]">Actor</p>
                <p className="mt-1 text-[15px] font-black text-ink">{userModalAccount.actor_type}</p>
              </article>
              <article className="rounded-[10px] border border-[rgba(8,10,13,.12)] bg-white/90 p-2.5">
                <p className="text-[10px] font-black uppercase tracking-[0.09em] text-[rgba(8,10,13,.58)]">Ultimo acceso</p>
                <p className="mt-1 text-[12px] font-semibold text-[rgba(8,10,13,.74)]">{dt(userModalAccount.last_login_at)}</p>
              </article>
            </div>

            <article className="rounded-[10px] border border-[rgba(8,10,13,.12)] bg-white/90 p-2.5">
              <p className="text-[10px] font-black uppercase tracking-[0.09em] text-[rgba(8,10,13,.58)]">Roles</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {userModalAccount.roles.length > 0 ? (
                  userModalAccount.roles.map((role) => (
                    <span
                      key={`modal-role-${role}`}
                      className="rounded-full border border-[rgba(8,10,13,.12)] bg-white/92 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] text-[rgba(8,10,13,.72)]"
                    >
                      {role}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-[rgba(8,10,13,.58)]">Sin roles activos</span>
                )}
              </div>
            </article>

            <article className="rounded-[10px] border border-[rgba(8,10,13,.12)] bg-white/90 p-2.5">
              <p className="text-[10px] font-black uppercase tracking-[0.09em] text-[rgba(8,10,13,.58)]">
                Bitacora del usuario ({userModalAudit.length})
              </p>
              <div className="mt-2 max-h-[44vh] space-y-2 overflow-auto pr-1">
                {userModalAudit.length > 0 ? (
                  userModalAudit.map((item) => (
                    <button
                      type="button"
                      key={`modal-audit-${item.id}`}
                      onClick={() => {
                        setUserModalAccountId("");
                        setAuditModalId(item.id);
                      }}
                      className="w-full rounded-[10px] border border-[rgba(8,10,13,.12)] bg-white/88 p-2 text-left transition hover:border-[rgba(5,122,168,.36)]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.08em] text-ink">{item.action}</p>
                        <p className="text-[10px] text-[rgba(8,10,13,.58)]">{dt(item.created_at)}</p>
                      </div>
                      <p className="mt-0.5 text-[11px] text-[rgba(8,10,13,.66)]">{item.resource_type}</p>
                      <p className="mt-0.5 text-[10px] text-[rgba(8,10,13,.58)]">Motivo: {item.reason || "Sin motivo"}</p>
                    </button>
                  ))
                ) : (
                  <p className="text-[11px] text-[rgba(8,10,13,.58)]">Sin eventos para este usuario.</p>
                )}
              </div>
            </article>
          </section>
        ) : null}
      </DashboardModal>

      <DashboardModal
        open={!!auditModalItem}
        title={auditModalItem ? auditModalItem.action : "Detalle de auditoria"}
        subtitle={auditModalItem ? "Que, cuando, como y quien ejecuto la accion" : undefined}
        onClose={() => setAuditModalId("")}
      >
        {auditModalItem ? (
          <section className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <article className="rounded-[10px] border border-[rgba(8,10,13,.12)] bg-white/90 p-2.5">
                <p className="text-[10px] font-black uppercase tracking-[0.09em] text-[rgba(8,10,13,.58)]">Usuario</p>
                <p className="mt-1 text-[12px] font-black text-ink">
                  {auditModalActor ? accountName(auditModalActor) : auditModalItem.actor_type}
                </p>
                <p className="mt-0.5 text-[10px] text-[rgba(8,10,13,.58)]">{auditModalActor?.primary_email || "Sin correo"}</p>
              </article>
              <article className="rounded-[10px] border border-[rgba(8,10,13,.12)] bg-white/90 p-2.5">
                <p className="text-[10px] font-black uppercase tracking-[0.09em] text-[rgba(8,10,13,.58)]">Cuando</p>
                <p className="mt-1 text-[12px] font-black text-ink">{dt(auditModalItem.created_at)}</p>
              </article>
              <article className="rounded-[10px] border border-[rgba(8,10,13,.12)] bg-white/90 p-2.5">
                <p className="text-[10px] font-black uppercase tracking-[0.09em] text-[rgba(8,10,13,.58)]">Modulo</p>
                <p className="mt-1 text-[12px] font-black text-ink">{auditModalItem.resource_type}</p>
              </article>
            </div>

            <article className="rounded-[10px] border border-[rgba(8,10,13,.12)] bg-white/90 p-2.5">
              <p className="text-[10px] font-black uppercase tracking-[0.09em] text-[rgba(8,10,13,.58)]">Motivo</p>
              <p className="mt-1 text-[11px] text-[rgba(8,10,13,.72)]">{auditModalItem.reason || "Sin motivo registrado"}</p>
            </article>

            <article className="rounded-[10px] border border-[rgba(8,10,13,.12)] bg-white/90 p-2.5">
              <p className="text-[10px] font-black uppercase tracking-[0.09em] text-[rgba(8,10,13,.58)]">Como se ejecuto</p>
              <div className="mt-1 grid gap-1 text-[11px] text-[rgba(8,10,13,.72)]">
                <p>IP: {auditModalItem.ip || "No disponible"}</p>
                <p className="break-all">User agent: {auditModalItem.user_agent || "No disponible"}</p>
              </div>
            </article>

            <article className="rounded-[10px] border border-[rgba(8,10,13,.12)] bg-white/90 p-2.5">
              <p className="text-[10px] font-black uppercase tracking-[0.09em] text-[rgba(8,10,13,.58)]">Payload</p>
              {auditModalItem.payload ? (
                <pre className="mt-1 max-h-[30vh] overflow-auto rounded-[8px] border border-[rgba(8,10,13,.12)] bg-[rgba(247,250,255,.9)] p-2 text-[10px] text-[rgba(8,10,13,.72)]">
                  {JSON.stringify(auditModalItem.payload, null, 2)}
                </pre>
              ) : (
                <p className="mt-1 text-[11px] text-[rgba(8,10,13,.58)]">Sin payload.</p>
              )}
            </article>
          </section>
        ) : null}
      </DashboardModal>
    </main>
  );
}
