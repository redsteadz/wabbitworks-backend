const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const { createTransporter } = require('../config/email');
const env = require('../config/env');

/**
 * Load and compile email template with Handlebars
 * @param {string} templateName - Name of the template file (without .html)
 * @param {object} variables - Variables to replace in template
 * @returns {string} - Compiled HTML
 */
const loadTemplate = (templateName, variables = {}) => {
  const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.html`);
  
  const templateSource = fs.readFileSync(templatePath, 'utf-8');
  const template = Handlebars.compile(templateSource);
  
  return template(variables);
};

/**
 * Send email
 * @param {object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} [options.text] - Plain text content
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: env.email.from,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for plain text
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error.message);
    throw error;
  }
};

/**
 * Send verification email
 */
const sendVerificationEmail = async ({ to, firstName, verificationUrl, verificationCode, expiresInHours }) => {
  const html = loadTemplate('verification', {
    firstName,
    verificationUrl,
    verificationCode,
    expiresIn: expiresInHours,
    year: new Date().getFullYear(),
  });
  
  return sendEmail({
    to,
    subject: 'Verify your email - Team Project',
    html,
  });
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async ({ to, firstName, resetUrl, expiresInHours, ipAddress, userAgent, requestTime }) => {
  const html = loadTemplate('password-reset', {
    firstName,
    resetUrl,
    expiresIn: expiresInHours,
    ipAddress: ipAddress || 'Unknown',
    userAgent: userAgent || 'Unknown',
    requestTime: requestTime || new Date().toISOString(),
    year: new Date().getFullYear(),
  });
  
  return sendEmail({
    to,
    subject: 'Reset your password - Team Project',
    html,
  });
};

/**
 * Send email change verification
 */
const sendEmailChangeVerification = async ({ to, firstName, newEmail, confirmUrl, expiresInHours }) => {
  const html = loadTemplate('email-change', {
    firstName,
    newEmail,
    confirmUrl,
    expiresIn: expiresInHours,
    year: new Date().getFullYear(),
  });
  
  return sendEmail({
    to,
    subject: 'Confirm your new email - Team Project',
    html,
  });
};

/**
 * Send welcome email after verification
 */
const sendWelcomeEmail = async ({ to, firstName }) => {
  const html = loadTemplate('welcome', {
    firstName,
    dashboardUrl: `${env.frontend.url}/dashboard`,
    year: new Date().getFullYear(),
  });
  
  return sendEmail({
    to,
    subject: '🎉 Welcome to Team Project!',
    html,
  });
};

/**
 * Send password changed notification
 */
const sendPasswordChangedEmail = async ({ to, firstName, ipAddress, userAgent, changedAt }) => {
  const html = loadTemplate('password-changed', {
    firstName,
    ipAddress: ipAddress || 'Unknown',
    userAgent: userAgent || 'Unknown',
    changedAt: changedAt || new Date().toLocaleString(),
    resetUrl: `${env.frontend.resetPasswordUrl}`,
    year: new Date().getFullYear(),
  });
  
  return sendEmail({
    to,
    subject: 'Your password was changed - Team Project',
    html,
  });
};

/**
 * Send team invitation email
 */
const sendTeamInvitationEmail = async ({ to, invitedUserName, inviterName, inviterEmail, teamName, role, message, acceptUrl, declineUrl, viewUrl, expiresAt }) => {
  const html = loadTemplate('team-invitation', {
    invitedUserName,
    inviterName,
    inviterEmail,
    teamName,
    role,
    message,
    acceptUrl,
    declineUrl,
    viewUrl,
    expiresAt,
    year: new Date().getFullYear(),
  });
  
  return sendEmail({
    to,
    subject: `You've been invited to join ${teamName} - Team Project`,
    html,
  });
};

/**
 * Send invitation accepted notification
 */
const sendInvitationAcceptedEmail = async ({ to, inviterName, acceptedUserName, teamName, role, teamUrl }) => {
  const html = loadTemplate('invitation-accepted', {
    inviterName,
    acceptedUserName,
    teamName,
    role,
    teamUrl,
    year: new Date().getFullYear(),
  });
  
  return sendEmail({
    to,
    subject: `🎉 ${acceptedUserName} accepted your invitation to ${teamName}`,
    html,
  });
};

/**
 * Send invitation declined notification
 */
const sendInvitationDeclinedEmail = async ({ to, inviterName, declinedUserName, teamName, role, teamUrl }) => {
  const html = loadTemplate('invitation-declined', {
    inviterName,
    declinedUserName,
    teamName,
    role,
    teamUrl,
    year: new Date().getFullYear(),
  });
  
  return sendEmail({
    to,
    subject: `${declinedUserName} declined your invitation to ${teamName}`,
    html,
  });
};

/**
 * Send task assignment email
 */
const sendTaskAssignedEmail = async ({ to, assigneeName, assignerName, taskTitle, taskDescription, teamName, priority, dueDate, taskUrl }) => {
  const priorityLabels = {
    urgent: 'URGENT',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };

  const html = loadTemplate('task-assigned', {
    assigneeName,
    assignerName,
    taskTitle,
    taskDescription,
    teamName,
    priority,
    priorityLabel: priorityLabels[priority] || 'Medium',
    dueDate: dueDate ? new Date(dueDate).toLocaleDateString() : null,
    taskUrl,
    year: new Date().getFullYear(),
  });
  
  return sendEmail({
    to,
    subject: `New task assigned: ${taskTitle}`,
    html,
  });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendEmailChangeVerification,
  sendWelcomeEmail,
  sendPasswordChangedEmail,
  sendTeamInvitationEmail,
  sendInvitationAcceptedEmail,
  sendInvitationDeclinedEmail,
  sendTaskAssignedEmail,
};