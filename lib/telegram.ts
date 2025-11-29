const ORDER_BOT_TOKEN = process.env.TELEGRAM_ORDER_BOT_TOKEN;
const ALERT_BOT_TOKEN = process.env.TELEGRAM_ALERT_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function sendTelegramMessage(text: string, type: 'order' | 'alert' = 'order') {
  if (!CHAT_ID) {
    console.error("Telegram Error: CHAT_ID is missing");
    return;
  }

  // 1. Pick the correct token
  const token = type === 'alert' ? ALERT_BOT_TOKEN : ORDER_BOT_TOKEN;

  if (!token) {
    console.error(`Telegram Error: No token found for type '${type}'`);
    return;
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: text,
        parse_mode: 'HTML'
      })
    });
  } catch (error) {
    console.error("Telegram Send Failed:", error);
  }
}