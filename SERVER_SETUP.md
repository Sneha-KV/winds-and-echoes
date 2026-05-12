# Server Setup Guide — DigitalOcean + Ghost

Step-by-step guide to get Ghost running on a DigitalOcean droplet with
Cloudflare in front of it.

> **Note:** Domain purchased via Cloudflare Registrar — nameservers are
> already set up automatically. Skip straight to adding DNS records in step 2.

---

## 1. Create the DigitalOcean droplet

1. Sign up at digitalocean.com
2. Create Droplet → Choose **Ubuntu 24.04 LTS**
3. Plan → **Basic** → CPU option → **Regular** (not Premium Intel, not Premium AMD)
4. Size → **1 vCPU / 2GB RAM / 50GB SSD → $12/month**
   - Do NOT use 1GB — Ghost + Node.js pipeline + Umami needs 2GB
   - Do NOT use Premium Intel — $24/month and unnecessary for a blog
5. Region → San Francisco (closest to Seattle)
6. Authentication → **SSH key**
   ```bash
   # On your Mac — reuse the same key you generated for GitHub
   cat ~/.ssh/id_ed25519.pub
   # Copy the output and paste it into DigitalOcean's SSH key field
   ```
7. Click **Create Droplet** — note your droplet's **public IP address**

> **SSH note:** DigitalOcean only adds the SSH key to the root user.
> To SSH in later use: `ssh root@your-droplet-ip`
> Then switch to your ghost user with: `su - yourusername`

---

## 2. Add DNS records in Cloudflare

Since you bought the domain through Cloudflare Registrar, nameservers are
already configured. Just add the DNS records pointing to your droplet.

1. Cloudflare dashboard → select `windsandechoes.com` → **DNS** → **Records**
2. Add all three records now — including `api` for the pipeline:

```
Type: A      Name: @      IPv4: your-droplet-ip        Proxy: ON (orange cloud)
Type: CNAME  Name: www    Target: windsandechoes.com   Proxy: ON
Type: A      Name: api    IPv4: your-droplet-ip        Proxy: ON
```

> **Proxy ON** routes traffic through Cloudflare's CDN — SSL, DDoS protection,
> and caching happen automatically. Leave it ON for all records.

> **What the IPs look like:** When Proxy is ON, `nslookup windsandechoes.com`
> returns Cloudflare IPs (like `104.21.x.x`), not your droplet IP. That's correct.

> **SSL/TLS mode:** After Ghost SSL is set up, go to Cloudflare → SSL/TLS →
> Overview and set mode to **Full (strict)**.

---

## 3. Initial server setup

```bash
# SSH into your droplet as root
ssh root@your-droplet-ip

# Update packages
apt update && apt upgrade -y

# Create a non-root user for Ghost (choose your own username)
adduser yourusername
usermod -aG sudo yourusername

# Fix home directory permissions (required by Ghost CLI)
chmod 755 /home/yourusername

# Set up firewall
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw enable

# Switch to your new user
su - yourusername
```

---

## 4. Install Node.js

> **Important:** Ghost v6 requires Node v22 specifically.
> Do NOT use `sudo apt install nodejs` — the apt version is outdated.
> Do NOT use Node v20 or v24 — Ghost v6 requires ^22.x.

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc

# Install Node.js v22 (required by Ghost v6)
nvm install 22
nvm use 22
nvm alias default 22
node --version  # should show v22.x.x
```

---

## 5. Install Ghost dependencies

```bash
# Install Nginx
sudo apt install nginx -y

# Install MySQL
sudo apt install mysql-server -y
sudo mysql_secure_installation
```

When `mysql_secure_installation` asks:
- Remove anonymous users? → **Y**
- Disallow root login remotely? → **Y**
- Remove test database? → **Y**
- Reload privilege tables? → **Y**

```bash
# Create Ghost database and user
sudo mysql -u root -p
```

```sql
CREATE DATABASE ghostdb;
CREATE USER 'yourusername'@'localhost' IDENTIFIED BY 'YourStrongPassword!';
GRANT ALL PRIVILEGES ON ghostdb.* TO 'yourusername'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

> **Password requirements:** MySQL requires uppercase, lowercase, number, and
> special character (e.g. `Winds@Echo2026#Xk9`). Save it in your password manager.

---

## 6. Install Ghost CLI and Ghost

```bash
# Install Ghost CLI globally
npm install -g ghost-cli

# Create Ghost directory
sudo mkdir -p /var/www/ghost
sudo chown yourusername:yourusername /var/www/ghost
cd /var/www/ghost

# Install Ghost
ghost install \
  --url https://windsandechoes.com \
  --dbname ghostdb \
  --dbuser yourusername \
  --dbpass YourStrongPassword! \
  --dbhost localhost \
  --process systemd \
  --no-prompt
```

Ghost will automatically:
- Download and install Ghost v6
- Set up Nginx config
- Configure SSL via acme.sh / Let's Encrypt
- Start Ghost as a systemd service

> **If you see "ghost command not found" after switching Node versions:**
> Run `npm install -g ghost-cli` again under the new Node version.

---

## 7. Fix Nginx default site conflict

After Ghost installs, remove the default Nginx site which conflicts with Ghost:

```bash
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

> Without this step, Nginx serves the default welcome page instead of Ghost.

---

## 8. Verify Ghost is running

```bash
cd /var/www/ghost
ghost status
# Should show: running (production) at https://windsandechoes.com
```

Open `https://windsandechoes.com/ghost` in your browser to create your admin account.

> **Admin account email:** Use your personal email — it's only your login,
> never shown publicly on the blog.
> **Onboarding wizard:** Skip all theme/setup prompts — click through until
> you reach the main dashboard.

