type NewsletterPayload = {
  email?: unknown;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getEmail(payload: NewsletterPayload): string | null {
  if (typeof payload.email !== "string") return null;
  const email = payload.email.trim().toLowerCase();
  return EMAIL_PATTERN.test(email) ? email : null;
}

async function forwardToWebhook(email: string): Promise<boolean> {
  const webhookUrl = process.env.NEWSLETTER_WEBHOOK_URL?.trim();
  if (!webhookUrl) return false;

  const token = process.env.NEWSLETTER_WEBHOOK_TOKEN?.trim();
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      email,
      source: "saut-web",
      subscribed_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error(`Newsletter webhook failed (${response.status})`);
  }

  return true;
}

export async function POST(request: Request) {
  let payload: NewsletterPayload;

  try {
    payload = (await request.json()) as NewsletterPayload;
  } catch {
    return Response.json({ message: "Solicitud inválida." }, { status: 400 });
  }

  const email = getEmail(payload);
  if (!email) {
    return Response.json(
      { message: "Escribe un correo válido." },
      { status: 400 }
    );
  }

  try {
    const forwarded = await forwardToWebhook(email);
    return Response.json({ ok: true, forwarded }, { status: 202 });
  } catch {
    return Response.json(
      { message: "No se pudo registrar el correo. Inténtalo de nuevo." },
      { status: 502 }
    );
  }
}
