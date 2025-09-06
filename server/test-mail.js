const MailService = require('./services/mail.service');

async function testMailService() {
  console.log('🧪 Testing AWS SES Mail Service...\n');

  try {
    // Test 1: Check AWS SES connection
    console.log('1️⃣ Testing AWS SES connection...');
    const connectionTest = await MailService.testConnection();
    
    if (connectionTest.success) {
      console.log('✅ AWS SES connection successful\n');
    } else {
      console.log('❌ AWS SES connection failed:', connectionTest.error);
      console.log('Please check your AWS credentials and region\n');
      return;
    }

    // Test 2: Send welcome email
    console.log('2️⃣ Testing welcome email...');
    const welcomeResult = await MailService.sendWelcomeEmail(
      'shashidhar.codes@gmail.com',
      'Shashidhar'
    );
    
    if (welcomeResult.success) {
      console.log('✅ Welcome email sent successfully');
      console.log('Message ID:', welcomeResult.messageId);
    } else {
      console.log('❌ Welcome email failed:', welcomeResult.error);
    }
    console.log('');

    // Test 3: Send password reset email
    console.log('3️⃣ Testing password reset email...');
    const resetResult = await MailService.sendPasswordResetEmail(
      'shashidhar.codes@gmail.com',
      'test-reset-token-123456',
      'Shashidhar'
    );
    
    if (resetResult.success) {
      console.log('✅ Password reset email sent successfully');
      console.log('Message ID:', resetResult.messageId);
    } else {
      console.log('❌ Password reset email failed:', resetResult.error);
    }
    console.log('');

    console.log('🎉 Mail service testing completed!');
    console.log('📧 Check your email inbox for test messages.');

  } catch (error) {
    console.error('❌ Mail service test failed:', error.message);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  testMailService();
}

module.exports = testMailService;