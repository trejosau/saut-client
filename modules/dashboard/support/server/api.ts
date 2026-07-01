import { adminRequest } from "@/modules/dashboard/shared/server/admin-api";

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

export async function listAdminSupportCases(params?: {
  status?: string;
  reason?: string;
  linked_order_id?: string;
  contact_email?: string;
  limit?: number;
  offset?: number;
}) {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.reason) search.set("reason", params.reason);
  if (params?.linked_order_id) {
    search.set("linked_order_id", params.linked_order_id);
  }
  if (params?.contact_email) {
    search.set("contact_email", params.contact_email);
  }
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.offset) search.set("offset", String(params.offset));
  const query = search.toString();

  return adminRequest<PaginatedSupportCases>({
    path: `/admin/support/cases${query ? `?${query}` : ""}`,
    method: "GET",
  });
}

export async function getAdminSupportCase(caseId: string) {
  return adminRequest<SupportCaseDetail>({
    path: `/admin/support/cases/${caseId}`,
    method: "GET",
  });
}

export async function updateAdminSupportCaseStatus(caseId: string, input: {
  status: "open" | "in_review" | "pending_customer" | "resolved" | "closed";
  note?: string;
  notify_customer?: boolean;
}) {
  return adminRequest<SupportCaseDetail>({
    path: `/admin/support/cases/${caseId}/status`,
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function addAdminSupportMessage(caseId: string, input: {
  message: string;
  is_internal?: boolean;
  attachments?: Array<{
    asset_id?: string;
    file_url: string;
    file_name?: string;
    mime_type?: string;
    size_bytes?: number;
  }>;
}) {
  return adminRequest<SupportCaseDetail>({
    path: `/admin/support/cases/${caseId}/messages`,
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function registerSupportRefund(caseId: string, input: {
  mode: "manual" | "auto";
  reason_code: string;
  notes?: string;
  amount_mxn?: number;
}) {
  return adminRequest<{
    case_id: string;
    mode: string;
    reason_code: string;
    auto_allowed: boolean;
    recorded: boolean;
  }>({
    path: `/admin/support/cases/${caseId}/refunds`,
    method: "POST",
    body: JSON.stringify(input),
  });
}

