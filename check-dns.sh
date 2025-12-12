#!/bin/bash

echo "🔍 DNS Diagnostic for onlibrary.net"
echo "=================================="

echo "Checking A record for onlibrary.net:"
dig +short A onlibrary.net

echo ""
echo "Checking A record for www.onlibrary.net:"
dig +short A www.onlibrary.net

echo ""
echo "Expected values:"
echo "199.36.158.100"
echo "199.36.158.100"

echo ""
echo "Checking if domain resolves to Firebase:"
if dig +short A onlibrary.net | grep -q "199.36.158.100"; then
    echo "✅ Root domain (onlibrary.net) points to Firebase"
else
    echo "❌ Root domain does NOT point to Firebase"
    echo "Current A record: $(dig +short A onlibrary.net)"
fi

if dig +short A www.onlibrary.net | grep -q "199.36.158.100"; then
    echo "✅ www subdomain points to Firebase"
else
    echo "❌ www subdomain does NOT point to Firebase"
    echo "Current A record: $(dig +short A www.onlibrary.net)"
fi

echo ""
echo "Testing HTTP connectivity:"
echo "Testing onlibrary.net..."
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://onlibrary.net/ || echo "Connection failed"

echo ""
echo "If you see 403 Forbidden errors above, your DNS is not configured correctly."
echo "Make sure both @ and www point to 199.36.158.100"
