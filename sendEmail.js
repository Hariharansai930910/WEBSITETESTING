// sendEmail.js
const nodemailer = require('nodemailer');
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.post('/send-email', async (req, res) => {
  const { matchInfo, sender } = req.body;

  // 1. Set up transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'sharemaate@gmail.com',            // Your email
      pass: 'Uniqueideathatgotmerich@04172025'                // App Password
    }
  });

  try {
    // 2. Fetch all emails from Firebase (you can simulate here or actually query Firestore)
    const toEmails = [
      'vssmah@gmail.com.com',
      'dhariharan789@gmail.com'
    ]; // You can replace this with your Firebase Firestore query later

    // 3. Send emails
const mailOptions = {
  from: sender,
  to: toEmails.join(','), // multiple recipients
  subject: `🍽️ New ${matchInfo.food || "Food"} Match Request!`,
  html: `
    <h3>🍱 A new food match request has been made!</h3>
    <ul>
      <li><strong>Food:</strong> ${matchInfo.food || "N/A"}</li>
      <li><strong>Slices/Portions:</strong> ${matchInfo.slices}</li>
      <li><strong>Preference:</strong> ${matchInfo.preference}</li>
    </ul>
    <p>🔥 Open your SliceMate app now to accept the match!</p>
  `
};

    await transporter.sendMail(mailOptions);
    res.status(200).send('Emails sent successfully');
  } catch (err) {
    console.error('Email Error:', err);
    res.status(500).send('Failed to send email');
  }
});

// Export this for Firebase or run standalone
module.exports = app;

// For standalone use:
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Email API running on port ${PORT}`));
