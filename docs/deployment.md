# Deployment Guide

## Production Checklist

Before deploying to production, complete all items in this checklist.

### Security
- [ ] Change default admin password (`Admin@Sacred2025!`)
- [ ] Set a strong `JWT_SECRET` (minimum 32 random characters — use `openssl rand -base64 32`)
- [ ] Set a strong `POSTGRES_PASSWORD`
- [ ] Enable HTTPS on all subdomains
- [ ] Configure CORS origins to production domains only
- [ ] Set `Square:Environment=production` and use production API keys
- [ ] Review rate limiting configuration

### Square
- [ ] Create a Square Developer account and application
- [ ] Obtain production Access Token and Location ID
- [ ] Register webhook endpoint: `https://api.sacredvibesyoga.com/api/bookings/webhooks/square`
- [ ] Copy webhook signature key to `Square:WebhookSignatureKey`
- [ ] Test a sandbox payment end-to-end before going live

### DNS / Subdomains
- [ ] `sacredvibesyoga.com` → frontend server
- [ ] `hands.sacredvibesyoga.com` → frontend server
- [ ] `sound.sacredvibesyoga.com` → frontend server
- [ ] `admin.sacredvibesyoga.com` → frontend server
- [ ] `api.sacredvibesyoga.com` → backend API server
- [ ] SSL certificates issued for all subdomains (Let's Encrypt)

---

## Recommended Production Stack

```
Internet
    │
    ├─── Cloudflare (DNS + DDoS protection)
    │
    ▼
nginx / Caddy (reverse proxy + SSL termination)
    │
    ├─── :3000 → Next.js frontend (PM2 or Docker)
    └─── :5000 → ASP.NET Core API (systemd or Docker)
         │
         └─── PostgreSQL (RDS / managed DB)
```

---

## VPS Deployment (Ubuntu 22.04)

### 1. Install dependencies

```bash
# .NET 9
wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
sudo apt update && sudo apt install -y dotnet-sdk-9.0

# Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# PostgreSQL 16
sudo apt install -y postgresql postgresql-contrib

# Nginx + Certbot
sudo apt install -y nginx certbot python3-certbot-nginx
```

### 2. PostgreSQL setup

```bash
sudo -u postgres psql << EOF
CREATE USER sacredvibes WITH PASSWORD 'your_strong_password';
CREATE DATABASE sacredvibes OWNER sacredvibes;
\q
EOF
```

### 3. Build and deploy backend

```bash
cd /srv/sacred-vibes/backend
dotnet publish src/SacredVibes.Api/SacredVibes.Api.csproj \
  -c Release -o /srv/sacred-vibes/api

# Create systemd service
sudo tee /etc/systemd/system/sacredvibes-api.service << EOF
[Unit]
Description=Sacred Vibes API
After=network.target

[Service]
WorkingDirectory=/srv/sacred-vibes/api
ExecStart=/usr/bin/dotnet /srv/sacred-vibes/api/SacredVibes.Api.dll
Restart=always
RestartSec=5
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=ASPNETCORE_URLS=http://localhost:5000
EnvironmentFile=/srv/sacred-vibes/.env
User=www-data

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable sacredvibes-api
sudo systemctl start sacredvibes-api
```

### 4. Build and deploy frontend

```bash
cd /srv/sacred-vibes/frontend
npm ci
NEXT_PUBLIC_API_URL=https://api.sacredvibesyoga.com npm run build

# Install PM2
sudo npm install -g pm2

# Start with PM2
pm2 start npm --name "sacredvibes-frontend" -- start -- -p 3000
pm2 save
pm2 startup
```

### 5. Nginx configuration

```nginx
# /etc/nginx/sites-available/sacredvibes

# Main site + Sacred Hands + Sacred Sound + Admin → frontend
server {
    listen 443 ssl;
    server_name sacredvibesyoga.com hands.sacredvibesyoga.com
                sound.sacredvibesyoga.com admin.sacredvibesyoga.com;

    ssl_certificate     /etc/letsencrypt/live/sacredvibesyoga.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sacredvibesyoga.com/privkey.pem;

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

# API subdomain → backend
server {
    listen 443 ssl;
    server_name api.sacredvibesyoga.com;

    ssl_certificate     /etc/letsencrypt/live/sacredvibesyoga.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sacredvibesyoga.com/privkey.pem;

    client_max_body_size 30M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static uploads served directly
    location /uploads/ {
        alias /srv/sacred-vibes/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}

# HTTP redirect
server {
    listen 80;
    server_name sacredvibesyoga.com hands.sacredvibesyoga.com
                sound.sacredvibesyoga.com admin.sacredvibesyoga.com
                api.sacredvibesyoga.com;
    return 301 https://$host$request_uri;
}
```

```bash
# Issue wildcard cert (covers all subdomains)
sudo certbot certonly --dns-cloudflare \
  -d sacredvibesyoga.com \
  -d "*.sacredvibesyoga.com"

sudo ln -s /etc/nginx/sites-available/sacredvibes /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## Docker Production Deployment

```bash
# On production server
git clone <repo> sacred-vibes && cd sacred-vibes

# Configure environment
cp .env.example .env
nano .env  # Fill in all required values

# Build and start
docker compose -f docker-compose.yml up -d --build

# View logs
docker compose logs -f api
docker compose logs -f frontend

# Run a migration manually if needed
docker compose exec api dotnet ef database update \
  --project src/SacredVibes.Infrastructure \
  --startup-project src/SacredVibes.Api
```

---

## Backup Strategy

```bash
# PostgreSQL backup (run via cron daily)
pg_dump -U sacredvibes sacredvibes \
  | gzip > /backups/sacredvibes-$(date +%Y%m%d).sql.gz

# Uploads backup
tar -czf /backups/uploads-$(date +%Y%m%d).tar.gz /srv/sacred-vibes/uploads/

# Retain 30 days
find /backups -mtime +30 -delete
```

---

## Health Check

The API exposes a health check endpoint:

```
GET https://api.sacredvibesyoga.com/health
```

Checks: API running + database connectivity.

Configure your monitoring system (UptimeRobot, Better Uptime, etc.) to poll this endpoint every 5 minutes.
