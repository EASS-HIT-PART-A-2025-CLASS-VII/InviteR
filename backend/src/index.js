import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import guestRoutes from './routes/guest.js';
import './waveScheduler.js';

// Load environment variables
dotenv.config();

// Configuration from environment variables
const config = {
  PORT: process.env.PORT || 5002,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/inviter',
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-here',
  NODE_ENV: process.env.NODE_ENV || 'development'
};

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Add content type middleware
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/guests', guestRoutes);

// MongoDB Connection
mongoose.connect(config.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    // --- One-time fix for guests with illegal status 'pending' ---
    try {
      const UserModel = mongoose.model('User');
      const users = await UserModel.find({});
      let fixed = 0;
      for (const user of users) {
        let changed = false;
        for (const event of user.events) {
          for (const guest of event.guests) {
            if (guest.status === 'pending') {
              guest.status = 'טרם ענה';
              changed = true;
              fixed++;
            }
          }
        }
        if (changed) await user.save();
      }
      if (fixed > 0) {
        console.log(`Fixed ${fixed} guests with illegal status 'pending'`);
      } else {
        console.log('No guests with illegal status found.');
      }
    } catch (err) {
      console.error('Error during guest status fix:', err);
    }
  })
  .catch((err) => console.error('MongoDB connection error:', err));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = config.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${config.NODE_ENV}`);
}); 