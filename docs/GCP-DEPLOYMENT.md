# Google Cloud Platform (GCP) Deployment Guide

Deploy the **UEX Multi-User Discord Bot** with comprehensive marketplace functionality on Google Cloud Platform using the Always Free tier or paid services.

## 🎯 What You'll Deploy

A comprehensive Discord bot that provides:
- **🛒 Full UEX Marketplace Integration** - Create, browse, and manage listings
- **💰 Advanced Trading Tools** - Filters, pagination, rich market data
- **💬 Negotiation Management** - View and reply to negotiations  
- **🔔 Real-time Notifications** - Marketplace and negotiation updates
- **👥 Multi-User Support** - Serves unlimited users securely
- **🔒 Bank-Level Security** - AES-256 encrypted credential storage

## 🆓 Free Forever: GCP Always Free Tier (Recommended)

**GCP's Always Free tier is perfect for your marketplace Discord bot** - no time limits, no auto-sleep, handles trading activity well!

### Cost: $0/month (Forever)

### What You Get:
- ✅ **1 e2-micro VM** (1 vCPU, 1GB RAM) - US regions only
- ✅ **30 GB persistent disk** storage
- ✅ **1 GB network egress** per month (North America)
- ✅ **No auto-sleep** - runs 24/7 continuously
- ✅ **Persistent storage** - user data survives restarts
- ✅ **No time limit** - truly free forever

---

## 🚀 Quick Start: Compute Engine Free Tier

### 1. Create GCP Account and Project

1. **Sign up at**: https://cloud.google.com/
2. **Create a new project** in GCP Console
3. **Enable Compute Engine API**

### 2. Create Free e2-micro Instance

1. **Go to Compute Engine** → VM instances
2. **Create Instance**:
   - **Name**: `uex-discord-bot`
   - **Region**: `us-central1`, `us-east1`, or `us-west1` (Free tier regions)
   - **Zone**: Any zone in the free regions
   - **Machine Configuration**:
     - **Series**: E2
     - **Machine Type**: `e2-micro` (1 vCPU, 1 GB memory)
   - **Boot Disk**:
     - **Operating System**: Ubuntu
     - **Version**: Ubuntu 20.04 LTS
     - **Size**: 10-30 GB (Free: 30 GB total)
   - **Firewall**: ✅ Allow HTTP traffic

### 3. Connect and Install Dependencies

1. **Connect via SSH** (click SSH button in console)

2. **Update system and install Node.js**:
```bash
# Update package list
sudo apt update

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs git
```

3. **Verify installation**:
```bash
node --version  # Should show v18.x.x
npm --version
```

### 4. Deploy the Bot

1. **Clone repository**:
```bash
git clone https://github.com/your-username/UEX_trading.git
cd UEX_trading
```

2. **Install dependencies**:
```bash
npm install
```

3. **Create environment file**:
```bash
cp env.example .env
nano .env
```

4. **Configure environment variables**:
```bash
# Required
DISCORD_BOT_TOKEN=your_discord_bot_token_here
USER_ENCRYPTION_KEY=your_random_32_character_encryption_key

# Optional
UEX_WEBHOOK_SECRET=your_webhook_secret
NODE_ENV=production
PORT=3000
```

### 5. Setup PM2 Process Manager

1. **Install PM2 globally**:
```bash
sudo npm install -g pm2
```

2. **Create ecosystem file**:
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
    max_memory_restart: '800M',
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
# Run the command that PM2 outputs
```

### 6. Configure Firewall

1. **Create firewall rule** in GCP Console:
```bash
gcloud compute firewall-rules create allow-bot-port \
  --allow tcp:3000 \
  --source-ranges 0.0.0.0/0 \
  --description "Allow UEX bot webhooks"
```

2. **Or via Console**:
   - Go to VPC Network → Firewall
   - Create rule: Allow TCP 3000 from 0.0.0.0/0

### 7. Testing Your Deployment

#### **Health Check**
1. **Find your external IP** in VM instances page
2. **Test health endpoint**: 
```bash
curl http://YOUR_EXTERNAL_IP:3000/health
# Should return: {"status":"healthy","platform":"GCP","commands":8,"uptime":"..."}
```

#### **Discord Command Testing**
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

#### **Basic Functionality Tests**
```bash
/help                    # Should show comprehensive help
/admin info             # Should show bot configuration
/marketplace-listings   # Should show "Please register first" message
```

#### **Full Testing (after registration)**
```bash
/register api_token:your_token secret_key:your_secret
/marketplace-listings   # Should show marketplace listings with filters
/marketplace-add       # Should show listing creation form
/negotiations          # Should show your negotiations
```

#### **Webhook Configuration**
3. **Your webhook URL**: `http://YOUR_EXTERNAL_IP:3000/webhook/uex`
4. **Configure in UEX Corp** settings to receive real-time notifications

