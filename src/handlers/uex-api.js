/**
 * UEX API Handler
 * All functions for communicating with the UEX Corp API
 */

const config = require('../utils/config');
const logger = require('../utils/logger');

/**
 * Send a reply message to a UEX negotiation
 * @param {string} negotiationHash - The negotiation hash from UEX
 * @param {string} message - The message to send
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
async function sendReply(negotiationHash, message) {
  throw new Error('Direct sendReply not supported in multi-user mode. Use sendReplyWithCredentials.');
}

/**
 * Send a reply message to a UEX negotiation with specific credentials
 * @param {string} negotiationHash - The negotiation hash from UEX
 * @param {string} message - The message to send
 * @param {object} credentials - API credentials {apiToken, secretKey}
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
async function sendReplyWithCredentials(negotiationHash, message, credentials) {
  try {
    logger.uex(`Sending reply to negotiation: ${negotiationHash}`);
    
    const response = await fetch(`${config.UEX_API_BASE_URL}/marketplace_negotiations_messages/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${credentials.apiToken}`,
        'secret_key': credentials.secretKey,
        'User-Agent': 'UEX-Discord-Bot/2.0-MultiUser'
      },
      body: JSON.stringify({
        hash: negotiationHash,
        message: message,
        is_production: 1
      })
    });

    const responseText = await response.text();
    logger.uex('API response received', { 
      status: response.status, 
      statusText: response.statusText,
      body: responseText 
    });

    // Handle different response formats from UEX API
    if (response.ok) {
      try {
        // Try to parse as JSON first
        const jsonResponse = JSON.parse(responseText);
        
        if (jsonResponse.status === 'ok' && jsonResponse.http_code === 200) {
          const messageId = jsonResponse.data?.id_message;
          logger.success(`Reply sent successfully to ${negotiationHash}`, { messageId });
          return { 
            success: true, 
            messageId: messageId,
            data: jsonResponse.data 
          };
        } else {
          throw new Error(`UEX API error: ${jsonResponse.error || 'Unknown error'}`);
        }
      } catch (parseError) {
        // Handle text responses like "ok", "negotiation_not_found", etc.
        if (responseText.trim() === 'ok') {
          logger.success(`Reply sent successfully to ${negotiationHash}`);
          return { success: true };
        } else {
          throw new Error(`UEX API error: ${responseText}`);
        }
      }
    } else {
      throw new Error(`HTTP ${response.status}: ${responseText}`);
    }

  } catch (error) {
    logger.error(`Failed to send reply to UEX`, {
      negotiationHash,
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
 * Test connection to UEX API
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function testConnection() {
  try {
    logger.uex('Testing UEX API connection');
    
    // Use a simple endpoint to test connectivity
    const response = await fetch(`${config.UEX_API_BASE_URL}/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.UEX_API_TOKEN}`,
        'secret_key': config.UEX_SECRET_KEY,
        'User-Agent': 'UEX-Discord-Bot/2.0'
      }
    });

    if (response.ok) {
      logger.success('UEX API connection test successful');
      return { success: true };
    } else {
      throw new Error(`HTTP ${response.status}`);
    }

  } catch (error) {
    logger.error('UEX API connection test failed', { error: error.message });
    return { 
      success: false, 
      error: error.message 
    };
  }
}

/**
 * Validate UEX webhook signature
 * @param {string} body - Raw request body
 * @param {string} signature - Signature from X-UEX-Signature header
 * @returns {boolean}
 */
