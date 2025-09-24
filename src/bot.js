/**
 * UEX Discord Bot - Main Entry Point
 * Initializes Discord client and Express server for personal bot deployment
 */

const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const express = require('express');
const fs = require('fs');
const path = require('path');

const config = require('./utils/config');
const logger = require('./utils/logger');
const webhookHandler = require('./handlers/webhook');
const buttonHandler = require('./handlers/button-interactions');

// Initialize Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ]
});

// Initialize Express app
const app = express();
app.use(express.json());
app.use(express.raw({ type: 'application/json' }));

// Collection to hold commands
client.commands = new Collection();

/**
 * Load all commands from the commands directory
 */
async function loadCommands() {
  logger.info('Loading Discord commands...');
  
  const commandsPath = path.join(__dirname, 'commands');
  
  if (!fs.existsSync(commandsPath)) {
    logger.warn('Commands directory not found, creating it...');
    fs.mkdirSync(commandsPath, { recursive: true });
    return;
  }

  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    try {
      const command = require(filePath);
      
      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        logger.success(`Loaded command: ${command.data.name}`);
      } else {
        logger.warn(`Command file ${file} is missing required "data" or "execute" property`);
      }
    } catch (error) {
      logger.error(`Error loading command ${file}`, { error: error.message });
    }
  }
}

/**
 * Register commands with Discord
 */
async function registerCommands() {
  const commands = [];
  
  for (const command of client.commands.values()) {
    commands.push(command.data.toJSON());
  }

  if (commands.length === 0) {
    logger.warn('No commands to register');
    return;
  }

  try {
    logger.info(`Registering ${commands.length} slash commands...`);
    
    const rest = new REST({ version: '10' }).setToken(config.DISCORD_BOT_TOKEN);
    
    const data = await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );

    logger.success(`Successfully registered ${data.length} slash commands`);
  } catch (error) {
    logger.error('Failed to register slash commands', { error: error.message });
  }
}

// Discord event handlers
client.once('ready', async () => {
  logger.success(`Discord bot logged in as ${client.user.tag}`);
  logger.info(`Bot ID: ${client.user.id}`);
  
  // Register commands
  await registerCommands();
  
  // Multi-user bot is ready - no test DM sent since there's no specific user ID
  logger.info('Multi-user bot ready - users can register with /register command');
  
  // Start keep-alive mechanism to prevent service from sleeping
  startKeepAlive();
  
  logger.success('🚀 UEX Discord Bot is ready for deployment!');
});

client.on('interactionCreate', async interaction => {
  // Handle slash commands
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);

    if (!command) {
      logger.warn(`Unknown command: ${interaction.commandName}`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      logger.error(`Error executing command ${interaction.commandName}`, {
        error: error.message,
        userId: interaction.user.id
      });
      
      const errorMessage = 'There was an error while executing this command!';
      
      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: errorMessage, ephemeral: true });
        } else {
          await interaction.reply({ content: errorMessage, ephemeral: true });
        }
      } catch (replyError) {
        logger.error('Failed to send error reply', { error: replyError.message });
      }
    }
    return;
  }

  // Handle button interactions
  if (interaction.isButton()) {
    try {
      await buttonHandler.handleButtonInteraction(interaction);
    } catch (error) {
      logger.error('Button interaction error', {
        error: error.message,
        customId: interaction.customId,
        userId: interaction.user.id
      });
    }
    return;
  }

  // Handle modal submit interactions
  if (interaction.isModalSubmit()) {
    try {
      await buttonHandler.handleModalSubmit(interaction);
    } catch (error) {
      logger.error('Modal submit error', {
        error: error.message,
        customId: interaction.customId,
        userId: interaction.user.id
      });
    }
    return;
  }
});

client.on('error', error => {
  logger.error('Discord client error', { error: error.message, stack: error.stack });
});

client.on('warn', warning => {
  logger.warn('Discord client warning', { warning });
});

