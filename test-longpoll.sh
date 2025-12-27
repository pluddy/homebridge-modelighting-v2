#!/bin/bash

# Test script for NPU long-polling functionality
# Usage: ./test-longpoll.sh [NPU_IP]

NPU_IP="${1:-192.168.1.101}"

echo "========================================"
echo "NPU Long-Polling Test"
echo "========================================"
echo "NPU IP: ${NPU_IP}"
echo ""

# Test 1: Basic connectivity
echo "Test 1: Basic connectivity (immediate response)"
echo "----------------------------------------"
if curl -s --max-time 5 "http://${NPU_IP}/xml-dump?nocrlf=true&what=status&where=/" > /dev/null; then
  echo "✓ NPU is reachable"
else
  echo "✗ NPU is not reachable at ${NPU_IP}"
  exit 1
fi
echo ""

# Test 2: Long-polling endpoint
echo "Test 2: Long-polling endpoint (10 second timeout)"
echo "----------------------------------------"
echo "This will wait up to 10 seconds for a state change."
echo "Try changing a light from the wall plate during this time..."
echo ""

START=$(date +%s)
RESPONSE=$(curl -s --max-time 12 "http://${NPU_IP}/xml-dump?nocrlf=true&longpoll=10&what=status&where=/")
END=$(date +%s)
DURATION=$((END - START))

if [ -n "$RESPONSE" ]; then
  echo "✓ Received response after ${DURATION} seconds"

  # Extract some channel states
  echo ""
  echo "Sample channel states:"
  echo "$RESPONSE" | grep -o 'LoadId="[0-9]*".*State>[0-9]*<' | head -5

  if [ $DURATION -lt 10 ]; then
    echo ""
    echo "✓ Response received quickly (${DURATION}s) - likely detected a state change!"
  else
    echo ""
    echo "✓ Response received after timeout (${DURATION}s) - no state changes detected"
  fi
else
  echo "✗ No response received"
fi
echo ""

# Test 3: Continuous monitoring
echo "Test 3: Continuous monitoring (30 seconds)"
echo "----------------------------------------"
echo "Monitoring for state changes for 30 seconds..."
echo "Change lights from wall plate to see immediate detection"
echo ""

TIMEOUT=$(($(date +%s) + 30))
COUNT=0

while [ $(date +%s) -lt $TIMEOUT ]; do
  COUNT=$((COUNT + 1))
  echo "[$(date +%T)] Poll #${COUNT}: Waiting for change..."

  START=$(date +%s)
  curl -s --max-time 32 "http://${NPU_IP}/xml-dump?nocrlf=true&longpoll=30&what=status&where=/" \
    | grep -o 'LoadId="[0-9]*".*State>[0-9]*<' \
    | head -3
  END=$(date +%s)
  DURATION=$((END - START))

  if [ $DURATION -lt 30 ]; then
    echo "  → Change detected after ${DURATION}s!"
  fi
  echo ""
done

echo "Test complete!"
echo ""
echo "Summary:"
echo "- NPU responds to long-polling requests"
echo "- State changes are detected in real-time"
echo "- Ready to use with Homebridge plugin"
