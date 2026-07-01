import { requestJson } from "@/core/lib/api/fetcher";

export type SupportReason = {
  code: string;
  label: string;
  requires_order: boolean;
};

export type SupportAttachment = {
  id: string;
  asset_id?: string | null;
  file_url: string;
  file_name?: string | null;
  mime_type?: string | null;
  size_bytes?: number | null;
  created_at: string;
};

export type SupportMessage = {
  id: string;
  sender_type: string;
  sender_label?: string | null;
  message: string;
  is_internal: boolean;
  created_at: string;
  attachments: SupportAttachment[];
};

export type SupportCase = {
  id: string;
  status: string;
  reason: string;
  priority?: string | null;
  subject?: string | null;
  customer_type: string;
  account_id?: string | null;
  contact_email: string;
  contact_phone?: string | null;
  guest_email?: string | null;
  guest_order_code?: string | null;
  linked_order_id?: string | null;
  linked_order_code?: string | null;
  is_order_related: boolean;
  assigned_to?: string | null;
  closed_at?: string | null;
  last_message_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type SupportCaseDetail = {
  case: SupportCase;
  messages: SupportMessage[];
};

export type PaginatedSupportCases = {
  items: SupportCase[];
  total: number;
  limit: number;
  offset: number;
};

export type GuestSupportIdentity = {
  guest_email: string;
  guest_order_code: string;
};

function buildGuestQuery(guest?: GuestSupportIdentity) {
  const params = new URLSearchParams();
  if (guest?.guest_email) params.set("guest_email", guest.guest_email);
  if (guest?.guest_order_code) {
    params.set("guest_order_code", guest.guest_order_code);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function listSupportReasons() {
  const payload = await requestJson<{ reasons: SupportReason[] }>("/api/support/reasons", {
    method: "GET",
  });
  return payload.reasons;
}

export async function listMySupportCases(guest?: GuestSupportIdentity) {
  return requestJson<PaginatedSupportCases>(
    `/api/support/cases${buildGuestQuery(guest)}`,
    { method: "GET" }
  );
}

export async function getMySupportCase(caseId: string, guest?: GuestSupportIdentity) {
  return requestJson<SupportCaseDetail>(
    `/api/support/cases/${encodeURIComponent(caseId)}${buildGuestQuery(guest)}`,
    { method: "GET" }
  );
}

export async function createSupportCase(input: {
  reason: string;
  message: string;
  subject?: string;
  priority?: string;
  is_about_order?: boolean;
  order_id?: string;
  link_order?: boolean;
  guest_email?: string;
  guest_order_code?: string;
  contact_email?: string;
  contact_phone?: string;
  attachments?: Array<{
    asset_id?: string;
    file_url: string;
    file_name?: string;
    mime_type?: string;
    size_bytes?: number;
  }>;
}) {
  return requestJson<SupportCaseDetail>("/api/support/cases", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function addSupportCaseMessage(
  caseId: string,
  input: {
    message: string;
    attachments?: Array<{
      asset_id?: string;
      file_url: string;
      file_name?: string;
      mime_type?: string;
      size_bytes?: number;
    }>;
  },
  guest?: GuestSupportIdentity
) {
  return requestJson<SupportCaseDetail>(
    `/api/support/cases/${encodeURIComponent(caseId)}/messages${buildGuestQuery(guest)}`,
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );
}
