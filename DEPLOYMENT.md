# Nines Game - Laravel Web Hosting Deployment Guide

This guide covers deploying the Nines multiplayer game to standard Laravel web hosting platforms.

## Prerequisites

- PHP 8.2 or higher
- PostgreSQL database
- Composer installed
- Node.js and npm (for building frontend assets)

## Project Structure

```
├── app/                 # Laravel application code
├── config/              # Laravel configuration files
├── database/            # Migrations and seeders
├── public/              # Web server document root
├── routes/              # Laravel route definitions
├── composer.json        # PHP dependencies (root level for hosting)
├── .env.example         # Environment template
├── src/                 # Phaser.js frontend source
├── dist/                # Built frontend assets
├── webpack.config.js    # Frontend build configuration
└── package.json         # Node.js dependencies
```

## Deployment Steps

### 1. Clone and Install Dependencies

```bash
# Install PHP dependencies (composer.json is now in root)
composer install --optimize-autoloader --no-dev

# Install Node.js dependencies
npm install

# Build frontend assets
npx webpack --config webpack.config.cjs --mode=production
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Generate application key
php artisan key:generate

# Configure your database and other settings in .env:
# - Set DB_* variables for your PostgreSQL database
# - Set APP_URL to your domain
# - Configure REVERB_* settings for your hosting environment
```

### 3. Database Setup

```bash
# Run migrations
php artisan migrate

# Clear configuration cache
php artisan config:clear
php artisan cache:clear
```

### 4. Build Frontend Assets

```bash
# Build production frontend (from project root)
./node_modules/.bin/webpack --mode=production
```

### 5. Web Server Configuration

Point your web server's document root to `public/`

#### Apache (.htaccess already included)
No additional configuration needed.

#### Nginx
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /path/to/your/project/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

### 6. WebSocket Configuration (Reverb)

For production, you'll need to run the Reverb WebSocket server:

```bash
# Start Reverb server (in background/process manager)
php artisan reverb:start --host=0.0.0.0 --port=8080
```

**Note**: For shared hosting, you may need to check if WebSocket connections are supported, or use a WebSocket service like Pusher instead.

## File Permissions

Ensure the following directories are writable:
```bash
chmod -R 755 storage
chmod -R 755 bootstrap/cache
```

## Environment Variables

Key environment variables to configure:

```env
APP_NAME="Nines Game"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com

DB_CONNECTION=pgsql
DB_HOST=your-db-host
DB_PORT=5432
DB_DATABASE=your-db-name
DB_USERNAME=your-db-user
DB_PASSWORD=your-db-password

BROADCAST_CONNECTION=reverb

REVERB_APP_ID=1
REVERB_APP_KEY=your-reverb-key
REVERB_APP_SECRET=your-reverb-secret
REVERB_HOST="yourdomain.com"
REVERB_PORT=8080
REVERB_SCHEME=https
```

## Troubleshooting

### Common Issues:

1. **500 Server Error**: Check file permissions and ensure `.env` is configured correctly
2. **Database Connection**: Verify PostgreSQL credentials and connection
3. **Assets Not Loading**: Ensure frontend build completed and `dist/` directory exists
4. **WebSocket Issues**: Check if your hosting provider supports WebSocket connections

### Logs:
Check Laravel logs at `storage/logs/laravel.log`

## Build Commands

### Frontend Build
```bash
# Production build (optimized)
npx webpack --config webpack.config.cjs --mode=production

# Development build (unminified)
npx webpack --config webpack.config.cjs --mode=development

# Development server with hot reload
npx webpack serve --config webpack.config.cjs --mode=development --host=0.0.0.0 --port=3000
```

## Features

Once deployed, your Nines game will support:

- Local multiplayer games (2 players on same device)
- Remote multiplayer games with shareable codes
- Real-time game synchronization via WebSockets
- QR code generation for easy game sharing
- Mobile-responsive design

## Support

For deployment issues, check the Laravel documentation at https://laravel.com/docs/deployment