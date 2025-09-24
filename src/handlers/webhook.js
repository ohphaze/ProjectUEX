/**
 * Webhook Handler
 * Logic for handling incoming UEX webhooks and sending Discord DMs
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../utils/config');
const logger = require('../utils/logger');
const uexAPI = require('./uex-api');
const userManager = require('../utils/user-manager');

/**
 * Process UEX webhook and send DM notification to the appropriate user
 * @param {object} discordClient - Discord.js client instance
 * @param {string} rawBody - Raw webhook request body
 * @param {string} signature - Webhook signature from headers
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function processUEXWebhook(discordClient, rawBody, signature) {
  try {
    const startTime = Date.now();
    logger.webhook('Processing UEX webhook', { timestamp: new Date().toISOString() });

    // Validate webhook signature
    if (!uexAPI.validateWebhookSignature(rawBody, signature)) {
      logger.error('Webhook signature validation failed');
      return {
        success: false,
        error: 'Invalid webhook signature'
      };
    }

    // Parse webhook data
    const parseResult = uexAPI.parseWebhookData(rawBody);
    if (!parseResult.valid) {
      logger.error('Webhook data parsing failed', { error: parseResult.error });
      return {
        success: false,
        error: parseResult.error
      };
    }

    const uexData = parseResult.data;
    logger.webhook('UEX webhook data received', { 
      ...uexData,
      processingTime: Date.now() - startTime
    });

    // Enhanced bidirectional notification routing using UEX API
    // 
    // Strategy:
    // 1. Get negotiation details from UEX API to find both participants
    // 2. Determine who sent the message vs who should receive notification
    // 3. Notify the recipient, not the sender
    
    const senderUsername = uexData.client_username;
    const negotiationHash = uexData.negotiation_hash;
    
    if (!senderUsername || !negotiationHash) {
      logger.warn('Missing sender username or negotiation hash in webhook data', {
        senderUsername,
        negotiationHash
      });
      return {
        success: false,
        error: 'Missing client_username or negotiation_hash in webhook data'
      };
    }

    // We need API credentials to fetch negotiation details
    // Try to find any registered user's credentials to make the API call
    const activeUsers = await userManager.getAllActiveUsers();
    
    if (activeUsers.length === 0) {
      logger.warn('No active users found - cannot fetch negotiation details');
      return {
        success: true,
        message: 'Webhook received but no registered users to fetch negotiation details'
      };
    }

    // Use the first active user's credentials to fetch negotiation details
    const firstUser = activeUsers[0];
    const credentialsResult = await userManager.getUserCredentials(firstUser.userId);
    
    if (!credentialsResult.found) {
      logger.error('Could not get credentials for active user', { userId: firstUser.userId });
      return {
        success: false,
        error: 'Failed to get API credentials for negotiation lookup'
      };
    }

    // Fetch negotiation details to get both participant usernames
    const negotiationResult = await uexAPI.getNegotiationDetails(negotiationHash, credentialsResult.credentials);
    
    if (!negotiationResult.success) {
      logger.warn('Could not fetch negotiation details - falling back to simple routing', {
        negotiationHash,
        error: negotiationResult.error
      });
      
      // Fallback to original logic: notify listing owner
      const targetUexUsername = uexData.listing_owner_username;
      if (!targetUexUsername) {
        return {
          success: false,
          error: 'Could not determine notification target - missing listing owner and negotiation lookup failed'
        };
      }
      
      const userResult = await userManager.findUserByUexUsername(targetUexUsername);
      if (!userResult.found) {
        return {
          success: true,
          message: `Fallback: No registered Discord user found for ${targetUexUsername}`
        };
      }
      
      const result = await sendNotificationDM(discordClient, userResult.userId, uexData);
      return {
        success: result.success,
        message: `Fallback notification sent to ${userResult.username}`,
        error: result.error
      };
    }

    // Extract participant usernames from negotiation details
    const negotiation = negotiationResult.negotiation;
    const advertiserUsername = negotiation.advertiser_username; // Listing owner
    const clientUsername = negotiation.client_username;         // Buyer
    
    logger.info('Negotiation participants identified', {
      sender: senderUsername,
      advertiser: advertiserUsername,
      client: clientUsername,
      negotiationHash
    });

    // Determine who should receive the notification (opposite of sender)
    let targetUexUsername;
    let notificationReason;
    
    if (senderUsername === advertiserUsername) {
      // Advertiser (seller) sent message → notify client (buyer)
      targetUexUsername = clientUsername;
      notificationReason = 'Seller replied to buyer';
    } else if (senderUsername === clientUsername) {
      // Client (buyer) sent message → notify advertiser (seller)
      targetUexUsername = advertiserUsername;
      notificationReason = 'Buyer contacted seller';
    } else {
      // Sender doesn't match either participant (shouldn't happen)
      logger.warn('Sender does not match negotiation participants', {
        sender: senderUsername,
        advertiser: advertiserUsername,
        client: clientUsername
      });
      
      // Default to notifying advertiser
      targetUexUsername = advertiserUsername;
      notificationReason = 'Unknown sender - defaulting to advertiser';
    }
    
    logger.info('Webhook routing decision', {
      sender: senderUsername,
      target: targetUexUsername,
      reason: notificationReason
    });

    // Find the Discord user by their UEX username
    const userResult = await userManager.findUserByUexUsername(targetUexUsername);
    
    if (!userResult.found) {
      logger.warn('No registered Discord user found for UEX username', { 
        uexUsername: targetUexUsername 
      });
      return {
        success: true,
        message: `Webhook received for UEX user "${targetUexUsername}" but no matching Discord user found`
      };
    }

    // Send notification to the specific user
    try {
      const result = await sendNotificationDM(discordClient, userResult.userId, uexData);
      
      if (result.success) {
        logger.success('Webhook notification sent successfully', {
          uexUsername: targetUexUsername,
          discordUserId: userResult.userId,
          discordUsername: userResult.username
        });
        
        return { 
          success: true, 
          message: `Notification sent to Discord user ${userResult.username} for UEX user ${targetUexUsername}`
        };
      } else {
        logger.error('Failed to send webhook notification', {
          uexUsername: targetUexUsername,
          discordUserId: userResult.userId,
          error: result.error
        });
        
        return {
          success: false,
          error: `Failed to send notification: ${result.error}`
        };
      }
    } catch (error) {
      logger.error('Error sending webhook notification', {
        uexUsername: targetUexUsername,
        discordUserId: userResult.userId,
        error: error.message
      });
      
      return {
        success: false,
        error: error.message
      };
    }

  } catch (error) {
    logger.error('Failed to process UEX webhook', {
      error: error.message,
      stack: error.stack
    });

    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Create Discord embed for UEX notification
 * @param {object} uexData - UEX webhook data
 * @returns {EmbedBuilder}
 */
