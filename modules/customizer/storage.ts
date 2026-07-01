import type { SavedCustomizerDesign } from "@/modules/customizer/types";

const STORAGE_VERSION = 1;
const GUEST_STORAGE_KEY = `saut.customizer.designs.guest.v${STORAGE_VERSION}`;

type StoredPayload = {
  version: number;
  designs: SavedCustomizerDesign[];
};

export type SaveCustomizerDesignsResult = {
  ok: boolean;
  persistedDesigns: SavedCustomizerDesign[];
  droppedCount: number;
};

function isBrowser() {
  return typeof window !== "undefined";
}

function accountStorageKey(accountId: string) {
  return `saut.customizer.designs.account.${accountId}.v${STORAGE_VERSION}`;
}

function resolveStorageKey(accountId: string | null) {
  if (!accountId) return GUEST_STORAGE_KEY;
  return accountStorageKey(accountId);
}

function parsePayload(raw: string | null): StoredPayload {
  if (!raw) {
    return { version: STORAGE_VERSION, designs: [] };
  }

  try {
    const parsed = JSON.parse(raw) as StoredPayload;
    if (!Array.isArray(parsed.designs)) {
      return { version: STORAGE_VERSION, designs: [] };
    }
    return {
      version: parsed.version ?? STORAGE_VERSION,
      designs: parsed.designs,
    };
  } catch {
    return { version: STORAGE_VERSION, designs: [] };
  }
}

function isQuotaExceededError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybeDomError = error as { name?: string; code?: number };
  return (
    maybeDomError.name === "QuotaExceededError" ||
    maybeDomError.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    maybeDomError.code === 22 ||
    maybeDomError.code === 1014
  );
}

function writePayload(storageKey: string, payload: StoredPayload): boolean {
  if (!isBrowser()) return false;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(payload));
    return true;
  } catch (error) {
    if (isQuotaExceededError(error)) return false;
    return false;
  }
}

function persistDesignsWithCompaction(
  storageKey: string,
  designs: SavedCustomizerDesign[]
): SavedCustomizerDesign[] | null {
  if (!isBrowser()) return null;

  if (designs.length === 0) {
    const ok = writePayload(storageKey, {
      version: STORAGE_VERSION,
      designs: [],
    });
    return ok ? [] : null;
  }

  const candidate = designs.slice();
  while (candidate.length > 0) {
    const ok = writePayload(storageKey, {
      version: STORAGE_VERSION,
      designs: candidate,
    });
    if (ok) return candidate.slice();
    if (candidate.length === 1) break;
    candidate.pop();
  }

  return null;
}

export function loadCustomizerDesigns(
  accountId: string | null
): SavedCustomizerDesign[] {
  if (!isBrowser()) return [];
  const raw = window.localStorage.getItem(resolveStorageKey(accountId));
  const payload = parsePayload(raw);
  return payload.designs;
}

export function saveCustomizerDesigns(
  accountId: string | null,
  designs: SavedCustomizerDesign[]
): SaveCustomizerDesignsResult {
  if (!isBrowser()) {
    return {
      ok: false,
      persistedDesigns: [],
      droppedCount: 0,
    };
  }

  const persistedDesigns = persistDesignsWithCompaction(
    resolveStorageKey(accountId),
    designs
  );

  if (!persistedDesigns) {
    return {
      ok: false,
      persistedDesigns: loadCustomizerDesigns(accountId),
      droppedCount: 0,
    };
  }

  return {
    ok: true,
    persistedDesigns,
    droppedCount: Math.max(0, designs.length - persistedDesigns.length),
  };
}

export function upsertCustomizerDesign(
  accountId: string | null,
  design: SavedCustomizerDesign
) {
  const existing = loadCustomizerDesigns(accountId);
  const idx = existing.findIndex((item) => item.designId === design.designId);
  const next = [...existing];
  if (idx >= 0) {
    next[idx] = design;
  } else {
    next.unshift(design);
  }
  saveCustomizerDesigns(accountId, next);
}

export function removeCustomizerDesign(
  accountId: string | null,
  designId: string
) {
  const existing = loadCustomizerDesigns(accountId);
  const next = existing.filter((item) => item.designId !== designId);
  saveCustomizerDesigns(accountId, next);
}

export function duplicateCustomizerDesign(
  accountId: string | null,
  source: SavedCustomizerDesign
): SavedCustomizerDesign {
  const now = new Date().toISOString();
  const copy: SavedCustomizerDesign = {
    ...source,
    designId:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? `design-${crypto.randomUUID()}`
        : `design-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: `${source.title} (copia)`,
    updatedAt: now,
    createdAt: now,
    ownerAccountId: accountId,
  };
  upsertCustomizerDesign(accountId, copy);
  return copy;
}

export function migrateGuestDesignsToAccount(accountId: string | null) {
  if (!isBrowser() || !accountId) return;

  const guest = loadCustomizerDesigns(null);
  if (guest.length === 0) return;

  const accountDesigns = loadCustomizerDesigns(accountId);
  const seen = new Set(accountDesigns.map((item) => item.designId));
  const merged = [...accountDesigns];

  for (const design of guest) {
    if (seen.has(design.designId)) continue;
    merged.push({
      ...design,
      ownerAccountId: accountId,
      updatedAt: new Date().toISOString(),
    });
    seen.add(design.designId);
  }

  const result = saveCustomizerDesigns(accountId, merged);
  if (!result.ok) return;

  const persistedIds = new Set(
    result.persistedDesigns.map((design) => design.designId)
  );
  const pendingGuestDesigns = guest.filter(
    (design) => !persistedIds.has(design.designId)
  );

  if (pendingGuestDesigns.length === 0) {
    window.localStorage.removeItem(GUEST_STORAGE_KEY);
    return;
  }

  saveCustomizerDesigns(null, pendingGuestDesigns);
}
