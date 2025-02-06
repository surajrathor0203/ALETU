/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const functions = require('firebase-functions');
const nodemailer = require('nodemailer');
const cors = require('cors')({ origin: true }); // Add this line

// Get email configuration, with fallback for local development
const getEmailConfig = () => {
  try {
    return {
      user: functions.config().email.user,
      pass: functions.config().email.password
    };
  } catch (error) {
    // Default config for local development
    return {
      user: 'nayebaredominique7@gmail.com', // Replace with your test email
      pass: 'iyffcruzcwehupie'     // Replace with your test password
    };
  }
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: getEmailConfig()
});

exports.sendTeacherCredentials = functions.https.onCall((data, context) => {
  // Add CORS headers
  return new Promise((resolve, reject) => {
    cors(data, context, async () => {
      const { to, username, password, loginUrl, name } = data;

      const mailOptions = {
        from: functions.config().email.user,
        to: to,
        subject: 'Your Teacher Account Credentials',
        html: `
          <h2>Welcome to Our Learning Platform!</h2>
          <p>Dear ${name},</p>
          <p>Your teacher account has been created. Here are your login credentials:</p>
          <p><strong>Username:</strong> ${username}</p>
          <p><strong>Password:</strong> ${password}</p>
          <p>Please login at: <a href="${loginUrl}">${loginUrl}</a></p>
          <p>For security reasons, please change your password after your first login.</p>
          <p>Best regards,<br>Admin Team</p>
        `
      };

      try {
        await transporter.sendMail(mailOptions);
        resolve({ success: true });
      } catch (error) {
        console.error('Error sending email:', error);
        reject(new functions.https.HttpsError('internal', 'Error sending email'));
      }
    });
  });
});
