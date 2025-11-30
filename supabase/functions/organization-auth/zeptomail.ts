const BASE_URL = "https://api.zeptomail.com/v1.1";
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
function mapRecipient(input) {
  if (typeof input === "string") {
    return {
      email_address: {
        address: input
      }
    };
  }
  return {
    email_address: {
      address: input.email,
      name: input.name
    }
  };
}
function normalizeRecipients(value) {
  if (!value) return undefined;
  const list = Array.isArray(value) ? value : [
    value
  ];
  if (!list.length) return undefined;
  return list.map(mapRecipient);
}
function mapReplyRecipient(input) {
  if (typeof input === "string") {
    return {
      address: input
    };
  }
  return {
    address: input.email,
    name: input.name
  };
}
function normalizeReplyRecipients(value) {
  if (!value) return undefined;
  const list = Array.isArray(value) ? value : [
    value
  ];
  if (!list.length) return undefined;
  return list.map(mapReplyRecipient);
}
function buildFrom(fromEmail, fromName) {
  return {
    address: fromEmail ?? DEFAULT_FROM_EMAIL,
    name: fromName ?? DEFAULT_FROM_NAME
  };
}
async function callZeptoMail(path, payload) {
  requireZeptoConfig();
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
  const parsed = text ? JSON.parse(text) : undefined;
  if (!response.ok) {
    const message = parsed?.message ?? parsed?.error ?? response.statusText;
    throw new Error(`ZeptoMail error ${response.status}: ${message}`);
  }
  return parsed;
}
export async function sendHtmlEmail(options) {
  if (!options.subject || !options.html) {
    throw new Error("subject and html are required for HTML email");
  }
  const payload = {
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
export async function sendTemplateEmail(options) {
  if (!options.templateKey) {
    throw new Error("templateKey is required");
  }
  const payload = {
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
  return await callZeptoMail("/email/template", payload);
}
