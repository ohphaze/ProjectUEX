/**
 * Marketplace Add Command
 * Create new marketplace listings on UEX Corp using the official API specification
 */

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const uexAPI = require('../handlers/uex-api');
const userManager = require('../utils/user-manager');
const logger = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('marketplace-add')
    .setDescription('Create a new marketplace listing on UEX Corp')
    .addStringOption(option =>
      option
        .setName('title')
        .setDescription('Listing title (alphanumeric and dashes only, max 140 chars)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('operation')
        .setDescription('Operation type')
        .setRequired(true)
        .addChoices(
          { name: 'Sell', value: 'sell' },
          { name: 'Buy', value: 'buy' }
        )
    )
    .addStringOption(option =>
      option
        .setName('type')
        .setDescription('Listing type')
        .setRequired(true)
        .addChoices(
          { name: 'Item (helmets, armor sets, etc.)', value: 'item' },
          { name: 'Service (escort, hauler, miner, etc.)', value: 'service' }
        )
    )
    .addIntegerOption(option =>
      option
        .setName('category')
        .setDescription('Item category ID (1=Materials, 2=Commodities, 3=Equipment, etc.)')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('price')
        .setDescription('Price per unit in UEC')
        .setRequired(true)
        .setMinValue(1)
    )
    // Required options must come before optional ones (Discord API constraint)
    .addStringOption(option =>
      option
        .setName('description')
        .setDescription('Detailed description of your listing (max 65535 chars)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('item_unit')
        .setDescription('Unit type for ITEMS (use only if type=item)')
        .setRequired(false)
        .addChoices(
          { name: 'Box', value: 'box' },
          { name: 'Crate', value: 'crate' },
          { name: 'cSCU', value: 'cscu' },
          { name: 'Dozen', value: 'dozen' },
          { name: 'Hundred', value: 'hundred' },
          { name: 'Pack', value: 'pack' },
          { name: 'Pair', value: 'pair' },
          { name: 'SCU', value: 'scu' },
          { name: 'Set', value: 'set' },
          { name: 'Stack', value: 'stack' },
          { name: 'Thousand', value: 'thousand' },
          { name: 'Unit', value: 'unit' }
        )
    )
    .addStringOption(option =>
      option
        .setName('service_unit')
        .setDescription('Unit type for SERVICES (use only if type=service)')
        .setRequired(false)
        .addChoices(
          { name: 'Contract', value: 'contract' },
          { name: 'Cycle', value: 'cycle' },
          { name: 'Day', value: 'day' },
          { name: 'Event', value: 'event' },
          { name: 'Expedition', value: 'expedition' },
          { name: 'GM', value: 'gm' },
          { name: 'Hour', value: 'hour' },
          { name: 'Minute', value: 'minute' },
          { name: 'Mission', value: 'mission' },
          { name: 'Month', value: 'month' },
          { name: 'Operation', value: 'operation' },
          { name: 'Route', value: 'route' },
          { name: 'Run', value: 'run' },
          { name: 'Service', value: 'service' }
        )
    )
    .addStringOption(option =>
      option
        .setName('location')
        .setDescription('Location (e.g., "Port Tressler", "New Babbage") - Optional')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('image_url')
        .setDescription('Image URL for your listing (JPG or PNG) - Optional')
        .setRequired(false)
    )
    .addBooleanOption(option =>
      option
        .setName('is_production')
        .setDescription('Create production listing (true) or test listing (false)')
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      const userId = interaction.user.id;

      // Extract all parameters
      const title = interaction.options.getString('title');
      const operation = interaction.options.getString('operation');
      const type = interaction.options.getString('type');
      const category = interaction.options.getInteger('category');
      const price = interaction.options.getInteger('price');
      const itemUnit = interaction.options.getString('item_unit');
      const serviceUnit = interaction.options.getString('service_unit');
      const description = interaction.options.getString('description');
      const location = interaction.options.getString('location') || '';
      const imageUrl = interaction.options.getString('image_url') || '';
      const isProduction = interaction.options.getBoolean('is_production') ?? true; // Default to production

      // Determine the unit based on type
      let unit;
      if (type === 'item') {
        if (!itemUnit) {
          const validationEmbed = new EmbedBuilder()
            .setTitle('❌ Missing Item Unit')
            .setDescription('You must specify an item unit when creating item listings.')
            .setColor(0xff0000)
            .addFields([
              {
                name: '📦 Available Item Units',
                value: 'box, crate, cscu, dozen, hundred, pack, pair, scu, set, stack, thousand, unit',
                inline: false
              }
            ])
            .setFooter({ text: 'Please select an item unit and try again' })
            .setTimestamp();

          await interaction.reply({ embeds: [validationEmbed], ephemeral: true });
          return;
        }
        unit = itemUnit;
      } else if (type === 'service') {
        if (!serviceUnit) {
          const validationEmbed = new EmbedBuilder()
            .setTitle('❌ Missing Service Unit')
            .setDescription('You must specify a service unit when creating service listings.')
            .setColor(0xff0000)
            .addFields([
              {
                name: '🛠️ Available Service Units',
                value: 'contract, cycle, day, event, expedition, gm, hour, minute, mission, month, operation, route, run, service',
                inline: false
              }
            ])
            .setFooter({ text: 'Please select a service unit and try again' })
            .setTimestamp();

          await interaction.reply({ embeds: [validationEmbed], ephemeral: true });
          return;
        }
        unit = serviceUnit;
      }

      // Validate title format (alphanumeric and dashes only)
      if (!/^[a-zA-Z0-9\s\-]+$/.test(title)) {
        const validationEmbed = new EmbedBuilder()
          .setTitle('❌ Invalid Title Format')
          .setDescription('Title must contain only alphanumeric characters and dashes.')
          .setColor(0xff0000)
          .addFields([
            {
              name: '✅ Valid Examples',
              value: '• "Premium Titanium Ore"\n• "High-Quality Ship Parts"\n• "Escort-Service-Alpha"',
              inline: false
            },
            {
              name: '❌ Invalid Characters',
              value: 'Special characters like @, #, $, %, &, *, (, ), etc. are not allowed',
              inline: false
            }
          ])
          .setFooter({ text: 'UEX Marketplace API Requirements' })
          .setTimestamp();

        await interaction.reply({ embeds: [validationEmbed], ephemeral: true });
        return;
      }



      logger.command('Marketplace add command used', {
        userId,
        username: interaction.user.username,
        title,
        operation,
        type,
        category,
        price,
        unit,
        isProduction,
        hasImage: !!imageUrl
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

      // Prepare image data if URL provided
      let imageData = null;
      if (imageUrl) {
        try {
          // Download and convert image to base64
          const response = await fetch(imageUrl);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          
          const buffer = await response.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          imageData = base64;
          
          // Check file size (10MB limit)
          if (base64.length > 10485760) {
            throw new Error('Image too large (max 10MB)');
          }
        } catch (error) {
          const imageErrorEmbed = new EmbedBuilder()
            .setTitle('⚠️ Image Processing Error')
            .setDescription('Failed to process the provided image URL.')
            .setColor(0xffa500)
            .addFields([
              {
                name: '❌ Error Details',
                value: `${error.message}`,
                inline: false
              },
              {
                name: '📝 Image Requirements',
                value: '• Must be JPG or PNG format\n• Maximum size: 10MB\n• Must be accessible via direct URL\n• HTTPS URLs recommended',
                inline: false
              },
              {
                name: '💡 What to Do',
                value: 'Your listing will be created **without an image**. You can try again with a different image URL.',
                inline: false
              }
            ])
            .setFooter({ text: 'Continuing without image...' })
            .setTimestamp();

          await interaction.editReply({ embeds: [imageErrorEmbed] });
          
          // Wait 3 seconds then continue without image
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      // Prepare listing data according to UEX API specification
      const listingData = {
        id_category: category,
        operation: operation,
        language: 'en_US',
        type: type,
        unit: unit,
        price: price,
        currency: 'UEC',
        location: location,
        title: title,
        description: description,
        is_production: isProduction ? 1 : 0
      };

      // Add image data if processed successfully
      if (imageData) {
        listingData.image_data = imageData;
      }

      // Create the marketplace listing
      const result = await uexAPI.createMarketplaceListing(listingData, userResult.credentials);

      if (!result.success) {
        const errorEmbed = new EmbedBuilder()
          .setTitle('❌ Failed to Create Listing')
          .setDescription('Failed to create your marketplace listing on UEX Corp.')
          .setColor(0xff0000)
          .addFields([
            {
              name: '⚠️ Error Details',
              value: result.error || 'Unknown error occurred',
              inline: false
            },
            {
              name: '🔍 Common Issues',
              value: '• **Category ID**: Make sure it exists (1=Materials, 2=Commodities, 3=Equipment)\n' +
                     '• **Title Format**: Only alphanumeric characters and dashes allowed\n' +
                     '• **Price**: Must be a positive integer\n' +
                     '• **Unit Type**: Must match your item/service type\n' +
                     '• **API Credentials**: May need to refresh your registration',
              inline: false
            },
            {
              name: '🛠️ Next Steps',
              value: '• Double-check all parameters\n• Try with a different category ID\n• Re-register if credential issues persist\n• Contact support if problem continues',
              inline: false
            }
          ])
          .setFooter({ text: 'UEX Marketplace API Error • Try again with adjusted parameters' })
          .setTimestamp();

        await interaction.editReply({ embeds: [errorEmbed] });
        return;
      }

      // Success! Show listing details with website-style design
      const operationEmoji = operation === 'sell' ? '💰' : '🛒';
      const operationText = operation === 'sell' ? 'WTS (Want to Sell)' : 'WTB (Want to Buy)';
      const typeEmoji = type === 'item' ? '📦' : '🛠️';
      const statusEmoji = '🟢';
      const productionBadge = isProduction ? '🌍 Production' : '🧪 Test';
      
      const successEmbed = new EmbedBuilder()
        .setTitle(`✅ ${operationText} Listing Created!`)
        .setDescription(`Your **${operationText}** listing is now **live** on the UEX Marketplace`)
        .setColor(operation === 'sell' ? 0x00ff00 : 0x0099ff);

      // Add main listing info in website-style format
      successEmbed.addFields([
        {
          name: `${operationEmoji} ${title}`,
          value: `**${Number(price).toLocaleString()} UEC** per ${unit} | ${typeEmoji} **${type.toUpperCase()}**\n` +
                 `📍 **${location || 'Location not specified'}** | ${statusEmoji} **Active** | ${productionBadge}\n` +
                 `🏷️ **${getCategoryName(category)}** • Unit: **${unit}**`,
          inline: false
        }
      ]);

      // Add description
      successEmbed.addFields([
        {
          name: '📝 Description',
          value: description.length > 300 ? description.substring(0, 300) + '...' : description,
          inline: false
        }
      ]);

      // Add API response details if available
      if (result.data) {
        const responseFields = [];
        
        if (result.data.id_listing) {
          responseFields.push({
            name: '🆔 Listing ID',
            value: `\`${result.data.id_listing}\``,
            inline: true
          });
        }
        
        if (result.data.url) {
          responseFields.push({
            name: '🌐 Direct URL',
            value: `[View Listing](${result.data.url})`,
            inline: true
          });
        }
        
        if (result.data.date_expiration) {
          const expirationDate = new Date(result.data.date_expiration * 1000);
          responseFields.push({
            name: '⏰ Expires',
            value: expirationDate.toLocaleDateString(),
            inline: true
          });
        }
        
        if (responseFields.length > 0) {
          successEmbed.addFields(responseFields);
        }
      }

      // Add listing management tips
      successEmbed.addFields([
        {
          name: '📈 Track Your Listing Performance',
          value: '• **Views** - How many people have seen your listing\n' +
                 '• **Negotiations** - Number of interested buyers/sellers\n' +
                 '• **Votes** - Community trust rating for your listing\n' +
                 'Use `/marketplace-listings username:' + interaction.user.username + '` to check your stats',
          inline: false
        },
        {
          name: '💡 Pro Tips for Better Results',
          value: '• **Add images** - Listings with photos get 3x more views\n' +
                 '• **Set competitive prices** - Check market rates first\n' +
                 '• **Update regularly** - Fresh listings appear higher in searches\n' +
                 '• **Respond quickly** - Fast replies improve your rating',
          inline: false
        }
      ]);

      // Set image prominently like the website
      if (imageUrl) {
        successEmbed.setImage(imageUrl);
        successEmbed.addFields([
          {
            name: '🖼️ Image Attached',
            value: 'Your listing image is displayed above and will appear on the UEX marketplace',
            inline: false
          }
        ]);
      }

      successEmbed
        .setFooter({ text: `UEX Marketplace • ${productionBadge} • Your listing is now visible to all traders!` })
        .setTimestamp();

      // Add action buttons
      const actionButtons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setLabel('🌐 View on UEX Marketplace')
            .setStyle(ButtonStyle.Link)
            .setURL(result.data?.url || 'https://uexcorp.space/marketplace'),
          new ButtonBuilder()
            .setLabel('💬 View My Negotiations')
            .setStyle(ButtonStyle.Secondary)
            .setCustomId('view_negotiations')
            .setEmoji('📋')
        );

      await interaction.editReply({ 
        embeds: [successEmbed], 
        components: [actionButtons] 
      });

    } catch (error) {
      logger.error('Marketplace add command error', { 
        error: error.message,
        stack: error.stack,
        userId: interaction.user.id 
      });

      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Command Error')
        .setDescription('An unexpected error occurred while creating your marketplace listing.')
        .setColor(0xff0000)
        .addFields([
          {
            name: '🔧 What to Try',
            value: '• Check your internet connection\n• Verify your UEX credentials are still valid\n• Try the command again in a few minutes\n• Contact support if the issue persists',
            inline: false
          },
          {
            name: '⚠️ Error Details',
            value: `\`${error.message}\``,
            inline: false
          }
        ])
        .setFooter({ text: 'UEX Marketplace Error Handler' })
        .setTimestamp();

      try {
        if (interaction.deferred) {
          await interaction.editReply({ embeds: [errorEmbed] });
        } else {
          await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
      } catch (replyError) {
        logger.error('Failed to send marketplace add error reply', { error: replyError.message });
      }
    }
  }
};

/**
 * Get category name from category ID
 */
function getCategoryName(categoryId) {
  const categories = {
    1: 'Materials',
    2: 'Commodities', 
    3: 'Equipment',
    4: 'Ships',
    5: 'Components',
    6: 'Weapons',
    7: 'Armor',
    8: 'Services',
    9: 'Other'
  };
  
  return categories[categoryId] || `Category ${categoryId}`;
} 
