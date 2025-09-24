#!/usr/bin/env node

/**
 * Deployment Validation Script for UEX Discord Bot
 * 
 * This script validates your environment configuration and checks
 * deployment readiness for various platforms (Render, AWS, GCP, etc.)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = '') {
  console.log(color + message + colors.reset);
}

function logSuccess(message) {
  log('✅ ' + message, colors.green);
}

function logError(message) {
  log('❌ ' + message, colors.red);
}

function logWarning(message) {
  log('⚠️  ' + message, colors.yellow);
}

function logInfo(message) {
  log('ℹ️  ' + message, colors.blue);
}

function logSection(title) {
  log('\n' + '='.repeat(50), colors.cyan);
  log(title.toUpperCase(), colors.cyan + colors.bold);
  log('='.repeat(50), colors.cyan);
}

// Load environment variables based on deployment scenario
function loadEnvironment() {
  const envFiles = ['.env.local', '.env'];
  let envLoaded = false;

  // Check if we're in a managed platform
  const isManagedPlatform = process.env.RENDER || 
                           process.env.RAILWAY_ENVIRONMENT || 
                           process.env.VERCEL ||
                           process.env.HEROKU ||
                           (process.env.NODE_ENV === 'production' && process.env.DISCORD_BOT_TOKEN);

  if (!isManagedPlatform) {
    // Try to load .env files for self-hosted deployments
    for (const envFile of envFiles) {
      const envPath = path.join(process.cwd(), envFile);
      if (fs.existsSync(envPath)) {
        logInfo(`Loading environment from: ${envFile}`);
        require('dotenv').config({ path: envPath });
        envLoaded = true;
        break;
      }
    }
    
    if (!envLoaded) {
      logWarning('No .env file found. Checking for environment variables...');
    }
  } else {
    logInfo('Detected managed platform environment');
  }

  return { isManagedPlatform, envLoaded };
}

// Validate required environment variables
function validateEnvironmentVariables() {
  logSection('Environment Variables Validation');

  const required = [
    { name: 'DISCORD_BOT_TOKEN', description: 'Discord bot token' },
    { name: 'USER_ENCRYPTION_KEY', description: 'User credential encryption key' }
  ];

  const optional = [
    { name: 'UEX_WEBHOOK_SECRET', description: 'UEX webhook validation secret' },
    { name: 'PORT', description: 'Server port', default: '3000' },
    { name: 'NODE_ENV', description: 'Application environment', default: 'production' }
  ];

  let allValid = true;

  // Check required variables
  log('\nRequired Variables:');
  for (const { name, description } of required) {
    const value = process.env[name];
    if (value) {
      logSuccess(`${name}: Configured (${description})`);
      
      // Additional validation for specific variables
      if (name === 'USER_ENCRYPTION_KEY' && value.length < 32) {
        logError(`${name}: Must be at least 32 characters long for security`);
        allValid = false;
      } else if (name === 'DISCORD_BOT_TOKEN' && !value.startsWith('Bot ') && !value.includes('.')) {
        logWarning(`${name}: Format might be incorrect (should contain dots for JWT format)`);
      }
    } else {
      logError(`${name}: Missing (${description})`);
      allValid = false;
    }
  }

  // Check optional variables
  log('\nOptional Variables:');
  for (const { name, description, default: defaultValue } of optional) {
    const value = process.env[name];
    if (value) {
      logSuccess(`${name}: ${value} (${description})`);
    } else if (defaultValue) {
      logInfo(`${name}: Using default '${defaultValue}' (${description})`);
    } else {
      logWarning(`${name}: Not set (${description})`);
    }
  }

  return allValid;
}

// Check Node.js and npm versions
function validateNodeEnvironment() {
  logSection('Node.js Environment Validation');

  const nodeVersion = process.version;
  const nodeMajor = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (nodeMajor >= 18) {
    logSuccess(`Node.js version: ${nodeVersion} (✓ Compatible)`);
  } else {
    logError(`Node.js version: ${nodeVersion} (✗ Requires Node.js 18+)`);
    return false;
  }

  try {
    const npmVersion = require('child_process').execSync('npm --version', { encoding: 'utf8' }).trim();
    logSuccess(`npm version: ${npmVersion}`);
  } catch (error) {
    logWarning('npm not found or not accessible');
  }

  return true;
}

// Check file structure and dependencies
function validateProjectStructure() {
  logSection('Project Structure Validation');

  const requiredFiles = [
    'package.json',
    'src/bot.js',
    'src/utils/config.js',
    'src/utils/user-manager.js',
    'src/commands/register.js',
    'src/handlers/webhook.js'
  ];

  const optionalFiles = [
    '.env',
    '.env.local',
    'ecosystem.config.js',
    'Dockerfile'
  ];

  let allPresent = true;

  log('\nRequired Files:');
  for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
      logSuccess(`${file}: Present`);
    } else {
      logError(`${file}: Missing`);
      allPresent = false;
    }
  }

  log('\nOptional Files:');
  for (const file of optionalFiles) {
    if (fs.existsSync(file)) {
      logSuccess(`${file}: Present`);
    } else {
      logInfo(`${file}: Not present (optional)`);
    }
  }

  // Check package.json
  if (fs.existsSync('package.json')) {
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const requiredDeps = ['discord.js', 'express', 'dotenv'];
      
      log('\nDependencies Check:');
      for (const dep of requiredDeps) {
        if (packageJson.dependencies && packageJson.dependencies[dep]) {
          logSuccess(`${dep}: v${packageJson.dependencies[dep]}`);
        } else {
          logError(`${dep}: Missing from dependencies`);
          allPresent = false;
        }
      }

      // Check scripts
      if (packageJson.scripts && packageJson.scripts.start) {
        logSuccess(`Start script: ${packageJson.scripts.start}`);
      } else {
        logWarning('No start script defined in package.json');
      }

    } catch (error) {
      logError('package.json: Invalid JSON format');
      allPresent = false;
    }
  }

  return allPresent;
}

// Test network connectivity
function testNetworkConnectivity() {
  logSection('Network Connectivity Test');

  return new Promise((resolve) => {
    const testUrls = [
      { name: 'Discord API', url: 'https://discord.com/api/v10/gateway' },
      { name: 'UEX API', url: 'https://api.uexcorp.space/2.0/health' }
    ];

    let completedTests = 0;
    let allPassed = true;

    testUrls.forEach(({ name, url }) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.pathname,
        method: 'GET',
        timeout: 5000
      };

      const req = https.request(options, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          logSuccess(`${name}: Accessible (${res.statusCode})`);
        } else {
          logWarning(`${name}: Unexpected status ${res.statusCode}`);
        }
        
        completedTests++;
        if (completedTests === testUrls.length) {
          resolve(allPassed);
        }
      });

      req.on('timeout', () => {
        logWarning(`${name}: Connection timeout`);
        allPassed = false;
        completedTests++;
        if (completedTests === testUrls.length) {
          resolve(allPassed);
        }
      });

      req.on('error', (error) => {
        logWarning(`${name}: Connection failed (${error.message})`);
        allPassed = false;
        completedTests++;
        if (completedTests === testUrls.length) {
          resolve(allPassed);
        }
      });

      req.setTimeout(5000);
      req.end();
    });
  });
}

// Detect deployment platform
function detectDeploymentPlatform() {
  logSection('Deployment Platform Detection');

  const platforms = [
    { name: 'Render', detect: () => !!process.env.RENDER },
    { name: 'Railway', detect: () => !!process.env.RAILWAY_ENVIRONMENT },
    { name: 'Vercel', detect: () => !!process.env.VERCEL },
    { name: 'Heroku', detect: () => !!process.env.HEROKU },
    { name: 'AWS EC2', detect: () => fs.existsSync('/sys/hypervisor/uuid') || fs.existsSync('/sys/class/dmi/id/product_uuid') },
    { name: 'Google Cloud', detect: () => fs.existsSync('/sys/class/dmi/id/product_name') && 
                                        fs.readFileSync('/sys/class/dmi/id/product_name', 'utf8').includes('Google') },
    { name: 'Docker', detect: () => fs.existsSync('/.dockerenv') },
    { name: 'Local Development', detect: () => process.env.NODE_ENV !== 'production' }
  ];

  const detected = platforms.filter(platform => {
    try {
      return platform.detect();
    } catch (error) {
      return false;
    }
  });

  if (detected.length > 0) {
    detected.forEach(platform => {
      logSuccess(`Platform: ${platform.name}`);
    });
  } else {
    logInfo('Platform: Self-hosted or unknown');
  }

  return detected;
}

// Generate deployment recommendations
function generateRecommendations(validationResults) {
  logSection('Deployment Recommendations');

  const { envValid, nodeValid, structureValid, platformInfo } = validationResults;

  if (!envValid) {
    log('\n🔧 Environment Variable Issues:');
    log('• Copy env.example to .env and fill in your values');
    log('• For managed platforms: Set variables in platform dashboard');
    log('• Generate a strong USER_ENCRYPTION_KEY (32+ characters)');
    log('• Get DISCORD_BOT_TOKEN from Discord Developer Portal');
  }

  if (!nodeValid) {
    log('\n📦 Node.js Environment Issues:');
    log('• Install Node.js 18 or later from https://nodejs.org/');
    log('• Run: npm install to install dependencies');
  }

  if (!structureValid) {
    log('\n📁 Project Structure Issues:');
    log('• Ensure all required files are present');
    log('• Run: npm install to install missing dependencies');
    log('• Check that src/ directory contains all required files');
  }

  log('\n🚀 Deployment Options:');
  log('• FREE: GCP Always Free Tier (e2-micro, truly free forever)');
  log('• FREE: Render Free Tier (750 hours/month, auto-sleep)');
  log('• PAID: AWS Lightsail ($3.50/month, simple deployment)');
  log('• PAID: Render Starter ($7/month, no sleep, persistent storage)');

  log('\n📚 Deployment Guides:');
  log('• docs/RENDER-DEPLOYMENT.md - Render platform guide');
  log('• docs/AWS-DEPLOYMENT.md - Amazon Web Services guide');
  log('• docs/GCP-DEPLOYMENT.md - Google Cloud Platform guide');

  log('\n🔍 Next Steps:');
  if (envValid && nodeValid && structureValid) {
    logSuccess('✅ All validations passed! Ready for deployment.');
    log('• Choose your preferred hosting platform');
    log('• Follow the corresponding deployment guide');
    log('• Test your bot with /health endpoint after deployment');
  } else {
    logWarning('⚠️  Please fix the issues above before deploying.');
    log('• Address environment variable issues');
    log('• Ensure Node.js 18+ is installed');
    log('• Verify all required files are present');
  }
}

// Main validation function
async function runValidation() {
  log(colors.cyan + colors.bold + '🤖 UEX Discord Bot Deployment Validation' + colors.reset);
  log('This script validates your environment and deployment readiness.\n');

  // Load environment
  const { isManagedPlatform } = loadEnvironment();

  // Run all validations
  const envValid = validateEnvironmentVariables();
  const nodeValid = validateNodeEnvironment();
  const structureValid = validateProjectStructure();
  const platformInfo = detectDeploymentPlatform();
  
  logInfo('Testing network connectivity...');
  const networkValid = await testNetworkConnectivity();

  // Generate recommendations
  generateRecommendations({
    envValid,
    nodeValid,
    structureValid,
    networkValid,
    platformInfo,
    isManagedPlatform
  });

  // Final summary
  logSection('Validation Summary');
  
  const results = [
    { name: 'Environment Variables', valid: envValid },
    { name: 'Node.js Environment', valid: nodeValid },
    { name: 'Project Structure', valid: structureValid },
    { name: 'Network Connectivity', valid: networkValid }
  ];

  results.forEach(({ name, valid }) => {
    if (valid) {
      logSuccess(`${name}: ✅ Passed`);
    } else {
      logError(`${name}: ❌ Failed`);
    }
  });

  const allPassed = results.every(r => r.valid);
  
  log('\n' + '='.repeat(50));
  if (allPassed) {
    logSuccess('🎉 All validations passed! Your bot is ready for deployment.');
  } else {
    logError('❌ Some validations failed. Please fix the issues above.');
  }
  log('='.repeat(50));

  process.exit(allPassed ? 0 : 1);
}

// Run validation if called directly
if (require.main === module) {
  runValidation().catch(error => {
    logError(`Validation failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runValidation }; 