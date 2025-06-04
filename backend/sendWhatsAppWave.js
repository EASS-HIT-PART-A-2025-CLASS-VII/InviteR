// WhatsApp Web automation script
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { headless: true }
});

client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
  console.log('Scan the QR code above with your WhatsApp app.');
});

client.on('ready', () => {
  console.log('WhatsApp client is ready!');
});

client.on('auth_failure', (msg) => {
  console.error('AUTHENTICATION FAILURE', msg);
});

client.on('disconnected', (reason) => {
  console.log('Client was logged out', reason);
});

client.initialize();

// recipients: array of phone numbers (strings, in international format, e.g. 972501234567)
// message: string
export async function sendWaveMessages(recipients, message) {
  if (!Array.isArray(recipients) || recipients.length === 0) {
    console.log('No recipients to send to.');
    return;
  }
  for (const phone of recipients) {
    const chatId = phone.includes('@c.us') ? phone : `${phone}@c.us`;
    try {
      await client.sendMessage(chatId, message);
      console.log(`Message sent to ${phone}`);
    } catch (err) {
      console.error(`Failed to send message to ${phone}:`, err);
    }
  }
} 