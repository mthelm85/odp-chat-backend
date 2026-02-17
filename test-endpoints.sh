#!/bin/bash

# Test script for the DOL Open Data Portal Backend
# Make sure the server is running (npm run dev) before executing this

BASE_URL="http://localhost:3000"

echo "Testing DOL Open Data Portal Backend"
echo "======================================"
echo ""

# Test 1: Health check
echo "Test 1: Health check"
echo "-------------------"
curl -s "$BASE_URL/health" | jq .
echo ""
echo ""

# Test 2: Off-topic message (should return JSON, not SSE)
echo "Test 2: Off-topic message (should reject)"
echo "----------------------------------------"
curl -s -X POST "$BASE_URL/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the capital of France?",
    "history": []
  }' | jq .
echo ""
echo ""

# Test 3: On-topic message (should return SSE stream)
echo "Test 3: On-topic message (SSE stream)"
echo "------------------------------------"
echo "Sending: 'What datasets are available?'"
echo ""
curl -N -X POST "$BASE_URL/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What datasets are available?",
    "history": []
  }'
echo ""
echo ""

echo "Tests complete!"