// Express routes
// Health check endpoint
app.get('/health', (req, res) => {
  try {
    const healthInfo = config.getHealthInfo();
    const isDiscordReady = client.isReady();
    
    res.json({
      ...healthInfo,
      discord: {
        ready: isDiscordReady,
        user: isDiscordReady ? client.user.tag : 'Not connected',
        guilds: isDiscordReady ? client.guilds.cache.size : 0
      },
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version
      }
    });
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(500).json({ 
      status: 'error', 
      message: error.message,
      platform: config.isManagedPlatform() ? 'managed' : 'self-hosted'
    });
  }
});

app.post('/webhook/uex', async (req, res) => {
  try {
    const signature = req.headers['x-uex-signature'] || req.headers['X-UEX-Signature'];
    const rawBody = JSON.stringify(req.body);
    
    logger.webhook('UEX webhook received');
    
    // Respond quickly to prevent timeouts while processing
    res.status(200).json({ success: true, message: 'Webhook received and processing' });
    
    // Process webhook asynchronously to prevent timeouts
    setImmediate(async () => {
      const result = await webhookHandler.processUEXWebhook(client, rawBody, signature);
      
      if (result.success) {
        logger.success('Webhook processed successfully', { message: result.message });
      } else {
        logger.error('Webhook processing failed', { error: result.error });
      }
    });
    
  } catch (error) {
    logger.error('Webhook endpoint error', { error: error.message });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Test endpoint for DM functionality - requires user ID
app.post('/test/dm/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID required' });
    }
    
    const result = await webhookHandler.sendTestDM(client, userId);
    
    if (result.success) {
      res.json({ success: true, message: 'Test DM sent successfully' });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    logger.error('Test DM endpoint error', { error: error.message });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Express error', { error: error.message, stack: error.stack });
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

/**
 * Initialize and start the bot
 */
async function startBot() {
  try {
    logger.info('🚀 Starting UEX Discord Bot...');
    logger.info(`Environment: ${config.NODE_ENV}`);
    logger.info(`Port: ${config.PORT}`);
    
    // Load commands
    await loadCommands();
    
    // Start Discord client
    logger.info('Connecting to Discord...');
    await client.login(config.DISCORD_BOT_TOKEN);
    
    // Start Express server
    const server = app.listen(config.PORT, () => {
      logger.success(`🌐 Express server running on port ${config.PORT}`);
      logger.success('✅ UEX Discord Bot deployment complete!');
    });
    
    // Graceful shutdown
    process.on('SIGINT', () => {
      logger.info('Received SIGINT, shutting down gracefully...');
      server.close(() => {
        client.destroy();
        process.exit(0);
      });
    });
    
    process.on('SIGTERM', () => {
      logger.info('Received SIGTERM, shutting down gracefully...');
      server.close(() => {
        client.destroy();
        process.exit(0);
      });
    });
    
  } catch (error) {
    logger.error('Failed to start bot', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

/**
 * Keep-alive mechanism to prevent service from sleeping on free hosting platforms
 * Pings the health endpoint every 10 minutes
 */
function startKeepAlive() {
  // Only run keep-alive if we have a service URL (deployed environment)
  if (process.env.RENDER_EXTERNAL_URL || process.env.RENDER_SERVICE_URL) {
    const keepAliveInterval = 10 * 60 * 1000; // 10 minutes in milliseconds
    
    setInterval(async () => {
      try {
        const serviceUrl = process.env.RENDER_EXTERNAL_URL || process.env.RENDER_SERVICE_URL;
        const response = await fetch(`${serviceUrl}/health`);
        
        if (response.ok) {
          logger.info('Keep-alive ping successful');
        } else {
          logger.warn('Keep-alive ping failed', { status: response.status });
        }
      } catch (error) {
        logger.warn('Keep-alive ping error', { error: error.message });
      }
    }, keepAliveInterval);
    
    logger.info('Keep-alive mechanism started - service will stay awake');
  } else {
    logger.info('Keep-alive disabled - not in deployed environment');
  }
}

// Start the bot
if (require.main === module) {
  startBot();
}

module.exports = { client, app }; 