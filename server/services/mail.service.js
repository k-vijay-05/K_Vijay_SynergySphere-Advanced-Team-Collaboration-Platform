const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS SES
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const ses = new AWS.SES({ apiVersion: '2010-12-01' });

class MailService {
  static async sendPasswordResetEmail(email, resetToken, userName = 'User') {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const params = {
      Destination: {
        ToAddresses: [email]
      },
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: this.getPasswordResetHtmlTemplate(userName, resetUrl)
          },
          Text: {
            Charset: 'UTF-8',
            Data: this.getPasswordResetTextTemplate(userName, resetUrl)
          }
        },
        Subject: {
          Charset: 'UTF-8',
          Data: 'Reset Your Password'
        }
      },
      Source: process.env.FROM_EMAIL || 'noreply@yourapp.com'
    };

    try {
      const result = await ses.sendEmail(params).promise();
      console.log('✅ Password reset email sent successfully:', result.MessageId);
      return { success: true, messageId: result.MessageId };
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      return { success: false, error: error.message };
    }
  }

  static async sendWelcomeEmail(email, userName) {
    const params = {
      Destination: {
        ToAddresses: [email]
      },
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: this.getWelcomeHtmlTemplate(userName)
          },
          Text: {
            Charset: 'UTF-8',
            Data: this.getWelcomeTextTemplate(userName)
          }
        },
        Subject: {
          Charset: 'UTF-8',
          Data: 'Welcome to Our Platform!'
        }
      },
      Source: process.env.FROM_EMAIL || 'noreply@yourapp.com'
    };

    try {
      const result = await ses.sendEmail(params).promise();
      console.log('✅ Welcome email sent successfully:', result.MessageId);
      return { success: true, messageId: result.MessageId };
    } catch (error) {
      console.error('❌ Failed to send welcome email:', error);
      return { success: false, error: error.message };
    }
  }

  static getPasswordResetHtmlTemplate(userName, resetUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Your Password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 30px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName},</h2>
            <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
            <p>To reset your password, click the button below:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>Or copy and paste this link into your browser:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p><strong>This link will expire in 1 hour for security reasons.</strong></p>
            <p>If you're having trouble, please contact our support team.</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  static getPasswordResetTextTemplate(userName, resetUrl) {
    return `
Hello ${userName},

We received a request to reset your password. If you didn't make this request, you can safely ignore this email.

To reset your password, visit this link:
${resetUrl}

This link will expire in 1 hour for security reasons.

If you're having trouble, please contact our support team.

This is an automated email. Please do not reply to this message.
    `;
  }

  static getWelcomeHtmlTemplate(userName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #28a745; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9f9f9; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Our Platform!</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName},</h2>
            <p>Thank you for joining our platform! We're excited to have you on board.</p>
            <p>You can now access all the features of your account. If you have any questions, feel free to reach out to our support team.</p>
            <p>Happy exploring!</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  static getWelcomeTextTemplate(userName) {
    return `
Hello ${userName},

Thank you for joining our platform! We're excited to have you on board.

You can now access all the features of your account. If you have any questions, feel free to reach out to our support team.

Happy exploring!

This is an automated email. Please do not reply to this message.
    `;
  }

  // Test email functionality
  static async testConnection() {
    try {
      const result = await ses.getIdentityVerificationAttributes({}).promise();
      console.log('✅ AWS SES connection successful');
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ AWS SES connection failed:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = MailService;