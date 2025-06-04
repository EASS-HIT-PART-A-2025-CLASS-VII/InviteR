import express from 'express';
import User from '../models/User.js';
import multer from 'multer';
import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import axios from 'axios';

const router = express.Router();

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Function to write to log file
const writeToLog = (waveId, eventId, logData, sendCount) => {
  const now = new Date();
  const pad = n => n.toString().padStart(2, '0');
  const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const logFileName = `Wave-${waveId}-${dateStr}-${timeStr}.txt`;
  const logPath = path.join(logsDir, logFileName);
  
  const logContent = `=== Wave Sending Log ===\n
Timestamp: ${now.toLocaleString('he-IL')}\n+ Wave ID: ${waveId}\n+ Event ID: ${eventId}\n+ \n+ Wave Details:\n+ ${JSON.stringify(logData.waveDetails, null, 2)}\n+ \n+ Sending Results:\n+ ${logData.results}\n+ \n+ Failed Attempts:\n+ ${logData.failedAttempts.length > 0 ? logData.failedAttempts.join('\\n') : 'None'}\n+ \n+ Skipped Guests (Already Responded):\n+ ${logData.skippedGuests.length > 0 ? logData.skippedGuests.join('\\n') : 'None'}\n+ \n+ Send Count: ${sendCount}\n+ `;
  
  fs.writeFileSync(logPath, logContent);
  return logPath;
};

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed!'), false);
    }
  }
});

// Add a new guest
router.post('/', async (req, res) => {
  try {
    console.log('=== Received request to add guest ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    const { phoneNumber, eventId, guest } = req.body;

    if (!phoneNumber || !guest) {
      console.error('Missing required fields:', { phoneNumber, guest });
      return res.status(400).json({ message: 'Phone number and guest data are required' });
    }

    console.log('Looking for user with phone:', phoneNumber);
    const user = await User.findOne({ phoneNumber });
    if (!user) {
      console.error('User not found:', phoneNumber);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Found user:', {
      phoneNumber: user.phoneNumber,
      name: user.name,
      eventsCount: user.events?.length
    });

    if (!user.events || user.events.length === 0) {
      console.error('No events found for user:', phoneNumber);
      return res.status(404).json({ message: 'No event found' });
    }

    const event = user.events[0];
    console.log('Using event:', {
      id: event._id,
      name: event.name,
      currentGuestsCount: event.guests?.length
    });

    // Validate guest data
    if (!guest.name || !guest.phone) {
      console.error('Invalid guest data:', guest);
      return res.status(400).json({ message: 'Guest name and phone number are required' });
    }

    // Set default values for new guest
    const newGuest = {
      ...guest,
      status: 'טרם ענה',
      quantity: guest.quantity || 1,
      confirmedQuantity: 0,
      wave: guest.wave || 0
    };

    console.log('Adding guest to event:', newGuest);
    // Add the new guest
    event.guests.push(newGuest);
    await user.save();

    console.log('Guest added successfully. Updated event:', {
      id: event._id,
      name: event.name,
      guestsCount: event.guests.length,
      lastGuest: event.guests[event.guests.length - 1]
    });

    res.json({
      message: 'Guest added successfully',
      event
    });
  } catch (error) {
    console.error('Error adding guest:', error);
    res.status(500).json({ message: 'Error adding guest' });
  }
});

// Import guests from Excel
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const user = await User.findOne({ phoneNumber });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Read Excel file
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(worksheet);

    // Process each row
    const newGuests = [];
    const errors = [];

    for (const row of data) {
      try {
        if (!row.name || !row.phone) {
          errors.push(`Row missing required fields: ${JSON.stringify(row)}`);
          continue;
        }

        const guest = {
          name: row.name,
          phone: row.phone,
          group: row.group || '',
          notes: row.notes || '',
          status: 'טרם ענה',
          quantity: row.quantity || 1,
          confirmedQuantity: 0
        };

        user.events[0].guests.push(guest);
        newGuests.push(guest);
      } catch (error) {
        errors.push(`Error processing row: ${JSON.stringify(row)}`);
      }
    }

    await user.save();

    res.json({
      message: 'Import completed',
      imported: newGuests.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error importing guests:', error);
    res.status(500).json({ message: 'Error importing guests' });
  }
});

