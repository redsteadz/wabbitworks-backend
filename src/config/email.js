const nodemailer = require('nodemailer');
const env = require('./env');

/**
 * Create and configure nodemailer transporter
 */
const createTransporter = () => {

  const transporter = nodemailer.createTransport({
    host: env.email.smtp.host,
    port: env.email.smtp.port,
    secure: env.email.smtp.secure, // true for 465, false for other ports
    auth: {
      user: env.email.smtp.user,
      pass: env.email.smtp.password,
    },
  });

  return transporter;
};

const verifyConnection = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Email server connection verified');
    return true;
  } catch (error) {
    console.error('Email server connection failed:', error.message);
    return false;
  }
};

module.exports = {
  createTransporter,
  verifyConnection,
};