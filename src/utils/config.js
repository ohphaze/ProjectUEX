/**
 * Configuration Management for UEX Discord Bot
 * 
 * Supports multiple deployment scenarios:
 * 1. Managed Platforms (Render, Railway, etc.) - Uses platform environment variables
 * 2. Cloud Instances (AWS EC2, GCP Compute, etc.) - Uses .env files
 * 3. Local Development - Uses .env.local or .env files
 * 4. Docker/Container deployments - Uses environment variables
 */

const fs = require('fs');
const path = require('path');

// Environment loading priority:
// 1. Process environment variables (for managed platforms like Render)
// 2. .env.local (for local development override)
// 3. .env (for cloud instances and local development)
function loadEnvironmentVariables() {
  const envFiles = ['.env.local', '.env'];
  
  // Only load .env files if not in a managed platform environment
  // Managed platforms (Render, Railway, etc.) provide variables directly
  const isManagedPlatform = process.env.RENDER || 
                           process.env.RAILWAY_ENVIRONMENT || 
                           process.env.VERCEL ||
                           process.env.HEROKU ||
                           process.env.NODE_ENV === 'production' && process.env.DISCORD_BOT_TOKEN;

  if (!isManagedPlatform) {
    // Try to load .env files for self-hosted deployments
    for (const envFile of envFiles) {
      const envPath = path.join(process.cwd(), envFile);
      if (fs.existsSync(envPath)) {
        console.log(`📁 Loading environment from: ${envFile}`);
        require('dotenv').config({ path: envPath });
        break; // Use the first available file
      }
    }
  } else {
    console.log('☁️ Using managed platform environment variables');
  }
}

// Load environment variables
loadEnvironmentVariables();

// Required environment variables for the bot to function
const requiredVars = [
  'DISCORD_BOT_TOKEN',
  'USER_ENCRYPTION_KEY'
];

// Optional environment variables with defaults
const optionalVars = {
  'PORT': 3000,
  'NODE_ENV': 'production',
  'ENABLE_LOGGING': 'true',
  'UEX_API_BASE_URL': 'https://api.uexcorp.space/2.0',
  'PERSISTENT_DATA_DIR': null // Default to null, will use working directory if not set
};

// Validate required environment variables
function validateConfiguration() {
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n🔧 Configuration Help:');
    console.error('   • For managed platforms (Render/Railway): Set variables in platform dashboard');
    console.error('   • For cloud instances (AWS/GCP): Create .env file with required variables');
    console.error('   • For local development: Copy env.example to .env');
    console.error('   • See README.md for complete setup instructions');
    console.error('\n📝 Note: UEX credentials are provided by users via /register command');
    process.exit(1);
  }

  // Validate encryption key strength
  const encryptionKey = process.env.USER_ENCRYPTION_KEY;
  if (encryptionKey.length < 32) {
    console.error('❌ USER_ENCRYPTION_KEY must be at least 32 characters long for security');
    console.error('   Generate a strong random key: https://www.random.org/strings/');
    process.exit(1);
  }

  console.log('✅ Configuration validated successfully');
}

// Apply defaults for optional variables
function applyDefaults() {
  for (const [key, defaultValue] of Object.entries(optionalVars)) {
    if (!process.env[key]) {
      // Only set the environment variable if defaultValue is not null
      if (defaultValue !== null) {
        process.env[key] = defaultValue.toString();
      }
    }
  }
}

// Initialize configuration
validateConfiguration();
applyDefaults();

// Configuration object with helpful methods
const config = {
  // Discord Configuration
  DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
  
  // UEX Configuration
  UEX_WEBHOOK_SECRET: process.env.UEX_WEBHOOK_SECRET,
  UEX_API_BASE_URL: process.env.UEX_API_BASE_URL,
  
  // Server Configuration
  PORT: parseInt(process.env.PORT, 10),
  NODE_ENV: process.env.NODE_ENV,
  
  // Features
  ENABLE_LOGGING: process.env.ENABLE_LOGGING !== 'false',
  
  // Security
  USER_ENCRYPTION_KEY: process.env.USER_ENCRYPTION_KEY,
  
  // Storage Configuration
  PERSISTENT_DATA_DIR: process.env.PERSISTENT_DATA_DIR,
  
  // Environment Detection
  isProduction: () => config.NODE_ENV === 'production',
  isDevelopment: () => config.NODE_ENV === 'development',
  isManagedPlatform: () => !!(process.env.RENDER || 
                            process.env.RAILWAY_ENVIRONMENT || 
                            process.env.VERCEL ||
                            process.env.HEROKU),
  
  // Configuration Info
  getDeploymentInfo: () => {
    const platform = config.isManagedPlatform() ? 'Managed Platform' : 'Self-Hosted';
    const environment = config.NODE_ENV;
    return { platform, environment, port: config.PORT };
  },
  
  // Health Check Info
  getHealthInfo: () => ({
    status: 'healthy',
    environment: config.NODE_ENV,
    platform: config.isManagedPlatform() ? 'managed' : 'self-hosted',
    features: {
      logging: config.ENABLE_LOGGING,
      webhookValidation: !!config.UEX_WEBHOOK_SECRET,
      persistentStorage: !!config.PERSISTENT_DATA_DIR
    },
    timestamp: new Date().toISOString()
  })
};

// Log deployment configuration on startup
if (config.ENABLE_LOGGING) {
  const deployInfo = config.getDeploymentInfo();
  console.log(`🚀 Bot Configuration:`);
  console.log(`   Platform: ${deployInfo.platform}`);
  console.log(`   Environment: ${deployInfo.environment}`);
  console.log(`   Port: ${deployInfo.port}`);
  console.log(`   Webhook Secret: ${config.UEX_WEBHOOK_SECRET ? 'Configured' : 'Not Set'}`);
  console.log(`   Logging: ${config.ENABLE_LOGGING ? 'Enabled' : 'Disabled'}`);
  console.log(`   Persistent Storage: ${config.PERSISTENT_DATA_DIR ? config.PERSISTENT_DATA_DIR : 'Working Directory'}`);
}

module.exports = config; 