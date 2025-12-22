#!/bin/bash
# Download chess pieces from a working source

cd "$(dirname "$0")/libs/pieces"

# Download from a public chess piece repository
# Using pieces from chessboard.js examples (these should work)
BASE_URL="https://raw.githubusercontent.com/oakmac/chessboardjs/master/img/chesspieces/wikipedia"

for piece in wK wQ wR wB wN wP bK bQ bR bB bN bP; do
  echo "Downloading $piece..."
  curl -L "${BASE_URL}/${piece}.png" -o "${piece}.png" 2>/dev/null
  if [ -f "${piece}.png" ]; then
    file_type=$(file -b "${piece}.png")
    if [[ "$file_type" == *"PNG"* ]] || [[ "$file_type" == *"image"* ]]; then
      echo "✓ $piece downloaded successfully"
    else
      echo "✗ $piece failed (got: $file_type)"
      rm "${piece}.png"
    fi
  else
    echo "✗ $piece failed to download"
  fi
done

echo ""
echo "Checking downloaded pieces..."
ls -lh *.png 2>/dev/null | wc -l | xargs echo "Pieces downloaded:"

