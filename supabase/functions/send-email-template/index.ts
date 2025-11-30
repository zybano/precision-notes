import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
type Recipient = {
  email: string;
  name?: string;
};

type RecipientInput = string | Recipient;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const body = await parseJson(req);
    if (!body) {
      return jsonResponse({ error: "Invalid JSON payload" }, 400);
    }

    const {
      to,
      templateKey,
      parameters,
      mergeInfo,
      merge_info,
      subject,
      fromEmail,
      fromName,
      cc,
      bcc,
      replyTo,
      bounceAddress,
      clientReference,
      mimeHeaders
    } = body;

    if (!to || !templateKey) {
      return jsonResponse({ error: "'to' and 'templateKey' are required" }, 400);
    }

    const mergePayload = parameters ?? mergeInfo ?? merge_info;

    const result = await sendTemplateEmail({
      to: to as RecipientInput | RecipientInput[],
      templateKey,
      parameters: mergePayload,
      subject,
      fromEmail,
      fromName,
      cc,
      bcc,
      replyTo,
      bounceAddress,
      clientReference,
      mimeHeaders
    });

    return jsonResponse({ success: true, result });
  } catch (error) {
    console.error("send-email-template error", error);
    return jsonResponse({ error: error?.message ?? String(error) }, 500);
  }
});

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}

async function parseJson(req: Request) {
  try {
    return await req.json();
  } catch (_error) {
    return null;
  }
}

const BASE_URL =  "https://api.zeptomail.com/v1.1";
const API_TOKEN = Deno.env.get("ZEPTOMAIL_API_TOKEN") ?? Deno.env.get("ZEPTOMAIL_TOKEN");
const DEFAULT_FROM_EMAIL = Deno.env.get("ZEPTOMAIL_FROM_EMAIL");
const DEFAULT_FROM_NAME = Deno.env.get("ZEPTOMAIL_FROM_NAME") ?? "Precision Notes";

async function sendTemplateEmail(options: {
  to: RecipientInput | RecipientInput[];
  templateKey: string;
  subject?: string;
  parameters?: Record<string, unknown>;
  fromEmail?: string;
  fromName?: string;
  cc?: RecipientInput[];
  bcc?: RecipientInput[];
  replyTo?: RecipientInput | RecipientInput[];
  bounceAddress?: string;
  clientReference?: string;
  mimeHeaders?: Record<string, string>;
}) {
  if (!API_TOKEN || !DEFAULT_FROM_EMAIL) {
    throw new Error("ZeptoMail environment variables not configured");
  }

  const payload: Record<string, unknown> = {
    from: buildFrom(options.fromEmail, options.fromName),
    to: normalizeRecipients(options.to),
    mail_template_key: options.templateKey,
    merge_info: options.parameters ?? {}
  };

  if (!payload.to?.length) {
    throw new Error("At least one recipient is required");
  }

  if (options.subject) {
    payload.subject = options.subject;
  }

  const cc = normalizeRecipients(options.cc);
  if (cc) payload.cc = cc;
  const bcc = normalizeRecipients(options.bcc);
  if (bcc) payload.bcc = bcc;
  const replyTo = normalizeReplyRecipients(options.replyTo);
  if (replyTo) payload.reply_to = replyTo;
  if (options.bounceAddress) payload.bounce_address = options.bounceAddress;
  if (options.clientReference) payload.client_reference = options.clientReference;
  if (options.mimeHeaders) payload.mime_headers = options.mimeHeaders;

  return callZeptoMail("/email/template", payload);
}

function mapRecipient(input: RecipientInput): { email_address: { address: string; name?: string } } {
  if (typeof input === "string") {
    return { email_address: { address: input } };
  }
  return { email_address: { address: input.email, name: input.name } };
}

function normalizeRecipients(value: RecipientInput | RecipientInput[] | undefined) {
  if (!value) return undefined;
  const list = Array.isArray(value) ? value : [value];
  if (!list.length) return undefined;
  return list.map(mapRecipient);
}

function mapReplyRecipient(input: RecipientInput): { address: string; name?: string } {
  if (typeof input === "string") {
    return { address: input };
  }
  return { address: input.email, name: input.name };
}

function normalizeReplyRecipients(value: RecipientInput | RecipientInput[] | undefined) {
  if (!value) return undefined;
  const list = Array.isArray(value) ? value : [value];
  if (!list.length) return undefined;
  return list.map(mapReplyRecipient);
}

function buildFrom(fromEmail?: string, fromName?: string) {
  return {
    address: fromEmail ?? DEFAULT_FROM_EMAIL!,
    name: fromName ?? DEFAULT_FROM_NAME
  };
}

async function callZeptoMail(path: string, payload: Record<string, unknown>) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Authorization": API_TOKEN,
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  let parsed: any = undefined;
  if (text && text.trim().length > 0) {
    try {
      parsed = JSON.parse(text);
    } catch (_error) {
      parsed = undefined;
    }
  }

  if (!response.ok) {
    const message = parsed?.message ?? parsed?.error ?? response.statusText ?? text;
    console.error("send-email-template ZeptoMail failure", {
      path,
      status: response.status,
      payload,
      responseBody: text
    });
    throw new Error(`ZeptoMail error ${response.status}: ${message}`);
  }

  return parsed;
}
