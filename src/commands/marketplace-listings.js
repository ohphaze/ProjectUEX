/**
 * Marketplace Listings Command (clean version)
 * Browse UEX marketplace with filters, pagination, and autocomplete
 */

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const uexAPI = require('../handlers/uex-api');
const logger = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('marketplace-listings')
    .setDescription('View active marketplace listings from UEX Corp')
    .addStringOption(option =>
      option.setName('username')
        .setDescription('Filter by specific username')
        .setAutocomplete(true)
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('operation')
        .setDescription('Filter by operation type')
        .setRequired(false)
        .addChoices(
          { name: 'Want to Sell (WTS)', value: 'sell' },
          { name: 'Want to Buy (WTB)', value: 'buy' }
        )
    )
    .addStringOption(option =>
      option.setName('item_type')
        .setDescription('Filter by item name or slug')
        .setAutocomplete(true)
        .setRequired(false)
    )
    .addIntegerOption(option =>
      option.setName('page')
        .setDescription('Page number (default: 1)')
        .setMinValue(1)
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      const username = interaction.options.getString('username');
      const operation = interaction.options.getString('operation');
      const itemType = interaction.options.getString('item_type');
      const page = interaction.options.getInteger('page') || 1;
      const perPage = 6;

      logger.command('Marketplace listings command used', {
        userId: interaction.user.id,
        username: interaction.user.username,
        filters: { username, operation, itemType, page }
      });

      await interaction.deferReply({ ephemeral: true });

      const filters = {};
      if (username) filters.username = username;

      let clientOperationFilter = null;
      if (operation === 'sell' || operation === 'buy') {
        filters.operation = operation;
      } else if (operation) {
        clientOperationFilter = operation;
      }

      let parsedItem = {};
      if (itemType) {
        parsedItem = parseSelectedItem(itemType);
        if (parsedItem.slug) filters.slug = parsedItem.slug;
        if (parsedItem.type && !filters.slug) filters.type = parsedItem.type;
      }

      // Fetch listings (request a reasonable server-side page if supported)
      let result = await uexAPI.getMarketplaceListings({ ...filters, page: 1, limit: 50 });
      if (!result.success) {
        await interaction.editReply({ embeds: [
          new EmbedBuilder()
            .setTitle('Error Fetching Listings')
            .setDescription(result.error || 'Failed to retrieve marketplace listings from UEX Corp.')
            .setColor(0xff0000)
        ]});
        return;
      }

      let listings = Array.isArray(result.data) ? result.data : (result.data ? [result.data] : []);

      // Fallback: trim a trailing random suffix on slug and retry once
      let baseSlugUsed = false;
      if (listings.length === 0 && filters.slug) {
        const baseSlug = filters.slug.replace(/-[a-zA-Z0-9]{6,}$/, '');
        if (baseSlug !== filters.slug) {
          const alt = await uexAPI.getMarketplaceListings({ slug: baseSlug, operation: filters.operation, username: filters.username });
          if (alt.success && Array.isArray(alt.data) && alt.data.length > 0) {
            listings = alt.data;
            baseSlugUsed = true;
            filters.slug = baseSlug;
          }
        }
      }

      // If still empty and we have a type-based hint, try type fallback
      if (listings.length === 0 && (parsedItem.type || parsedItem.label)) {
        const typeQuery = parsedItem.type || slugify(parsedItem.label || '');
        if (typeQuery) {
          const byType = await uexAPI.getMarketplaceListings({ type: typeQuery, operation: filters.operation, username: filters.username });
          if (byType.success && Array.isArray(byType.data) && byType.data.length > 0) {
            listings = byType.data;
            // Clear slug filter so downstream equality check doesn't remove items
            delete filters.slug;
            filters.type = typeQuery;
          }
        }
      }

      // Client-side enforcement for filters that API may not apply strictly
      if (filters.slug && listings.length > 0) {
        const s = filters.slug.toLowerCase();
        listings = listings.filter(l => {
          const ls = (l.slug || '').toLowerCase();
          return baseSlugUsed ? ls.startsWith(s) : ls === s;
        });
      }
      if (filters.type && listings.length > 0) {
        const t = String(filters.type).toLowerCase();
        listings = listings.filter(l => (String(l.type || l.title || '').toLowerCase().includes(t)) || (String(l.slug || '').toLowerCase().includes(t)));
      }
      if (username && listings.length > 0) {
        const u = username.toLowerCase();
        listings = listings.filter(l => (l.user_username || l.username || '').toLowerCase() === u);
      }
      if (clientOperationFilter && listings.length > 0) {
        listings = listings.filter(l => (l.operation || '').toLowerCase() === clientOperationFilter);
      }

      if (listings.length === 0) {
        await interaction.editReply({ embeds: [
          new EmbedBuilder()
            .setTitle('No Marketplace Listings Found')
            .setDescription('No active marketplace listings match your criteria.')
            .setColor(0x666666)
            .addFields({ name: 'Search Tips', value: '• Try different filter criteria\n• Check spelling of username or item\n• Remove filters to see all listings' })
        ]});
        return;
      }

      const totalPages = Math.max(1, Math.ceil(listings.length / perPage));
      const start = (page - 1) * perPage;
      const end = Math.min(start + perPage, listings.length);
      const pageListings = listings.slice(start, end);

      const embed = new EmbedBuilder()
        .setTitle('UEX Marketplace Listings')
        .setDescription(`Page ${page} of ${totalPages} • Found ${listings.length} listing${listings.length !== 1 ? 's' : ''} ${getFilterDescription(filters)}`)
        .setColor(0x00ff00)
        .setTimestamp();

      pageListings.forEach((l, idx) => {
        const n = start + idx + 1;
        const op = (l.operation || '').toUpperCase();
        const opLabel = op === 'SELL' || op === 'WTS' ? 'SELL' : (op === 'BUY' || op === 'WTB' ? 'BUY' : (op || 'UNKNOWN'));
        const price = l.price ? `**${Number(l.price).toLocaleString()} aUEC**` : '*Price negotiable*';
        const unit = l.unit ? ` per ${l.unit}` : '';
        let priceDisplay = price + unit;
        if (l.price_old && l.price_old !== l.price) {
          const diff = ((l.price - l.price_old) / l.price_old) * 100;
          priceDisplay += ` (${diff > 0 ? '+' : ''}${diff.toFixed(1)}%)`;
        }
        const status = (l.is_sold_out === 1 || l.in_stock === 0) ? 'Sold Out' : 'Active';
        const stock = l.in_stock ? `Stock: **${l.in_stock}** ${l.unit || 'units'}` : '*Stock available*';
        const location = l.location ? `Location: **${l.location}**` : '*Location TBD*';
        const trader = l.user_username ? `Trader: **${l.user_username}**` : '*Trader*';

        let details = `${opLabel} • ${priceDisplay}\n` +
                      `${stock} • ${status}\n` +
                      `${location} • ${trader}`;

        if (l.total_views || l.total_negotiations || l.votes) {
          details += `\nViews: **${l.total_views || 0}** • Negotiations: **${l.total_negotiations || 0}** • Votes: **${l.votes || 0}**`;
        }
        if (l.source) {
          const label = ({ looted: 'Looted', pledged: 'Pledged', purchased_in_game: 'Purchased', pirated: 'Pirated', gifted: 'Gifted' })[l.source] || l.source;
          details += `\nSource: **${label}**`;
        }
        if (l.date_expiration) {
          const d = new Date(l.date_expiration * 1000);
          const days = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          details += days > 0 ? `\nExpires: **${days}** day${days !== 1 ? 's' : ''} (${d.toLocaleDateString()})` : `\nExpired: ${d.toLocaleDateString()}`;
        }
        if (l.date_added) {
          details += `\nListed ${new Date(l.date_added * 1000).toLocaleDateString()}`;
        }
        if (l.photos && Array.isArray(l.photos) && l.photos.length > 0) {
          const imgs = l.photos.slice(0, 3).map((p, i) => `[Image ${i + 1}](${p})`).join(' • ');
          details += `\nImages: ${imgs}`;
        } else if (l.image_url) {
          details += `\nImage: ${l.image_url}`;
        }
        if (l.video_url) details += `\nVideo: ${l.video_url}`;
        if (l.contact_info) details += `\nContact: ${l.contact_info}`;
        if (l.user_avatar) details += `\nTrader Profile: ${l.user_avatar}`;

        let itemHeader = `**${l.title || l.type || 'Untitled Listing'}**`;
        if (l.slug) itemHeader += `\nItem Slug: \`${l.slug}\``;
        if (l.id && l.id !== l.slug) itemHeader += `\nListing ID: \`${l.id}\``;
        if (l.id_item && l.id_item !== l.slug) itemHeader += `\nItem ID: \`${l.id_item}\``;

        embed.addFields({ name: `${n}. ${itemHeader}`, value: details, inline: false });
      });

      const firstWithImage = pageListings.find(l => l.image_url);
      if (firstWithImage) embed.setImage(firstWithImage.image_url);

      embed.addFields({
        name: 'Browse Information',
        value: `Page ${page} of ${totalPages} • ${listings.length} total listings\nCopy item slugs above to search for similar items\nUse filters to narrow down results`,
        inline: false
      });

      // Components
      const navRow = new ActionRowBuilder();
      if (page > 1) {
        navRow.addComponents(new ButtonBuilder()
          .setCustomId(`listings_page_${page - 1}_${encodeFilters(filters)}`)
          .setLabel('Previous')
          .setStyle(ButtonStyle.Secondary));
      }
      navRow.addComponents(new ButtonBuilder()
        .setCustomId('page_indicator')
        .setLabel(`Page ${page}/${totalPages}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true));
      if (page < totalPages) {
        navRow.addComponents(new ButtonBuilder()
          .setCustomId(`listings_page_${page + 1}_${encodeFilters(filters)}`)
          .setLabel('Next')
          .setStyle(ButtonStyle.Secondary));
      }

      const actionRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder().setLabel('Visit UEX Marketplace').setStyle(ButtonStyle.Link).setURL('https://uexcorp.space/marketplace'),
          new ButtonBuilder().setLabel('Refresh').setStyle(ButtonStyle.Primary).setCustomId(`refresh_listings_${encodeFilters(filters)}`)
        );
      if (Object.keys(filters).length > 0) {
        actionRow.addComponents(new ButtonBuilder().setLabel('Clear Filters').setStyle(ButtonStyle.Secondary).setCustomId('clear_filters_listings'));
      }

      const components = [actionRow];
      if (totalPages > 1) components.unshift(navRow);

      await interaction.editReply({ embeds: [embed], components });

    } catch (error) {
      logger.error('Marketplace listings command error', { error: error.message, stack: error.stack, userId: interaction.user.id });
      const e = new EmbedBuilder().setTitle('Command Error').setDescription('An unexpected error occurred while fetching marketplace listings.').setColor(0xff0000);
      try {
        if (interaction.deferred) {
          await interaction.editReply({ embeds: [e] });
        } else {
          await interaction.reply({ embeds: [e], ephemeral: true });
        }
      } catch {}
    }
  },

  async autocomplete(interaction) {
    try {
      const focused = interaction.options.getFocused(true);
      const value = focused.value || '';
      if (focused.name === 'username') {
        const suggestions = await uexAPI.getMarketplaceAutocompleteSuggestions(value, 'username', 25);
        await interaction.respond(suggestions.map(s => ({ name: s, value: s })).slice(0, 25));
        return;
      }
      if (focused.name === 'item_type') {
        const choices = await uexAPI.getMarketplaceItemAutocomplete(value, 25);
        await interaction.respond(choices.slice(0, 25));
        return;
      }
      await interaction.respond([]);
    } catch (error) {
      logger.warn('Autocomplete failed for marketplace-listings', { error: error.message });
      try { await interaction.respond([]); } catch {}
    }
  }
};

function getFilterDescription(filters) {
  const parts = [];
  if (filters.username) parts.push(`by **${filters.username}**`);
  if (filters.operation) parts.push(`operation: **${filters.operation}**`);
  if (filters.slug) parts.push(`item: **${filters.slug}**`);
  if (filters.type) parts.push(`type: **${filters.type}**`);
  return parts.length > 0 ? `(${parts.join(', ')})` : '';
}

function encodeFilters(filters) {
  // Keep short to fit Discord customId limits (~100 chars including prefix)
  const payload = JSON.stringify({ username: filters.username, operation: filters.operation, slug: filters.slug });
  return Buffer.from(payload).toString('base64').substring(0, 80);
}

function parseSelectedItem(value) {
  const out = {};
  if (!value) return out;
  const idMatch = value.match(/\bid::([^|]+)/);
  const slugMatch = value.match(/\bslug::([^|]+)/);
  const typeMatch = value.match(/\btype::([^|]+)/);
  const labelMatch = value.match(/\blabel::([^|]+)/);
  if (idMatch) out.id = decodeURIComponent(idMatch[1]);
  if (slugMatch) out.slug = decodeURIComponent(slugMatch[1]);
  if (typeMatch) out.type = decodeURIComponent(typeMatch[1]);
  if (labelMatch) out.label = decodeURIComponent(labelMatch[1]);
  if (!idMatch && !slugMatch && !typeMatch) out.slug = value;
  return out;
}

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/["'`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Decode filters from button custom IDs
 */
function decodeFilters(encoded) {
  try {
    return JSON.parse(Buffer.from(encoded, 'base64').toString());
  } catch {
    return {};
  }
}
