#!/bin/bash

# Test Supabase Function with curl
# Replace YOUR_JWT_TOKEN with an actual JWT token from your application

echo "🔍 Testing Supabase Function Directly"
echo "====================================="

# Your Supabase project URL
SUPABASE_URL="https://zyozeuihjptarceuipwu.supabase.co"

echo ""
echo "1️⃣ Testing function endpoint (should return 401 without auth):"
curl -X POST "${SUPABASE_URL}/functions/v1/send_client_invitation" \
  -H "Content-Type: application/json" \
  -d '{"clientEmail": "test@example.com"}' \
  -w "\nStatus: %{http_code}\n"

echo ""
echo "2️⃣ Testing with invalid auth (should return 401):"
curl -X POST "${SUPABASE_URL}/functions/v1/send_client_invitation" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid_token" \
  -d '{"clientEmail": "test@example.com"}' \
  -w "\nStatus: %{http_code}\n"

echo ""
echo "3️⃣ Testing with valid JWT token (replace YOUR_JWT_TOKEN):"
echo "💡 To get a JWT token:"
echo "   1. Log into your application"
echo "   2. Open browser dev tools"
echo "   3. Go to Network tab"
echo "   4. Make any request to your app"
echo "   5. Look for 'Authorization: Bearer ...' header"
echo ""

# Uncomment and replace YOUR_JWT_TOKEN with actual token
# curl -X POST "${SUPABASE_URL}/functions/v1/send_client_invitation" \
#   -H "Content-Type: application/json" \
#   -H "Authorization: Bearer YOUR_JWT_TOKEN" \
#   -d '{
#     "clientEmail": "test@example.com",
#     "clientName": "Test Client",
#     "trainerName": "Test Trainer",
#     "trainerId": "test-uuid",
#     "customMessage": "This is a test invitation"
#   }' \
#   -w "\nStatus: %{http_code}\n"

echo ""
echo "4️⃣ Check function logs:"
echo "Run this command to see function logs:"
echo "supabase functions logs send_client_invitation"

echo ""
echo "5️⃣ Check environment variables:"
echo "Run this command to list secrets:"
echo "supabase secrets list" 