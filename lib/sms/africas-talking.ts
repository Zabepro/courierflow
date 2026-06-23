export type SmsResult =
  | { success: true;  messageId: string; cost: string }
  | { success: false; error: string };

export async function sendSms(to: string, message: string): Promise<SmsResult> {
  const apiKey   = process.env.AT_API_KEY;
  const username = process.env.AT_USERNAME ?? "sandbox";
  const senderId = process.env.AT_SENDER_ID;

  if (!apiKey || apiKey === "REPLACE_ME") {
    console.warn("[SMS] AT_API_KEY not configured — skipping send");
    return { success: false, error: "AT_API_KEY not configured" };
  }

  const isSandbox = username === "sandbox";
  const url = isSandbox
    ? "https://api.sandbox.africastalking.com/version1/messaging"
    : "https://api.africastalking.com/version1/messaging";

  const body = new URLSearchParams({ username, to, message });
  /* Sandbox only — production sender IDs require TCRA registration in Tanzania */
  if (senderId && isSandbox) body.set("from", senderId);

  console.info(`[SMS] Sending to ${to} via ${isSandbox ? "sandbox" : "production"} (username=${username})`);

  try {
    const res = await fetch(url, {
      method:  "POST",
      headers: {
        apiKey,
        Accept:         "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const raw = await res.text();
    console.info(`[SMS] AT raw response (${res.status}): ${raw}`);

    type AtResponse = {
      SMSMessageData?: {
        Message?: string;
        Recipients?: Array<{
          messageId:  string;
          cost:       string;
          statusCode: number;
          status:     string;
          number:     string;
        }>;
      };
    };

    let data: AtResponse;
    try { data = JSON.parse(raw) as AtResponse; }
    catch { return { success: false, error: `Invalid JSON from AT: ${raw.slice(0, 200)}` }; }

    const recipient = data.SMSMessageData?.Recipients?.[0];

    if (!recipient) {
      const msg = data.SMSMessageData?.Message ?? "No recipients in response";
      console.error(`[SMS] No recipient in AT response: ${msg}`);
      return { success: false, error: msg };
    }

    console.info(`[SMS] Recipient: status=${recipient.status} statusCode=${recipient.statusCode} cost=${recipient.cost}`);

    /* statusCode 100 = Processed, 101 = Sent (both are success) */
    const ok =
      recipient.statusCode === 100 ||
      recipient.statusCode === 101 ||
      recipient.status === "Success";

    if (ok) {
      return { success: true, messageId: recipient.messageId, cost: recipient.cost };
    }

    return { success: false, error: `AT rejected: ${recipient.status} (code ${recipient.statusCode})` };
  } catch (e) {
    const err = e instanceof Error ? e.message : "Network error";
    console.error(`[SMS] Fetch error: ${err}`);
    return { success: false, error: err };
  }
}
