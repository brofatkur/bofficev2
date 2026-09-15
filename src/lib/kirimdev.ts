import { AppSettings, WhatsAppLog } from './types';
import { getSettings, addWhatsAppLog } from './data-store';

export interface SendWAMessageParams {
  to: string;
  message: string;
  messageType?: WhatsAppLog['messageType'];
}

export function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '+62' + cleaned.substring(1);
  } else if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  return cleaned;
}

export async function sendWhatsAppMessage({
  to,
  message,
  messageType = 'custom',
}: SendWAMessageParams): Promise<{ success: boolean; log: WhatsAppLog; response?: any; error?: string }> {
  const settings: AppSettings = await getSettings();
  const formattedPhone = formatPhoneNumber(to);

  const apiKey = settings.kirimdevApiKey?.trim();
  const phoneNumberId = settings.kirimdevPhoneNumberId?.trim();

  // If KirimDev API is not configured or in test mode, we simulate clean sending & log it!
  const isConfigured = Boolean(apiKey && phoneNumberId && apiKey !== 'kdv_live_sample');

  if (!isConfigured) {
    const simulatedLog: WhatsAppLog = {
      id: 'wa_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      recipient: formattedPhone,
      messageType,
      content: message,
      status: 'simulated',
      sentAt: new Date().toISOString(),
    };
    await addWhatsAppLog(simulatedLog);
    return {
      success: true,
      log: simulatedLog,
      error: 'Simulasi Pengiriman (API Key/Phone Number ID KirimDev belum diisi di Pengaturan)',
    };
  }

  try {
    const url = `https://api.kirimdev.com/v1/${phoneNumberId}/messages`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: { body: message },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const errorMsg = data?.error?.message || data?.message || 'Gagal mengirim pesan via KirimDev API';
      const failedLog: WhatsAppLog = {
        id: 'wa_' + Date.now(),
        recipient: formattedPhone,
        messageType,
        content: message,
        status: 'failed',
        sentAt: new Date().toISOString(),
        error: errorMsg,
      };
      await addWhatsAppLog(failedLog);
      return { success: false, log: failedLog, error: errorMsg, response: data };
    }

    const successLog: WhatsAppLog = {
      id: 'wa_' + Date.now(),
      recipient: formattedPhone,
      messageType,
      content: message,
      status: 'sent',
      sentAt: new Date().toISOString(),
    };
    await addWhatsAppLog(successLog);

    return { success: true, log: successLog, response: data };
  } catch (err: any) {
    const errorLog: WhatsAppLog = {
      id: 'wa_' + Date.now(),
      recipient: formattedPhone,
      messageType,
      content: message,
      status: 'failed',
      sentAt: new Date().toISOString(),
      error: err.message || 'Koneksi API Gagal',
    };
    await addWhatsAppLog(errorLog);
    return { success: false, log: errorLog, error: err.message };
  }
}
