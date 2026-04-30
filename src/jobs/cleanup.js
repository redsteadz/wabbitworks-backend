const VerificationTokenModel = require('../modules/auth/verificationToken.model');
const PasswordResetTokenModel = require('../modules/auth/passwordResetToken.model');
const SessionModel = require('../modules/auth/session.model');
const NotificationModel = require('../modules/notifications/notification.model');
const InvitationModel = require('../modules/invitations/invitation.model');

/**
 * Clean up expired tokens, sessions, old notifications, and expired invitations
 * Run this as a cron job (e.g., daily)
 */
const cleanup = async () => {
  try {
    console.log('Starting cleanup job...');

    // Delete expired verification tokens
    const deletedVerificationTokens = await VerificationTokenModel.deleteExpired();
    console.log(`  - Deleted ${deletedVerificationTokens} expired verification tokens`);

    // Delete expired password reset tokens
    const deletedResetTokens = await PasswordResetTokenModel.deleteExpired();
    console.log(`  - Deleted ${deletedResetTokens} expired password reset tokens`);

    // Delete expired sessions
    const deletedSessions = await SessionModel.deleteExpired();
    console.log(`  - Deleted ${deletedSessions} expired sessions`);

    // Delete old read notifications (older than 30 days)
    const deletedNotifications = await NotificationModel.deleteOldRead(30);
    console.log(`  - Deleted ${deletedNotifications} old read notifications`);

    // Expire old pending invitations
    const expiredInvitations = await InvitationModel.expireOld();
    console.log(`  - Expired ${expiredInvitations} old pending invitations`);

    console.log('Cleanup job completed');
  } catch (error) {
    console.error('Cleanup job failed:', error);
  }
};

module.exports = { cleanup };