/**
 * Button Interactions Handler
 * Handles Discord button interactions for UEX bot functionality
 */

const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const uexAPI = require('./uex-api');
const userManager = require('../utils/user-manager');
const logger = require('../utils/logger');

/**
 * Handle button interactions
 * @param {object} interaction - Discord button interaction
 */
async function handleButtonInteraction(interaction) {
  try {
    const customId = interaction.customId;
    
    if (customId.startsWith('reply_')) {
      await handleReplyButton(interaction);
    } else if (customId === 'view_negotiations') {
      await handleViewNegotiationsButton(interaction);
    } else if (customId === 'help_reply_command') {
      await handleHelpReplyCommandButton(interaction);
    } else if (customId.startsWith('help_')) {
      await handleHelpButton(interaction);
    } else if (customId === 'marketplace_listings_all') {
      await handleMarketplaceListingsAllButton(interaction);
    } else if (customId.startsWith('listings_page_')) {
      await handleListingsPaginationButton(interaction);
    } else if (customId.startsWith('refresh_listings_')) {
      await handleRefreshListingsButton(interaction);
    } else if (customId === 'clear_filters_listings') {
      await handleClearFiltersButton(interaction);
    } else {
      logger.warn('Unknown button interaction', { customId });
      await interaction.reply({ 
        content: '❌ Unknown button interaction', 
        ephemeral: true 
      });
    }
    
  } catch (error) {
    logger.error('Button interaction error', {
      error: error.message,
      stack: error.stack,
      customId: interaction.customId,
      userId: interaction.user.id
    });

    try {
      const errorMessage = '❌ An error occurred while processing your request.';
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    } catch (replyError) {
      logger.error('Failed to send error reply', { error: replyError.message });
    }
  }
}

/**
 * Handle reply button interaction
 * @param {object} interaction - Discord button interaction
 */
async function handleReplyButton(interaction) {
  try {
    // Extract negotiation hash from button custom ID
    const negotiationHash = interaction.customId.replace('reply_', '');
    
    logger.info('Reply button clicked', {
      negotiationHash,
      userId: interaction.user.id,
      username: interaction.user.username
    });

    // Check if user is registered
    const userResult = await userManager.getUserCredentials(interaction.user.id);
    
    if (!userResult.found) {
      const notRegisteredEmbed = new EmbedBuilder()
        .setTitle('❌ Not Registered')
        .setDescription('You need to register your UEX API credentials first.')
        .setColor(0xff0000)
        .addFields([
          {
            name: '📝 How to Register',
            value: 'Use `/register` command with your UEX API credentials',
            inline: false
          },
          {
            name: '🔑 Get API Keys',
            value: 'Get Bearer Token from UEX **My Apps** + Secret Key from **Account Settings**',
            inline: false
          }
        ])
        .setFooter({ text: 'UEX Discord Bot' })
        .setTimestamp();

      const helpButton = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('help_credentials')
            .setLabel('📖 Get Help')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🔑')
        );

      await interaction.reply({ 
        embeds: [notRegisteredEmbed], 
        components: [helpButton], 
        ephemeral: true 
      });
      return;
    }

    // Create modal for message input
    const modal = new ModalBuilder()
      .setCustomId(`reply_modal_${negotiationHash}`)
      .setTitle('Reply to UEX Negotiation');

    const messageInput = new TextInputBuilder()
      .setCustomId('reply_message')
      .setLabel('Your Reply Message')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Type your reply message here...')
      .setRequired(true)
      .setMaxLength(2000);

    const actionRow = new ActionRowBuilder().addComponents(messageInput);
    modal.addComponents(actionRow);

    await interaction.showModal(modal);

  } catch (error) {
    logger.error('Reply button handler error', {
      error: error.message,
      stack: error.stack,
      userId: interaction.user.id
    });

    await interaction.reply({ 
      content: '❌ Failed to open reply dialog. Please try again.', 
      ephemeral: true 
    });
  }
}

/**
 * Handle modal submit interactions
 * @param {object} interaction - Discord modal submit interaction
 */
