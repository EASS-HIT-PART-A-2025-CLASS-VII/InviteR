import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const { phoneNumber } = req.query;
    const user = await User.findOne({ phoneNumber });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      weddingDetails: user.weddingDetails,
      hasWeddingDetails: !!user.weddingDetails?.name
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    const { phoneNumber, profile } = req.body;
    console.log('Received profile update request:', req.body);

    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    let user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update receiveStatusUpdates if provided
    if (typeof profile.receiveStatusUpdates !== 'undefined') {
      user.receiveStatusUpdates = profile.receiveStatusUpdates;
    }

    // If user has no events, create a new one
    if (!user.events || user.events.length === 0) {
      const newEvent = {
        name: `חתונה של ${profile.groomName || ''} ו${profile.brideName || ''}`,
        groomName: profile.groomName || '',
        brideName: profile.brideName || '',
        date: profile.weddingDate || '',
        location: profile.location || '',
        description: profile.description || '',
        groomPhone: profile.groomPhone || '',
        bridePhone: profile.bridePhone || '',
        guests: [],
        waves: [],
        wazeLink: profile.wazeLink || '',
        payboxLink: profile.payboxLink || '',
        bitLink: profile.bitLink || ''
      };
      user.events = [newEvent];
    } else {
      // Update existing event with new data
      const event = user.events[0];
      event.name = `חתונה של ${profile.groomName || ''} ו${profile.brideName || ''}`;
      event.groomName = profile.groomName || '';
      event.brideName = profile.brideName || '';
      event.date = profile.weddingDate || '';
      event.location = profile.location || '';
      event.description = profile.description || '';
      event.groomPhone = profile.groomPhone || '';
      event.bridePhone = profile.bridePhone || '';
      event.wazeLink = profile.wazeLink || '';
      event.payboxLink = profile.payboxLink || '';
      event.bitLink = profile.bitLink || '';
    }

    // Update isFirstTime based on whether user has events
    user.isFirstTime = !user.events || user.events.length === 0;

    await user.save();
    console.log('User saved successfully');

    res.json({
      message: 'Profile updated successfully',
      user: {
        phoneNumber: user.phoneNumber,
        name: user.name,
        isFirstTime: user.isFirstTime,
        events: user.events,
        groomPhone: user.groomPhone,
        bridePhone: user.bridePhone,
        receiveStatusUpdates: user.receiveStatusUpdates
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Update wedding details
router.put('/wedding-details', async (req, res) => {
  try {
    const { phoneNumber, weddingDetails } = req.body;
    
    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.weddingDetails = weddingDetails;
    await user.save();

    res.json({
      message: 'Wedding details updated successfully',
      weddingDetails: user.weddingDetails
    });
  } catch (error) {
    console.error('Error updating wedding details:', error);
    res.status(500).json({ message: 'Error updating wedding details' });
  }
});

// Get user dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const { phoneNumber } = req.query;
    const user = await User.findOne({ phoneNumber });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      events: user.events.map(event => ({
        _id: event._id.toString(),
        name: event.name,
        date: event.date,
        location: event.location,
        description: event.description,
        guests: event.guests.map(guest => ({
          _id: guest._id.toString(),
          name: guest.name,
          phone: guest.phone,
          quantity: guest.quantity || 1,
          status: guest.status,
          wave: guest.wave || 0
        })),
        waves: event.waves.map((wave, index) => ({
          id: index + 1,
          date: wave.date,
          time: wave.time,
          type: wave.type,
          message: wave.message
        }))
      }))
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Error fetching dashboard data' });
  }
});

// Add guest to event
router.post('/events/:eventId/guests', async (req, res) => {
  try {
    const { phoneNumber } = req.query;
    const { eventId } = req.params;
    const guestData = req.body;

    console.log('Adding guest request:', { phoneNumber, eventId, guestData }); // Debug log

    const user = await User.findOne({ phoneNumber });
    if (!user) {
      console.log('User not found:', phoneNumber); // Debug log
      return res.status(404).json({ message: 'User not found' });
    }

    const event = user.events.id(eventId);
    if (!event) {
      console.log('Event not found:', eventId); // Debug log
      return res.status(404).json({ message: 'Event not found' });
    }

    // Add new guest to event
    event.guests.push({
      name: guestData.name,
      phone: guestData.phone,
      quantity: guestData.quantity || 1,
      status: 'pending',
      wave: guestData.wave || 0
    });

    console.log('Saving user with new guest...'); // Debug log
    await user.save();
    console.log('User saved successfully'); // Debug log

    // Return updated event data
    const response = {
      message: 'Guest added successfully',
      event: {
        id: event._id.toString(),
        name: event.name,
        date: event.date,
        location: event.location,
        description: event.description,
        guests: event.guests.map(guest => ({
          id: guest._id.toString(),
          name: guest.name,
          phone: guest.phone,
          quantity: guest.quantity || 1,
          status: guest.status,
          wave: guest.wave || 0
        })),
        waves: event.waves.map((wave, index) => ({
          id: index + 1,
          date: wave.date,
          time: wave.time,
          type: wave.type,
          message: wave.message
        }))
      }
    };

    console.log('Sending response:', response); // Debug log
    res.json(response);
  } catch (error) {
    console.error('Error adding guest:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({ message: 'Error adding guest', error: error.message });
  }
});

// Update guest status
router.put('/events/:eventId/guests/:guestId/status', async (req, res) => {
  try {
    const { phoneNumber } = req.query;
    const { eventId, guestId } = req.params;
    const { status } = req.body;

    console.log('Updating guest status:', { phoneNumber, eventId, guestId, status });

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

    guest.status = status;
    await user.save();

    res.json({
      message: 'Guest status updated successfully',
      guest: {
        id: guest._id.toString(),
        name: guest.name,
        phone: guest.phone,
        quantity: guest.quantity,
        status: guest.status,
        wave: guest.wave
      }
    });
  } catch (error) {
    console.error('Error updating guest status:', error);
    res.status(500).json({ message: 'Error updating guest status' });
  }
});

export default router; 