const ORDER_BOT_TOKEN = process.env.TELEGRAM_ORDER_BOT_TOKEN;
const ALERT_BOT_TOKEN = process.env.TELEGRAM_ALERT_BOT_TOKEN;

// New specific chat IDs, falling back to old one for backward compat
const ORDER_CHAT_ID = process.env.TELEGRAM_ORDER_CHAT_ID || process.env.TELEGRAM_CHAT_ID;
const DELIVERY_CHAT_ID = process.env.TELEGRAM_DELIVERY_CHAT_ID || process.env.TELEGRAM_CHAT_ID;

export async function sendTelegramMessage(text: string, type: 'order' | 'alert' = 'order') {
  // 1. Pick the correct token & chat ID
  const isAlert = type === 'alert';
  const token = isAlert ? ALERT_BOT_TOKEN : ORDER_BOT_TOKEN;
  const chatId = isAlert ? DELIVERY_CHAT_ID : ORDER_CHAT_ID;

  if (!token) {
    console.error(`Telegram Error: No token found for type '${type}'`);
    return;
  }

  if (!chatId) {
    console.error(`Telegram Error: No Chat ID found for type '${type}'`);
    return;
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
      })
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Telegram API Error:", err);
    }

  } catch (error) {
    console.error("Telegram Send Failed:", error);
  }
}