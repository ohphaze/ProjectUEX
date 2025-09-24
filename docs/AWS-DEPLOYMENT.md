# AWS Deployment Guide

Deploy the **UEX Multi-User Discord Bot** with comprehensive marketplace functionality on Amazon Web Services. This guide covers AWS Lightsail (recommended) and EC2 deployment options.

## 🎯 What You'll Deploy

A comprehensive Discord bot that provides:
- **🛒 Full UEX Marketplace Integration** - Create, browse, and manage listings
- **💰 Advanced Trading Tools** - Filters, pagination, rich market data  
- **💬 Negotiation Management** - View and reply to negotiations
- **🔔 Real-time Notifications** - Marketplace and negotiation updates
- **👥 Multi-User Support** - Serves unlimited users securely
- **🔒 Bank-Level Security** - AES-256 encrypted credential storage

## 🚀 Quick Start: AWS Lightsail (Recommended)

**AWS Lightsail** is the easiest and most cost-effective way to deploy on AWS with predictable pricing.

### 💰 Cost: $3.50/month (IPv6) or $5/month (IPv4)

### 1. Create Lightsail Instance

1. **Sign in to AWS Lightsail**: https://lightsail.aws.amazon.com/
2. **Create Instance**:
   - **Platform**: Linux/Unix
   - **Blueprint**: Node.js
   - **Instance Plan**: $3.50/month (512 MB RAM, 1 vCPU, 20 GB SSD)
   - **Instance Name**: `uex-discord-bot`

### 2. Connect and Setup

1. **Connect via SSH** from Lightsail console
2. **Clone the repository**:
```bash
git clone https://github.com/your-username/UEX_trading.git
cd UEX_trading
```

3. **Install dependencies**:
```bash
npm install
```

4. **Create environment file**:
```bash
cp env.example .env
nano .env
```

5. **Configure environment variables**:
```bash
# Required
DISCORD_BOT_TOKEN=your_discord_bot_token_here
USER_ENCRYPTION_KEY=your_random_32_character_encryption_key

# Optional
UEX_WEBHOOK_SECRET=your_webhook_secret
NODE_ENV=production
PORT=3000
```

### 3. Setup Process Manager

1. **Install PM2**:
```bash
npm install -g pm2
```

2. **Create PM2 ecosystem file**:
```bash
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'uex-discord-bot',
    script: 'src/bot.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '400M',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
```

3. **Start the bot**:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 4. Configure Networking

1. **Open Lightsail Networking tab**
2. **Add firewall rule**:
   - **Protocol**: TCP
   - **Port**: 3000
   - **Source**: Anywhere (0.0.0.0/0)

### 5. Setup Domain (Optional)

1. **Get Static IP** in Lightsail (free)
2. **Attach Static IP** to your instance
3. **Configure DNS** to point to your static IP
4. **Your webhook URL**: `http://your-domain.com:3000/webhook/uex`

## 🧪 Testing Your Deployment

### 1. **Health Check**
Test if your bot is running:
```bash
curl http://your-static-ip:3000/health
# Should return: {"status":"healthy","platform":"AWS","commands":8,"uptime":"..."}
```

### 2. **Discord Command Testing**
1. Go to your Discord server where the bot is invited
2. Type `/` to see available commands:
   - `/help` - Comprehensive help system
   - `/admin info` - Bot configuration (admin only)
   - `/marketplace-add` - Create marketplace listings
   - `/marketplace-listings` - Browse marketplace
   - `/negotiations` - View negotiations
   - `/register` - User registration
   - `/reply` - Reply to negotiations
   - `/unregister` - Remove credentials

### 3. **Basic Functionality Tests**
```bash
/help                    # Should show comprehensive help
/admin info             # Should show bot configuration
/marketplace-listings   # Should show "Please register first" message
```

### 4. **Full Testing (after registration)**
```bash
/register api_token:your_token secret_key:your_secret
/marketplace-listings   # Should show marketplace listings with filters
/marketplace-add       # Should show listing creation form
/negotiations          # Should show your negotiations
```

### 5. **Webhook Testing**
Configure your UEX Corp webhook URL to:
```
http://your-static-ip:3000/webhook/uex
```

Test webhook reception:
```bash
# Check PM2 logs for webhook messages
pm2 logs uex-discord-bot
```

### 6. **Performance Monitoring**
```bash
# Check bot status
pm2 status

# Monitor resource usage
pm2 monit

# View recent logs
pm2 logs uex-discord-bot --lines 50
```

---

## 🔧 Advanced: AWS EC2 Deployment

For more control and scalability, use EC2 instances.

### Cost: ~$3.90/month (t3.nano) to ~$8.50/month (t3.micro)

### 1. Launch EC2 Instance

1. **EC2 Console**: https://console.aws.amazon.com/ec2/
2. **Launch Instance**:
   - **AMI**: Amazon Linux 2 or Ubuntu 20.04 LTS
   - **Instance Type**: t3.nano (512MB RAM) or t3.micro (1GB RAM)
   - **Security Group**: Allow SSH (22) and HTTP (3000)
   - **Key Pair**: Create or use existing key pair

