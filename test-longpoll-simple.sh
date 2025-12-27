#!/bin/bash

# Simple interactive long-polling test
# This will wait for you to change a light, then show immediate detection

NPU_IP="${1:-192.168.1.101}"

echo "=========================================="
echo "NPU Long-Polling Interactive Test"
echo "=========================================="
echo "NPU IP: ${NPU_IP}"
echo ""
echo "This test will hold a connection open and wait"
echo "for ANY state change on the NPU."
echo ""
echo "Instructions:"
echo "1. Wait for the 'Waiting...' message"
echo "2. Press a button on your wall plate"
echo "3. Watch how fast the response comes back!"
echo ""
read -p "Press ENTER when ready to start..."
echo ""

for i in {1..3}; do
  echo "=== Test ${i}/3 ==="
  echo "Waiting for state change (30 second timeout)..."
  echo "** GO AHEAD - Press a button on the wall plate NOW **"
  echo ""

  START=$(date +%s)

  # Make the request and capture response
  RESPONSE=$(curl -s --max-time 32 "http://${NPU_IP}/xml-dump?nocrlf=true&longpoll=30&what=status&where=/")

  END=$(date +%s)
  DURATION=$((END - START))

  if [ $DURATION -lt 30 ]; then
    echo "✓ CHANGE DETECTED after ${DURATION} seconds!"
    echo ""
    echo "First few channel states:"
    echo "$RESPONSE" | grep -o 'LoadId="[0-9]*".*State>[0-9]*<' | head -5
    echo ""
    echo "This is FAST! Long-polling works perfectly."
  else
    echo "✗ Timeout after ${DURATION} seconds (no changes detected)"
    echo "   Did you press a button? Try again on the next test."
  fi

  echo ""

  if [ $i -lt 3 ]; then
    read -p "Press ENTER for next test..."
    echo ""
  fi
done

echo "=========================================="
echo "Test complete!"
echo ""
echo "What you should have seen:"
echo "- Response time < 2 seconds when you press buttons"
echo "- Response time = 30 seconds when no button pressed"
echo ""
echo "This proves long-polling detects changes instantly,"
echo "much better than the old 2-30 second polling!"
