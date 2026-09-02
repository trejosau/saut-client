import { buildApiUrl as buildUrl } from "@/core/lib/api/endpoints";
import { requestJson } from "@/core/lib/api/fetcher";

export type CheckoutAddress = {
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country?: string | null;
  reference?: string | null;
};

export type CustomizerPlacementPayload = {
  asset_id: string;
  x: number;
  y: number;
  scale?: number | null;
  rotation?: number | null;
};

export type CartItemResponse = {
  id: string;
  item_type: string;
  publication_id?: string | null;
  publication_slug?: string | null;
  design_variant_id?: string | null;
  garment_type: string;
  garment_model: string;
  color: string;
  size: string;
  grammage_g: number;
  fit: string;
  quantity: number;
  unit_price_mxn: number;
  line_total_mxn: number;
  custom_front?: unknown;
  custom_back?: unknown;
  custom_note?: string | null;
  improve_quality: boolean;
  drop_id?: string | null;
  drop_total_limit?: number | null;
  meta?: Record<string, unknown> | null;
};

export type CartSessionResponse = {
  id: string;
  status: string;
  guest_session_id?: string | null;
  account_id?: string | null;
  total_items: number;
  subtotal_mxn: number;
  items: CartItemResponse[];
  created_at: string;
  updated_at: string;
};

export type ShippingQuote = {
  quote_id: string;
  provider: string;
  service: string;
  price_mxn: number;
  eta_days: number;
};

export type CheckoutSessionResponse = {
  id: string;
  cart_id: string;
  status: string;
  email: string;
  phone: string;
  address: CheckoutAddress;
  shipping_method: "local" | "national" | string;
  shipping_quote_id?: string | null;
  shipping_provider?: string | null;
  shipping_service?: string | null;
  shipping_cost_mxn: number;
  shipping_quotes: ShippingQuote[];
  subtotal_mxn: number;
  total_mxn: number;
  currency: string;
  paid_at?: string | null;
  payment_attempt_id?: string | null;
  order_id?: string | null;
  items: CartItemResponse[];
};

export type PaymentAttemptResponse = {
  id: string;
  checkout_session_id: string;
  status: string;
  amount_mxn: number;
  currency: string;
  provider: string;
  provider_payment_intent_id?: string | null;
  provider_charge_id?: string | null;
  client_secret?: string | null;
  checkout_url?: string | null;
  failure_reason?: string | null;
  created_at: string;
  updated_at: string;
};

export type PaymentConfirmResponse = {
  attempt: PaymentAttemptResponse;
  order_id?: string | null;
  order_access_token?: string | null;
  refunded_oversell: boolean;
};

export type OrderItem = {
  id: string;
  cart_item_id: string;
  item_type: string;
  publication_id?: string | null;
  publication_slug?: string | null;
  design_variant_id?: string | null;
  garment_type: string;
  garment_model: string;
  color: string;
  size: string;
  grammage_g: number;
  fit: string;
  quantity: number;
  unit_price_mxn: number;
  drop_id?: string | null;
  drop_total_limit?: number | null;
  snapshot: Record<string, unknown>;
  created_at: string;
};

export type OrderResponse = {
  id: string;
  checkout_session_id: string;
  payment_attempt_id: string;
  payment_reference: string;
  email: string;
  phone: string;
  shipping_method: "local" | "national" | string;
  shipping_cost_mxn: number;
  subtotal_mxn: number;
  total_mxn: number;
  currency: string;
  address: Record<string, unknown>;
  status: string;
  tracking_number?: string | null;
  tracking_carrier?: string | null;
  tracking_url?: string | null;
  shipping_label_url?: string | null;
  drop_id?: string | null;
  drop_number?: number | null;
  drop_total_limit?: number | null;
  drop_label?: string | null;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
};

export type OrderLookupResponse = {
  id: string;
  status: string;
  shipping_method: string;
  order_code: string;
};

export type LocalAddressPayload = {
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country?: string | null;
  reference?: string | null;
};

