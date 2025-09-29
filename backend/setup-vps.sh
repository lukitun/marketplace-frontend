#!/bin/bash

# VPS Backend Setup Script
echo "Setting up Marketplace Backend on VPS..."

# Update system
echo "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MySQL
echo "Installing MySQL..."
sudo apt install -y mysql-server

# Install PM2 globally
echo "Installing PM2..."
sudo npm install -g pm2

# Install dependencies
echo "Installing backend dependencies..."
npm install

# Create required directories
echo "Creating directories..."
mkdir -p public/uploads
mkdir -p logs

# Set permissions
chmod +x setup-vps.sh

# Configure MySQL
echo "Configuring MySQL database..."
echo "Please run the following commands in MySQL:"
echo "1. sudo mysql"
echo "2. CREATE DATABASE marketplace_db;"
echo "3. CREATE USER 'marketplace_user'@'localhost' IDENTIFIED BY 'your_secure_password';"
echo "4. GRANT ALL PRIVILEGES ON marketplace_db.* TO 'marketplace_user'@'localhost';"
echo "5. FLUSH PRIVILEGES;"
echo "6. EXIT;"
echo ""
echo "Then import the schema:"
echo "mysql -u marketplace_user -p marketplace_db < database/schema.sql"

# Setup environment variables
echo "Setting up environment variables..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Please edit .env file with your configuration"
fi

# Setup PM2
echo "Setting up PM2..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Configure firewall
echo "Configuring firewall..."
sudo ufw allow 22
sudo ufw allow 5000
sudo ufw allow 80
sudo ufw allow 443

echo "Backend setup complete!"
echo "Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Setup MySQL database and import schema"
echo "3. Run: pm2 restart marketplace-backend"
echo "4. Backend will be running on port 5000"