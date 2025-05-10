#!/usr/bin/env sh

set -e

cd "$(dirname "$0")"

echo '---'
echo "$(date --iso-8601=seconds): start"

./runServerSideChecks.mjs
git add data.json
git commit -m "Status update: $(date --iso-8601=minutes)"
git push github

echo "$(date --iso-8601=seconds): end"
