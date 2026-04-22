#!/usr/bin/env bash
# Build standalone qrit binaries for every supported platform.
# Output: dist/qrit-<os>-<arch>[.tar.gz]
#
# Requires: bun >= 1.1
# Invoke: bun run compile   (or:  bash scripts/compile.sh)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

OUT="$ROOT/dist"
ENTRY="src/cli.tsx"
mkdir -p "$OUT"

# target -> bin name suffix
TARGETS=(
  "bun-darwin-arm64:darwin-arm64"
  "bun-darwin-x64:darwin-x64"
  "bun-linux-arm64:linux-arm64"
  "bun-linux-x64:linux-x64"
)

VERSION="$(bun -e 'console.log(require("./package.json").version)')"
echo "building qrit v$VERSION"

for entry in "${TARGETS[@]}"; do
  target="${entry%%:*}"
  suffix="${entry##*:}"
  bin="$OUT/qrit-$suffix"
  echo "  -> $target"
  bun build "$ENTRY" \
    --compile \
    --minify \
    --sourcemap \
    --target="$target" \
    --outfile "$bin"

  tar -czf "$bin.tar.gz" -C "$OUT" "$(basename "$bin")"
done

(
  cd "$OUT"
  shasum -a 256 qrit-*.tar.gz > "checksums-$VERSION.txt"
)

echo
echo "done. artifacts in $OUT"
ls -la "$OUT"
