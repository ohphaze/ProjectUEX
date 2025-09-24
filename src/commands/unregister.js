/**
 * Unregister Command
 * Allows users to remove their UEX API credentials from the shared bot
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const logger = require('../utils/logger');
const userManager = require('../utils/user-manager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unregister')
    .setDescription('Remove your UEX API credentials from this bot'),

  async execute(interaction) {
    try {
      const userId = interaction.user.id;

      logger.command('User unregistration attempt', {
        userId,
        username: interaction.user.username
      });

      // Defer reply
      await interaction.deferReply({ ephemeral: true });

      // Check if user is registered
      const isRegistered = await userManager.isUserRegistered(userId);
      
      if (!isRegistered) {
                 const notRegisteredEmbed = new EmbedBuilder()
           .setTitle('ℹ️ Not Registered')
           .setDescription('You don\'t have any UEX API credentials registered with this bot.')
           .setColor(0x0099ff)
           .addFields([
             {
               name: '📝 Want to Register?',
               value: 'Use `/register` command to add your UEX API credentials',
               inline: false
             }
           ])
           .setFooter({ text: 'UEX Discord Bot' })
           .setTimestamp();

        await interaction.editReply({ embeds: [notRegisteredEmbed] });
        return;
      }

      // Remove user credentials
      const result = await userManager.unregisterUser(userId);

      if (result.success) {
                 const successEmbed = new EmbedBuilder()
           .setTitle('✅ Unregistered Successfully')
           .setDescription('Your UEX API credentials have been removed from this bot.')
           .setColor(0x00ff00)
           .addFields([
             {
               name: '🗑️ Data Removed',
               value: 'Your encrypted credentials are no longer stored',
               inline: false
             },
             {
               name: '❌ Commands Disabled',
               value: 'You can no longer use `/reply` commands until you register again',
               inline: false
             },
             {
               name: '🔄 Re-register Anytime',
               value: 'Use `/register` command if you want to use the bot again',
               inline: false
             }
           ])
           .setFooter({ text: 'UEX Discord Bot' })
           .setTimestamp();

        await interaction.editReply({ embeds: [successEmbed] });

        logger.success('User unregistered successfully', {
          userId,
          username: interaction.user.username
        });

      } else {
                 const errorEmbed = new EmbedBuilder()
           .setTitle('❌ Unregistration Failed')
           .setDescription('Failed to remove your credentials.')
           .setColor(0xff0000)
           .addFields([
             {
               name: '⚠️ Error',
               value: result.error || 'Unknown error occurred',
               inline: false
             }
           ])
           .setFooter({ text: 'UEX Discord Bot' })
           .setTimestamp();

        await interaction.editReply({ embeds: [errorEmbed] });
      }

    } catch (error) {
      logger.error('Unregister command error', {
        error: error.message,
        stack: error.stack,
        userId: interaction.user.id
      });

      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Unregistration Error')
        .setDescription('An unexpected error occurred.')
        .setColor(0xff0000)
        .addFields([
          {
            name: '⚠️ Error Details',
            value: 'Please try again or contact support',
            inline: false
          }
        ])
        .setFooter({ text: 'UEX Discord Bot - Multi-User' })
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