function createNotificationEmbed(uexData) {
  const {
    negotiation_hash: hash = 'Unknown',
    message = 'No message',
    client_username: sender = 'Unknown sender',
    listing_title: title = 'Unknown listing',
    event_type: eventType = 'negotiation'
  } = uexData;

  // Determine embed color based on event type
  let embedColor;
  switch (eventType) {
    case 'negotiation_started':
      embedColor = 0x00ff00; // Green for new negotiations
      break;
    case 'negotiation_message':
      embedColor = 0x0099ff; // Blue for messages
      break;
    case 'negotiation_completed':
      embedColor = 0xffd700; // Gold for completed
      break;
    default:
      embedColor = 0x0099ff; // Default blue
  }

  const embed = new EmbedBuilder()
    .setTitle('🔔 New UEX Message')
    .setDescription(`**${title}**`)
    .setColor(embedColor)
    .addFields([
      {
        name: '👤 From',
        value: sender,
        inline: true
      },
      {
        name: '📝 Message',
        value: `"${message}"`,
        inline: false
      }
    ])
    .setFooter({ text: `Negotiation: ${hash}` })
    .setTimestamp();

  // Add additional fields if available
  if (uexData.listing_price) {
    embed.addFields([{
      name: '💰 Price',
      value: `${uexData.listing_price} aUEC`,
      inline: true
    }]);
  }

  if (uexData.listing_location) {
    embed.addFields([{
      name: '📍 Location',
      value: uexData.listing_location,
      inline: true
    }]);
  }

  return embed;
}

/**
 * Send notification DM to a specific user
 * @param {object} discordClient - Discord.js client instance
 * @param {string} userId - Discord user ID to send notification to
 * @param {object} uexData - UEX webhook data
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function sendNotificationDM(discordClient, userId, uexData) {
  try {
    logger.discord('Sending UEX notification DM', { userId });

    const user = await discordClient.users.fetch(userId);
    if (!user) {
      throw new Error(`Could not find Discord user with ID: ${userId}`);
    }

    const embed = createNotificationEmbed(uexData);

    // Create buttons for replying
    const replyButton = new ButtonBuilder()
      .setCustomId(`reply_${uexData.negotiation_hash}`)
      .setLabel('Reply')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder()
      .addComponents(replyButton);

    await user.send({ embeds: [embed], components: [row] });

    logger.success('UEX notification DM sent successfully', { userId });
    return { success: true };

  } catch (error) {
    logger.error('Failed to send UEX notification DM', {
      userId,
      error: error.message,
      stack: error.stack
    });

    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send test DM to a specific user to verify bot functionality
 * @param {object} discordClient - Discord.js client instance
 * @param {string} userId - Discord user ID to send test DM to
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function sendTestDM(discordClient, userId) {
  try {
    logger.discord('Sending test DM', { userId });

    const user = await discordClient.users.fetch(userId);
    if (!user) {
      throw new Error(`Could not find Discord user with ID: ${userId}`);
    }

    const embed = new EmbedBuilder()
      .setTitle('🤖 UEX Discord Bot Test')
      .setDescription('The UEX Discord bot is working correctly!')
      .setColor(0x00ff00)
      .addFields([
        {
          name: '✅ Bot Status',
          value: 'Online and ready to receive your UEX notifications',
          inline: false
        },
        {
          name: '📨 DM Delivery',
          value: 'This message confirms that DM notifications are working',
          inline: false
        },
        {
          name: '🔗 Setup Webhook',
          value: 'Configure your UEX webhooks to point to the bot\'s `/webhook/uex` endpoint',
          inline: false
        },
        {
          name: '🔐 Privacy',
          value: 'Your credentials are encrypted and your notifications are private',
          inline: false
        }
      ])
      .setFooter({ text: 'UEX Discord Bot v2.0' })
      .setTimestamp();

    await user.send({ embeds: [embed] });

    logger.success('Test DM sent successfully', { userId });
    return { success: true };

  } catch (error) {
    logger.error('Failed to send test DM', {
      userId,
      error: error.message,
      stack: error.stack
    });

    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  processUEXWebhook,
  createNotificationEmbed,
  sendNotificationDM,
  sendTestDM
}; 