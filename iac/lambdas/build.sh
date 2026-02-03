#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SRC_DIR="$SCRIPT_DIR/src"
DIST_DIR="$SCRIPT_DIR/dist"

rm -rf "$DIST_DIR"

for fn_dir in "$SRC_DIR"/*/; do
  fn_name=$(basename "$fn_dir")
  echo "Building $fn_name..."
  npx esbuild "$fn_dir/index.ts" \
    --bundle \
    --platform=node \
    --target=node20 \
    --format=cjs \
    --outfile="$DIST_DIR/$fn_name/index.cjs"
done

echo "Build complete."