function validateWebhookSignature(body, signature) {
  if (!config.UEX_WEBHOOK_SECRET) {
    logger.warn('UEX_WEBHOOK_SECRET not configured - skipping signature verification');
    return true; // Skip validation if not configured
  }
  
  if (!signature) {
    logger.warn('No signature provided but UEX_WEBHOOK_SECRET is configured');
    return false;
  }
  
  try {
    const crypto = require('crypto');
    const expectedSignature = 'sha256=' + crypto
      .createHmac('sha256', config.UEX_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');
      
    const isValid = signature === expectedSignature;
    
    if (isValid) {
      logger.success('UEX webhook signature validated');
    } else {
      logger.error('UEX webhook signature mismatch');
    }
    
    return isValid;
  } catch (error) {
    logger.error('Error validating UEX webhook signature', { error: error.message });
    return false;
  }
}

/**
 * Parse and validate UEX webhook data
 * @param {string} rawBody - Raw webhook body
 * @returns {{valid: boolean, data?: object, error?: string}}
 */
function parseWebhookData(rawBody) {
  try {
    const data = JSON.parse(rawBody);
    
    // Validate required fields
    const { negotiation_hash: hash, message } = data;
    if (!hash || !message) {
      return {
        valid: false,
        error: 'Missing required fields: negotiation_hash, message'
      };
    }
    
    return {
      valid: true,
      data: data
    };
  } catch (error) {
    return {
      valid: false,
      error: `Invalid JSON: ${error.message}`
    };
  }
}

/**
 * Get user profile information from UEX API
 * @param {object} credentials - API credentials {apiToken, secretKey}
 * @returns {Promise<{success: boolean, username?: string, profile?: object, error?: string}>}
 */
async function getUserProfile(credentials) {
  try {
    logger.uex('Getting user profile from UEX API');
    
    const response = await fetch(`${config.UEX_API_BASE_URL}/user/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${credentials.apiToken}`,
        'secret_key': credentials.secretKey,
        'User-Agent': 'UEX-Discord-Bot/2.0-MultiUser'
      }
    });

    const responseText = await response.text();
    logger.uex('User profile API response received', { 
      status: response.status, 
      statusText: response.statusText,
      body: responseText 
    });

    if (response.ok) {
      try {
        const jsonResponse = JSON.parse(responseText);
        
        if (jsonResponse.status === 'ok' && jsonResponse.data) {
          const username = jsonResponse.data.username;
          logger.success('User profile retrieved successfully', { username });
          return { 
            success: true, 
            username: username,
            profile: jsonResponse.data 
          };
        } else {
          throw new Error(`UEX API error: ${jsonResponse.error || 'Unknown error'}`);
        }
      } catch (parseError) {
        throw new Error(`Failed to parse UEX API response: ${parseError.message}`);
      }
    } else {
      throw new Error(`HTTP ${response.status}: ${responseText}`);
    }

  } catch (error) {
    logger.error('Failed to get user profile from UEX API', {
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
 * Get negotiation details from UEX API
 * @param {string} negotiationHash - The negotiation hash
 * @param {object} credentials - API credentials {apiToken, secretKey}
 * @returns {Promise<{success: boolean, negotiation?: object, error?: string}>}
 */
async function getNegotiationDetails(negotiationHash, credentials) {
  try {
    logger.uex(`Getting negotiation details for hash: ${negotiationHash}`);
    
    const response = await fetch(`${config.UEX_API_BASE_URL}/marketplace_negotiations?hash=${negotiationHash}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${credentials.apiToken}`,
        'secret_key': credentials.secretKey,
        'User-Agent': 'UEX-Discord-Bot/2.0-MultiUser'
      }
    });

    const responseText = await response.text();
    logger.uex('Negotiation details API response received', { 
      status: response.status, 
      statusText: response.statusText,
      body: responseText 
    });

    if (response.ok) {
      try {
        const jsonResponse = JSON.parse(responseText);
        
        if (jsonResponse.status === 'ok' && jsonResponse.data && jsonResponse.data.length > 0) {
          const negotiation = jsonResponse.data[0]; // Get first negotiation
          logger.success('Negotiation details retrieved successfully', { 
            hash: negotiationHash,
            advertiser: negotiation.advertiser_username,
            client: negotiation.client_username
          });
          return { 
            success: true, 
            negotiation: negotiation
          };
        } else {
          throw new Error(`UEX API error: ${jsonResponse.error || 'No negotiation data found'}`);
        }
      } catch (parseError) {
        throw new Error(`Failed to parse UEX API response: ${parseError.message}`);
      }
    } else {
      throw new Error(`HTTP ${response.status}: ${responseText}`);
    }

  } catch (error) {
    logger.error('Failed to get negotiation details from UEX API', {
      negotiationHash,
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
 * Get marketplace listings
 * @param {object} filters - Optional filters {id, slug, username}
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
async function getMarketplaceListings(filters = {}) {
  try {
    logger.uex('Fetching marketplace listings', { filters });
    
    const queryParams = new URLSearchParams();
    if (filters.id) queryParams.append('id', filters.id);
    if (filters.slug) queryParams.append('slug', filters.slug);
    if (filters.username) queryParams.append('username', filters.username);
    // Support additional filters if provided
    if (filters.operation) queryParams.append('operation', filters.operation);
    // Some callers may pass item type text; API expects slug/id. Keep for forward-compat.
    if (filters.type) queryParams.append('type', filters.type);
    
    const url = `${config.UEX_API_BASE_URL}/marketplace_listings/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'UEX-Discord-Bot/2.0-MultiUser'
      }
    });

    const responseData = await response.json();
    logger.uex('Marketplace listings response', { 
      status: response.status, 
      count: responseData.data?.length || 0 
    });

    if (response.ok) {
      return { success: true, data: responseData.data || [] };
    } else {
      return { success: false, error: responseData.message || 'Failed to fetch marketplace listings' };
    }

  } catch (error) {
    logger.error('Error fetching marketplace listings', { error: error.message });
    return { success: false, error: error.message };
  }
}

// In-memory cache for lightweight autocomplete suggestions
const _autocompleteCache = {
  lastFetch: 0,
  listings: []
};

/**
 * Get autocomplete suggestions for marketplace related inputs
 * Pulls recent listings and extracts unique slugs and usernames
 * @param {string} query - Partial user input
 * @param {('item'|'username')} kind - Suggestion type
 * @param {number} [limit=25] - Max number of suggestions
 * @returns {Promise<string[]>}
 */
async function getMarketplaceAutocompleteSuggestions(query, kind, limit = 25) {
  const now = Date.now();
  const TTL_MS = 5 * 60 * 1000; // 5 minutes

  // Refresh cache if stale
  if (now - _autocompleteCache.lastFetch > TTL_MS || _autocompleteCache.listings.length === 0) {
    try {
      const res = await getMarketplaceListings({});
      if (res.success) {
        _autocompleteCache.listings = Array.isArray(res.data) ? res.data : [];
        _autocompleteCache.lastFetch = now;
      }
    } catch (e) {
      // Swallow errors here; just return empty suggestions
    }
  }

  const q = (query || '').toLowerCase();
  const values = new Set();

  for (const l of _autocompleteCache.listings) {
    if (kind === 'item') {
      // Prefer slug; fallback to title/type
      const candidates = [l.slug, l.title, l.type].filter(Boolean);
      for (const c of candidates) {
        const s = String(c);
        if (!q || s.toLowerCase().includes(q)) values.add(s);
      }
    } else if (kind === 'username') {
      const candidates = [l.user_username, l.username].filter(Boolean);
      for (const c of candidates) {
        const s = String(c);
        if (!q || s.toLowerCase().includes(q)) values.add(s);
      }
    }
    if (values.size >= limit) break;
  }

  return Array.from(values).slice(0, limit);
}

/**
 * Create a new marketplace listing
 * @param {object} listingData - Listing data (category, operation, type, etc.)
 * @param {object} credentials - API credentials {apiToken, secretKey}
 * @returns {Promise<{success: boolean, listingId?: string, error?: string}>}
 */
async function createMarketplaceListing(listingData, credentials) {
  try {
    logger.uex('Creating marketplace listing', { 
      category: listingData.id_category,
      operation: listingData.operation,
      type: listingData.type,
      title: listingData.title,
      price: listingData.price,
      unit: listingData.unit,
      is_production: listingData.is_production
    });
    
    const response = await fetch(`${config.UEX_API_BASE_URL}/marketplace_advertise/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${credentials.apiToken}`,
        'secret_key': credentials.secretKey,
        'User-Agent': 'UEX-Discord-Bot/2.0-MultiUser'
      },
      body: JSON.stringify(listingData)
    });

    let responseData;
    const responseText = await response.text();
    
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      logger.error('Failed to parse marketplace advertise response', { 
        responseText, 
        parseError: parseError.message 
      });
      return { success: false, error: 'Invalid response format from UEX API' };
    }

    logger.uex('Marketplace listing creation response', { 
      status: response.status, 
      success: response.ok,
      responseData: responseData
    });

    if (response.ok) {
      // Check for specific success response
      if (responseData === 'ok' || (typeof responseData === 'object' && responseData.status === 'ok')) {
        return { 
          success: true, 
          data: {
            id_listing: responseData.id_listing,
            url: responseData.url,
            date_expiration: responseData.date_expiration
          }
        };
      } else {
        return { success: false, error: 'Unexpected success response format' };
      }
    } else {
      // Handle specific error responses according to API documentation
      const errorMessages = {
        'service_unavailable': 'UEX service is currently unavailable',
        'missing_secret_key': 'Secret key is missing from request',
        'invalid_secret_key': 'Invalid secret key provided',
        'missing_operation': 'Operation type is required (sell/buy)',
        'invalid_operation': 'Invalid operation type (must be sell or buy)',
        'missing_type': 'Listing type is required (item/service)',
        'invalid_type': 'Invalid listing type (must be item or service)',
        'missing_id_category': 'Category ID is required',
        'missing_unit': 'Unit type is required',
        'invalid_unit': 'Invalid unit type for the selected listing type',
        'missing_title': 'Title is required',
        'missing_description': 'Description is required',
        'image_data_exceeds_limit': 'Image size exceeds 10MB limit',
        'missing_currency': 'Currency is required',
        'invalid_currency': 'Invalid currency (must be UEC)',
        'missing_language': 'Language is required',
        'invalid_language': 'Invalid language (must be en_US)',
        'category_not_found': 'The specified category does not exist',
        'item_not_found': 'The specified item was not found',
        'user_not_found': 'User account not found',
        'user_not_allowed': 'User is not allowed to create listings',
        'user_not_verified': 'User account is not verified',
        'user_active_listings_limit_reached': 'Maximum number of active listings reached',
        'image_upload_error': 'Failed to upload image',
        'image_storage_error': 'Failed to store image on server'
      };

      const errorKey = typeof responseData === 'string' ? responseData : responseData?.error || responseData?.message;
      const userFriendlyError = errorMessages[errorKey] || errorKey || `HTTP ${response.status}: ${response.statusText}`;
      
      return { 
        success: false, 
        error: userFriendlyError,
        statusCode: response.status,
        errorCode: errorKey
      };
    }

  } catch (error) {
    logger.error('Error creating marketplace listing', { 
      error: error.message, 
      stack: error.stack 
    });
    return { 
      success: false, 
      error: `Network error: ${error.message}` 
    };
  }
}



/**
 * Get user's marketplace negotiations
 * @param {object} credentials - API credentials {apiToken, secretKey}
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
async function getMarketplaceNegotiations(credentials) {
  try {
    logger.uex('Fetching marketplace negotiations');
    
    const response = await fetch(`${config.UEX_API_BASE_URL}/marketplace_negotiations/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${credentials.apiToken}`,
        'secret_key': credentials.secretKey,
        'User-Agent': 'UEX-Discord-Bot/2.0-MultiUser'
      }
    });

    const responseData = await response.json();
    logger.uex('Marketplace negotiations response', { 
      status: response.status, 
      count: responseData.data?.length || 0 
    });

    if (response.ok) {
      return { success: true, data: responseData.data || [] };
    } else {
      return { success: false, error: responseData.message || 'Failed to fetch marketplace negotiations' };
    }

  } catch (error) {
    logger.error('Error fetching marketplace negotiations', { error: error.message });
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendReply,
  sendReplyWithCredentials,
  testConnection,
  validateWebhookSignature,
  parseWebhookData,
  getUserProfile,
  getNegotiationDetails,
  getMarketplaceListings,
  getMarketplaceAutocompleteSuggestions,
  createMarketplaceListing,
  getMarketplaceNegotiations
}; 
