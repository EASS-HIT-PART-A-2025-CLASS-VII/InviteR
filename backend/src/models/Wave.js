const mongoose = require('mongoose');

const waveSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    type: {
        type: String,
        enum: ['sms', 'whatsapp', 'phone'],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    scheduledDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'sent', 'failed'],
        default: 'pending'
    },
    sentAt: {
        type: Date
    },
    results: [{
        guestId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Guest'
        },
        name: String,
        phone: String,
        success: Boolean,
        error: String
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Wave', waveSchema); 