---

## 9. Set up Cloudflare SSL mode

In Cloudflare dashboard → `windsandechoes.com` → **SSL/TLS** → **Overview**:

Set mode to **Full (strict)** — required now that Ghost has a real
Let's Encrypt certificate. Leaving it on Flexible causes 502 errors.

---

## 10. Get your Ghost Admin API key

1. Ghost admin → **Settings** → **Integrations**
2. Click **Add custom integration**
3. Name it `Pipeline` → click **Save**
4. Copy the **Admin API Key** — save in your password manager
5. Add a webhook at the bottom of the same page:
   - Name: `Publish trigger`
   - Event: `Post published`
   - Target URL: `https://api.windsandechoes.com/api/webhook/publish`
   - Secret: leave blank for now

---

## 11. Install pm2 for the pipeline server

```bash
npm install -g pm2

pm2 startup systemd -u yourusername --hp /home/yourusername
# Copy and run the sudo command it outputs exactly
pm2 save
```

---

## 12. Deploy the pipeline

```bash
cd /home/yourusername
git clone https://github.com/yourusername/winds-and-echoes.git
cd winds-and-echoes

npm install

cp pipeline/.env.example pipeline/.env
nano pipeline/.env
# Fill in: ANTHROPIC_API_KEY, GHOST_URL, GHOST_ADMIN_API_KEY

pm2 start pipeline/src/index.js --name "wae-pipeline"
pm2 save
```

Test it's running locally:
```bash
curl http://localhost:3001/health
# Should return: {"status":"ok","service":"winds-and-echoes-pipeline"}
```

---

## 13. Configure Nginx for the pipeline

```bash
sudo nano /etc/nginx/sites-available/pipeline
```

Paste exactly (the `nginx` label is just syntax highlighting — don't include it):
```
server {
    listen 80;
    server_name api.windsandechoes.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/pipeline /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 14. Set up SSL for api subdomain

Ghost CLI only manages SSL for the main domain. Use certbot for the API subdomain:

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d api.windsandechoes.com --email your@email.com --agree-tos --non-interactive
```

Verify it works:
```bash
curl https://api.windsandechoes.com/health
# Should return: {"status":"ok","service":"winds-and-echoes-pipeline"}
```

---

## 15. Set up automated backups (Backblaze B2)

**First, set up Backblaze B2:**
1. Sign up at backblaze.com
2. B2 Cloud Storage → Buckets → **Create a Bucket**
   - Name: `winds-and-echoes-backups`
   - Files: Private
3. App Keys → **Add a New Application Key**
   - Name: `backup-key`
   - Bucket: `winds-and-echoes-backups`
   - Access: Read and Write
   - **Copy keyID and applicationKey immediately — shown once only**
4. Note your bucket endpoint — shown in bucket details (e.g. `s3.us-west-004.backblazeb2.com`)

**Configure s3cmd:**
```bash
sudo apt install s3cmd -y
s3cmd --configure
```

Enter when prompted:
- Access Key → your Backblaze **keyID**
- Secret Key → your Backblaze **applicationKey**
- Default Region → `US`
- S3 Endpoint → `s3.us-west-004.backblazeb2.com` (use your actual endpoint)
- DNS-style bucket template → `%(bucket)s.s3.us-west-004.backblazeb2.com`
- Encryption password → leave blank (press Enter)
- Use HTTPS → Yes
- HTTP Proxy → leave blank (press Enter)
- Save settings → **Y**

Test connection:
```bash
s3cmd ls s3://winds-and-echoes-backups
# Returns blank (empty bucket) — no error means it's working
```

> **Note:** The test during `s3cmd --configure` shows 403 AccessDenied —
> that's expected because the key only has access to one bucket, not all buckets.
> The `s3cmd ls` test above is the correct verification.

**Create backup script:**
```bash
nano /home/yourusername/backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d)
BACKUP_DIR="/tmp/ghost-backup-$DATE"
mkdir -p $BACKUP_DIR

# Dump Ghost MySQL database
mysqldump -u yourusername -p'YourStrongPassword!' ghostdb > $BACKUP_DIR/ghost-db.sql

# Copy Ghost content (themes, images)
cp -r /var/www/ghost/content $BACKUP_DIR/

# Upload to Backblaze B2
s3cmd put -r $BACKUP_DIR s3://winds-and-echoes-backups/

# Clean up
rm -rf $BACKUP_DIR
echo "Backup complete: $DATE"
```

```bash
chmod +x /home/yourusername/backup.sh

# Test it runs
bash /home/yourusername/backup.sh

# Schedule daily at 2am
crontab -e
# Add this line:
# 0 2 * * * /home/yourusername/backup.sh >> /var/log/ghost-backup.log 2>&1
```

---

## 16. Verify everything works

```bash
# Ghost
cd /var/www/ghost
ghost status  # should show: running (production)

# Pipeline
pm2 status    # should show: online

# HTTPS endpoints
curl https://windsandechoes.com            # Ghost blog
curl https://api.windsandechoes.com/health # Pipeline health check

# Nginx
sudo systemctl status nginx
```

---

## Quick reference — useful commands

```bash
# SSH into server
ssh root@your-droplet-ip
su - yourusername

# Ghost
cd /var/www/ghost
ghost start / stop / restart / status / logs

# Pipeline
pm2 start/stop/restart wae-pipeline
pm2 logs wae-pipeline
pm2 status

# Nginx
sudo nginx -t               # test config
sudo systemctl reload nginx # apply changes

# Pull latest code and restart pipeline
cd /home/yourusername/winds-and-echoes
git pull
pm2 restart wae-pipeline

# Manual backup
bash /home/yourusername/backup.sh
```
