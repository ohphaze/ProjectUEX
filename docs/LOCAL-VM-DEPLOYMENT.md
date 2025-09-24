# Local Development & VM/Server Deployment Guide

This guide covers two deployment scenarios:
1. **🏠 Local Development** - Running on your personal computer
2. **🌐 VM/Server Deployment** - Running on a server/VPS for 24/7 operation

## 🏠 Local Development Setup

Perfect for development, testing, or personal use on your own computer.

### Prerequisites

- **Node.js 18+** - [Download from nodejs.org](https://nodejs.org/)
- **Git** - [Download from git-scm.com](https://git-scm.com/)
- **Code Editor** - VS Code, Sublime Text, or your preferred editor
- **Discord Bot Token** - [Create at Discord Developer Portal](https://discord.com/developers/applications)

### Step 1: Environment Setup

**Windows:**
```cmd
# Install Node.js from nodejs.org (LTS version)
# Install Git from git-scm.com
# Optional: Install Windows Terminal for better command line experience

# Verify installations
node --version
npm --version
git --version
```

**macOS:**
```bash
# Using Homebrew (recommended)
brew install node git

# Or download from websites
# Node.js: https://nodejs.org/
# Git: https://git-scm.com/

# Verify installations
node --version
npm --version
git --version
```

**Linux (Ubuntu/Debian):**
```bash
# Update package list
sudo apt update

# Install Node.js 18+ (using NodeSource repository)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Git
sudo apt install git -y

# Verify installations
node --version
npm --version
git --version
```

### Step 2: Clone and Setup Project

```bash
# Clone the repository
git clone https://github.com/your-username/UEX_trading.git
cd UEX_trading

# Install dependencies
npm install

# Create environment file
cp env.example .env
```

### Step 3: Configure Environment Variables

Edit the `.env` file with your preferred text editor:

```bash
# On Windows
notepad .env

# On macOS
open -e .env

# On Linux
nano .env
# or
vim .env
```

**Required Configuration:**
```bash
# Discord Bot Configuration
DISCORD_BOT_TOKEN=your_discord_bot_token_here

# Security Configuration  
USER_ENCRYPTION_KEY=your_random_32_character_encryption_key_here

# Optional Configuration
UEX_WEBHOOK_SECRET=your_webhook_secret_for_validation
NODE_ENV=development
PORT=3000
ENABLE_LOGGING=true
```

**📝 Getting Your Discord Bot Token:**
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to "Bot" section and create a bot
4. Copy the token (keep it secret!)
5. Enable "Message Content Intent" under Privileged Gateway Intents
6. Invite bot to a Discord server using OAuth2 URL Generator

**🔑 Generate Encryption Key:**
```bash
# Generate a secure 32+ character encryption key
# Examples (pick one method):

# Method 1: Random string
UEX_Bot_Secure_2024_Development_Key_123456

# Method 2: Use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Method 3: Use online generator (ensure it's 32+ characters)
```

### Step 4: Register Commands and Start

```bash
# Register Discord slash commands
node scripts/register-commands.js

# Start the bot in development mode (auto-reload on changes)
npm run dev

# OR start in production mode
npm start
```

### Step 5: Test Your Local Setup

**1. Health Check:**
Open browser and visit: `http://localhost:3000/health`

Expected response:
```json
{
  "status": "healthy",
  "platform": "local",
  "commands": 8,
  "uptime": "0:01:23"
}
```

**2. Discord Commands:**
Test in your Discord server:
```bash
/help                    # Should show comprehensive help
/admin info             # Should show bot configuration
/marketplace-listings   # Should prompt for registration
```

**3. User Registration Test:**
```bash
/register api_token:test_token secret_key:test_secret
# Should show registration success (use real UEX credentials for full testing)
```

### Local Development Best Practices

**🔄 Development Workflow:**
```bash
# Make code changes
# Bot automatically restarts (if using npm run dev)
# Test changes in Discord
# Check logs in terminal
```

**📝 Debugging:**
- Check terminal logs for errors
- Use `console.log()` for debugging
- Test with `/admin info` to verify bot status
- Check `user_data/` directory for encrypted user files

**🔒 Security (Local Development):**
- Never commit `.env` file to Git
- Use strong encryption keys even for development
- Keep Discord bot token secure
- Test webhook functionality with public tunnel (ngrok, etc.)

### ✅ When to Use Local Development

- **Development & Testing**: Building new features or testing changes
- **Personal Use**: Only you will use the bot
- **Learning**: Understanding how the bot works
- **Quick Testing**: Testing UEX API credentials or Discord features

### ❌ When NOT to Use Local Development

- **Multiple Users**: Other people need access to the bot
- **24/7 Operation**: Need constant uptime for notifications
- **Remote Access**: Users from different locations
- **Production Environment**: Serving a community or organization

---

## 🌐 VM/Server Deployment

Deploy on any Linux server, VPS, or cloud instance for 24/7 operation serving multiple users.

### VPS/Server Options

**Recommended Providers:**
- **DigitalOcean** - $4/month, excellent documentation
- **AWS Lightsail** - $3.50/month, integrated with AWS
- **Google Cloud Compute** - Free tier available
- **Linode** - $5/month, developer-friendly
- **Vultr** - $2.50/month for smallest instance
- **Azure** - Free tier with $200 credit

**Minimum Requirements:**
- **OS**: Ubuntu 20.04+ or similar Linux distribution
- **RAM**: 512MB minimum (1GB recommended)
- **Storage**: 10GB SSD
- **CPU**: 1 vCPU
- **Network**: Public IP address

### Step 1: Server Preparation

**1. Connect to Your Server:**
```bash
# Connect via SSH (replace with your server IP)
ssh root@your-server-ip

# Or if using a key file
ssh -i your-key.pem ubuntu@your-server-ip
```

**2. Update System:**
```bash
# Update package lists and upgrade system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install curl wget unzip software-properties-common -y
```

**3. Install Node.js 18+:**
```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should be 18.x or higher
npm --version
```

**4. Install Process Manager:**
```bash
# Install PM2 globally for process management
sudo npm install -g pm2

# Verify installation
pm2 --version
```

**5. Install Git:**
```bash
# Install Git
sudo apt install git -y

# Verify installation
git --version
```

### Step 2: Deploy Application

**1. Clone Repository:**
```bash
# Clone your bot repository
git clone https://github.com/your-username/UEX_trading.git

# Change to project directory
cd UEX_trading

# Install dependencies
npm install
```

**2. Configure Environment:**
```bash
# Create environment file
cp env.example .env

# Edit with your production values
nano .env
```

**Production Environment Configuration:**
```bash
# Discord Configuration
DISCORD_BOT_TOKEN=your_production_bot_token

# Security Configuration
USER_ENCRYPTION_KEY=your_secure_production_encryption_key_32_chars

# Server Configuration
NODE_ENV=production
PORT=3000

# Optional Webhook Configuration
UEX_WEBHOOK_SECRET=your_webhook_secret

# Logging Configuration
ENABLE_LOGGING=true

# Data Directory (optional)
# PERSISTENT_DATA_DIR=/var/uex-bot-data
```

**3. Register Commands:**
```bash
# Register Discord slash commands
node scripts/register-commands.js
```

### Step 3: Configure Process Management

**1. Start with PM2:**
```bash
# Start the bot with PM2
pm2 start src/bot.js --name "uex-discord-bot"

# View status
pm2 status

# View logs
pm2 logs uex-discord-bot
```

**2. Configure Auto-Restart:**
```bash
# Generate startup script for automatic restart on server reboot
pm2 startup

# This will output a command to run as root - copy and execute it
# Example: sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu

# Save current PM2 processes
pm2 save
```

**3. Monitor the Process:**
```bash
# View real-time logs
pm2 logs uex-discord-bot --lines 50

# Monitor resources
pm2 monit

# Restart if needed
pm2 restart uex-discord-bot

# Stop if needed
pm2 stop uex-discord-bot
```

### Step 4: Configure Firewall

**1. Setup UFW (Ubuntu Firewall):**
```bash
# Enable UFW
sudo ufw enable

# Allow SSH (important - don't lock yourself out!)
sudo ufw allow ssh

# Allow HTTP/HTTPS for webhooks
sudo ufw allow 80
sudo ufw allow 443

# Allow your bot port (if needed for direct access)
sudo ufw allow 3000

# Check status
sudo ufw status
```

### Step 5: Configure Reverse Proxy (Optional)

For HTTPS and custom domain with Nginx:

**1. Install Nginx:**
```bash
sudo apt install nginx -y
```

**2. Create Nginx Configuration:**
```bash
# Create site configuration
sudo nano /etc/nginx/sites-available/uex-bot
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain

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

**3. Enable Site:**
```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/uex-bot /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

**4. Setup SSL with Let's Encrypt (Optional):**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### Step 6: Test Deployment

**1. Health Check:**
```bash
# Test local health endpoint
curl http://localhost:3000/health

# Test via domain (if configured)
curl https://your-domain.com/health
```

**2. Discord Commands:**
Test these in Discord:
```bash
/help                    # Should show comprehensive help
/admin info             # Should show server configuration
/marketplace-listings   # Should show marketplace or registration prompt
```

**3. Webhook Test:**
```bash
# Test webhook endpoint
curl -X POST https://your-domain.com/webhook/uex \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### Step 7: Monitoring & Maintenance

**1. Setup Log Rotation:**
```bash
# Configure PM2 log rotation
pm2 install pm2-logrotate

# Configure rotation settings
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

**2. Monitor Resources:**
```bash
# View PM2 monitoring
pm2 monit

# Check system resources
htop
df -h
free -h
```

**3. Backup Strategy:**
```bash
# Create backup script
nano ~/backup-bot.sh
```

**Backup Script:**
```bash
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup user data
tar -czf $BACKUP_DIR/uex-bot-userdata-$DATE.tar.gz /home/ubuntu/UEX_trading/user_data/

# Backup environment file
cp /home/ubuntu/UEX_trading/.env $BACKUP_DIR/env-$DATE.backup

# Keep only last 7 backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*.backup" -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
# Make script executable
chmod +x ~/backup-bot.sh

# Setup cron job for daily backups
crontab -e

# Add this line for daily backup at 2 AM
0 2 * * * /home/ubuntu/backup-bot.sh >> /home/ubuntu/backup.log 2>&1
```

### Step 8: Updates & Maintenance

**1. Update Bot Code:**
```bash
# Pull latest changes
cd ~/UEX_trading
git pull origin main

# Install new dependencies
npm install

# Restart bot
pm2 restart uex-discord-bot

# Check logs
pm2 logs uex-discord-bot --lines 20
```

**2. Update System:**
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Node.js (if needed)
# Follow Step 1 instructions again

# Update PM2
sudo npm install -g pm2@latest

# Update PM2 runtime
pm2 update
```

**3. Monitor Performance:**
```bash
# View bot performance
pm2 show uex-discord-bot

# View system performance
sudo apt install htop -y
htop

# Check disk usage
df -h

# Check memory usage
free -h
```

### ✅ When to Use VM/Server Deployment

- **24/7 Operation**: Need constant uptime for webhooks and notifications
- **Multiple Users**: Serving a community or organization
- **Production Environment**: Reliable service for regular use
- **Custom Configuration**: Need specific server setups or integrations
- **Scalability**: Planning to grow user base

### ❌ When NOT to Use VM/Server

- **Just Testing**: Local development is better for testing
- **No Linux Experience**: Consider managed platforms like Render
- **Don't Want Maintenance**: Prefer platforms that handle updates
- **Temporary Use**: Short-term testing or development

---

## 🔧 Troubleshooting

### Common Local Development Issues

**❌ Port Already in Use:**
```bash
# Error: Port 3000 is already in use
# Solution: Change port in .env file
PORT=3001

# Or kill process using port 3000
lsof -ti:3000 | xargs kill -9
```

**❌ Node.js Version Issues:**
```bash
# Check Node.js version
node --version

# If < 18, update Node.js
# Windows/macOS: Download from nodejs.org
# Linux: Follow Step 1 instructions
```

**❌ Permission Errors (Windows):**
```cmd
# Run command prompt as Administrator
# Or use PowerShell as Administrator
```

**❌ Permission Errors (macOS/Linux):**
```bash
# Don't use sudo with npm install in project directory
# If needed, fix npm permissions:
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
```

### Common Server Deployment Issues

**❌ SSH Connection Failed:**
```bash
# Check server IP and credentials
# Ensure SSH service is running
# Check firewall rules
# Try connecting from different network
```

**❌ Node.js Installation Failed:**
```bash
# Try alternative installation method
sudo apt install nodejs npm -y

# Or use snap
sudo snap install node --classic

# Verify version
node --version
```

**❌ PM2 Process Crashes:**
```bash
# Check logs for errors
pm2 logs uex-discord-bot

# Check environment variables
pm2 show uex-discord-bot

# Restart with verbose logging
pm2 restart uex-discord-bot --log-type combined
```

**❌ Webhook Not Receiving:**
```bash
# Check firewall rules
sudo ufw status

# Test port accessibility
curl http://your-server-ip:3000/health

# Check Nginx configuration (if using)
sudo nginx -t
sudo systemctl status nginx
```

**❌ Discord Commands Not Working:**
```bash
# Re-register commands
node scripts/register-commands.js

# Check bot permissions in Discord
# Verify bot token is correct
# Check Discord Developer Portal for issues
```

### Performance Optimization

**🚀 Local Development:**
- Use `npm run dev` for auto-reload during development
- Increase Node.js memory if needed: `node --max-old-space-size=4096 src/bot.js`
- Use Chrome DevTools for debugging: `node --inspect src/bot.js`

**🚀 Server Deployment:**
- Monitor memory usage with `pm2 monit`
- Adjust PM2 max memory restart: `pm2 start src/bot.js --max-memory-restart 500M`
- Use SSD storage for better performance
- Configure log rotation to prevent disk space issues

---

## 📋 Quick Reference

### Essential Commands

**Local Development:**
```bash
npm run dev           # Start with auto-reload
npm start            # Start production mode
npm run validate     # Validate setup
node scripts/register-commands.js  # Register Discord commands
```

**Server Management:**
```bash
pm2 start src/bot.js --name "uex-discord-bot"  # Start bot
pm2 status           # View status
pm2 logs uex-discord-bot  # View logs
pm2 restart uex-discord-bot  # Restart bot
pm2 stop uex-discord-bot     # Stop bot
pm2 save             # Save current processes
```

**System Management:**
```bash
sudo apt update && sudo apt upgrade -y  # Update system
sudo systemctl restart nginx            # Restart web server
sudo ufw status                         # Check firewall
df -h                                   # Check disk space
free -h                                 # Check memory
```

### Important File Locations

**Local Development:**
- Environment: `.env`
- User Data: `user_data/`
- Logs: Terminal output

**Server Deployment:**
- Environment: `~/UEX_trading/.env`
- User Data: `~/UEX_trading/user_data/`
- Logs: `pm2 logs uex-discord-bot`
- Nginx Config: `/etc/nginx/sites-available/uex-bot`

---

## 🎯 Next Steps

1. **Choose your deployment method** (local or server)
2. **Follow the appropriate setup guide** above
3. **Test all functionality** with the provided commands
4. **Configure monitoring** for production deployments
5. **Setup backup strategy** for important data
6. **Share bot invite link** with your users (for server deployments)

**Ready to deploy? Pick your method and start with Step 1!** 