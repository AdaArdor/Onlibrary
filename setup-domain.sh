#!/bin/bash

# Custom Domain Setup Script for OnLibrary
# Replace "yourdomain.com" with your actual domain

echo "🌐 Setting up custom domain for OnLibrary..."

# Add custom domain to Firebase (run after purchasing domain)
echo "Step 1: Adding domain to Firebase Hosting..."
# firebase hosting:channel:deploy live --project onlibrary-7795e

# The domain you want to use
DOMAIN="onlibrary.net"

echo "Step 2: Add these DNS records in your domain registrar:"
echo "----------------------------------------"
echo "Type: A     | Name: @   | Value: 199.36.158.100"
echo "Type: A     | Name: www | Value: 199.36.158.100" 
echo "Type: CNAME | Name: @   | Value: onlibrary-7795e.web.app"
echo "----------------------------------------"

echo "Step 3: Go to Firebase Console:"
echo "https://console.firebase.google.com/project/onlibrary-7795e/hosting/main"
echo "Click 'Add custom domain' and enter: $DOMAIN"

echo "✅ After DNS propagation (24-48 hours), your app will be live at:"
echo "https://$DOMAIN"
echo "https://www.$DOMAIN"
