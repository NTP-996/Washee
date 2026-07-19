/* washee — POST /api/book  (Vercel Serverless Function)
 *
 * Receives a booking from /booking and forwards it to the ops Telegram group.
 * The bot token lives ONLY here, as a server-side env var — the browser never sees it.
 *
 * Env (set in Vercel → Project → Settings → Environment Variables, or landing/.env for
 * local `vercel dev`):
 *   WASHEE_BOT_TOKEN   BotFather HTTP API token
 *   WASHEE_CHAT_ID     destination chat id (the "Washee" ops group)
 */

// Ops-facing wash labels — always native VND, whatever currency the customer viewed.
const TIERS = {
  glow: "Glow (250k₫)",
  plus: "Glow Plus (400k₫)",
};

// ESM (package.json has "type": "module"): export default, not module.exports.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  const token = process.env.WASHEE_BOT_TOKEN;
  const chatId = process.env.WASHEE_CHAT_ID;
  if (!token || !chatId) {
    return res.status(500).json({ ok: false, error: "not_configured" });
  }

  // Vercel parses a JSON body automatically; guard in case it arrives as a string.
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body && typeof body === "object" ? body : {};

  const phone = String(body.phone || "").trim();
  const address = String(body.address || "").trim();
  const lang = String(body.lang || "en").toLowerCase() === "vi" ? "VI" : "EN";
  const digits = phone.replace(/[\s+\-().]/g, "");
  if (!/^[0-9]{6,}$/.test(digits) || !address) {
    return res.status(400).json({ ok: false, error: "invalid_input" });
  }

  const washLine = TIERS[body.tier] ? `🧼 Wash: ${TIERS[body.tier]}\n` : "";
  const when = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  // Plain text (no parse_mode): a free-form address can never break Telegram's parser.
  const text =
    `🚿 New washee booking\n` +
    washLine +
    `📞 Phone: ${phone}\n` +
    `📍 Address: ${address}\n` +
    `🗣 Language: ${lang}\n` +
    `🕒 ${when} (Asia/Ho_Chi_Minh)`;

  try {
    const tg = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    });
    const json = await tg.json().catch(() => ({}));
    if (tg.ok && json.ok) return res.status(200).json({ ok: true });
    return res.status(502).json({ ok: false, error: json.description || `telegram_${tg.status}` });
  } catch {
    return res.status(502).json({ ok: false, error: "telegram_unreachable" });
  }
}
