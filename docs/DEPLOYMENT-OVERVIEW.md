# UEX Discord Bot Deployment Overview

This guide helps you choose the best deployment method for your **UEX Multi-User Discord Bot** with comprehensive marketplace trading functionality.

## 🎯 Choose Your Deployment Method

Based on your needs, technical expertise, and budget:

### 📱 **Option 1: Render (Easiest - Recommended for Beginners)**
- **✅ Best for**: Quick setup, automatic deployments, beginners
- **✅ Pros**: Zero configuration, GitHub integration, free 750hrs/month, automatic HTTPS
- **❌ Cons**: Auto-sleeps after inactivity, limited to 750hrs/month on free tier
- **💰 Cost**: Free (750hrs) or $7/month (no sleep)
- **⏱️ Setup**: 5-10 minutes
- **📖 [→ Render Deployment Guide](RENDER-DEPLOYMENT.md)**

### 🖥️ **Option 2: Local Development/Personal Use**
- **✅ Best for**: Development, testing, personal use on your own computer
- **✅ Pros**: Full control, no hosting costs, instant setup, immediate feedback
- **❌ Cons**: Only works when your computer is on, not accessible remotely
- **💰 Cost**: Free (uses your computer)
- **⏱️ Setup**: 5-15 minutes
- **📖 [→ Local Setup Instructions](#local-development-setup)**

### 🌐 **Option 3: VM/Server Deployment**
- **✅ Best for**: 24/7 operation, advanced users, production environments
- **✅ Pros**: Always online, full control, can serve many users, no platform limitations
- **❌ Cons**: Requires server management knowledge, potential ongoing costs
- **💰 Cost**: $3.50-$20/month (depending on provider)
- **⏱️ Setup**: 15-30 minutes
- **📖 [→ VM/Server Setup Instructions](#vmserver-deployment-setup)**

### 🆓 **Option 4: Free Cloud Platforms**
- **GCP Always Free**: **$0 forever** with compute limits
- **AWS Lightsail**: **$3.50/month** for reliable hosting
- **Railway**: **$5/month** for developer-friendly hosting

---

## 📊 Complete Platform Comparison

| Platform | Cost/Month | Setup Difficulty | Auto-Sleep | Persistent Storage | Best For |
|----------|------------|------------------|------------|-------------------|----------|
| **🖥️ Local Development** | $0 | Easy | ❌ No | ✅ Yes | Development, testing |
| **🌐 VM/Server (Ubuntu)** | $3.50+ | Medium | ❌ No | ✅ Yes | Production, 24/7 operation |
| **🆓 GCP Always Free** | $0 | Medium | ❌ No | ✅ Yes | Long-term free hosting |
| **📱 Render Free** | $0 | Easy | ✅ Yes | ❌ No | Quick testing & demos |
| **📱 Render Starter** | $7 | Easy | ❌ No | ✅ Yes | Managed hosting |
| **🌩️ AWS Lightsail** | $3.50 | Medium | ❌ No | ✅ Yes | Cost-effective VPS |
| **🚄 Railway** | $5 | Easy | ❌ No | ✅ Yes | Developer-friendly |

---

## 🏠 Local Development Setup

Perfect for development, testing, or personal use on your own computer.

### Prerequisites
- **Node.js 18+** - [Download from nodejs.org](https://nodejs.org/)
- **Git** - [Download from git-scm.com](https://git-scm.com/)
- **Discord Bot** - [Create at Discord Developer Portal](https://discord.com/developers/applications)

### Quick Setup Steps
```bash
# 1. Clone repository
git clone https://github.com/your-username/UEX_trading.git
cd UEX_trading

# 2. Install dependencies
npm install

# 3. Configure environment
cp env.example .env
# Edit .env with your Discord bot token and encryption key

# 4. Register commands and start
node scripts/register-commands.js
npm run dev
```

### ✅ **When to Choose Local:**
- Development and testing new features
- Personal use (only you will use the bot)
- Learning how the bot works
- No need for 24/7 operation

### ❌ **When NOT to Choose Local:**
- Multiple users need access
- Need 24/7 uptime
- Want to receive notifications when computer is off
- Planning to serve a community

---

## 🌐 VM/Server Deployment Setup

Deploy on any Linux server, VPS, or cloud instance for 24/7 operation.

### Platform Options
- **DigitalOcean Droplets** - $4/month, excellent documentation
- **AWS Lightsail** - $3.50/month, integrated with AWS ecosystem
- **Google Cloud Compute** - Free tier available, scalable
- **Linode** - $5/month, developer-friendly
- **Vultr** - $2.50/month for smallest instance

### Quick Setup Overview
```bash
# 1. Server preparation (Ubuntu 20.04+)
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs git
sudo npm install -g pm2

# 2. Application setup
git clone https://github.com/your-username/UEX_trading.git
cd UEX_trading
npm install
cp env.example .env
# Configure .env with production values

# 3. Deploy with process manager
node scripts/register-commands.js
pm2 start src/bot.js --name "uex-discord-bot"
pm2 startup && pm2 save
```

### ✅ **When to Choose VM/Server:**
- Need 24/7 uptime for multiple users
- Want full control over the environment
- Planning to serve a large community
- Need custom configurations or integrations

### ❌ **When NOT to Choose VM/Server:**
- New to server administration
- Don't want to manage updates and security
- Just testing or developing
- Prefer managed solutions

---

## 🚀 Managed Cloud Platform Guides

### **🎯 Recommended: Render (Easiest)**
Perfect for beginners who want automatic deployments and don't mind auto-sleep.

**Pros:**
- GitHub integration - auto-deploys on code changes
- Automatic HTTPS certificates
- Built-in environment variable management
- Free tier with 750 hours/month
- Zero server management

**Cons:**
- Auto-sleeps after 15 minutes (free tier)
- Limited build minutes on free tier
- Less control than self-hosted

**📖 [Complete Render Guide →](RENDER-DEPLOYMENT.md)**

### **💰 Cost-Effective: AWS Lightsail**
Best balance of cost, reliability, and ease of use.

**Pros:**
- Predictable $3.50/month pricing
- No auto-sleep, persistent storage
- AWS ecosystem integration
- Good documentation and support
- SSD storage included

**Cons:**
- Manual setup required
- Basic Linux knowledge needed
- Limited to AWS infrastructure

**📖 [Complete AWS Guide →](AWS-DEPLOYMENT.md)**

### **🆓 Forever Free: Google Cloud Platform**
True $0/month hosting with the Always Free tier.

**Pros:**
- Never expires (as long as GCP exists)
- Generous free tier limits
- No credit card required after initial setup
- Full Linux VM access
- Integrated with Google services

**Cons:**
- More complex setup
- Resource limitations on free tier
- Need to stay within free tier limits

**📖 [Complete GCP Guide →](GCP-DEPLOYMENT.md)**

---

## 🔧 Pre-Deployment Checklist

Complete this checklist regardless of your chosen deployment method:

### ✅ Discord Bot Setup
- [ ] Created Discord application at [Discord Developer Portal](https://discord.com/developers/applications)
- [ ] Generated and copied bot token (keep secret!)
- [ ] Enabled "Message Content Intent" under Privileged Gateway Intents
- [ ] Invited bot to at least one Discord server (required for DMs)

### ✅ UEX Corp API Setup
- [ ] Have UEX Corp account with API access
- [ ] Know where to find Bearer Token (My Apps section)
- [ ] Know where to find Secret Key (Account Settings)
- [ ] Understand webhook configuration process

### ✅ Environment Configuration
- [ ] Generated secure USER_ENCRYPTION_KEY (32+ random characters)
- [ ] Prepared all required environment variables
- [ ] Optional: Generated UEX_WEBHOOK_SECRET for validation

### ✅ Code Preparation
- [ ] Repository cloned or forked
- [ ] Dependencies installed locally (`npm install`)
- [ ] No syntax errors (`npm test` if available)
- [ ] Bot starts locally (`npm run dev`)
- [ ] Validated setup (`npm run validate`)

---

## 🧪 Testing Your Deployment

After deploying to any platform, follow these steps:

### 1. **Health Check**
Visit: `https://your-bot-domain.com/health`

Expected response:
```json
{
  "status": "healthy",
  "platform": "your-platform",
  "commands": 8,
  "uptime": "0:01:23"
}
```

### 2. **Discord Functionality**
Test these commands in Discord:
```bash
/help                    # Should show comprehensive help
/admin info             # Should show bot configuration (admin only)
/marketplace-listings   # Should show marketplace (after registering)
```

### 3. **User Registration Test**
```bash
/register api_token:test_token secret_key:test_secret
# Should show registration success (use real credentials)
```

### 4. **Webhook Endpoint Test**
```bash
# Test webhook endpoint accessibility
curl https://your-bot-domain.com/webhook/uex
# Should return webhook info or 405 Method Not Allowed
```

---

## 🆘 Troubleshooting Guide

### **Common Issues Across All Platforms**

**❌ Bot Won't Start**
```bash
# Check setup validation
npm run validate

# Verify environment variables
echo $DISCORD_BOT_TOKEN
echo $USER_ENCRYPTION_KEY

# Check Node.js version (requires 18+)
node --version
```

**❌ Commands Not Working**
- Verify bot has been added to at least one Discord server
- Check that "Message Content Intent" is enabled
- Wait up to 1 hour for global slash commands to propagate
- Try registering commands manually: `node scripts/register-commands.js`

**❌ Webhooks Not Receiving**
- Test webhook URL accessibility: `curl https://your-domain.com/health`
- Verify UEX webhook configuration points to correct URL
- Check webhook secret matches (if configured)
- Review platform logs for webhook processing

**❌ User Registration Failing**
- Verify UEX API credentials are current and valid
- Check that user has proper UEX account permissions
- Ensure webhook URL is configured in user's UEX settings
- Try re-registering with updated credentials

### **Platform-Specific Issues**

**🖥️ Local Development:**
- Port already in use: Change PORT in .env file
- Permission errors: Check file/folder permissions
- Network issues: Verify firewall settings for webhook testing

**📱 Render:**
- Build failures: Check build logs in Render dashboard
- Environment variables: Verify all required vars are set
- Auto-sleep: Upgrade to paid plan or accept sleep behavior

**🌐 VM/Server:**
- Connection refused: Check firewall rules and port access
- Permission denied: Verify user permissions and sudo access
- Service crashes: Check PM2 logs with `pm2 logs`

---

## 💡 Pro Tips & Best Practices

### **🔒 Security Recommendations**
1. **Use strong encryption keys** - 32+ random characters
2. **Regular credential rotation** - Change keys periodically  
3. **Monitor access logs** - Review platform/server logs regularly
4. **Backup user data** - Regular backups of `user_data/` directory
5. **Keep dependencies updated** - Run `npm audit` regularly

### **⚡ Performance Optimization**
1. **Choose nearby regions** - Deploy close to your primary users
2. **Monitor resource usage** - Watch CPU/memory on VM deployments
3. **Configure log levels** - Reduce logging in production if needed
4. **Use process managers** - PM2 for VM deployments, platform managers for cloud

### **💰 Cost Management**
1. **Start with free tiers** - Test with free options first
2. **Set billing alerts** - Configure spending notifications
3. **Monitor usage patterns** - Understand your actual resource needs
4. **Scale gradually** - Start small, upgrade as user base grows

### **🔄 Maintenance Strategy**
1. **Automated deployments** - Use GitHub integration where possible
2. **Regular updates** - Keep bot code and dependencies current
3. **Monitor health** - Set up monitoring/alerting for production
4. **Have rollback plan** - Know how to quickly revert deployments

---

## 🎯 Quick Decision Matrix

**🤔 Choose your deployment based on:**

- **Just testing/learning?** → **Local Development**
- **Need free forever?** → **GCP Always Free Tier**
- **Want easiest setup?** → **Render**
- **Need reliable and cheap?** → **AWS Lightsail**  
- **Want managed hosting?** → **Render Paid**
- **Need full control?** → **VM/Server**
- **Serving large community?** → **VM/Server or AWS**

---

## 📚 Next Steps

1. **Choose your deployment method** from the options above
2. **Follow the specific guide** for your chosen platform
3. **Complete the pre-deployment checklist**
4. **Test your deployment** using the testing guide
5. **Share bot invite link** with your users
6. **Configure monitoring** for production deployments

**Ready to deploy? Pick your method and follow the detailed guide!** 