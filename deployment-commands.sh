#!/bin/bash
# Deployment Commands for Nines Game Production Server

echo "=== Nines Game Deployment Commands ==="
echo

echo "1. Copy systemd service file:"
echo "sudo cp laravel-reverb.service /etc/systemd/system/"
echo

echo "2. Enable and start the service:"
echo "sudo systemctl daemon-reload"
echo "sudo systemctl enable laravel-reverb"
echo "sudo systemctl start laravel-reverb"
echo

echo "3. Check service status:"
echo "sudo systemctl status laravel-reverb"
echo

echo "4. View service logs:"
echo "sudo journalctl -u laravel-reverb -f"
echo

echo "5. After deployment, restart the service:"
echo "sudo systemctl restart laravel-reverb"
echo

echo "6. Test WebSocket connection:"
echo "curl -i -N -H 'Connection: Upgrade' -H 'Upgrade: websocket' \\"
echo "     -H 'Sec-WebSocket-Version: 13' \\"
echo "     -H 'Sec-WebSocket-Key: x3JJHMbDL1EzLkh9GBhXDw==' \\"
echo "     http://127.0.0.1:8081/app/\$(grep REVERB_APP_KEY .env | cut -d '=' -f2)"
echo

echo "=== Service Management ==="
echo "Start:   sudo systemctl start laravel-reverb"
echo "Stop:    sudo systemctl stop laravel-reverb"
echo "Restart: sudo systemctl restart laravel-reverb"
echo "Status:  sudo systemctl status laravel-reverb"
echo "Logs:    sudo journalctl -u laravel-reverb -f"