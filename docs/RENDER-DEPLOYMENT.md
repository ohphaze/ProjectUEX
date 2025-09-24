# Deploying UEX Multi-User Discord Bot to Render

This guide will walk you through deploying your **UEX Multi-User Discord Bot** with full marketplace functionality to **Render** - a free hosting platform perfect for Discord bots.

## 🎯 What You'll Deploy

A comprehensive Discord bot that provides:
- **🛒 Full UEX Marketplace Integration** - Create, browse, and manage listings
- **💰 Advanced Trading Tools** - Filters, pagination, rich market data
- **💬 Negotiation Management** - View and reply to negotiations
- **🔔 Real-time Notifications** - Marketplace and negotiation updates
- **👥 Multi-User Support** - Serves unlimited users securely
- **🔒 Bank-Level Security** - AES-256 encrypted credential storage

## Why Render?

- **750 hours/month free** (25+ days of 24/7 uptime)
- **Auto-wakes on HTTP requests** (webhooks, health checks, marketplace activity)
- **Zero configuration deployment** from GitHub
- **Professional features** (HTTPS, logging, monitoring)
- **Easy environment variable management**
- **Perfect for marketplace bots** - handles traffic spikes well

## Prerequisites

Before starting, ensure you have:
- A GitHub account
- A Discord account with developer access
- UEX Corp account with API access (for testing)

## Step 1: Create Your Discord Bot

