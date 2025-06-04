const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const mongoose = require('mongoose');
const Guest = require('../models/Guest');
const Wave = require('../models/Wave');
const Event = require('../models/Event');

// Initialize WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox']
    }
});

// Generate QR code for WhatsApp Web
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('QR Code generated. Please scan with WhatsApp Web.');
});

// Handle client ready
client.on('ready', () => {
    console.log('WhatsApp client is ready!');
});

// Initialize client
client.initialize();

// Function to replace dynamic variables in message
const replaceVariables = (message, guest, event) => {
    return message
        .replace(/{Name}/g, guest.name)
        .replace(/{EventDate}/g, event.date)
        .replace(/{EventLocation}/g, event.location)
        .replace(/{GroomName}/g, event.groomName)
        .replace(/{BrideName}/g, event.brideName)
        .replace(/{GroomPhone}/g, event.groomPhone)
        .replace(/{BridePhone}/g, event.bridePhone);
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

module.exports = {
    sendWave,
    client
}; 