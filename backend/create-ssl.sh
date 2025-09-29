#!/bin/bash

# Create self-signed SSL certificate for development/testing
echo "Creating self-signed SSL certificate..."

# Create SSL directory
sudo mkdir -p /etc/nginx/ssl

# Generate private key
sudo openssl genrsa -out /etc/nginx/ssl/marketplace.key 2048

# Generate certificate
sudo openssl req -new -x509 -key /etc/nginx/ssl/marketplace.key -out /etc/nginx/ssl/marketplace.crt -days 365 -subj "/C=US/ST=State/L=City/O=Organization/CN=207.180.241.64"

# Set proper permissions
sudo chmod 600 /etc/nginx/ssl/marketplace.key
sudo chmod 644 /etc/nginx/ssl/marketplace.crt

echo "SSL certificate created successfully!"