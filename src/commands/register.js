/**
 * Register Command
 * Allows users to securely register their UEX API credentials for multi-user deployment
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../utils/config');
const logger = require('../utils/logger');
const userManager = require('../utils/user-manager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('register')
    .setDescription('Register your UEX API credentials (Bearer Token from My Apps + Secret Key from Settings)')
    .addStringOption(option =>
      option
        .setName('api_token')
        .setDescription('Your UEX Bearer Token from My Apps section')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('secret_key')
        .setDescription('Your UEX Secret Key from Account Settings')
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      const apiToken = interaction.options.getString('api_token');
      const secretKey = interaction.options.getString('secret_key');
      const userId = interaction.user.id;

      logger.command('User registration attempt', {
        userId,
        username: interaction.user.username
      });

      // Defer reply since validation might take time
      await interaction.deferReply({ ephemeral: true });

      // Validate credentials with UEX API
      const validationResult = await userManager.validateUEXCredentials(apiToken, secretKey);
      
      if (!validationResult.valid) {
        const errorEmbed = new EmbedBuilder()
          .setTitle('❌ Registration Failed')
          .setDescription('The provided UEX API credentials are invalid.')
          .setColor(0xff0000)
          .addFields([
            {
              name: '⚠️ Error',
              value: validationResult.error || 'Invalid credentials',
              inline: false
            },
            {
              name: '🔑 How to Get Your UEX API Credentials',
              value: '**Step 1: Get API Token**\n' +
                     '• Go to your UEX account dashboard\n' +
                     '• Navigate to "My Apps" section\n' +
                     '• Create a new application or select existing one\n' +
                     '• Copy the "Bearer Token" from your application\n\n' +
                     '**Step 2: Get Secret Key**\n' +
                     '• Go to "Account Settings" in your UEX profile\n' +
                     '• Find the "Secret Key" section\n' +
                     '• Generate a new key if needed\n' +
                     '• Copy the secret key (don\'t share with anyone!)',
              inline: false
            },
            {
              name: '🌐 UEX Platform',
              value: '[Visit UEX Corp](https://uexcorp.space) to manage your credentials',
              inline: false
            }
          ])
          .setFooter({ text: 'UEX Discord Bot' })
          .setTimestamp();

        await interaction.editReply({ embeds: [errorEmbed] });
        return;
      }

      // Store encrypted credentials
      const result = await userManager.registerUser(userId, {
        apiToken,
        secretKey,
        username: interaction.user.username,
        registeredAt: new Date().toISOString()
      });

      if (result.success) {
                 const successEmbed = new EmbedBuilder()
           .setTitle('✅ Registration Successful')
           .setDescription('Your UEX API credentials have been securely stored!')
           .setColor(0x00ff00)
           .addFields([
             {
               name: '🔐 Security',
               value: 'Your credentials are encrypted and stored securely',
               inline: false
             },
             {
               name: '📱 Ready to Use',
               value: 'You can now use `/reply` commands for your negotiations',
               inline: false
             },
             {
               name: '🔔 Notifications',
               value: 'You\'ll receive DMs when your listings get messages',
               inline: false
             },
             {
               name: '🗑️ Remove Access',
               value: 'Use `/unregister` to remove your credentials anytime',
               inline: false
             }
           ])
           .setFooter({ text: 'UEX Discord Bot' })
           .setTimestamp();

        await interaction.editReply({ embeds: [successEmbed] });

        logger.success('User registered successfully', {
          userId,
          username: interaction.user.username
        });

      } else {
                 const errorEmbed = new EmbedBuilder()
           .setTitle('❌ Registration Error')
           .setDescription('Failed to store your credentials securely.')
           .setColor(0xff0000)
           .addFields([
             {
               name: '⚠️ Error',
               value: result.error || 'Storage error',
               inline: false
             }
           ])
           .setFooter({ text: 'UEX Discord Bot' })
           .setTimestamp();

        await interaction.editReply({ embeds: [errorEmbed] });
      }

    } catch (error) {
      logger.error('Register command error', {
        error: error.message,
        stack: error.stack,
        userId: interaction.user.id
      });

      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Registration Error')
        .setDescription('An unexpected error occurred during registration.')
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