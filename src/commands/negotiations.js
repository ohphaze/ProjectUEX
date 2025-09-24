/**
 * Negotiations Command
 * View your marketplace negotiations from UEX Corp
 */

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const uexAPI = require('../handlers/uex-api');
const userManager = require('../utils/user-manager');
const logger = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('negotiations')
    .setDescription('View your marketplace negotiations'),

  async execute(interaction) {
    try {
      const userId = interaction.user.id;

      logger.command('Negotiations command used', {
        userId,
        username: interaction.user.username
      });

      // Defer reply since API call might take time
      await interaction.deferReply({ ephemeral: true });

      // Check if user is registered
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

      // Fetch user's negotiations
      const result = await uexAPI.getMarketplaceNegotiations(userResult.credentials);

      if (!result.success) {
        const errorEmbed = new EmbedBuilder()
          .setTitle('❌ Error Fetching Negotiations')
          .setDescription('Failed to retrieve your negotiations from UEX Corp.')
          .setColor(0xff0000)
          .addFields([
            {
              name: '⚠️ Error Details',
              value: result.error || 'Unknown error occurred',
              inline: false
            }
          ])
          .setFooter({ text: 'UEX Marketplace • Try again later' })
          .setTimestamp();

        await interaction.editReply({ embeds: [errorEmbed] });
        return;
      }

      const negotiations = result.data || [];

      if (negotiations.length === 0) {
        const noNegotiationsEmbed = new EmbedBuilder()
          .setTitle('💬 No Active Negotiations')
          .setDescription('You don\'t have any active marketplace negotiations.')
          .setColor(0x666666)
          .addFields([
            {
              name: '🛒 Start Trading',
              value: '• Create listings with `/marketplace-add`\n• Browse listings with `/marketplace-listings`\n• Contact other traders to start negotiations',
              inline: false
            }
          ])
          .setFooter({ text: 'UEX Marketplace' })
          .setTimestamp();

        const marketplaceButton = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setLabel('🌐 Visit UEX Marketplace')
              .setStyle(ButtonStyle.Link)
              .setURL('https://uexcorp.space/marketplace')
          );

        await interaction.editReply({ 
          embeds: [noNegotiationsEmbed], 
          components: [marketplaceButton] 
        });
        return;
      }

      // Group negotiations by status
      const activeNegotiations = negotiations.filter(n => n.status === 'active' || n.status === 'pending');
      const completedNegotiations = negotiations.filter(n => n.status === 'completed' || n.status === 'accepted');
      const otherNegotiations = negotiations.filter(n => !activeNegotiations.includes(n) && !completedNegotiations.includes(n));

      const negotiationsEmbed = new EmbedBuilder()
        .setTitle('💬 Your Marketplace Negotiations')
        .setDescription(`You have **${negotiations.length}** total negotiation${negotiations.length !== 1 ? 's' : ''}`)
        .setColor(0x0099ff);

      // Show active negotiations first (up to 5) with enhanced information
      if (activeNegotiations.length > 0) {
        const displayActive = activeNegotiations.slice(0, 5);
        
        const activeSection = displayActive.map((negotiation, index) => {
          // Enhanced negotiation information using rich API data
          const listingTitle = negotiation.listing_title || negotiation.item_name || 'Unknown Item';
          const listingSlug = negotiation.listing_slug ? `\`${negotiation.listing_slug}\`` : '';
          const price = negotiation.price || negotiation.offered_price || 0;
          const unit = negotiation.unit || 'units';
          
          // Determine if user is advertiser (seller) or client (buyer)
          const isAdvertiser = negotiation.is_listing_advertiser === 1;
          const userRole = isAdvertiser ? 'Seller' : 'Buyer';
          const otherRole = isAdvertiser ? 'Buyer' : 'Seller';
          const roleEmoji = isAdvertiser ? '💰' : '🛒';
          
          // Get other party information
          const otherPartyName = isAdvertiser ? 
            (negotiation.client_username || negotiation.client_name || 'Unknown Buyer') :
            (negotiation.advertiser_username || negotiation.advertiser_name || 'Unknown Seller');
          
          // Add avatar links if available
          let otherPartyInfo = `${otherRole}: **${otherPartyName}**`;
          if (isAdvertiser && negotiation.client_avatar) {
            otherPartyInfo += ` [👤](${negotiation.client_avatar})`;
          } else if (!isAdvertiser && negotiation.advertiser_avatar) {
            otherPartyInfo += ` [👤](${negotiation.advertiser_avatar})`;
          }
          
          // Add timing information
          let timingInfo = '';
          if (negotiation.date_added) {
            const startedDate = new Date(negotiation.date_added * 1000);
            timingInfo += `📅 Started: ${startedDate.toLocaleDateString()}`;
          }
          if (negotiation.date_modified && negotiation.date_modified !== negotiation.date_added) {
            const modifiedDate = new Date(negotiation.date_modified * 1000);
            timingInfo += ` • 🔄 Last activity: ${modifiedDate.toLocaleDateString()}`;
          }
          
          return `${roleEmoji} **${listingTitle}** ${listingSlug}\n` +
                 `💰 **${Number(price).toLocaleString()} aUEC** per ${unit} • You are: **${userRole}**\n` +
                 `👥 ${otherPartyInfo}\n` +
                 `🔗 Hash: \`${negotiation.hash}\`\n` +
                 `${timingInfo}`;
        }).join('\n\n');
        
        negotiationsEmbed.addFields([
          {
            name: `🟢 Active Negotiations (${activeNegotiations.length})`,
            value: activeSection,
            inline: false
          }
        ]);
      }

      // Show completed negotiations (up to 3) with enhanced details
      if (completedNegotiations.length > 0) {
        const displayCompleted = completedNegotiations.slice(0, 3);
        
        const completedSection = displayCompleted.map((negotiation, index) => {
          const listingTitle = negotiation.listing_title || negotiation.item_name || 'Unknown Item';
          const listingSlug = negotiation.listing_slug ? `\`${negotiation.listing_slug}\`` : '';
          const finalPrice = negotiation.final_price || negotiation.price || negotiation.offered_price || 0;
          const unit = negotiation.unit || 'units';
          
          // Determine user role in this negotiation
          const isAdvertiser = negotiation.is_listing_advertiser === 1;
          const userRole = isAdvertiser ? 'Sold as' : 'Bought as';
          const roleEmoji = isAdvertiser ? '💰' : '🛒';
          
          // Get completion timing
          let completionInfo = '';
          if (negotiation.date_closed) {
            const closedDate = new Date(negotiation.date_closed * 1000);
            completionInfo = `✅ Completed: ${closedDate.toLocaleDateString()}`;
          } else if (negotiation.date_closed_client) {
            const closedDate = new Date(negotiation.date_closed_client * 1000);
            completionInfo = `✅ Completed: ${closedDate.toLocaleDateString()}`;
          }
          
          // Calculate duration if we have start and end dates
          let durationInfo = '';
          if (negotiation.date_added && (negotiation.date_closed || negotiation.date_closed_client)) {
            const startTime = negotiation.date_added * 1000;
            const endTime = (negotiation.date_closed || negotiation.date_closed_client) * 1000;
            const durationDays = Math.ceil((endTime - startTime) / (1000 * 60 * 60 * 24));
            durationInfo = ` • ⏱️ Duration: ${durationDays} day${durationDays !== 1 ? 's' : ''}`;
          }
          
          return `${roleEmoji} **${listingTitle}** ${listingSlug}\n` +
                 `💰 **${Number(finalPrice).toLocaleString()} aUEC** per ${unit} • ${userRole}\n` +
                 `${completionInfo}${durationInfo}`;
        }).join('\n\n');
        
        negotiationsEmbed.addFields([
          {
            name: `✅ Recent Completed (${completedNegotiations.length})`,
            value: completedSection,
            inline: false
          }
        ]);
      }

      // Show summary if there are more
      const totalShown = Math.min(5, activeNegotiations.length) + Math.min(3, completedNegotiations.length);
      if (negotiations.length > totalShown) {
        negotiationsEmbed.addFields([
          {
            name: '📊 Summary',
            value: `• **${activeNegotiations.length}** active negotiations\n` +
                   `• **${completedNegotiations.length}** completed negotiations\n` +
                   `• **${otherNegotiations.length}** other status\n` +
                   `Showing ${totalShown} of ${negotiations.length} total`,
            inline: false
          }
        ]);
      }

      // Add action buttons
      const actionButtons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setLabel('🌐 Visit UEX Marketplace')
            .setStyle(ButtonStyle.Link)
            .setURL('https://uexcorp.space/marketplace'),
          new ButtonBuilder()
            .setLabel('💬 Reply via Discord')
            .setStyle(ButtonStyle.Secondary)
            .setCustomId('help_reply_command')
            .setEmoji('🤖')
        );

      negotiationsEmbed
        .setFooter({ text: 'UEX Marketplace • Use /reply to respond to negotiations' })
        .setTimestamp();

      await interaction.editReply({ 
        embeds: [negotiationsEmbed], 
        components: [actionButtons] 
      });

    } catch (error) {
      logger.error('Negotiations command error', { 
        error: error.message,
        stack: error.stack,
        userId: interaction.user.id 
      });

      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Command Error')
        .setDescription('An unexpected error occurred while fetching your negotiations.')
        .setColor(0xff0000)
        .setFooter({ text: 'UEX Marketplace' })
        .setTimestamp();

      try {
        if (interaction.deferred) {
          await interaction.editReply({ embeds: [errorEmbed] });
        } else {
          await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
      } catch (replyError) {
        logger.error('Failed to send negotiations error reply', { error: replyError.message });
      }
    }
  }
}; 