#### **Performance Monitoring**
```bash
# Check bot status
pm2 status

# Monitor resource usage  
pm2 monit

# View logs
pm2 logs uex-discord-bot --lines 50
```

**🎉 Your marketplace Discord bot is now running on GCP's Free tier forever!**

---

## 🔧 Advanced: Paid Compute Engine

For more resources and additional features beyond the free tier.

### Cost: ~$6-15/month

### 1. Create Larger Instance

```bash
gcloud compute instances create uex-discord-bot \
  --zone=us-central1-a \
  --machine-type=e2-small \
  --image-family=ubuntu-2004-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=20GB \
  --tags=http-server
```

### 2. Setup Load Balancer (Optional)

For production with SSL:

1. **Create instance group**
2. **Setup HTTP(S) Load Balancer**
3. **Configure SSL certificate**
4. **Point to your instance group**

---

## ☁️ Alternative: Cloud Run (Serverless)

**Note**: Cloud Run is serverless and may not be ideal for Discord bots that need persistent connections.

### Cost: Pay per request (generous free tier)

### 1. Create Dockerfile

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8080
ENV PORT=8080
CMD ["node", "src/bot.js"]
```

### 2. Deploy to Cloud Run

```bash
# Build and deploy
gcloud run deploy uex-discord-bot \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DISCORD_BOT_TOKEN=your_token,USER_ENCRYPTION_KEY=your_key
```

---

## 🚢 Alternative: App Engine

Simple deployment with automatic scaling.

### Cost: ~$7-20/month (no free tier for standard environment)

### 1. Create app.yaml

```yaml
runtime: nodejs18

env_variables:
  DISCORD_BOT_TOKEN: "your_discord_bot_token_here"
  USER_ENCRYPTION_KEY: "your_random_32_character_encryption_key"
  UEX_WEBHOOK_SECRET: "your_webhook_secret"
  NODE_ENV: "production"

automatic_scaling:
  min_instances: 1
  max_instances: 2
```

### 2. Deploy

```bash
gcloud app deploy
```

---

## 🔐 Security Best Practices

### 1. IAM and Service Accounts

```bash
# Create service account for bot
gcloud iam service-accounts create uex-bot-sa \
  --description="UEX Discord Bot Service Account" \
  --display-name="UEX Bot"

# Grant minimal permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:uex-bot-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/logging.logWriter"
```

### 2. Secret Manager (Recommended)

Store sensitive data in Secret Manager:

```bash
# Store Discord token
gcloud secrets create discord-bot-token --data-file=-
# Paste your token and press Ctrl+D

# Store encryption key
gcloud secrets create user-encryption-key --data-file=-
# Paste your encryption key and press Ctrl+D
```

Update your application to use Secret Manager:

```javascript
// In config.js - for production use
const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');
const client = new SecretManagerServiceClient();

async function getSecret(secretName) {
  const [version] = await client.accessSecretVersion({
    name: `projects/YOUR_PROJECT_ID/secrets/${secretName}/versions/latest`,
  });
  return version.payload.data.toString();
}
```

### 3. Firewall Rules

```bash
# Minimal firewall - only allow bot port
gcloud compute firewall-rules create uex-bot-minimal \
  --allow tcp:3000 \
  --source-ranges 0.0.0.0/0 \
  --target-tags bot-server

# Apply tag to your instance
gcloud compute instances add-tags uex-discord-bot \
  --tags bot-server \
  --zone us-central1-a
```

---

## 📊 Monitoring and Logging

### 1. Cloud Monitoring

Set up monitoring for your bot:

```bash
# Enable APIs
gcloud services enable monitoring.googleapis.com
gcloud services enable logging.googleapis.com
```

### 2. Log Viewing

```bash
# View application logs
gcloud logging read "resource.type=gce_instance AND resource.labels.instance_id=YOUR_INSTANCE_ID"

