const ORDER_BOT_TOKEN = process.env.TELEGRAM_ORDER_BOT_TOKEN;
const ALERT_BOT_TOKEN = process.env.TELEGRAM_ALERT_BOT_TOKEN;

// New specific chat IDs, falling back to old one for backward compat
const ORDER_CHAT_ID = process.env.TELEGRAM_ORDER_CHAT_ID || process.env.TELEGRAM_CHAT_ID;
const DELIVERY_CHAT_ID = process.env.TELEGRAM_DELIVERY_CHAT_ID || process.env.TELEGRAM_CHAT_ID;

/**
 * Sends a message via Telegram Bot API.
 * @param text - The message content to send.
 * @param type - The type of notification ('order' or 'alert').
 */
async function sendTelegramMessage(text: string, type: 'order' | 'alert' = 'order') {
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
        parse_mode: 'HTML' // Changed to HTML for consistent <b> formatting
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

/**
 * Service for handling Telegram notifications (Orders, Alerts, Sync Status).
 */
export const TelegramService = {
  // Keep raw access if needed
  send: sendTelegramMessage,

  /**
   * Notify that a sync operation has started.
   * @param count - Estimated number of items to sync.
   * @param syncId - Unique identifier for this sync job.
   */
  async notifySyncStart(count: number, syncId: string) {
    return sendTelegramMessage(
      `🔄 *Sync Started*\n` +
      `ID: \`${syncId.slice(0, 8)}\`\n` +
      `Items: ${count}\n` +
      `Time: ${new Date().toLocaleTimeString()}`,
      'alert'
    );
  },

  /**
   * Notify that a sync operation completed successfully.
   * @param syncId - Unique identifier for the sync job.
   * @param count - Number of items processed.
   */
  async notifySyncSuccess(syncId: string, count: number) {
    return sendTelegramMessage(
      `✅ *Sync Success*\n` +
      `ID: \`${syncId.slice(0, 8)}\`\n` +
      `Items: ${count}\n` +
      `Time: ${new Date().toLocaleTimeString()}`,
      'alert'
    );
  },

  /**
   * Notify that a sync operation failed.
   * @param syncId - Unique identifier for the sync job.
   * @param error - Error message or stack trace.
   */
  async notifySyncFail(syncId: string, error: string) {
    return sendTelegramMessage(
      `❌ *Sync Failed*\n` +
      `ID: \`${syncId.slice(0, 8)}\`\n` +
      `Error: \`${error}\`\n` +
      `Time: ${new Date().toLocaleTimeString()}`,
      'alert'
    );
  }
};

// Fallback for existing imports
export { sendTelegramMessage };