### 2. Connect and Install Dependencies

1. **Connect via SSH**:
```bash
ssh -i your-key.pem ec2-user@your-instance-ip
```

2. **Update system and install Node.js**:
```bash
# Amazon Linux 2
sudo yum update -y
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs git

# Ubuntu
sudo apt update
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs git
```

### 3. Deploy Bot

1. **Clone repository**:
```bash
git clone https://github.com/your-username/UEX_trading.git
cd UEX_trading
```

2. **Install dependencies**:
```bash
npm install
```

3. **Create .env file**:
```bash
cp env.example .env
nano .env
```

4. **Configure environment variables** (same as Lightsail section above)

### 4. Setup PM2 and Start Bot

1. **Install PM2 globally**:
```bash
sudo npm install -g pm2
```

2. **Start bot with PM2**:
```bash
pm2 start src/bot.js --name "uex-discord-bot"
pm2 save
pm2 startup
# Follow the command PM2 gives you to enable auto-start
```

### 5. Configure Load Balancer (Optional)

For production deployments, use Application Load Balancer:

1. **Create Target Group** pointing to port 3000
2. **Create Application Load Balancer**
3. **Configure health checks** to `/health`
4. **Setup SSL certificate** via AWS Certificate Manager

---

## 🐳 Docker Deployment on AWS

### Using AWS ECS or EC2 with Docker

1. **Create Dockerfile** (if not exists):
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "src/bot.js"]
```

2. **Build and push to ECR**:
```bash
# Create ECR repository
aws ecr create-repository --repository-name uex-discord-bot

# Build image
docker build -t uex-discord-bot .

# Tag and push
docker tag uex-discord-bot:latest your-account.dkr.ecr.region.amazonaws.com/uex-discord-bot:latest
docker push your-account.dkr.ecr.region.amazonaws.com/uex-discord-bot:latest
```

3. **Deploy via ECS**:
   - Create ECS cluster
   - Create task definition with environment variables
   - Create service with desired count

---

## 📋 Security Best Practices

### 1. IAM Roles and Permissions
- Use IAM roles instead of access keys when possible
- Apply principle of least privilege
- Enable CloudTrail for auditing

### 2. Security Groups
```bash
# Minimal security group rules
SSH (22): Your IP only
HTTP (3000): 0.0.0.0/0 (for webhooks)
HTTPS (443): 0.0.0.0/0 (if using SSL)
```

### 3. Environment Variables Security
- Never commit .env files to git
- Use AWS Systems Manager Parameter Store for sensitive data (optional)
- Rotate encryption keys regularly

### 4. Monitoring and Logs
- Use CloudWatch for monitoring
- Enable VPC Flow Logs
- Set up CloudWatch alarms for high CPU/memory usage

---

## 🔄 Updates and Maintenance

### Updating the Bot

1. **Pull latest changes**:
```bash
cd UEX_trading
git pull origin main
npm install
```

2. **Restart with PM2**:
```bash
pm2 restart uex-discord-bot
```

### Backup User Data

1. **Backup encrypted user data**:
```bash
# Create backup of user_data directory
tar -czf user_data_backup_$(date +%Y%m%d).tar.gz user_data/

# Store in S3 (optional)
aws s3 cp user_data_backup_$(date +%Y%m%d).tar.gz s3://your-backup-bucket/
```

### Monitoring

1. **Check bot status**:
```bash
pm2 status
pm2 logs uex-discord-bot
```

2. **Monitor resources**:
```bash
htop  # CPU and memory usage
df -h # Disk usage
```

---

## 🆘 Troubleshooting

### Common Issues

**Bot won't start**:
```bash
# Check PM2 logs
pm2 logs uex-discord-bot

# Check environment variables
cat .env

# Test Node.js version
node --version  # Should be 18+
```

**Webhooks not working**:
- Check security group allows port 3000
- Verify static IP is attached (Lightsail)
- Test health endpoint: `curl http://your-ip:3000/health`

**Memory issues**:
- Upgrade to larger instance type
- Monitor with `pm2 monit`
- Set memory restart limit in PM2 config

### Getting Help

- Check `/health` endpoint for bot status
- Review PM2 logs for errors
- Verify all environment variables are set correctly
- Test Discord bot permissions in server

---

## 💰 Cost Optimization

### Lightsail vs EC2 Comparison

| Service | Cost/Month | RAM | Storage | Best For |
|---------|------------|-----|---------|----------|
| Lightsail | $3.50 | 512MB | 20GB | Simple deployment |
| EC2 t3.nano | $3.90 | 512MB | EBS | More control |
| EC2 t3.micro | $8.50 | 1GB | EBS | Higher performance |

### Cost Saving Tips

1. **Use Lightsail** for simplicity and predictable pricing
2. **Set up billing alerts** in AWS console
3. **Use spot instances** for non-production environments
4. **Stop instances** when not needed (development)
5. **Monitor usage** with AWS Cost Explorer

Your UEX Discord Bot is now running on AWS! 🎉 