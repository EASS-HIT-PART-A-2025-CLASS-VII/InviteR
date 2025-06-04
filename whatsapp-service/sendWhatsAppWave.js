import express from 'express';
import cors from 'cors';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

// Clean up Chromium profile directory
const profileDir = '/tmp/whatsapp-session';
if (fs.existsSync(profileDir)) {
    fs.rmSync(profileDir, { recursive: true, force: true });
}
fs.mkdirSync(profileDir, { recursive: true });

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: profileDir
    }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    }
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

// POST /send-message { recipients: [phones], message: string }
app.post('/send-message', async (req, res) => {
    const { recipients, message } = req.body;
    if (!Array.isArray(recipients) || recipients.length === 0 || !message) {
        return res.status(400).json({ error: 'recipients and message required' });
    }
    const results = [];
    for (const phone of recipients) {
        const chatId = phone.includes('@c.us') ? phone : `${phone}@c.us`;
        try {
            await client.sendMessage(chatId, message);
            results.push({ phone, success: true });
        } catch (err) {
            results.push({ phone, success: false, error: err.message });
        }
    }
    res.json({ results });
});

// POST /send-otp { phone, otp }
app.post('/send-otp', async (req, res) => {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ error: 'phone and otp required' });
    const chatId = phone.includes('@c.us') ? phone : `${phone}@c.us`;
    const message = `קוד הכניסה שלך ל-InviteR הוא: ${otp}`;
    try {
        await client.sendMessage(chatId, message);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /send-wave { guests: [{phone, name, ...}], message: string, event: {date, location, groomName, brideName, groomPhone, bridePhone, wazeLink, payboxLink, bitLink} }
app.post('/send-wave', async (req, res) => {
    const { guests, message, event } = req.body;
    if (!Array.isArray(guests) || guests.length === 0 || !message || !event) {
        return res.status(400).json({ error: 'guests, message, and event required' });
    }
    const results = [];
    for (const guest of guests) {
        const phone = guest.phone;
        const chatId = phone.includes('@c.us') ? phone : `${phone}@c.us`;
        let personalized = replaceVariables(message, guest, event);
        try {
            await client.sendMessage(chatId, personalized);
            results.push({ phone, success: true });
        } catch (err) {
            results.push({ phone, success: false, error: err.message });
        }
    }
    res.json({ results });
});

const PORT = process.env.PORT || 5010;
app.listen(PORT, () => {
    console.log(`WhatsApp service running on port ${PORT}`);
});

// Function to replace dynamic variables in message
const replaceVariables = (message, guest, event) => {
    return message
        .replace(/\{Name\}/g, guest.name || '')
        .replace(/\{Table\}/g, guest.table || '')
        .replace(/\{EventDate\}/g, event.date || '')
        .replace(/\{EventLocation\}/g, event.location || '')
        .replace(/\{GroomName\}/g, event.groomName || '')
        .replace(/\{BrideName\}/g, event.brideName || '')
        .replace(/\{GroomPhone\}/g, event.groomPhone || '')
        .replace(/\{BridePhone\}/g, event.bridePhone || '')
        .replace(/\{WazeLink\}/g, event.wazeLink || '')
        .replace(/\{PayboxLink\}/g, event.payboxLink || '')
        .replace(/\{BitLink\}/g, event.bitLink || '');
};

// Function to send WhatsApp message
const sendWhatsAppMessage = async (phoneNumber, message) => {
    try {
        // Format phone number (remove any non-numeric characters and add country code if needed)
        const formattedNumber = phoneNumber.replace(/\D/g, '');
        const chatId = `${formattedNumber}@c.us`;
        
        // Send message
        await client.sendMessage(chatId, message);
        return true;
    } catch (error) {
        console.error(`Error sending message to ${phoneNumber}:`, error);
        return false;
    }
};

// Main function to send wave
const sendWave = async (waveId, eventId) => {
    try {
        // Get wave and event details
        const wave = await Wave.findById(waveId);
        const event = await Event.findById(eventId);
        
        if (!wave || !event) {
            throw new Error('Wave or event not found');
        }

        // Get all guests for the event
        const guests = await Guest.find({ eventId });

        // Send messages to each guest
        const results = await Promise.all(
            guests.map(async (guest) => {
                // Replace variables in message
                const personalizedMessage = replaceVariables(wave.message, guest, event);
                
                // Send message
                const success = await sendWhatsAppMessage(guest.phone, personalizedMessage);
                
                return {
                    guestId: guest._id,
                    name: guest.name,
                    phone: guest.phone,
                    success
                };
            })
        );

        // Update wave status
        wave.status = 'sent';
        wave.sentAt = new Date();
        wave.results = results;
        await wave.save();

        return {
            success: true,
            totalGuests: guests.length,
            successfulSends: results.filter(r => r.success).length,
            failedSends: results.filter(r => !r.success).length,
            results
        };
    } catch (error) {
        console.error('Error sending wave:', error);
        throw error;
    }
}; 