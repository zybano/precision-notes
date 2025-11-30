export type Recipient = {
  email: string;
  name?: string;
};

export type RecipientInput = string | Recipient;

interface BaseEmailOptions {
  to: RecipientInput | RecipientInput[];
  fromEmail?: string;
  fromName?: string;
  cc?: RecipientInput[];
  bcc?: RecipientInput[];
  replyTo?: RecipientInput | RecipientInput[];
  bounceAddress?: string;
  clientReference?: string;
  mimeHeaders?: Record<string, string>;
}

interface HtmlEmailOptions extends BaseEmailOptions {
  subject: string;
  html: string;
}

interface TemplateEmailOptions extends BaseEmailOptions {
  templateKey: string;
  subject?: string;
  parameters?: Record<string, unknown>;
}

const BASE_URL = Deno.env.get("ZEPTOMAIL_BASE_URL")?.replace(/\/$/, "") ?? "https://api.zeptomail.com/v1.1";
const API_TOKEN = Deno.env.get("ZEPTOMAIL_API_TOKEN") ?? Deno.env.get("ZEPTOMAIL_TOKEN");
const DEFAULT_FROM_EMAIL = Deno.env.get("ZEPTOMAIL_FROM_EMAIL");
const DEFAULT_FROM_NAME = Deno.env.get("ZEPTOMAIL_FROM_NAME") ?? "Precision Notes";

function requireZeptoConfig() {
  if (!API_TOKEN) {
    throw new Error("ZEPTOMAIL_API_TOKEN is not configured");
  }
  if (!DEFAULT_FROM_EMAIL) {
    throw new Error("ZEPTOMAIL_FROM_EMAIL is not configured");
  }
}

function mapRecipient(input: RecipientInput): { email_address: { address: string; name?: string } } {
  if (typeof input === "string") {
    return { email_address: { address: input } };
  }
  return {
    email_address: {
      address: input.email,
      name: input.name
    }
  };
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
  requireZeptoConfig();

  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Authorization": `Zoho-enczapikey ${API_TOKEN}`,
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify(payload)
  });

  let parsed: any = undefined;
  const text = await response.text();
  if (text && text.trim().length > 0) {
    try {
      parsed = JSON.parse(text);
    } catch (_error) {
      parsed = undefined;
    }
  }

  if (!response.ok) {
    const message = parsed?.message ?? parsed?.error ?? response.statusText ?? text;
    console.error("ZeptoMail request failed", {
      path,
      status: response.status,
      payload,
      responseBody: text
    });
    throw new Error(`ZeptoMail error ${response.status}: ${message}`);
  }

  return parsed;
}

export async function sendHtmlEmail(options: HtmlEmailOptions) {
  if (!options.subject || !options.html) {
    throw new Error("subject and html are required for HTML email");
  }

  const payload: Record<string, unknown> = {
    from: buildFrom(options.fromEmail, options.fromName),
    to: normalizeRecipients(options.to),
    subject: options.subject,
    htmlbody: options.html
  };

  if (!payload.to?.length) {
    throw new Error("At least one recipient is required");
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

  return await callZeptoMail("/email", payload);
}

export async function sendTemplateEmail(options: TemplateEmailOptions) {
  if (!options.templateKey) {
    throw new Error("templateKey is required");
  }

  const payload: Record<string, unknown> = {
    from: buildFrom(options.fromEmail, options.fromName),
    to: normalizeRecipients(options.to),
    template_key: options.templateKey,
    merge_info: options.parameters ?? {},
    mail_format: "plaintext"
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

  return await callZeptoMail("/email/template", payload);
}
