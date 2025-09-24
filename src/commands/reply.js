/**
 * Reply Command
 * Discord slash command for replying to UEX negotiations
 */

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const uexAPI = require('../handlers/uex-api');
const logger = require('../utils/logger');
const userManager = require('../utils/user-manager');
const config = require('../utils/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reply')
    .setDescription('Send a reply to a UEX negotiation')
    .addStringOption(option =>
      option
        .setName('hash')
        .setDescription('The negotiation hash from UEX')
        .setRequired(true)
        .setMinLength(8)
        .setMaxLength(64)
    )
    .addStringOption(option =>
      option
        .setName('message')
        .setDescription('Your reply message')
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(2000)
    ),

  async execute(interaction) {
    try {
      // Get command options
      const hash = interaction.options.getString('hash');
      const message = interaction.options.getString('message');
      const userId = interaction.user.id;

      logger.command('Processing reply command', {
        hash,
        messageLength: message.length,
        userId
      });

      // Defer reply since UEX API call might take some time
      await interaction.deferReply({ ephemeral: true });

      // Get user's registered credentials
      const userResult = await userManager.getUserCredentials(userId);
      
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
            },
            {
              name: '🏠 Privacy Options',
              value: 'Create a private Discord server or use private channels for complete privacy',
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
          embeds: [notRegisteredEmbed], 
          components: [helpButton] 
        });
        return;
      }

      // Send reply to UEX API with user's credentials
      const result = await uexAPI.sendReplyWithCredentials(hash, message, userResult.credentials);

      if (result.success) {
        // Success response
        const successEmbed = new EmbedBuilder()
          .setTitle('✅ Reply Sent Successfully')
          .setColor(0x00ff00)
          .addFields([
            {
              name: '📝 Negotiation',
              value: `\`${hash}\``,
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

        logger.success('Reply command completed successfully', {
          hash,
          messageId: result.messageId
        });

      } else {
        // Error response
        const errorEmbed = new EmbedBuilder()
          .setTitle('❌ Reply Failed')
          .setColor(0xff0000)
          .addFields([
            {
              name: '📝 Negotiation',
              value: `\`${hash}\``,
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

        logger.error('Reply command failed', {
          hash,
          error: result.error
        });
      }

    } catch (error) {
      logger.error('Reply command error', {
        error: error.message,
        stack: error.stack,
        userId: interaction.user.id
      });

      // Create error embed
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Command Error')
        .setDescription('An unexpected error occurred while processing your reply.')
        .setColor(0xff0000)
        .addFields([
          {
            name: '⚠️ Error Details',
            value: error.message,
            inline: false
          }
        ])
        .setFooter({ text: 'UEX Discord Bot' })
        .setTimestamp();

      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({ embeds: [errorEmbed] });
        } else {
          await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
      } catch (replyError) {
        logger.error('Failed to send error reply', { error: replyError.message });
      }
    }
  }
}; 