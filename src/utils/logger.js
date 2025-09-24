/**
 * Simple Logging Utility
 * Provides consistent logging across the UEX Discord Bot
 */

const config = require('./config');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

// Format timestamp for logs
function getTimestamp() {
  return new Date().toISOString();
}

// Core logging function
function log(level, message, data = null) {
  if (!config.ENABLE_LOGGING && level !== 'error') {
    return;
  }

  const timestamp = getTimestamp();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  
  // Color-code the output
  let coloredPrefix;
  switch (level) {
    case 'error':
      coloredPrefix = `${colors.red}${prefix}${colors.reset}`;
      break;
    case 'warn':
      coloredPrefix = `${colors.yellow}${prefix}${colors.reset}`;
      break;
    case 'info':
      coloredPrefix = `${colors.blue}${prefix}${colors.reset}`;
      break;
    case 'success':
      coloredPrefix = `${colors.green}${prefix}${colors.reset}`;
      break;
    case 'debug':
      coloredPrefix = `${colors.gray}${prefix}${colors.reset}`;
      break;
    default:
      coloredPrefix = prefix;
  }

  // Log the message
  console.log(`${coloredPrefix} ${message}`);
  
  // Log additional data if provided
  if (data) {
    console.log(`${colors.gray}${JSON.stringify(data, null, 2)}${colors.reset}`);
  }
}

// Exported logging functions
module.exports = {
  info: (message, data) => log('info', message, data),
  error: (message, data) => log('error', message, data),
  warn: (message, data) => log('warn', message, data),
  success: (message, data) => log('success', message, data),
  debug: (message, data) => {
    if (config.isDevelopment()) {
      log('debug', message, data);
    }
  },
  
  // Special logging functions for specific contexts
  discord: (message, data) => log('info', `[DISCORD] ${message}`, data),
  uex: (message, data) => log('info', `[UEX] ${message}`, data),
  webhook: (message, data) => log('info', `[WEBHOOK] ${message}`, data),
  command: (message, data) => log('info', `[COMMAND] ${message}`, data)
}; 