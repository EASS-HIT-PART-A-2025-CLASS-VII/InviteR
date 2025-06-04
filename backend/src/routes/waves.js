const express = require('express');
const router = express.Router();
const Wave = require('../models/Wave');
const { sendWave } = require('../scripts/sendWhatsAppWave');

// ... existing code ...

// Send wave immediately
router.post('/send/:waveId', async (req, res) => {
    try {
        const { waveId } = req.params;
        const { phone, eventId } = req.body;

        if (!phone || !eventId) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const result = await sendWave(waveId, eventId);
        res.json(result);
    } catch (error) {
        console.error('Error sending wave:', error);
        res.status(500).json({ message: 'Error sending wave', error: error.message });
    }
});

module.exports = router; 