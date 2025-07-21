# Production Deployment Guide for Nines Game

## Current Status
✅ WebSocket client configuration working correctly  
✅ Browser attempting connection to `wss://ninesgame.co.uk/app/...`  
❌ nginx WebSocket proxy not configured on production server  

## Required Production Setup

### 1. Nginx Configuration
Add the following to your nginx server block for `ninesgame.co.uk`:

```nginx
# WebSocket endpoint for Laravel Reverb
location /app {
    proxy_pass http://127.0.0.1:8081;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 86400;
    proxy_send_timeout 86400;
    proxy_connect_timeout 86400;
}
```

### 2. Laravel Reverb Server (Recommended: Systemd Service)

**Option A: Manual Start (Not Recommended)**
```bash
cd /var/www/ninesgame.co.uk
php artisan reverb:start --host=0.0.0.0 --port=8081
```

**Option B: Systemd Service (Recommended)**
1. Copy the service file:
```bash
sudo cp laravel-reverb.service /etc/systemd/system/
```

2. Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable laravel-reverb
sudo systemctl start laravel-reverb
```

3. Check status:
```bash
sudo systemctl status laravel-reverb
```

**Benefits of Systemd Service:**
- ✅ Starts automatically on server boot
- ✅ Restarts automatically if it crashes
- ✅ Survives deployments
- ✅ Proper logging and monitoring
- ✅ No need to manually restart after each deployment

### 3. Production Environment Variables
Ensure your production `.env` contains:
```env
APP_ENV=production
REVERB_APP_ID=your-app-id
REVERB_APP_KEY=your-app-key  
REVERB_APP_SECRET=your-app-secret
REVERB_HOST=ninesgame.co.uk
REVERB_PORT=443
REVERB_SCHEME=https
REVERB_SERVER_HOST=127.0.0.1
REVERB_SERVER_PORT=8081
```

### 4. Firewall Configuration
Ensure port 8081 is accessible from localhost:
```bash
# Allow local connections to port 8081
sudo ufw allow from 127.0.0.1 to any port 8081
```

### 5. Testing Commands
After setup, test the WebSocket connection:
```bash
# Test if Reverb server is listening
netstat -tulpn | grep :8081

# Test WebSocket upgrade from local server
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
     -H "Sec-WebSocket-Version: 13" \
     -H "Sec-WebSocket-Key: x3JJHMbDL1EzLkh9GBhXDw==" \
     http://127.0.0.1:8081/app/your-app-key
```

## What's Working Now
- ✅ Client automatically detects production environment
- ✅ Uses correct `wss://` protocol for HTTPS sites  
- ✅ Connects to port 443 as expected
- ✅ Laravel API serving correct configuration
- ✅ Built production assets ready for deployment

## Next Steps
1. Add the nginx WebSocket proxy configuration
2. Start Laravel Reverb server on port 8081
3. Reload nginx configuration
4. Test WebSocket connection in browser

The application code is ready - only server configuration remains.