// Update guest status
router.put('/status', async (req, res) => {
  try {
    const { phoneNumber, eventId, guestId, status } = req.body;

    // Validate status
    const validStatuses = ['טרם ענה', 'מגיע', 'לא מגיע', 'אולי', 'מספר לא תקין'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const event = user.events.id(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const guest = event.guests.id(guestId);
    if (!guest) {
      return res.status(404).json({ message: 'Guest not found' });
    }

    // Update guest status
    guest.status = status;
    
    // If status is 'מגיע', set confirmedQuantity to quantity
    // If status is not 'מגיע', set confirmedQuantity to 0
    guest.confirmedQuantity = status === 'מגיע' ? guest.quantity : 0;

    await user.save();
    res.json({ message: 'Guest status updated successfully', event });
  } catch (error) {
    console.error('Error updating guest status:', error);
    res.status(500).json({ message: 'Error updating guest status' });
  }
});

// Update guest quantity
router.put('/quantity', async (req, res) => {
  try {
    const { phoneNumber, eventId, guestId, quantity, confirmedQuantity } = req.body;

    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const event = user.events.id(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const guest = event.guests.id(guestId);
    if (!guest) {
      return res.status(404).json({ message: 'Guest not found' });
    }

    if (typeof quantity !== 'undefined') {
      guest.quantity = quantity;
    }
    if (typeof confirmedQuantity !== 'undefined') {
      guest.confirmedQuantity = confirmedQuantity;
      // If guest is marked as 'מגיע', send WhatsApp to user
      if (guest.status === 'מגיע' && user.receiveStatusUpdates === true) {
        let phone = user.phoneNumber.replace(/\D/g, '');
        if (phone.startsWith('0')) phone = '972' + phone.slice(1);
        const message = `${guest.name} מגיע - ${confirmedQuantity}`;
        try {
          await axios.post('http://inviter-whatsapp:5010/send-message', {
            recipients: [phone],
            message
          });
        } catch (err) {
          console.error('Failed to send WhatsApp confirmation to user:', err);
        }
      }
    }
    await user.save();

    res.json({ event });
  } catch (error) {
    console.error('Error updating guest quantity:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete guest
router.delete('/:guestId', async (req, res) => {
  try {
    const { phoneNumber, eventId } = req.query;
    const { guestId } = req.params;

    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const event = user.events.id(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    event.guests = event.guests.filter(guest => guest._id.toString() !== guestId);
    await user.save();

    res.json({ event });
  } catch (error) {
    console.error('Error deleting guest:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all guests
router.get('/', async (req, res) => {
  try {
    const { phoneNumber } = req.query;
    console.log('Fetching guests for user:', phoneNumber);

    if (!phoneNumber) {
      console.error('No phone number provided');
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const user = await User.findOne({ phoneNumber });
    if (!user) {
      console.error('User not found:', phoneNumber);
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.events || user.events.length === 0) {
      console.log('No events found for user:', phoneNumber);
      return res.json({ guests: [] });
    }

    // Get guests from the first event
    const event = user.events[0];
    console.log('Found event:', event._id);
    console.log('Number of guests:', event.guests ? event.guests.length : 0);

    // Ensure we're sending a valid JSON response
    const response = {
      guests: event.guests || []
    };

    // Log the response before sending
    console.log('Sending response:', JSON.stringify(response, null, 2));
    
    // Set content type header explicitly
    res.setHeader('Content-Type', 'application/json');
    res.json(response);
  } catch (error) {
    console.error('Error fetching guests:', error);
    res.status(500).json({ 
      message: 'Error fetching guests',
      error: error.message 
    });
  }
});

// Create default waves for a new event
const createDefaultWaves = () => {
  const now = new Date();
  const waves = [
    {
      id: 1,
      name: 'גל SMS ראשון',
      date: now.toISOString().split('T')[0],
      time: '10:00',
      type: 'sms',
      message: 'שלום, אנו שמחים להזמין אותך לאירוע שלנו. נשמח לקבל את תשובתך.',
      status: 'pending'
    },
    {
      id: 2,
      name: 'גל WhatsApp ראשון',
      date: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: '10:00',
      type: 'whatsapp',
      message: 'שלום, אנו שמחים להזמין אותך לאירוע שלנו. נשמח לקבל את תשובתך.',
      status: 'pending'
    },
    {
      id: 3,
      name: 'גל SMS שני',
      date: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: '10:00',
      type: 'sms',
      message: 'שלום, עדיין לא קיבלנו את תשובתך. נשמח אם תוכל/י לאשר את השתתפותך.',
      status: 'pending'
    },
    {
      id: 4,
      name: 'גל WhatsApp שני',
      date: new Date(now.getTime() + 72 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: '10:00',
      type: 'whatsapp',
      message: 'שלום, עדיין לא קיבלנו את תשובתך. נשמח אם תוכל/י לאשר את השתתפותך.',
      status: 'pending'
    },
    {
      id: 5,
      name: 'גל טלפוני',
      date: new Date(now.getTime() + 96 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: '10:00',
      type: 'phone',
      message: 'שלום, נשמח אם תוכל/י לאשר את השתתפותך בטלפון.',
      status: 'pending'
    }
  ];
  return waves;
};

// Add a new wave
router.post('/waves', async (req, res) => {
  try {
    const { phoneNumber, eventId, wave } = req.body;
    
    if (!phoneNumber || !eventId || !wave) {
      return res.status(400).json({ message: 'Phone number, event ID, and wave data are required' });
    }

    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const event = user.events.id(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Validate wave data
    if (!wave.name || !wave.date || !wave.time || !wave.type || !wave.message) {
      return res.status(400).json({ message: 'Wave name, date, time, type, and message are required' });
    }

    // Set wave ID as the next available ID
    const nextId = event.waves.length > 0 ? Math.max(...event.waves.map(w => w.id)) + 1 : 1;
    wave.id = nextId;
    if (!wave.status) wave.status = 'pending';

    // Add the new wave
    event.waves.push(wave);
    await user.save();

    res.json({
      message: 'Wave added successfully',
      wave
    });
  } catch (error) {
    console.error('Error adding wave:', error);
    res.status(500).json({ message: 'Error adding wave' });
  }
});

// Initialize default waves for a new event
router.post('/waves/initialize', async (req, res) => {
  try {
    const { phoneNumber, eventId } = req.body;
    
    if (!phoneNumber || !eventId) {
      return res.status(400).json({ message: 'Phone number and event ID are required' });
    }

    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const event = user.events.id(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Add default waves if no waves exist
    if (!event.waves || event.waves.length === 0) {
      event.waves = createDefaultWaves();
      await user.save();
    }

    res.json({
      message: 'Default waves initialized successfully',
      waves: event.waves
    });
  } catch (error) {
    console.error('Error initializing waves:', error);
    res.status(500).json({ message: 'Error initializing waves' });
  }
});

// Update wave
router.put('/waves/:waveId', async (req, res) => {
  try {
    const { phoneNumber, eventId, wave } = req.body;
    const waveId = parseInt(req.params.waveId);

    if (!phoneNumber || !eventId || !wave) {
      return res.status(400).json({ message: 'Phone number, event ID, and wave data are required' });
    }

    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const event = user.events.id(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const waveIndex = event.waves.findIndex(w => w.id === waveId);
    if (waveIndex === -1) {
      return res.status(404).json({ message: 'Wave not found' });
    }

    // Update wave
    event.waves[waveIndex] = {
      ...event.waves[waveIndex],
      ...wave,
      id: waveId // Preserve the original ID
    };

    await user.save();
    res.json({ message: 'Wave updated successfully', event });
  } catch (error) {
    console.error('Error updating wave:', error);
    res.status(500).json({ message: 'Error updating wave' });
  }
});

// Send wave
router.post('/waves/send', async (req, res) => {
  try {
    const { phoneNumber, eventId, waveId, statusesToSend } = req.body;
    
    if (!phoneNumber || !eventId || !waveId) {
      return res.status(400).json({ message: 'Phone number, event ID, and wave ID are required' });
    }

    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const event = user.events.id(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const wave = event.waves.find(w => w.id === waveId);
    if (!wave) {
      return res.status(404).json({ message: 'Wave not found' });
    }

    if (wave.active === false) {
      return res.status(400).json({ message: 'הגל הזה אינו פעיל' });
    }

    // Prepare event date string for replacement
    let eventDateStr = '';
    if (event.date) {
      const d = new Date(event.date);
      eventDateStr = d.toLocaleDateString('he-IL');
    }

    // Prepare log data
    const logData = {
      waveDetails: {
        name: wave.name,
        date: wave.date,
        time: wave.time,
        type: wave.type,
        message: wave.message
      },
      results: '',
      failedAttempts: [],
      skippedGuests: []
    };

    // Default statusesToSend to ['טרם ענה'] if not provided
    const statuses = Array.isArray(statusesToSend) && statusesToSend.length > 0 ? statusesToSend : ['טרם ענה'];

    // Get all guests for this wave
    const allGuestsInWave = event.guests.filter(guest => guest.wave === waveId);
    const guests = allGuestsInWave.filter(guest => statuses.includes(guest.status));

    // Log skipped guests
    const skippedGuests = allGuestsInWave.filter(guest => !statuses.includes(guest.status));
    logData.skippedGuests = skippedGuests.map(g => 
      `- ${g.name} (${g.phone}): ${g.status}`
    );

    console.log(`Sending wave ${waveId} to ${guests.length} guests`);

    // Update wave status
    wave.status = 'sent';
    wave.sendCount = (wave.sendCount || 0) + 1;
    await user.save();

    // Send WhatsApp messages if type is whatsapp
    if (wave.type === 'whatsapp') {
      const guestsToSend = guests.map(g => ({
        phone: g.phone.startsWith('0') ? '972' + g.phone.slice(1) : g.phone,
        name: g.name,
        table: g.table || ''
      }));
      try {
        const response = await axios.post('http://inviter-whatsapp:5010/send-wave', {
          guests: guestsToSend,
          message: wave.message,
          event: {
            date: event.date,
            location: event.location,
            groomName: event.groomName,
            brideName: event.brideName,
            groomPhone: event.groomPhone,
            bridePhone: event.bridePhone,
            wazeLink: event.wazeLink,
            payboxLink: event.payboxLink,
            bitLink: event.bitLink
          }
        });
        response.data.results.forEach((result, idx) => {
          if (result.success) {
            logData.results += `✓ Sent to ${guestsToSend[idx].name} (${guestsToSend[idx].phone})\n`;
          } else {
            logData.failedAttempts.push(`✗ Failed to send to ${guestsToSend[idx].name} (${guestsToSend[idx].phone}): ${result.error}`);
          }
        });
      } catch (err) {
        logData.failedAttempts.push('WhatsApp-service error: ' + err.message);
      }
    } else {
      // For development, log the messages instead of sending them
      guests.forEach(guest => {
        console.log(`[DEV] Sending ${wave.type} to ${guest.name} (${guest.phone}): ${wave.message}`);
        logData.results += `✓ [DEV] Sent ${wave.type} to ${guest.name} (${guest.phone})\n`;
      });
    }

    // Write log file
    const logPath = writeToLog(waveId, eventId, logData, wave.sendCount);

    res.json({
      message: 'Wave sent successfully',
      sentTo: guests.length,
      logPath: logPath
    });
  } catch (error) {
    console.error('Error sending wave:', error);
    res.status(500).json({ message: 'Error sending wave' });
  }
});

// Update guest
router.put('/:guestId', async (req, res) => {
  try {
    const { phoneNumber, eventId, guest } = req.body;
    const { guestId } = req.params;

    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const event = user.events.id(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const guestToUpdate = event.guests.id(guestId);
    if (!guestToUpdate) {
      return res.status(404).json({ message: 'Guest not found' });
    }

    // Update guest fields
    guestToUpdate.name = guest.name;
    guestToUpdate.phone = guest.phone;
    guestToUpdate.quantity = guest.quantity;
    guestToUpdate.status = guest.status;
    guestToUpdate.wave = guest.wave;
    guestToUpdate.table = guest.table || '';

    await user.save();
    res.json({ message: 'Guest updated successfully', event });
  } catch (error) {
    console.error('Error updating guest:', error);
    res.status(500).json({ message: 'Error updating guest' });
  }
});

// Get all waves for an event
router.get('/waves', async (req, res) => {
  try {
    const { phoneNumber, eventId } = req.query;
    if (!phoneNumber || !eventId) {
      return res.status(400).json({ message: 'Phone number and event ID are required' });
    }
    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const event = user.events.id(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json({ waves: event.waves });
  } catch (error) {
    console.error('Error fetching waves:', error);
    res.status(500).json({ message: 'Error fetching waves' });
  }
});

// Add a route to reset sendCount for a wave
router.put('/waves/:waveId/reset-send-count', async (req, res) => {
  try {
    const { phoneNumber, eventId } = req.body;
    const waveId = parseInt(req.params.waveId);
    if (!phoneNumber || !eventId) {
      return res.status(400).json({ message: 'Phone number and event ID are required' });
    }
    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const event = user.events.id(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    const wave = event.waves.find(w => w.id === waveId);
    if (!wave) {
      return res.status(404).json({ message: 'Wave not found' });
    }
    wave.sendCount = 0;
    await user.save();
    res.json({ message: 'Send count reset successfully', event });
  } catch (error) {
    console.error('Error resetting send count:', error);
    res.status(500).json({ message: 'Error resetting send count' });
  }
});

// Add a route to delete a wave by id
router.delete('/waves/:waveId', async (req, res) => {
  try {
    const { phoneNumber, eventId } = req.query;
    const waveId = parseInt(req.params.waveId);
    if (!phoneNumber || !eventId) {
      return res.status(400).json({ message: 'Phone number and event ID are required' });
    }
    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const event = user.events.id(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    const initialLength = event.waves.length;
    event.waves = event.waves.filter(w => w.id !== waveId);
    if (event.waves.length === initialLength) {
      return res.status(404).json({ message: 'Wave not found' });
    }
    await user.save();
    res.json({ message: 'Wave deleted successfully', event });
  } catch (error) {
    console.error('Error deleting wave:', error);
    res.status(500).json({ message: 'Error deleting wave' });
  }
});

export default router; 