async function handleModalSubmit(interaction) {
  try {
    const customId = interaction.customId;
    
    if (customId.startsWith('reply_modal_')) {
      await handleReplyModalSubmit(interaction);
    } else {
      logger.warn('Unknown modal interaction', { customId });
      await interaction.reply({ 
        content: '❌ Unknown modal interaction', 
        ephemeral: true 
      });
    }
    
  } catch (error) {
    logger.error('Modal submit error', {
      error: error.message,
      stack: error.stack,
      customId: interaction.customId,
      userId: interaction.user.id
    });

    try {
      const errorMessage = '❌ An error occurred while processing your reply.';
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    } catch (replyError) {
      logger.error('Failed to send modal error reply', { error: replyError.message });
    }
  }
}

/**
 * Handle reply modal submit
 * @param {object} interaction - Discord modal submit interaction
 */
async function handleReplyModalSubmit(interaction) {
  try {
    // Extract negotiation hash from modal custom ID
    const negotiationHash = interaction.customId.replace('reply_modal_', '');
    const message = interaction.fields.getTextInputValue('reply_message');
    
    logger.info('Reply modal submitted', {
      negotiationHash,
      messageLength: message.length,
      userId: interaction.user.id,
      username: interaction.user.username
    });

    // Defer reply since UEX API call might take time
    await interaction.deferReply({ ephemeral: true });

    // Get user's credentials
    const userResult = await userManager.getUserCredentials(interaction.user.id);
    
    if (!userResult.found) {
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Not Registered')
        .setDescription('Your UEX credentials are no longer available.')
        .setColor(0xff0000)
        .addFields([
          {
            name: '📝 How to Register',
            value: 'Use `/register` command with your UEX API credentials',
            inline: false
          },
          {
            name: '🔑 Get API Keys',
            value: 'Get Bearer Token from UEX **My Apps** + Secret Key from **Account Settings**',
            inline: false
          }
        ])
        .setFooter({ text: 'UEX Discord Bot' })
        .setTimestamp();

      const helpButton = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('help_credentials')
            .setLabel('📖 Get Help')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🔑')
        );

      await interaction.editReply({ 
        embeds: [errorEmbed], 
        components: [helpButton] 
      });
      return;
    }

    // Send reply via UEX API
    const result = await uexAPI.sendReplyWithCredentials(negotiationHash, message, userResult.credentials);

    if (result.success) {
      // Success response
      const successEmbed = new EmbedBuilder()
        .setTitle('✅ Reply Sent Successfully')
        .setColor(0x00ff00)
        .addFields([
          {
            name: '📝 Negotiation',
            value: `\`${negotiationHash}\``,
            inline: true
          },
          {
            name: '💬 Message',
            value: `"${message.length > 100 ? message.substring(0, 100) + '...' : message}"`,
            inline: false
          }
        ])
        .setFooter({ text: 'UEX Discord Bot' })
        .setTimestamp();

      // Add message ID if available
      if (result.messageId) {
        successEmbed.addFields([{
          name: '🆔 Message ID',
          value: `${result.messageId}`,
          inline: true
        }]);
      }

      await interaction.editReply({ embeds: [successEmbed] });

      logger.success('Reply sent successfully via button', {
        negotiationHash,
        messageId: result.messageId,
        userId: interaction.user.id
      });

    } else {
      // Error response
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Reply Failed')
        .setColor(0xff0000)
        .addFields([
          {
            name: '📝 Negotiation',
            value: `\`${negotiationHash}\``,
            inline: true
          },
          {
            name: '⚠️ Error',
            value: result.error || 'Unknown error occurred',
            inline: false
          }
        ])
        .setFooter({ text: 'UEX Discord Bot' })
        .setTimestamp();

      await interaction.editReply({ embeds: [errorEmbed] });

      logger.error('Reply failed via button', {
        negotiationHash,
        error: result.error,
        userId: interaction.user.id
      });
    }

  } catch (error) {
    logger.error('Reply modal submit error', {
      error: error.message,
      stack: error.stack,
      userId: interaction.user.id
    });

    const errorEmbed = new EmbedBuilder()
      .setTitle('❌ Reply Error')
      .setDescription('An unexpected error occurred while sending your reply.')
      .setColor(0xff0000)
      .setFooter({ text: 'UEX Discord Bot' })
      .setTimestamp();

    try {
      await interaction.editReply({ embeds: [errorEmbed] });
    } catch (replyError) {
      logger.error('Failed to send reply error message', { error: replyError.message });
    }
  }
}

