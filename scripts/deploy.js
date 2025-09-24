#!/usr/bin/env node

/**
 * Deployment helper script for UEX Discord Bot
 * Helps users deploy the updated bot with keep-alive mechanism
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 UEX Discord Bot Deployment Helper');
console.log('=====================================\n');

// Check if we're in the correct directory
const packagePath = path.join(__dirname, '..', 'package.json');
if (!fs.existsSync(packagePath)) {
  console.error('❌ Error: Run this script from the root directory of the UEX Discord Bot');
  process.exit(1);
}

// Read package.json to get project info
const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

console.log(`📦 Project: ${packageData.name} v${packageData.version}`);
console.log(`📁 Directory: ${process.cwd()}\n`);

console.log('🔄 Recent Updates:');
console.log('• ✅ Keep-alive mechanism added to prevent service sleeping');
console.log('• ✅ Improved webhook handling for better reliability');
console.log('• ✅ Enhanced logging for debugging webhook issues');
console.log('• ✅ Asynchronous webhook processing to prevent timeouts\n');

console.log('📋 Deployment Steps:');
console.log('1. Ensure your code is committed to Git');
console.log('2. Push changes to your GitHub repository');
console.log('3. Render will automatically rebuild and deploy');
console.log('4. Monitor logs for "Keep-alive ping successful" messages\n');

console.log('🔧 Environment Variables Required:');
console.log('• DISCORD_BOT_TOKEN - Your Discord bot token');
console.log('• USER_ENCRYPTION_KEY - 32-character encryption key');
console.log('• UEX_WEBHOOK_SECRET - (Optional) Webhook validation secret\n');

console.log('🎯 Testing Your Deployment:');
console.log('1. Visit: https://YOUR_SERVICE_URL/health');
console.log('2. Should return bot status immediately');
console.log('3. Look for keep-alive messages in logs every 10 minutes');
console.log('4. Test Discord commands to ensure bot is responsive\n');

console.log('📊 Monitoring:');
console.log('• Check Render dashboard logs for webhook processing');
console.log('• Monitor "UEX webhook received" messages');
console.log('• Look for processing times under 1000ms');
console.log('• Verify keep-alive pings every 10 minutes\n');

console.log('🆘 If you\'re still missing notifications:');
console.log('• Verify webhook URL with UEX Corp');
console.log('• Check webhook secret matches environment variable');
console.log('• Test webhook manually with curl (see docs)');
console.log('• Ensure Discord bot has DM permissions\n');

console.log('✅ Deployment preparation complete!');
console.log('📖 For detailed instructions, see: docs/RENDER-DEPLOYMENT.md'); 