export async function createCartSession(input: {
  guest_session_id?: string;
  account_id?: string;
}) {
  return requestJson<CartSessionResponse>(buildUrl("/cart/sessions"), {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getCartSession(cartId: string) {
  return requestJson<CartSessionResponse>(
    buildUrl(`/cart/sessions/${encodeURIComponent(cartId)}`),
    { method: "GET" }
  );
}

export async function addPredesignedCartItem(
  cartId: string,
  input: {
    publication_slug: string;
    publication_id?: string;
    design_variant_id?: string;
    garment_type: string;
    garment_model?: string;
    color: string;
    size: string;
    grammage_g: number;
    fit?: string;
    quantity: number;
    unit_price_mxn?: number;
    meta?: Record<string, unknown>;
  }
) {
  return requestJson<CartSessionResponse>(
    buildUrl(`/cart/sessions/${encodeURIComponent(cartId)}/items/predesigned`),
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );
}

export async function addCustomizedCartItem(
  cartId: string,
  input: {
    garment_type: string;
    garment_model?: string;
    color: string;
    size: string;
    grammage_g: number;
    fit?: string;
    quantity: number;
    unit_price_mxn: number;
    front_assets: CustomizerPlacementPayload[];
    back_assets: CustomizerPlacementPayload[];
    note?: string;
    improve_quality?: boolean;
    meta?: Record<string, unknown>;
  }
) {
  return requestJson<CartSessionResponse>(
    buildUrl(`/cart/sessions/${encodeURIComponent(cartId)}/items/customized`),
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );
}

export async function removeCartItem(cartId: string, itemId: string) {
  return requestJson<CartSessionResponse>(
    buildUrl(
      `/cart/sessions/${encodeURIComponent(cartId)}/items/${encodeURIComponent(itemId)}`
    ),
    {
      method: "DELETE",
    }
  );
}

export async function createCheckoutSession(input: {
  cart_id: string;
  email: string;
  phone: string;
  address: CheckoutAddress;
  selected_quote_id?: string;
}) {
  return requestJson<CheckoutSessionResponse>(buildUrl("/checkout/sessions"), {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getCheckoutSession(checkoutId: string) {
  return requestJson<CheckoutSessionResponse>(
    buildUrl(`/checkout/sessions/${encodeURIComponent(checkoutId)}`),
    { method: "GET" }
  );
}

export async function selectCheckoutShippingQuote(
  checkoutId: string,
  quoteId: string
) {
  return requestJson<CheckoutSessionResponse>(
    buildUrl(
      `/checkout/sessions/${encodeURIComponent(checkoutId)}/shipping/select`
    ),
    {
      method: "POST",
      body: JSON.stringify({ quote_id: quoteId }),
    }
  );
}

export async function createPaymentAttempt(
  checkoutSessionId: string,
  input?: { return_origin?: string }
) {
  return requestJson<PaymentAttemptResponse>(buildUrl("/payments/attempts"), {
    method: "POST",
    body: JSON.stringify({
      checkout_session_id: checkoutSessionId,
      return_origin: input?.return_origin,
    }),
  });
}

export async function getPaymentAttempt(attemptId: string) {
  return requestJson<PaymentAttemptResponse>(
    buildUrl(`/payments/attempts/${encodeURIComponent(attemptId)}`),
    { method: "GET" }
  );
}

export async function confirmPaymentAttempt(attemptId: string) {
  return requestJson<PaymentConfirmResponse>(
    buildUrl(`/payments/attempts/${encodeURIComponent(attemptId)}/confirm`),
    {
      method: "POST",
      body: JSON.stringify({}),
    }
  );
}

export async function cancelPaymentAttempt(attemptId: string) {
  return requestJson<PaymentAttemptResponse>(
    buildUrl(`/payments/attempts/${encodeURIComponent(attemptId)}/cancel`),
    {
      method: "POST",
      body: JSON.stringify({}),
    }
  );
}

function orderAccessHeaders(orderAccessToken?: string | null): HeadersInit | undefined {
  return orderAccessToken ? { "x-order-access-token": orderAccessToken } : undefined;
}

export async function getOrder(orderId: string, orderAccessToken?: string | null) {
  return requestJson<OrderResponse>(`/api/orders/${encodeURIComponent(orderId)}`, {
    method: "GET",
    headers: orderAccessHeaders(orderAccessToken),
  });
}

export async function getOrderByCheckout(checkoutId: string, orderAccessToken?: string | null) {
  return requestJson<OrderResponse>(
    `/api/orders/by-checkout/${encodeURIComponent(checkoutId)}`,
    { method: "GET", headers: orderAccessHeaders(orderAccessToken) }
  );
}

export async function lookupOrderByCode(input: { email: string; order_code: string }) {
  return requestJson<OrderLookupResponse>(
    `/api/orders/lookup?${new URLSearchParams({
      email: input.email,
      order_code: input.order_code,
    }).toString()}`,
    {
      method: "GET",
    }
  );
}

export async function updateLocalOrderAddress(
  orderId: string,
  input: { address: LocalAddressPayload; reason?: string },
  orderAccessToken?: string | null
) {
  return requestJson<{
    order_id: string;
    address: LocalAddressPayload;
    shipment?: Record<string, unknown> | null;
  }>(`/api/orders/${encodeURIComponent(orderId)}/address`, {
    method: "PATCH",
    body: JSON.stringify(input),
    headers: orderAccessHeaders(orderAccessToken),
  });
}
