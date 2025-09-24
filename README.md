# UEX Multi-User Discord Bot

A comprehensive, self-hostable Discord bot for **UEX Corp marketplace trading and negotiations**. One deployment serves unlimited users with bank-level security and complete privacy options.

## 🎯 What This Bot Does

- **🛒 Full Marketplace Integration**: Create, browse, and manage UEX marketplace listings directly from Discord
- **💰 Advanced Trading Tools**: Browse listings with filters, pagination, and rich market data 
- **🔔 Real-time Notifications**: Receive UEX Corp marketplace and negotiation updates as Discord DMs
- **💬 Interactive Trading**: Reply to negotiations directly through Discord with slash commands or buttons
- **👥 Multi-User Architecture**: One bot deployment serves unlimited users securely with encrypted credential storage
- **🔒 Privacy by Design**: Multiple privacy options using Discord's built-in permission system
- **💰 Free Forever**: Deploy once on free hosting platforms, serve unlimited users

## 🚀 Quick Start

### **🤖 Invite Automatix to Your Server**
Ready to use Automatix? [**Invite Automatix to your Discord server**](https://discord.com/oauth2/authorize?client_id=1229684801213042708&permissions=2147551232&integration_type=0&scope=bot) and start trading on the UEX marketplace immediately!

### **🌍 Join Our Community Server**
Want to try Automatix first? [**Join our Discord server**](https://discord.gg/f36UX9bQG4) where Automatix is already available and ready to use!

## 🛒 Marketplace Features

### **📋 Browse & Discover**
- **`/marketplace-listings`** - Browse all marketplace listings with advanced filters
- **Pagination Support** - Navigate through thousands of listings (6 per page)
- **Operation Filters** - Filter by WTS (sell), WTB (buy), or Trading listings
- **Item Discovery** - View item slugs and IDs to copy for searches
- **Rich Market Data** - Price changes, popularity metrics, trader ratings, expiration dates

### **📦 Create Listings** 
- **`/marketplace-add`** - Create professional marketplace listings
- **Full UEX API Support** - All marketplace_advertise API fields included
- **Item & Service Types** - Support for both items and services with proper unit validation
- **Image Support** - Automatic image processing and base64 conversion
- **Production & Test** - Toggle between production and test listings
- **Smart Validation** - Real-time field validation with helpful error messages

### **💬 Manage Negotiations**
- **`/negotiations`** - View your active marketplace negotiations  
- **`/reply`** - Reply to negotiations with rich context display
- **Interactive Buttons** - Quick reply buttons in notification messages
- **Comprehensive Data** - Full negotiation details with trader information

## 🏗️ Multi-User Architecture

This bot is designed for **one admin to deploy and serve multiple users**:

- **Express Server**: Handles incoming UEX webhooks at `/webhook/uex` + serves health endpoint
- **Discord.js Client**: Connects to Discord Gateway for DM delivery and command handling  
- **Encrypted User Storage**: All user credentials secured with AES-256-GCM encryption
- **User Isolation**: Each user can only access their own negotiations and marketplace data
- **Privacy Controls**: Discord permissions provide complete user isolation options

### 🔒 Privacy Options for Users

**🏠 Private Discord Server (Recommended)**
- User creates their own Discord server
- Invites only the bot (complete isolation)
- Like having a personal trading bot

**🔒 Private Channels**
- Use private channels in existing Discord servers
- Channel permissions control who can see bot interactions
- Perfect for teams or trading groups

**👥 Shared Servers**
- All bot commands are ephemeral (only the user sees responses)
- User credentials are encrypted and isolated from other users
- Convenient for large Discord communities

## 🚀 Deployment Options

Choose your deployment method based on your needs and technical expertise:

### 📱 **Option 1: Render (Easiest - Recommended for Beginners)**
- **✅ Best for**: Quick setup, automatic deployments, beginners
- **✅ Pros**: Zero configuration, GitHub integration, free 750hrs/month
- **❌ Cons**: Auto-sleeps after inactivity, limited to 750hrs/month on free tier
- **📖 [→ Render Deployment Guide](docs/RENDER-DEPLOYMENT.md)**

### 🖥️ **Option 2: Local Development/Personal Use**
- **✅ Best for**: Development, testing, personal use on your own computer
- **✅ Pros**: Full control, no hosting costs, instant setup
- **❌ Cons**: Only works when your computer is on, not accessible remotely
- **📖 [→ Local Setup Guide](#local-development--testing)**

### 🌐 **Option 3: VM/Server Deployment**
- **✅ Best for**: 24/7 operation, advanced users, production environments
- **✅ Pros**: Always online, full control, can serve many users
- **❌ Cons**: Requires server management knowledge, potential costs
- **📖 [→ VM/Server Setup Guide](#vmserver-deployment)**

### 🆓 **Option 4: Free Cloud Platforms**
- **GCP Always Free**: **$0 forever** - [GCP Guide](docs/GCP-DEPLOYMENT.md)
- **AWS Lightsail**: **$3.50/month** - [AWS Guide](docs/AWS-DEPLOYMENT.md)
- **📖 [→ Complete Platform Comparison](docs/DEPLOYMENT-OVERVIEW.md)**

---

## 🏠 Local Development / Testing

Perfect for development, testing, or personal use on your own computer.

### Prerequisites
- **Node.js 18+** - [Download from nodejs.org](https://nodejs.org/)
- **Git** - [Download from git-scm.com](https://git-scm.com/)
- **Discord Bot** - [Create at Discord Developer Portal](https://discord.com/developers/applications)

### Step 1: Clone and Setup
```bash
# Clone the repository
git clone https://github.com/your-username/UEX_trading.git
cd UEX_trading

# Install dependencies
npm install

# Copy environment template
cp env.example .env
```

### Step 2: Configure Environment
Edit `.env` file with your credentials:
```bash
# Required - Get from Discord Developer Portal
DISCORD_BOT_TOKEN=your_discord_bot_token_here

# Required - Generate a random 32+ character string
USER_ENCRYPTION_KEY=your_random_32_character_encryption_key

# Optional - For webhook validation
UEX_WEBHOOK_SECRET=your_webhook_secret
```

### Step 3: Register Commands & Start
```bash
# Register Discord slash commands
node scripts/register-commands.js

# Start development server
npm run dev

# Or for production
npm start
```

### Step 4: Test Your Setup
1. **Health Check**: Visit `http://localhost:3000/health`
2. **Discord Commands**: Try `/help` in Discord
3. **User Registration**: Use `/register` with your UEX credentials
4. **Marketplace**: Try `/marketplace-listings` to browse

---

## 🌐 VM/Server Deployment

Deploy on any Linux server, VPS, or cloud instance for 24/7 operation.

### Prerequisites
- **Linux Server** (Ubuntu 20.04+ recommended)
- **Node.js 18+** and **npm**
- **PM2** (for process management)
- **Domain/IP** accessible from internet (for webhooks)

### Step 1: Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Git
sudo apt install git -y
```

### Step 2: Application Setup
```bash
# Clone repository
git clone https://github.com/your-username/UEX_trading.git
cd UEX_trading

# Install dependencies
npm install

# Copy environment template
cp env.example .env
```

### Step 3: Configure Environment
Edit `.env` with your production values:
```bash
# Use nano or vim to edit
nano .env

# Required variables:
DISCORD_BOT_TOKEN=your_production_bot_token
USER_ENCRYPTION_KEY=your_secure_encryption_key_32_chars
PORT=3000
NODE_ENV=production
UEX_WEBHOOK_SECRET=your_webhook_secret
```

### Step 4: Setup Process Management
```bash
# Register Discord commands
node scripts/register-commands.js

# Start with PM2
pm2 start src/bot.js --name "uex-discord-bot"

# Configure auto-restart on server reboot
pm2 startup
pm2 save
```

### Step 5: Configure Reverse Proxy (Optional)
For HTTPS and custom domain:

**Using Nginx:**
```bash
sudo apt install nginx -y

# Create nginx config
sudo nano /etc/nginx/sites-available/uex-bot
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site and restart nginx
sudo ln -s /etc/nginx/sites-available/uex-bot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Optional: Setup SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

### Step 6: Monitor Your Deployment
```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs uex-discord-bot

# Monitor with PM2 web interface
pm2 install pm2-web
pm2-web
```

---

## 💬 User Guide

### Getting Your UEX API Credentials

**🔑 Step 1: Get API Token (Bearer Token)**
1. Login to [UEX Corp](https://uexcorp.space)
2. Navigate to **"My Apps"** section  
3. Create a new application or select existing
4. Copy the **"Bearer Token"** - this is your `api_token`

**🔐 Step 2: Get Secret Key**
1. Go to **"Account Settings"** in your UEX profile
2. Find the **"Secret Key"** section
3. Generate new key if needed
4. Copy the secret key - this is your `secret_key`

### Registration & Setup

**1. Register Your Credentials:**
```
/register api_token:your_bearer_token secret_key:your_secret_key
```
⚠️ **Important**: Use in DMs or private channels only!

**2. Configure UEX Webhooks:**
- In UEX Corp account settings
- Set webhook URL: `https://your-bot-domain.com/webhook/uex`
- Set webhook secret (if configured by admin)

### Available Commands

**❓ Get Help:**
```
/help                    # General help and getting started
/help topic:credentials  # Step-by-step UEX credential guide  
/help topic:commands     # Complete command reference
/help topic:privacy      # Privacy and security information
```

**🛒 Marketplace Commands:**
```
/marketplace-add         # Create new marketplace listing
/marketplace-listings    # Browse marketplace with filters
/negotiations           # View your active negotiations
```

**💬 Trading & Communication:**
```
/reply hash:abc123 message:Thanks for your offer!
```

**📝 Account Management:**
```
/register api_token:token secret_key:secret
/unregister             # Remove your credentials
```

**🔧 Admin Commands (for bot admins):**
```
/admin stats            # User registration statistics
/admin info             # Bot configuration details
```

### Interactive Features

**🔔 Automatic Notifications:**
- Receive DMs for marketplace events and negotiations
- Rich embeds with trading details and market data
- Interactive "Reply" buttons for quick responses

**⚡ Smart Marketplace Tools:**
- **Pagination**: Navigate thousands of listings efficiently
- **Advanced Filters**: Operation type, item category, username search
- **Item Discovery**: Copy item slugs/IDs directly from listings
- **Rich Data**: Price changes, popularity, trader ratings, expiration dates

**🔒 Privacy Features:**
- All commands are ephemeral (only you see responses)
- Your credentials are encrypted and isolated
- Choose privacy level with Discord permissions

## 🔒 Security & Privacy

- 🔐 **Bank-level Encryption**: All user credentials encrypted with AES-256-GCM
- 👤 **Complete User Isolation**: Users can only access their own data
- 🔑 **Permission Validation**: Admin commands require Discord permissions
- 📝 **Comprehensive Logging**: All actions logged for security monitoring
- 🏠 **Privacy by Choice**: Use Discord permissions for complete isolation
- 🛡️ **Secure Storage**: File-based encrypted storage, no database required

## 📁 Project Structure

```
src/
├── bot.js                      # Main entry point: Express + Discord client
├── commands/                   # Discord slash commands
│   ├── register.js            # User credential registration
│   ├── unregister.js          # User credential removal
│   ├── marketplace-add.js     # Create marketplace listings
│   ├── marketplace-listings.js # Browse marketplace with filters
│   ├── negotiations.js        # View user's negotiations
│   ├── reply.js               # Reply to negotiations
│   ├── help.js                # Comprehensive help system
│   └── admin.js               # Admin commands (stats, info)
├── handlers/                   # External integrations
│   ├── webhook.js             # UEX webhook processing
│   ├── uex-api.js             # UEX API communication
│   └── button-interactions.js # Discord button/modal handling
└── utils/                      # Shared utilities
    ├── config.js              # Environment configuration
    ├── logger.js              # Logging utility
    └── user-manager.js        # User credential encryption/storage

docs/                          # Deployment guides
├── DEPLOYMENT-OVERVIEW.md     # Platform comparison guide
├── RENDER-DEPLOYMENT.md       # Render hosting guide
├── AWS-DEPLOYMENT.md          # AWS Lightsail guide
└── GCP-DEPLOYMENT.md          # Google Cloud guide

scripts/
├── register-commands.js       # Slash command registration
├── validate-deployment.js     # Pre-deployment validation
└── deploy.js                  # Deployment automation

user_data/                     # Encrypted user credential files (auto-created)
```

## 🛠️ Development & Maintenance

### Adding New Commands
```javascript
// src/commands/example.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('example')
    .setDescription('Example command'),
  
  async execute(interaction) {
    await interaction.reply({ 
      content: 'Hello from UEX Bot!', 
      ephemeral: true 
    });
  }
};
```

### Available Scripts
```bash
npm start              # Production server
npm run dev           # Development with auto-reload
npm run validate      # Pre-deployment validation
npm run deploy        # Deployment automation
npm test              # Run tests
```

### Environment Variables
```bash
# Required
DISCORD_BOT_TOKEN=     # Discord bot token
USER_ENCRYPTION_KEY=   # 32+ character encryption key

# Optional
UEX_WEBHOOK_SECRET=    # Webhook validation secret
NODE_ENV=production    # Environment mode
PORT=3000              # Server port
ENABLE_LOGGING=true    # Detailed logging
PERSISTENT_DATA_DIR=   # Custom data directory
```

## 🆘 Troubleshooting

### For Admins

**Bot Won't Start:**
- ✅ Check Node.js version (18+ required)
- ✅ Verify all required environment variables
- ✅ Ensure Discord bot token is valid
- ✅ Check hosting platform logs

**Webhooks Not Working:**
- ✅ Verify webhook URL is accessible: `https://your-domain.com/webhook/uex`
- ✅ Test health endpoint: `https://your-domain.com/health`
- ✅ Check `UEX_WEBHOOK_SECRET` configuration
- ✅ Review server logs for webhook errors

**Commands Not Registering:**
- ✅ Run `node scripts/register-commands.js`
- ✅ Check Discord bot permissions
- ✅ Verify bot is in at least one server
- ✅ Wait up to 1 hour for global command propagation

### For Users

**Commands Not Working:**
- ✅ Bot must share a server with you for DMs
- ✅ Check Discord privacy settings for DMs
- ✅ Verify you're registered with `/register`
- ✅ Try commands in private channel or DM

**Marketplace Issues:**
- ✅ Verify UEX API credentials are current
- ✅ Check if you're registered: `/admin info` (if admin)
- ✅ Try re-registering with updated credentials
- ✅ Use `/help topic:credentials` for guidance

**Not Receiving Notifications:**
- ✅ Ensure UEX webhooks are configured correctly
- ✅ Check bot online status in Discord
- ✅ Verify webhook URL in UEX settings
- ✅ Test with `/negotiations` command

## 🌟 Benefits

- ✅ **Complete Trading Solution** - Full marketplace integration with UEX Corp
- ✅ **Zero Setup for Users** - Admin deploys once, serves everyone
- ✅ **Privacy by Choice** - Use Discord permissions for isolation
- ✅ **Bank-Level Security** - Military-grade encryption for all credentials
- ✅ **Free Hosting Options** - Serve unlimited users on free platforms
- ✅ **Rich Discord Integration** - Native buttons, embeds, and slash commands
- ✅ **Easy Maintenance** - One deployment, automatic updates
- ✅ **Professional Features** - Advanced filtering, pagination, real-time data

## 📄 License

MIT License - Feel free to modify and deploy your own instance!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## 📞 Support

**For Admins:**
- Check `/health` endpoint for status
- Use `/admin info` for configuration
- Monitor logs in hosting platform
- Review deployment guides in `/docs`

**For Users:**
- Register with `/register` command
- Use `/help` for comprehensive guidance
- Try commands in private channels/DMs
- Contact your bot admin for technical issues

---

**🚀 Ready to start trading? Choose your deployment method above and follow the guide!** 