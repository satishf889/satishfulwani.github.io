#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

OUTPUT="$ROOT/assets/Satish_Fulwani_Resume.pdf"
HTML="file://$ROOT/resume.html"

if [[ -n "${CHROME_BIN:-}" ]]; then
  CHROME="$CHROME_BIN"
elif command -v chromium-browser >/dev/null 2>&1; then
  CHROME="$(command -v chromium-browser)"
elif command -v chromium >/dev/null 2>&1; then
  CHROME="$(command -v chromium)"
elif [[ -x "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]]; then
  CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
else
  echo "Error: Chromium/Chrome not found. Set CHROME_BIN to your browser binary."
  exit 1
fi

echo "Generating PDF resume using: $CHROME"

"$CHROME" \
  --headless \
  --disable-gpu \
  --no-sandbox \
  --disk-cache-size=1 \
  --print-to-pdf="$OUTPUT" \
  "$HTML"

if [[ ! -f "$OUTPUT" ]]; then
  echo "Error: PDF was not created at $OUTPUT"
  exit 1
fi

echo "Success! PDF saved to: $OUTPUT"
