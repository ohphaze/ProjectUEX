/**
 * Help Command
 * Comprehensive help system for UEX Discord Bot users
 */

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const logger = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Get comprehensive help with the UEX Discord Bot')
    .addStringOption(option =>
      option
        .setName('topic')
        .setDescription('Specific help topic')
        .setRequired(false)
        .addChoices(
          { name: 'Registration Guide', value: 'registration' },
          { name: 'Available Commands', value: 'commands' },
          { name: 'Getting UEX Credentials', value: 'credentials' },
          { name: 'Privacy & Security', value: 'privacy' },
          { name: 'Quick Start Guide', value: 'quickstart' }
        )
    ),

  async execute(interaction) {
    try {
      const topic = interaction.options.getString('topic') || 'quickstart';
      
      logger.command('Help command used', {
        userId: interaction.user.id,
        username: interaction.user.username,
        topic
      });

      const { embed, buttons } = buildHelpResponse(topic);

      await interaction.reply({ embeds: [embed], components: buttons, ephemeral: true });

    } catch (error) {
      logger.error('Help command error', { 
        error: error.message,
        userId: interaction.user.id 
      });

      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Help Error')
        .setDescription('Failed to display help information. Please try again.')
        .setColor(0xff0000)
        .setFooter({ text: 'If this continues, contact the bot administrator' });

      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }
};

/**
 * Build help response with embed and navigation buttons
 */
