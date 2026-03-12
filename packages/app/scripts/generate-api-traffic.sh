#!/bin/bash
# Generate v1 API traffic for analytics testing
# Hits a couple v1 endpoints ~250 times each

BASE_URL="${1:-http://localhost:3000}"
COUNT=250

echo "Hitting $BASE_URL/api/v1/status $COUNT times..."
for i in $(seq 1 $COUNT); do
  curl -s -o /dev/null "$BASE_URL/api/v1/status" &
  # Run 25 at a time
  if (( i % 25 == 0 )); then
    wait
    echo "  status: $i/$COUNT"
  fi
done
wait

echo "Hitting $BASE_URL/api/v1/routes $COUNT times..."
for i in $(seq 1 $COUNT); do
  curl -s -o /dev/null "$BASE_URL/api/v1/routes" &
  if (( i % 25 == 0 )); then
    wait
    echo "  routes: $i/$COUNT"
  fi
done
wait

echo "Done. 500 total v1 API calls sent."
echo "Run Rollup from the admin dashboard to see them in analytics."