/**
 * Handle help topic navigation buttons
 * @param {object} interaction - Discord button interaction
 */
async function handleHelpButton(interaction) {
  try {
    const customId = interaction.customId;
    const topic = customId.replace('help_', '');

    logger.command('Help button clicked', {
      userId: interaction.user.id,
      username: interaction.user.username,
      topic
    });

    const { embed, buttons } = buildHelpResponse(topic);

    await interaction.update({ embeds: [embed], components: buttons });

  } catch (error) {
    logger.error('Help button interaction error', {
      error: error.message,
      userId: interaction.user.id,
      customId: interaction.customId
    });

    const errorEmbed = new EmbedBuilder()
      .setTitle('❌ Help Error')
      .setDescription('Failed to load help information. Please try again.')
      .setColor(0xff0000);

    try {
      await interaction.update({ embeds: [errorEmbed], components: [] });
    } catch (updateError) {
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }
}

/**
 * Build help response with embed and navigation buttons
 * (Copied from help command for button interactions)
 */
function buildHelpResponse(topic) {
  const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
  
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
                   '• Click "🔑 Credentials" below for detailed instructions',
            inline: false
          },
          {
            name: '🔐 Step 2: Register with the Bot',
            value: '```/register api_token:YOUR_BEARER_TOKEN secret_key:YOUR_SECRET_KEY```\n' +
                   '⚠️ **Important**: Use this command in DMs or private channels only!\n' +
                   '• Click "📝 Registration" below for complete help',
            inline: false
          },
          {
            name: '⚡ Step 3: Start Trading',
            value: '• `/marketplace-listings` - Browse marketplace\n' +
                   '• `/negotiations` - View your active negotiations\n' +
                   '• `/reply` - Respond to negotiations\n' +
                   '• Click "🤖 Commands" below for complete command list',
            inline: false
          },
          {
            name: '🔒 Privacy Options',
            value: '• **Private Server**: Create your own Discord server, invite only the bot\n' +
                   '• **Private Channels**: Use private channels with restricted permissions\n' +
                   '• **DM Commands**: All registration commands work in DMs\n' +
                   '• Click "🔒 Privacy" below for detailed privacy information',
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

/**
 * Handle view negotiations button click
 * @param {object} interaction - Discord button interaction
 */
async function handleViewNegotiationsButton(interaction) {
  try {
    logger.info('View negotiations button clicked', { 
      userId: interaction.user.id,
      username: interaction.user.username 
    });

    const helpEmbed = new EmbedBuilder()
      .setTitle('💬 How to View Your Negotiations')
      .setDescription('Use the `/negotiations` command to see all your marketplace negotiations.')
      .setColor(0x0099ff)
      .addFields([
        {
          name: '📋 Command Usage',
          value: '```\n/negotiations\n```\nThis will show all your active and completed marketplace negotiations.',
          inline: false
        },
        {
          name: '📊 What You\'ll See',
          value: '• **Active negotiations** - Currently ongoing discussions\n• **Completed negotiations** - Finished deals\n• **Negotiation details** - Item, price, and parties involved\n• **Hashes** - For use with `/reply` command',
          inline: false
        },
        {
          name: '💬 Replying to Negotiations',
          value: 'Copy the hash from your negotiations and use:\n```\n/reply hash:HASH_HERE message:Your response\n```',
          inline: false
        }
      ])
      .setFooter({ text: 'UEX Marketplace • Stay on top of your deals' })
      .setTimestamp();

    await interaction.reply({ 
      embeds: [helpEmbed], 
      ephemeral: true 
    });

  } catch (error) {
    logger.error('View negotiations button error', {
      error: error.message,
      userId: interaction.user.id
    });

    try {
      const errorMessage = '❌ Failed to display negotiations help.';
      await interaction.reply({ content: errorMessage, ephemeral: true });
    } catch (replyError) {
      logger.error('Failed to send view negotiations button error reply', { error: replyError.message });
    }
  }
}

/**
 * Handle help reply command button click
 * @param {object} interaction - Discord button interaction
 */
async function handleHelpReplyCommandButton(interaction) {
  try {
    logger.info('Help reply command button clicked', { 
      userId: interaction.user.id,
      username: interaction.user.username 
    });

    const helpEmbed = new EmbedBuilder()
      .setTitle('💬 How to Reply to Negotiations via Discord')
      .setDescription('You can reply to UEX marketplace negotiations directly through Discord!')
      .setColor(0x00ff88)
      .addFields([
        {
          name: '📋 Step 1: Get the Negotiation Hash',
          value: '• Use `/negotiations` to see your active negotiations\n• Copy the hash from the negotiation you want to reply to\n• Example hash: `abc123def456`',
          inline: false
        },
        {
          name: '💬 Step 2: Send Your Reply',
          value: '```\n/reply hash:abc123def456 message:Thanks for your offer!\n```\n• Replace `abc123def456` with the actual hash\n• Write your message in the `message` field',
          inline: false
        },
        {
          name: '🔔 Step 3: Get Notified',
          value: '• You\'ll receive Discord DMs when others reply\n• Click "Reply" buttons in notifications for quick responses\n• All replies are sent directly to UEX Corp',
          inline: false
        },
        {
          name: '✨ Pro Tips',
          value: '• Use private channels or DMs for `/register` and `/reply` commands\n• Notifications include "Reply" buttons for convenience\n• Your replies appear on UEX Corp marketplace instantly',
          inline: false
        }
      ])
      .setFooter({ text: 'UEX Discord Bot • Streamlined marketplace communication' })
      .setTimestamp();

    await interaction.reply({ 
      embeds: [helpEmbed], 
      ephemeral: true 
    });

  } catch (error) {
    logger.error('Help reply command button error', {
      error: error.message,
      userId: interaction.user.id
    });

    try {
      const errorMessage = '❌ Failed to display reply help.';
      await interaction.reply({ content: errorMessage, ephemeral: true });
    } catch (replyError) {
      logger.error('Failed to send help reply command button error reply', { error: replyError.message });
    }
  }
}



/**
 * Handle marketplace listings all button click
 * @param {object} interaction - Discord button interaction
 */
async function handleMarketplaceListingsAllButton(interaction) {
  try {
    logger.info('Marketplace listings all button clicked', { 
      userId: interaction.user.id,
      username: interaction.user.username 
    });

    await interaction.reply({ 
      content: '🏪 Use `/marketplace-listings` to view active marketplace listings and see what items are being traded.',
      ephemeral: true 
    });

  } catch (error) {
    logger.error('Marketplace listings all button error', { 
      error: error.message,
      userId: interaction.user.id 
    });

    await interaction.reply({ 
      content: '❌ An error occurred.',
      ephemeral: true 
    });
  }
}

/**
 * Handle listings pagination button click
 * @param {object} interaction - Discord button interaction
 */
async function handleListingsPaginationButton(interaction) {
  try {
    logger.info('Listings pagination button clicked', { 
      customId: interaction.customId,
      userId: interaction.user.id,
      username: interaction.user.username 
    });

    // Parse the custom ID: listings_page_{pageNumber}_{encodedFilters}
    const parts = interaction.customId.split('_');
    const pageNumber = parseInt(parts[2]);
    const encodedFilters = parts[3] || '';

    // Decode filters
    let filters = {};
    try {
      filters = JSON.parse(Buffer.from(encodedFilters, 'base64').toString());
    } catch (error) {
      logger.warn('Failed to decode filters', { encodedFilters, error: error.message });
    }

    // Build the command string to simulate command execution
    let commandParams = [`page:${pageNumber}`];
    if (filters.username) commandParams.push(`username:${filters.username}`);
    if (filters.operation) commandParams.push(`operation:${filters.operation}`);
    if (filters.type) commandParams.push(`item_type:${filters.type}`);

    await interaction.deferUpdate();

    // Import the marketplace listings command and execute it
    const marketplaceListingsCommand = require('../commands/marketplace-listings');
    
    // Create a mock interaction with the new page number
    const mockInteraction = {
      ...interaction,
      options: {
        getString: (name) => {
          switch (name) {
            case 'username': return filters.username || null;
            case 'operation': return filters.operation || null;
            case 'item_type': return filters.type || null;
            default: return null;
          }
        },
        getInteger: (name) => {
          if (name === 'page') return pageNumber;
          return null;
        }
      },
      editReply: interaction.editReply.bind(interaction),
      deferReply: () => Promise.resolve() // Already deferred
    };

    await marketplaceListingsCommand.execute(mockInteraction);

  } catch (error) {
    logger.error('Listings pagination button error', { 
      error: error.message,
      customId: interaction.customId,
      userId: interaction.user.id 
    });

    await interaction.editReply({ 
      content: '❌ An error occurred while changing pages.',
      components: [] 
    });
  }
}

/**
 * Handle refresh listings button click
 * @param {object} interaction - Discord button interaction
 */
async function handleRefreshListingsButton(interaction) {
  try {
    logger.info('Refresh listings button clicked', { 
      customId: interaction.customId,
      userId: interaction.user.id,
      username: interaction.user.username 
    });

    // Parse the encoded filters from custom ID
    const encodedFilters = interaction.customId.split('refresh_listings_')[1] || '';
    
    let filters = {};
    try {
      filters = JSON.parse(Buffer.from(encodedFilters, 'base64').toString());
    } catch (error) {
      logger.warn('Failed to decode filters for refresh', { encodedFilters, error: error.message });
    }

    await interaction.deferUpdate();

    // Import and execute marketplace listings command
    const marketplaceListingsCommand = require('../commands/marketplace-listings');
    
    const mockInteraction = {
      ...interaction,
      options: {
        getString: (name) => {
          switch (name) {
            case 'username': return filters.username || null;
            case 'operation': return filters.operation || null;
            case 'item_type': return filters.type || null;
            default: return null;
          }
        },
        getInteger: (name) => {
          if (name === 'page') return 1; // Reset to page 1 on refresh
          return null;
        }
      },
      editReply: interaction.editReply.bind(interaction),
      deferReply: () => Promise.resolve()
    };

    await marketplaceListingsCommand.execute(mockInteraction);

  } catch (error) {
    logger.error('Refresh listings button error', { 
      error: error.message,
      userId: interaction.user.id 
    });

    await interaction.editReply({ 
      content: '❌ An error occurred while refreshing listings.'
    });
  }
}

/**
 * Handle clear filters button click
 * @param {object} interaction - Discord button interaction
 */
async function handleClearFiltersButton(interaction) {
  try {
    logger.info('Clear filters button clicked', { 
      userId: interaction.user.id,
      username: interaction.user.username 
    });

    await interaction.deferUpdate();

    // Execute marketplace listings command with no filters
    const marketplaceListingsCommand = require('../commands/marketplace-listings');
    
    const mockInteraction = {
      ...interaction,
      options: {
        getString: () => null,
        getInteger: () => null
      },
      editReply: interaction.editReply.bind(interaction),
      deferReply: () => Promise.resolve()
    };

    await marketplaceListingsCommand.execute(mockInteraction);

  } catch (error) {
    logger.error('Clear filters button error', { 
      error: error.message,
      userId: interaction.user.id 
    });

    await interaction.editReply({ 
      content: '❌ An error occurred while clearing filters.'
    });
  }
}

module.exports = {
  handleButtonInteraction,
  handleModalSubmit
}; 