### 1.1 Go to Discord Developer Portal
1. Visit [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"**
3. Name it (e.g., "My UEX Bot")
4. Click **"Create"**

### 1.2 Create the Bot
1. Go to the **"Bot"** section in the sidebar
2. Click **"Add Bot"**
3. Under **"Token"**, click **"Copy"** (save this - you'll need it later)
4. **Important**: Keep this token secret!

### 1.3 Set Bot Permissions
1. Go to the **"OAuth2"** > **"URL Generator"** section
2. Select **"bot"** and **"applications.commands"** scopes
3. Select these bot permissions:
   - Send Messages
   - Use Slash Commands
   - Read Message History
4. Copy the generated URL and open it to invite your bot to a server

## Step 2: Fork the Repository

### 2.1 Fork on GitHub
1. Go to [UEX Trading Bot Repository](https://github.com/your-username/UEX_trading)
2. Click **"Fork"** in the top-right corner
3. Choose your GitHub account as the destination

### 2.2 Note Your Repository URL
Your forked repository will be at:
```
https://github.com/YOUR_GITHUB_USERNAME/UEX_trading
```

## Step 3: Deploy to Render

### 3.1 Create Render Account
1. Go to [Render.com](https://render.com)
2. Sign up using your **GitHub account** (recommended)
3. This will automatically connect your GitHub repositories

### 3.2 Create a New Web Service
1. Click **"New +"** in the top-right
2. Select **"Web Service"**
3. Choose **"Build and deploy from a Git repository"**
4. Click **"Connect"** next to your forked repository

### 3.3 Configure the Service
Fill in these settings:

**Basic Settings:**
- **Name**: `uex-discord-bot` (or your preferred name)
- **Environment**: `Node`
- **Region**: Choose closest to you
- **Branch**: `main`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

**Advanced Settings:**
- **Auto-Deploy**: `Yes` (deploys automatically on git push)

## Step 4: Configure Environment Variables

### 4.1 Required Environment Variables
In the Render dashboard, go to **"Environment"** and add these variables:

| Variable Name | Description | Example |
|---------------|-------------|---------|
| `DISCORD_BOT_TOKEN` | Your Discord bot token from Step 1.2 | `MTIzNDU2Nzg5...` |
| `USER_ENCRYPTION_KEY` | 32-character random string for encrypting user data | `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6` |

### 4.2 Generate Encryption Key
You need a 32-character random string. Use one of these methods:

**Option A - Online Generator:**
- Visit [Random.org String Generator](https://www.random.org/strings/)
- Set: Length 32, Characters a-z + A-Z + 0-9
- Generate and copy the result

**Option B - Command Line:**
```bash
# Linux/Mac/WSL
openssl rand -hex 16

# Windows PowerShell
[System.Web.Security.Membership]::GeneratePassword(32, 0)
```

### 4.3 Save Environment Variables
1. Click **"Add Environment Variable"** for each one
2. Enter the name and value
3. Click **"Save Changes"**

## Step 4.5: Add Persistent Disk Storage (Optional but Recommended)

By default, Render's free tier has **ephemeral storage** - user data is lost when the service restarts. To persist user registrations across restarts and deployments, add a persistent disk:

### 4.5.1 Add Persistent Disk
1. In your Render service dashboard, go to **"Disks"** in the sidebar
2. Click **"Add Disk"**
3. Configure the disk:
   - **Size**: 1GB (sufficient for hundreds of users)
   - **Mount Path**: `/var/data`
   - **Name**: `user-data-storage`
4. Click **"Add Disk"**

### 4.5.2 Configure Persistent Data Environment Variable
1. Go to **"Environment"** in your Render dashboard
2. Add this environment variable:

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `PERSISTENT_DATA_DIR` | `/var/data` | Directory where user data will be stored |

### 4.5.3 Cost Information
- **1GB persistent disk**: $0.25/month
- **Total cost with Render Starter**: $7 (service) + $0.25 (disk) = $7.25/month
- **Benefits**: User data persists across all restarts and deployments

### 4.5.4 Without Persistent Disk
If you don't add persistent disk:
- User data is stored in ephemeral storage
- Users must re-register after each restart
- Free tier works but requires re-registration

## Step 5: Deploy and Test

### 5.1 Deploy the Bot
1. Click **"Create Web Service"**
2. Render will start building and deploying your bot
3. This takes 2-5 minutes for the first deployment
4. Watch the logs for any errors

### 5.2 Test the Deployment
Once deployed, you should see:
- **Status**: "Live" (green indicator)
- **Logs**: "Discord bot is ready!" message
- **Health Check**: Your service URL + `/health` should return "OK"

### 5.3 Test Bot Commands
1. Go to your Discord server
2. Type `/` and you should see your bot's commands:
   - `/help` - Comprehensive help system
   - `/admin info` - Bot configuration (admin only)
   - `/marketplace-add` - Create marketplace listings
   - `/marketplace-listings` - Browse marketplace
   - `/negotiations` - View negotiations
   - `/register` - User registration
   - `/reply` - Reply to negotiations
   - `/unregister` - Remove credentials

3. **Basic Tests:**
   ```
   /help                    # Should show help system
   /admin info             # Should show bot configuration
   /marketplace-listings   # Should show "Please register first" message
   ```

4. **Full Testing (after user registration):**
   ```
   /register api_token:your_token secret_key:your_secret
   /marketplace-listings   # Should show marketplace listings
   /marketplace-add       # Should open listing creation form
   /negotiations          # Should show your negotiations
   ```

## Step 6: User Registration

### 6.1 Get UEX API Credentials
Users need to obtain their UEX API credentials:
1. Visit [UEX Corp API Portal](https://uexcorp.space/api)
2. Log in with UEX account
3. Generate API Token and Secret Key

### 6.2 Register with Bot
Each user registers their credentials with the bot:
```
/register api_token:YOUR_UEX_TOKEN secret_key:YOUR_UEX_SECRET
```

The bot will encrypt and store these credentials securely.

## Step 7: Configure UEX Webhooks (Optional)

To receive real-time notifications when negotiations update:

### 7.1 Get Your Service URL
- In Render dashboard, copy your service URL (e.g., `https://uex-discord-bot-abc123.onrender.com`)

### 7.2 Set Up Webhook in UEX
1. Contact UEX Corp support or use their webhook configuration
2. Provide webhook URL: `YOUR_SERVICE_URL/webhook/uex`
3. Provide webhook secret: (any random string you choose)
4. Add `UEX_WEBHOOK_SECRET` environment variable in Render with the same secret

## Privacy Settings

### Option 1: Private Discord Server
1. Create your own Discord server
2. Only invite your bot
3. Keep the server private (don't share invite links)

### Option 2: Private Channel
1. Create a private channel in existing server
2. Remove permissions for @everyone
3. Only allow yourself and the bot

### Option 3: DM Commands (Shared Server)
- Use `/register`, `/reply`, `/unregister` in DMs with the bot
- Commands are ephemeral (only you see responses)

## Monitoring and Maintenance

### Auto-Sleep Prevention (Keep-Alive)
The bot now includes a **keep-alive mechanism** that prevents sleeping:
- **Automatically pings** the health endpoint every 10 minutes
- **Only runs in deployed environments** (Render, etc.)
- **Prevents webhook delivery issues** caused by service sleeping
- **Visible in logs** as "Keep-alive ping successful"

### Auto-Sleep Behavior (Legacy)
- Service sleeps after 15 minutes of inactivity
- **Automatically wakes** on:
  - Incoming webhooks
  - Discord commands
  - Health check requests
- **Keep-alive prevents this** from happening

### Webhook Reliability
Recent improvements for webhook handling:
- **Faster response times** to prevent UEX timeouts
- **Asynchronous processing** to handle wake-up delays
- **Better error logging** for debugging
- **Service stays awake** with keep-alive mechanism

### Logs and Debugging
- View logs in Render dashboard under **"Logs"**
- Look for "Keep-alive ping successful" messages
- Check webhook processing times in logs
- Monitor "Webhook received and processing" messages
- Bot automatically reconnects to Discord if needed

### Updates
- Push changes to your GitHub repository
- Render automatically rebuilds and deploys
- Zero downtime deployments
- Keep-alive mechanism persists through updates

## Troubleshooting

### Bot Not Responding
1. Check Render logs for errors
2. Verify environment variables are set correctly
3. Ensure Discord bot token is valid
4. Check if service is sleeping (send a command to wake it)

### API Errors
1. Verify UEX API credentials are correct
2. Check if UEX API is experiencing downtime
3. Look for rate limiting messages in logs

### Webhook Issues
1. Verify webhook URL is accessible: `YOUR_SERVICE_URL/webhook/uex`
2. Check `UEX_WEBHOOK_SECRET` matches what you provided to UEX
3. Monitor webhook logs in Render dashboard

### Service Won't Start
1. Check build logs for npm install errors
2. Verify `package.json` has correct dependencies
3. Ensure Node.js version compatibility

### Missing Webhook Notifications
**If you're not receiving UEX notifications:**

1. **Check if keep-alive is working**:
   - Look for "Keep-alive ping successful" in logs
   - Should appear every 10 minutes
   - If missing, service might be sleeping

2. **Verify webhook configuration**:
   - Webhook URL: `YOUR_SERVICE_URL/webhook/uex`
   - Secret matches your `UEX_WEBHOOK_SECRET`
   - UEX Corp has your correct webhook URL

3. **Check webhook delivery**:
   - Look for "UEX webhook received" in logs
   - Check "Webhook received and processing" messages
   - Monitor processing times (should be under 1000ms)

4. **Test webhook manually**:
   ```bash
   curl -X POST YOUR_SERVICE_URL/webhook/uex \
     -H "Content-Type: application/json" \
     -d '{"test": "data"}'
   ```

5. **Force wake-up test**:
   - Visit: `YOUR_SERVICE_URL/health`
   - Should return bot status immediately
   - If slow (>5 seconds), service was sleeping

**Quick Fix**: If notifications are still missing, redeploy the service with the new keep-alive mechanism.

## Cost Management

### Free Tier Limits
- **750 hours/month** (about 25 days)
- Resets monthly
- Monitor usage in Render dashboard

### Usage Optimization
- Service only runs when active
- Automatic sleep saves hours
- Consider paid plan ($7/month) for true 24/7 uptime if needed

## Security Best Practices

1. **Never share your Discord bot token**
2. **Use strong encryption key** (32+ random characters)
3. **Keep your GitHub repository private** if you prefer
4. **Regularly rotate API credentials**
5. **Monitor access logs** for unusual activity

## Support

If you encounter issues:
1. Check the [troubleshooting section](#troubleshooting)
2. Review Render logs for error messages
3. Verify all environment variables are correctly set
4. Ensure your Discord bot has proper permissions

## Next Steps

Once deployed successfully:
1. Share registration instructions with your team
2. Set up private channels for notifications
3. Consider upgrading to paid plan for 24/7 uptime
4. Monitor usage and performance through Render dashboard

Your UEX Discord Bot is now live and ready to serve multiple users with bank-level security! 