# Follow logs in real-time
gcloud logging tail "resource.type=gce_instance"
```

### 3. Alerting

Create alerting policies in Cloud Monitoring:
- High CPU usage (>80%)
- High memory usage (>90%)
- Application errors
- Instance down

---

## 🔄 Updates and Backup

### Updating the Bot

1. **SSH into your instance**
2. **Pull updates**:
```bash
cd UEX_trading
git pull origin main
npm install
pm2 restart uex-discord-bot
```

### Backup User Data

1. **Create regular backups**:
```bash
# Create snapshot of boot disk
gcloud compute disks snapshot uex-discord-bot \
  --zone=us-central1-a \
  --snapshot-names=uex-bot-backup-$(date +%Y%m%d)

# Or backup user_data directory to Cloud Storage
gsutil cp -r user_data/ gs://your-backup-bucket/user-data-$(date +%Y%m%d)/
```

### Automatic Backup Script

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d)
cd /home/your-username/UEX_trading
tar -czf user_data_backup_$DATE.tar.gz user_data/
gsutil cp user_data_backup_$DATE.tar.gz gs://your-backup-bucket/
rm user_data_backup_$DATE.tar.gz
```

```bash
# Add to crontab for daily backups at 2 AM
crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

---

## 🆘 Troubleshooting

### Common Issues

**Free Tier Limitations**:
- Only works in US regions: `us-central1`, `us-east1`, `us-west1`
- 1 e2-micro instance limit per account
- 30 GB total persistent disk across all instances

**Bot Won't Start**:
```bash
# Check PM2 status
pm2 status
pm2 logs uex-discord-bot

# Check system resources
free -h  # Memory usage
df -h    # Disk usage
```

**Webhooks Not Working**:
```bash
# Test firewall
curl http://YOUR_EXTERNAL_IP:3000/health

# Check GCP firewall rules
gcloud compute firewall-rules list

# Verify external IP
gcloud compute instances describe uex-discord-bot --zone=us-central1-a | grep natIP
```

**Out of Memory**:
```bash
# Monitor memory with PM2
pm2 monit

# Restart bot if needed
pm2 restart uex-discord-bot

# Consider upgrading to e2-small if consistently hitting limits
```

---

## 💰 Cost Management

### Free Tier Usage Monitoring

1. **Set up billing alerts** in GCP Console
2. **Monitor free tier usage**:
   - Compute Engine: 744 hours/month (30 days × 24 hours)
   - Persistent Disk: 30 GB
   - Network: 1 GB egress to North America

### Cost Optimization Tips

1. **Always use free tier regions**: us-central1, us-east1, us-west1
2. **Monitor disk usage**: Keep under 30 GB
3. **Use snapshot scheduling** instead of keeping multiple disk snapshots
4. **Set budget alerts** for any unexpected charges
5. **Consider preemptible instances** for development (not recommended for production bots)

### Scaling Beyond Free Tier

| Instance Type | vCPUs | RAM | Cost/Month | Use Case |
|---------------|-------|-----|------------|----------|
| e2-micro (Free) | 1 | 1 GB | $0 | Single bot |
| e2-small | 1 | 2 GB | ~$13 | Multiple bots |
| e2-medium | 1 | 4 GB | ~$26 | High traffic |

---

## 🌐 Domain and SSL Setup

### 1. Reserve Static IP

```bash
gcloud compute addresses create uex-bot-ip --region=us-central1
```

### 2. Assign to Instance

```bash
gcloud compute instances delete-access-config uex-discord-bot --zone=us-central1-a
gcloud compute instances add-access-config uex-discord-bot \
  --address=uex-bot-ip \
  --zone=us-central1-a
```

### 3. Configure DNS

Point your domain to the static IP address.

### 4. Setup SSL (Optional)

Use Caddy for automatic SSL:

```bash
# Install Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/caddy-stable-archive-keyring.gpg] https://dl.cloudsmith.io/public/caddy/stable/deb/debian any-version main" | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy

# Configure Caddy
sudo nano /etc/caddy/Caddyfile
```

```caddy
your-domain.com {
    reverse_proxy localhost:3000
}
```

```bash
sudo systemctl reload caddy
```

**🎉 Your UEX Discord Bot is now running on GCP with SSL!**

**Webhook URL**: `https://your-domain.com/webhook/uex`

---

Your Discord bot is now deployed on Google Cloud Platform! The Always Free tier provides an excellent foundation for running your bot permanently at no cost, with the option to scale up as needed. 🚀 