function buildHelpResponse(topic) {
  let embed;
  
  switch (topic) {
    case 'quickstart':
      embed = new EmbedBuilder()
        .setTitle('🚀 UEX Discord Bot - Quick Start Guide')
        .setDescription('Get started with the UEX Discord Bot in 3 easy steps:')
        .setColor(0x0099ff)
        .addFields([
          {
            name: '📋 Step 1: Get Your UEX Credentials',
            value: '• **Bearer Token**: Go to [UEX Corp](https://uexcorp.space) → My Apps → Copy Bearer Token\n' +
                   '• **Secret Key**: Go to Account Settings → Generate/Copy Secret Key\n' +
                   '• Click "🔑 Get Credentials" below for detailed instructions',
            inline: false
          },
          {
            name: '🔐 Step 2: Register with the Bot',
            value: '```/register api_token:YOUR_BEARER_TOKEN secret_key:YOUR_SECRET_KEY```\n' +
                   '⚠️ **Important**: Use this command in DMs or private channels only!\n' +
                   '• Click "📝 Registration Guide" below for complete help',
            inline: false
          },
          {
            name: '⚡ Step 3: Start Trading',
            value: '• `/marketplace-listings` - Browse marketplace\n' +
                   '• `/negotiations` - View your active negotiations\n' +
                   '• `/reply` - Respond to negotiations\n' +
                   '• Click "🤖 All Commands" below for complete command list',
            inline: false
          },
          {
            name: '🔒 Privacy Options',
            value: '• **Private Server**: Create your own Discord server, invite only the bot\n' +
                   '• **Private Channels**: Use private channels with restricted permissions\n' +
                   '• **DM Commands**: All registration commands work in DMs\n' +
                   '• Click "🔒 Privacy & Security" below for detailed privacy information',
            inline: false
          }
        ])
        .setFooter({ text: 'UEX Discord Bot • Multi-User Trading Assistant' })
        .setTimestamp();
      break;

    case 'registration':
      embed = new EmbedBuilder()
        .setTitle('📝 Registration Guide')
        .setDescription('Complete guide to registering your UEX credentials with the bot:')
        .setColor(0x00ff00)
        .addFields([
          {
            name: '🔑 Before You Start',
            value: '• Make sure you have a UEX Corp account at [uexcorp.space](https://uexcorp.space)\n' +
                   '• You\'ll need both a Bearer Token AND a Secret Key\n' +
                   '• Choose your privacy setup (DMs, private server, or private channels)',
            inline: false
          },
          {
            name: '📱 Registration Command',
            value: '```/register api_token:YOUR_BEARER_TOKEN secret_key:YOUR_SECRET_KEY```\n' +
                   '**Replace the placeholders with your actual credentials:**\n' +
                   '• `YOUR_BEARER_TOKEN` = Bearer Token from UEX My Apps\n' +
                   '• `YOUR_SECRET_KEY` = Secret Key from UEX Account Settings',
            inline: false
          },
          {
            name: '🛡️ Privacy & Security',
            value: '• **ALWAYS** register in DMs or private channels\n' +
                   '• Never share your credentials in public channels\n' +
                   '• Your credentials are encrypted with AES-256-GCM\n' +
                   '• Only you can access your data - complete user isolation',
            inline: false
          },
          {
            name: '✅ After Registration',
            value: '• Use `/negotiations` to check your current negotiations\n' +
                   '• The bot will send you DM notifications for new activity\n' +
                   '• Use `/unregister` if you need to remove your credentials\n' +
                   '• All trading commands are now available to you',
            inline: false
          }
        ])
        .setFooter({ text: 'Registration is completely secure and private' })
        .setTimestamp();
      break;

    case 'commands':
      embed = new EmbedBuilder()
        .setTitle('🤖 Available Bot Commands')
        .setDescription('Complete list of all available commands organized by category:')
        .setColor(0x00ff00)
        .addFields([
          {
            name: '📝 Account Management',
            value: '• `/register` - Register your UEX API credentials with the bot\n' +
                   '• `/unregister` - Remove your credentials from the bot\n' +
                   '• `/help` - Show help information (this command)',
            inline: false
          },
          {
            name: '🏪 Marketplace Commands',
            value: '• `/marketplace-listings` - View active marketplace listings with pagination and filters\n' +
                   '• `/marketplace-add` - Create new marketplace listings for your items\n' +
                   '• `/negotiations` - View and manage your marketplace negotiations',
            inline: false
          },
          {
            name: '💬 Trading & Communication',
            value: '• `/reply` - Reply to UEX negotiations with custom messages\n' +
                   '• **Interactive Buttons** - Click "Reply" in notification messages\n' +
                   '• **Automatic DMs** - Receive notifications for negotiation updates',
            inline: false
          },
          {
            name: '🔧 Admin Commands (Admins Only)',
            value: '• `/admin stats` - View bot usage statistics and user counts\n' +
                   '• `/admin info` - View bot configuration, uptime, and system status\n' +
                   '• Requires Discord Administrator permissions',
            inline: false
          },
          {
            name: '🎯 Command Tips',
            value: '• All commands work in DMs, private channels, and servers\n' +
                   '• Sensitive responses are ephemeral (only you can see them)\n' +
                   '• Registration commands should be used in private for security\n' +
                   '• Interactive buttons provide quick access to common actions',
            inline: false
          }
        ])
        .setFooter({ text: 'All commands are available 24/7 with automatic bot wake-up' })
        .setTimestamp();
      break;

    case 'credentials':
      embed = new EmbedBuilder()
        .setTitle('🔑 How to Get Your UEX API Credentials')
        .setDescription('Step-by-step guide to obtaining your UEX Corp API credentials:')
        .setColor(0xff9900)
        .addFields([
          {
            name: '📱 Step 1: Get Bearer Token (API Token)',
            value: '1. Login to [UEX Corp](https://uexcorp.space)\n' +
                   '2. Navigate to **"My Apps"** section in your dashboard\n' +
                   '3. Create a new application OR select an existing one\n' +
                   '4. Copy the **"Bearer Token"** from your application\n' +
                   '5. This becomes your `api_token` parameter for registration',
            inline: false
          },
          {
            name: '🔐 Step 2: Get Secret Key',
            value: '1. Go to **"Account Settings"** in your UEX profile\n' +
                   '2. Find the **"Secret Key"** or **"API Secret"** section\n' +
                   '3. Generate a new secret key if you don\'t have one\n' +
                   '4. Copy the secret key (keep it extremely private!)\n' +
                   '5. This becomes your `secret_key` parameter for registration',
            inline: false
          },
          {
            name: '⚠️ Security Warning',
            value: '• **NEVER** share your secret key with anyone\n' +
                   '• **NEVER** post credentials in public Discord channels\n' +
                   '• **ALWAYS** register in DMs or private channels\n' +
                   '• Regenerate keys if you suspect they\'ve been compromised',
            inline: false
          },
          {
            name: '✅ Registration Example',
            value: '```\n/register api_token:eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9... secret_key:your-secret-key-here\n```\n' +
                   '*(Replace with your actual credentials)*',
            inline: false
          },
          {
            name: '🔗 Useful Links',
            value: '• [UEX Corp Website](https://uexcorp.space)\n' +
                   '• [UEX API Documentation](https://uexcorp.space/api)\n' +
                   '• [My Apps Dashboard](https://uexcorp.space/apps)\n' +
                   '• [Account Settings](https://uexcorp.space/settings)',
            inline: false
          }
        ])
        .setFooter({ text: 'Questions about UEX credentials? Contact UEX Corp support' })
        .setTimestamp();
      break;

    case 'privacy':
      embed = new EmbedBuilder()
        .setTitle('🔒 Privacy & Security Features')
        .setDescription('Your security and privacy are our top priorities. Here are your options:')
        .setColor(0xff0066)
        .addFields([
          {
            name: '🔐 Bank-Level Security',
            value: '• **AES-256-GCM Encryption**: Military-grade encryption for all credentials\n' +
                   '• **User Isolation**: Complete separation between users\n' +
                   '• **No Shared Data**: You can only access your own negotiations\n' +
                   '• **Secure Storage**: Encrypted file-based storage, no database vulnerabilities',
            inline: false
          },
          {
            name: '🏠 Privacy Option 1: Private Discord Server (Recommended)',
            value: '• Create your own Discord server\n' +
                   '• Invite only the UEX bot\n' +
                   '• Complete isolation from other users\n' +
                   '• Like having your own personal bot instance',
            inline: false
          },
          {
            name: '🔒 Privacy Option 2: Private Channels',
            value: '• Create private channels in existing servers\n' +
                   '• Set channel permissions to restrict access\n' +
                   '• Perfect for teams or small groups\n' +
                   '• Use role-based permissions for fine control',
            inline: false
          },
          {
            name: '👥 Privacy Option 3: Shared Servers with Ephemeral Commands',
            value: '• All bot responses are ephemeral (only you can see them)\n' +
                   '• Your credentials remain encrypted and isolated\n' +
                   '• Convenient for large Discord communities\n' +
                   '• Other users cannot see your trading activity',
            inline: false
          },
          {
            name: '🛡️ Best Security Practices',
            value: '• **Always** register using DMs or private channels\n' +
                   '• **Never** share your UEX secret key with anyone\n' +
                   '• Use `/unregister` if you suspect credential compromise\n' +
                   '• Keep your Discord account secure with 2FA enabled\n' +
                   '• Regularly review your UEX account for unauthorized access',
            inline: false
          }
        ])
        .setFooter({ text: 'Questions about security? Contact the bot administrator' })
        .setTimestamp();
      break;

    default:
      embed = new EmbedBuilder()
        .setTitle('❓ Help Topics Available')
        .setDescription('Choose a specific help topic for detailed information:')
        .setColor(0x666666)
        .addFields([
          {
            name: '📚 Available Help Topics',
            value: '• **🚀 Quick Start** - Get started in 3 easy steps\n' +
                   '• **📝 Registration** - Complete registration guide\n' +
                   '• **🤖 Commands** - All available bot commands\n' +
                   '• **🔑 Credentials** - How to get UEX API credentials\n' +
                   '• **🔒 Privacy** - Privacy options and security features',
            inline: false
          }
        ])
        .setFooter({ text: 'Click the buttons below to navigate help topics' });
  }

  // Create navigation buttons
  const buttons = [
    new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('help_quickstart')
          .setLabel('🚀 Quick Start')
          .setStyle(topic === 'quickstart' ? ButtonStyle.Primary : ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('help_registration')
          .setLabel('📝 Registration')
          .setStyle(topic === 'registration' ? ButtonStyle.Primary : ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('help_commands')
          .setLabel('🤖 Commands')
          .setStyle(topic === 'commands' ? ButtonStyle.Primary : ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('help_credentials')
          .setLabel('🔑 Credentials')
          .setStyle(topic === 'credentials' ? ButtonStyle.Primary : ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('help_privacy')
          .setLabel('🔒 Privacy')
          .setStyle(topic === 'privacy' ? ButtonStyle.Primary : ButtonStyle.Secondary)
      )
  ];

  return { embed, buttons };
} 