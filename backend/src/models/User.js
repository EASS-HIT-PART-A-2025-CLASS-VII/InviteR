import mongoose from 'mongoose';

const guestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  status: {
    type: String,
    enum: ['טרם ענה', 'מגיע', 'לא מגיע', 'אולי', 'מספר לא תקין'],
    default: 'טרם ענה'
  },
  wave: { type: Number, default: 0 },
  confirmedQuantity: { type: Number, default: 0 },
  table: { type: String, default: '' }
});

const waveSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  type: { type: String, enum: ['sms', 'whatsapp', 'phone'], required: true },
  message: { type: String, required: true },
  sendCount: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  sendToStatuses: { type: [String], default: ['טרם ענה'] }
});

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  groomName: { type: String, default: '' },
  brideName: { type: String, default: '' },
  date: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String },
  guests: [guestSchema],
  waves: [waveSchema],
  wazeLink: { type: String, default: '' },
  payboxLink: { type: String, default: '' },
  bitLink: { type: String, default: '' }
}, { _id: true });

const userSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  isFirstTime: {
    type: Boolean,
    default: true
  },
  groomPhone: {
    type: String,
    required: false
  },
  bridePhone: {
    type: String,
    required: false
  },
  receiveStatusUpdates: {
    type: Boolean,
    default: true
  },
  events: [eventSchema]
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

export default User; 