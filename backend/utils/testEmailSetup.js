const nodemailer = require('nodemailer');

// Create test email account for development
const createTestEmailAccount = async () => {
  try {
    // Create a test account using Ethereal Email
    const testAccount = await nodemailer.createTestAccount();

    console.log('Test Email Account Created:');
    console.log('Email:', testAccount.user);
    console.log('Password:', testAccount.pass);
    console.log('SMTP Server:', testAccount.smtp.host);
    console.log('Port:', testAccount.smtp.port);

    return testAccount;
  } catch (error) {
    console.error('Error creating test account:', error);
    return null;
  }
};

module.exports = { createTestEmailAccount };