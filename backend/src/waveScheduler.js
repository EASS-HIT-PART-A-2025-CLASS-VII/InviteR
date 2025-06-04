import cron from 'node-cron';
import User from './models/User.js';
import { sendWaveMessages } from '../sendWhatsAppWave.js';
import fs from 'fs';
import path from 'path';

// Logs directory and log writing function (same as in guest.js)
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}
const writeToLog = (waveId, eventId, logData, sendCount) => {
  const now = new Date();
  const pad = n => n.toString().padStart(2, '0');
  const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const logFileName = `Wave-${waveId}-${dateStr}-${timeStr}.txt`;
  const logPath = path.join(logsDir, logFileName);
  const logContent = `=== Wave Sending Log ===\n\nTimestamp: ${now.toLocaleString('he-IL')}\nWave ID: ${waveId}\nEvent ID: ${eventId}\nSend Count: ${sendCount}\n\nWave Details:\n${JSON.stringify(logData.waveDetails, null, 2)}\n\nSending Results:\n${logData.results}\n\nFailed Attempts:\n${logData.failedAttempts.length > 0 ? logData.failedAttempts.join('\\n') : 'None'}\n\nSkipped Guests (Already Responded):\n${logData.skippedGuests.length > 0 ? logData.skippedGuests.join('\\n') : 'None'}\n`;
  fs.writeFileSync(logPath, logContent);
  return logPath;
};

// Scheduler: runs every minute
cron.schedule('* * * * *', async () => {
  const now = new Date();
  try {
    const users = await User.find({});
    for (const user of users) {
      for (const event of user.events) {
        for (const wave of event.waves) {
          if (wave.status !== 'sent' && (!wave.sendCount || wave.sendCount === 0)) {
            // Check if wave date/time has arrived
            const waveDateTime = new Date(`${wave.date}T${wave.time}`);
            if (now >= waveDateTime) {
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
              // Get all guests for this wave
              const allGuestsInWave = event.guests.filter(guest => guest.wave === wave.id);
              const guests = allGuestsInWave.filter(guest => guest.status !== 'מגיע' && guest.status !== 'לא מגיע');
              // Log skipped guests
              const skippedGuests = allGuestsInWave.filter(guest => guest.status === 'מגיע' || guest.status === 'לא מגיע');
              logData.skippedGuests = skippedGuests.map(g => `- ${g.name} (${g.phone}): ${g.status}`);
              // Send messages
              if (wave.type === 'whatsapp') {
                for (const g of guests) {
                  let phone = g.phone.replace(/\D/g, '');
                  if (phone.startsWith('0')) phone = '972' + phone.slice(1);
                  let personalizedMessage = wave.message
                    .replace(/\{Name\}/g, g.name)
                    .replace(/\{GroomName\}/g, event.groomName || '')
                    .replace(/\{BrideName\}/g, event.brideName || '')
                    .replace(/\{EventLocation\}/g, event.location || '')
                    .replace(/\{WazeLink\}/g, event.wazeLink || '')
                    .replace(/\{PayboxLink\}/g, event.payboxLink || '')
                    .replace(/\{BitLink\}/g, event.bitLink || '');
                  try {
                    await sendWaveMessages([phone], personalizedMessage);
                    logData.results += `✓ Sent to ${g.name} (${g.phone})\n`;
                  } catch (err) {
                    logData.failedAttempts.push(`✗ Failed to send to ${g.name} (${g.phone}): ${err.message}`);
                  }
                }
              } else {
                guests.forEach(guest => {
                  logData.results += `✓ [DEV] Sent ${wave.type} to ${guest.name} (${guest.phone})\n`;
                });
              }
              // Update wave status
              wave.status = 'sent';
              wave.sendCount = (wave.sendCount || 0) + 1;
              // Write log file
              writeToLog(wave.id, event._id, logData, wave.sendCount);
            }
          }
        }
      }
      await user.save();
    }
  } catch (err) {
    console.error('[WaveScheduler] Error:', err);
  }
}); 