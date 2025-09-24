/**
 * Admin Command
 * Server administration commands for multi-user bot management
 */

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const logger = require('../utils/logger');
const userManager = require('../utils/user-manager');
const config = require('../utils/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Bot administration commands (Server admins only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('stats')
        .setDescription('View bot usage statistics')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('info')
        .setDescription('View bot configuration and status')
    ),

  async execute(interaction) {
    try {
      // Check if user has admin permissions
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        const noPermissionEmbed = new EmbedBuilder()
          .setTitle('❌ Access Denied')
          .setDescription('This command requires Administrator permissions.')
          .setColor(0xff0000)
          .setFooter({ text: 'UEX Discord Bot - Admin' })
          .setTimestamp();

        await interaction.reply({ embeds: [noPermissionEmbed], ephemeral: true });
        return;
      }

      const subcommand = interaction.options.getSubcommand();

      logger.command('Admin command used', {
        subcommand,
        userId: interaction.user.id,
        username: interaction.user.username,
        guildId: interaction.guild?.id
      });

      await interaction.deferReply({ ephemeral: true });

      if (subcommand === 'stats') {
        await handleStatsCommand(interaction);
      } else if (subcommand === 'info') {
        await handleInfoCommand(interaction);
      }

    } catch (error) {
      logger.error('Admin command error', {
        error: error.message,
        stack: error.stack,
        userId: interaction.user.id
      });

      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Admin Command Error')
        .setDescription('An error occurred while processing the admin command.')
        .setColor(0xff0000)
        .setFooter({ text: 'UEX Discord Bot - Admin' })
        .setTimestamp();

      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({ embeds: [errorEmbed] });
        } else {
          await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
      } catch (replyError) {
        logger.error('Failed to send admin error reply', { error: replyError.message });
      }
    }
  }
};

/**
 * Handle stats subcommand
 */
async function handleStatsCommand(interaction) {
  try {
    const stats = await userManager.getUserStats();

    if (stats.error) {
      throw new Error(stats.error);
    }

    const statsEmbed = new EmbedBuilder()
      .setTitle('📊 Bot Usage Statistics')
      .setDescription('Current user registration and activity statistics')
      .setColor(0x0099ff)
      .addFields([
        {
          name: '👥 Total Users',
          value: `${stats.totalUsers}`,
          inline: true
        },
        {
          name: '✅ Active Users',
          value: `${stats.activeUsers}`,
          inline: true
        },
        {
          name: '❌ Inactive Users',
          value: `${stats.inactiveUsers}`,
          inline: true
        },
        {
          name: '🔥 Recently Active (24h)',
          value: `${stats.recentlyActive}`,
          inline: true
        },
        {
          name: '🤖 Bot Mode',
          value: 'Multi-User (Secure)',
          inline: true
        },
        {
          name: '🌐 Environment',
          value: config.NODE_ENV,
          inline: true
        }
      ])
      .setFooter({ text: 'UEX Discord Bot - Admin' })
      .setTimestamp();

    await interaction.editReply({ embeds: [statsEmbed] });

  } catch (error) {
    logger.error('Admin stats command error', { error: error.message });
    
    const errorEmbed = new EmbedBuilder()
      .setTitle('❌ Stats Error')
      .setDescription('Failed to retrieve bot statistics.')
      .setColor(0xff0000)
      .addFields([
        {
          name: '⚠️ Error',
          value: error.message,
          inline: false
        }
      ])
      .setFooter({ text: 'UEX Discord Bot - Admin' })
      .setTimestamp();

    await interaction.editReply({ embeds: [errorEmbed] });
  }
}

/**
 * Handle info subcommand
 */
async function handleInfoCommand(interaction) {
  try {
    const client = interaction.client;
    const uptime = process.uptime();
    const uptimeHours = Math.floor(uptime / 3600);
    const uptimeMinutes = Math.floor((uptime % 3600) / 60);
    const memory = process.memoryUsage();

    const infoEmbed = new EmbedBuilder()
      .setTitle('🤖 Bot Information')
      .setDescription('Current bot configuration and system status')
      .setColor(0x00ff00)
      .addFields([
        {
          name: '🤖 Bot Status',
          value: client.user ? `Online as ${client.user.tag}` : 'Offline',
          inline: false
        },
                 {
           name: '🎮 Bot Mode',
           value: '🏢 **Multi-User Mode** - Users register their own UEX credentials with full privacy options',
           inline: false
         },
        {
          name: '⏱️ Uptime',
          value: `${uptimeHours}h ${uptimeMinutes}m`,
          inline: true
        },
        {
          name: '💾 Memory Usage',
          value: `${Math.round(memory.rss / 1024 / 1024)}MB`,
          inline: true
        },
        {
          name: '🌐 Environment',
          value: config.NODE_ENV,
          inline: true
        },
        {
          name: '📊 Servers',
          value: `${client.guilds.cache.size}`,
          inline: true
        },
                 {
           name: '🔐 Security Features',
           value: '✅ Encrypted user credentials\n✅ Per-user API isolation\n✅ Permission validation\n✅ Discord privacy controls',
           inline: false
         }
      ])
      .setFooter({ text: 'UEX Discord Bot - Admin' })
      .setTimestamp();

    await interaction.editReply({ embeds: [infoEmbed] });

  } catch (error) {
    logger.error('Admin info command error', { error: error.message });
    
    const errorEmbed = new EmbedBuilder()
      .setTitle('❌ Info Error')
      .setDescription('Failed to retrieve bot information.')
      .setColor(0xff0000)
      .addFields([
        {
          name: '⚠️ Error',
          value: error.message,
          inline: false
        }
      ])
      .setFooter({ text: 'UEX Discord Bot - Admin' })
      .setTimestamp();

    await interaction.editReply({ embeds: [errorEmbed] });
  }
} 