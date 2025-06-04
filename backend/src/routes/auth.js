import express from 'express';
import User from '../models/User.js';
import axios from 'axios';

const router = express.Router();

// Store OTPs temporarily (in production, use Redis or similar)
const otpStore = new Map();

// Generate OTP - random 6 digits
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Validate phone number
const validatePhoneNumber = (phoneNumber) => {
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  return cleanNumber.length === 10;
};

// Clean phone number
const cleanPhoneNumber = (phoneNumber) => {
  return phoneNumber.replace(/\D/g, '');
};

// Send OTP
router.post('/send-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const cleanNumber = cleanPhoneNumber(phoneNumber);
    
    console.log('Received request to send OTP for:', cleanNumber);

    if (!phoneNumber) {
      console.error('No phone number provided');
      return res.status(400).json({ message: 'Phone number is required' });
    }

    if (!validatePhoneNumber(cleanNumber)) {
      console.error('Invalid phone number format:', cleanNumber);
      return res.status(400).json({ message: 'Invalid phone number format' });
    }

    const otp = generateOTP();
    console.log('Generated OTP:', otp);

    // Store OTP with expiration (5 minutes)
    const expiresAt = Date.now() + 5 * 60 * 1000;
    otpStore.set(cleanNumber, { otp, expiresAt });
    console.log('Stored OTP for:', cleanNumber);

    // Send OTP via WhatsApp-service
    let phone = cleanNumber.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = '972' + phone.slice(1);
    try {
      await axios.post('http://inviter-whatsapp:5010/send-otp', { phone, otp });
    } catch (err) {
      console.error('Failed to send OTP via WhatsApp-service:', err);
      return res.status(500).json({ message: 'Failed to send OTP via WhatsApp' });
    }

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ message: 'Error sending OTP' });
  }
});

// Verify OTP and login/register
router.post('/verify-otp', async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;
    const cleanNumber = cleanPhoneNumber(phoneNumber);
    console.log('Received verification request for:', cleanNumber);

    if (!phoneNumber || !otp) {
      console.error('Missing required fields:', { phoneNumber: cleanNumber, otp });
      return res.status(400).json({ message: 'Phone number and OTP are required' });
    }

    if (!validatePhoneNumber(cleanNumber)) {
      console.error('Invalid phone number format:', cleanNumber);
      return res.status(400).json({ message: 'Invalid phone number format' });
    }

    // Check if OTP is valid and not expired
    const otpObj = otpStore.get(cleanNumber);
    if (!otpObj) {
      console.error('No OTP found for:', cleanNumber);
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    if (otpObj.expiresAt < Date.now()) {
      otpStore.delete(cleanNumber);
      console.error('OTP expired for:', cleanNumber);
      return res.status(400).json({ message: 'OTP expired. Please request a new code.' });
    }
    if (otpObj.otp !== otp) {
      console.error('Invalid OTP for:', cleanNumber);
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    // Clear OTP after successful verification
    otpStore.delete(cleanNumber);
    console.log('Cleared OTP for:', cleanNumber);

    // Check if user exists by phone number, groom phone, or bride phone
    console.log('Looking for user with phone:', cleanNumber);
    let user = await User.findOne({
      $or: [
        { phoneNumber: cleanNumber },
        { groomPhone: cleanNumber },
        { bridePhone: cleanNumber }
      ]
    });

    if (user) {
      console.log('Found existing user:', user.phoneNumber);
      // User exists, return user data
      return res.json({
        user: {
          phoneNumber: user.phoneNumber,
          name: user.name,
          events: user.events,
          isFirstTime: false,
          groomPhone: user.groomPhone,
          bridePhone: user.bridePhone
        }
      });
    }

    console.log('Creating new user for:', cleanNumber);
    // Create new user
    user = new User({
      phoneNumber: cleanNumber,
      name: 'משתמש חדש',
      isFirstTime: true,
      events: []
    });

    await user.save();
    console.log('Created new user:', user.phoneNumber);

    res.json({
      user: {
        phoneNumber: user.phoneNumber,
        name: user.name,
        events: user.events,
        isFirstTime: true
      }
    });
  } catch (error) {
    console.error('Error in verify-otp:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router; 