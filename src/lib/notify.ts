import "server-only";
import nodemailer from "nodemailer";

/**
 * Telling the office that someone is asking about a property.
 *
 * An inquiry is already saved to Firestore by the form, so nothing here is
 * load-bearing: every function is best-effort, no-ops when unconfigured, and
 * swallows its own errors. A notification failing must never turn into a buyer
 * seeing an error on a form that actually worked.
 *
 * The point is speed. A buyer who fills in a form has usually opened four
 * other listings too, and whoever replies first gets the viewing. Waiting for
 * someone to remember to check the dashboard loses that race.
 */

const BRAND = "Lay Hama Homes";
const NAVY = "#15304A";
const GOLD = "#DFB250";

const esc = (s: unknown) =>
  String(s).replace(/[<>&]/g, (c) =>
    c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&amp;",
  );

/**
 * An Iraqi phone as a wa.me link. Buyers write their number every way there
 * is — 0750…, +964 750…, 964750… — and the owner should be able to tap once
 * rather than retype it into WhatsApp.
 */
function whatsappLink(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return null;
  const intl = digits.startsWith("00")
    ? digits.slice(2)
    : digits.startsWith("0")
      ? "964" + digits.slice(1)
      : digits.startsWith("964")
        ? digits
        : "964" + digits;
  return `https://wa.me/${intl}`;
}

/**
 * Pick the outgoing-mail transport. SMTP_HOST/USER/PASS point at Zoho so the
 * mail comes from info@homeskurdistan.com — the same address printed in the
 * footer — rather than from a personal Gmail. Returns null when unset, which
 * is the normal state in local development.
 */
function getMailer() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  const port = Number(process.env.SMTP_PORT) || 465;
  return {
    transporter: nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // 465 = SSL, 587 = STARTTLS
      auth: { user, pass },
    }),
    from: `"${BRAND}" <${user}>`,
  };
}

export interface InquiryNotice {
  propertyId: string;
  name: string;
  phone: string;
  message?: string;
  /** Human-readable title, when the page knew it — an id alone tells nobody
      which property is being asked about. */
  propertyTitle?: string;
  siteUrl: string;
}

/** Email to the office. Never throws. */
export async function notifyInquiry(q: InquiryNotice) {
  const mailer = getMailer();
  const to = process.env.NOTIFY_EMAIL || process.env.SMTP_USER;

  // Say why it was skipped — a missing env var on Vercel is otherwise silent,
  // and "the notifications stopped" is hard to diagnose after the fact.
  if (!mailer || !to) {
    console.warn(
      `[inquiry-email] skipped — sender:${mailer ? "set" : "missing"} recipient:${to ? "set" : "missing"}`,
    );
    return;
  }

  const wa = whatsappLink(q.phone);
  const link = `${q.siteUrl}/properties/${encodeURIComponent(q.propertyId)}`;
  const heading = q.propertyTitle || q.propertyId;

  const row = (label: string, value: string) =>
    `<tr>
      <td style="padding:11px 16px;color:#64748b;border-bottom:1px solid #eef2f7;font-size:14px;">${label}</td>
      <td style="padding:11px 16px;font-weight:600;color:#0f172a;border-bottom:1px solid #eef2f7;text-align:right;">${value}</td>
    </tr>`;

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#f1f5f9;padding:24px;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:${NAVY};padding:24px;text-align:center;">
        <div style="font-size:20px;font-weight:800;color:#ffffff;">${BRAND}</div>
        <div style="font-size:13px;color:${GOLD};letter-spacing:.5px;">نووسینگەی لای حەمە</div>
        <div style="font-size:18px;font-weight:700;color:${GOLD};margin-top:16px;">داواکاریی نوێ — New inquiry</div>
        <div style="color:#cbd5e1;font-size:15px;margin-top:4px;">${esc(heading)}</div>
      </div>
      <div style="padding:22px 24px;">
        <table style="width:100%;border-collapse:collapse;font-size:15px;">
          ${row("ناو / Name", esc(q.name))}
          ${row("تەلەفۆن / Phone", `<a href="tel:${esc(q.phone)}" style="color:${NAVY};text-decoration:none;">${esc(q.phone)}</a>`)}
        </table>

        ${
          q.message
            ? `<p style="margin:18px 0 6px;color:#64748b;font-size:13px;">نامە / Message</p>
               <div style="padding:14px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;white-space:pre-wrap;font-size:15px;color:#0f172a;">${esc(q.message)}</div>`
            : ""
        }

        <div style="margin-top:22px;text-align:center;">
          ${
            wa
              ? `<a href="${wa}" style="display:inline-block;background:#25D366;color:#ffffff;text-decoration:none;font-weight:700;padding:13px 26px;border-radius:12px;font-size:15px;">وەڵام بدەرەوە لە WhatsApp</a>`
              : ""
          }
          <div style="margin-top:12px;">
            <a href="${link}" style="color:${NAVY};font-size:14px;">بینینی خانووەکە / View the property</a>
          </div>
        </div>

        <div style="margin-top:20px;padding:14px 16px;background:#fffbeb;border:1px solid #fde68a;border-radius:12px;color:#92400e;font-size:13px;line-height:1.6;">
          ⚡ زوو وەڵام بدەرەوە — کڕیار بەزۆری چەند خانوویەکی تر داوا دەکات، و ئەوەی یەکەم وەڵام دەداتەوە بینینەکە دەباتەوە.
        </div>
      </div>
      <div style="background:#f1f5f9;padding:14px;text-align:center;color:#94a3b8;font-size:12px;">
        ${BRAND} — homes.layhama.com
      </div>
    </div>
  </div>`;

  try {
    await mailer.transporter.sendMail({
      from: mailer.from,
      to,
      // The name and number in the subject, so the phone's lock screen alone
      // is enough to decide whether to stop what you're doing.
      subject: `داواکاریی نوێ — ${q.name} (${q.phone})`,
      replyTo: undefined,
      html,
    });
    console.log(`[inquiry-email] sent to ${to}`);
  } catch (e) {
    console.error(
      `[inquiry-email] send failed: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
}

/** Telegram, for whoever wants it faster than email. Never throws. */
export async function notifyInquiryTelegram(q: InquiryNotice) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const wa = whatsappLink(q.phone);
  const text =
    `🏡 <b>داواکاریی نوێ — New inquiry</b>\n\n` +
    `<b>خانوو / Property:</b> ${esc(q.propertyTitle || q.propertyId)}\n` +
    `<b>ناو / Name:</b> ${esc(q.name)}\n` +
    `<b>تەلەفۆن / Phone:</b> ${esc(q.phone)}\n` +
    (q.message ? `\n${esc(q.message)}\n` : "") +
    (wa ? `\n${wa}` : "");

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
  } catch {
    /* best-effort */
  }
}
