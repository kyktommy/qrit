#!/bin/sh
# qrit installer: downloads the standalone binary for this machine from
# GitHub releases, verifies its SHA-256, and installs it.
#
#   curl -fsSL https://raw.githubusercontent.com/kyktommy/qrit/main/install.sh | sh
#
# Env overrides:
#   QRIT_VERSION      tag to install (default: latest release), e.g. v0.2.0
#   QRIT_INSTALL_DIR  target directory (default: ~/.local/bin)

set -eu

REPO="kyktommy/qrit"
INSTALL_DIR="${QRIT_INSTALL_DIR:-$HOME/.local/bin}"

fail() {
  echo "qrit install: $1" >&2
  exit 1
}

case "$(uname -s)" in
  Darwin) os="darwin" ;;
  Linux) os="linux" ;;
  *) fail "unsupported OS: $(uname -s)" ;;
esac

case "$(uname -m)" in
  arm64 | aarch64) arch="arm64" ;;
  x86_64 | amd64) arch="x64" ;;
  *) fail "unsupported architecture: $(uname -m)" ;;
esac

tag="${QRIT_VERSION:-}"
if [ -z "$tag" ]; then
  # /releases/latest redirects to /releases/tag/<tag>
  latest_url="$(curl -fsSLI -o /dev/null -w '%{url_effective}' "https://github.com/$REPO/releases/latest")" ||
    fail "could not reach GitHub"
  tag="${latest_url##*/}"
  case "$tag" in
    v*) ;;
    *) fail "no published release found for $REPO" ;;
  esac
fi

name="qrit-$os-$arch"
base="https://github.com/$REPO/releases/download/$tag"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

echo "downloading qrit $tag ($os-$arch)"
curl -fsSL -o "$tmp/$name.tar.gz" "$base/$name.tar.gz" || fail "download failed: $base/$name.tar.gz"
curl -fsSL -o "$tmp/checksums.txt" "$base/checksums-${tag#v}.txt" || fail "checksum file download failed"

expected="$(awk -v f="$name.tar.gz" '$2 == f { print $1 }' "$tmp/checksums.txt")"
[ -n "$expected" ] || fail "no checksum listed for $name.tar.gz"

if command -v sha256sum >/dev/null 2>&1; then
  actual="$(sha256sum "$tmp/$name.tar.gz" | awk '{ print $1 }')"
else
  actual="$(shasum -a 256 "$tmp/$name.tar.gz" | awk '{ print $1 }')"
fi
[ "$expected" = "$actual" ] || fail "checksum mismatch (expected $expected, got $actual)"

tar -xzf "$tmp/$name.tar.gz" -C "$tmp"
mkdir -p "$INSTALL_DIR"
mv "$tmp/$name" "$INSTALL_DIR/qrit"
chmod +x "$INSTALL_DIR/qrit"

echo "installed $INSTALL_DIR/qrit"
case ":$PATH:" in
  *":$INSTALL_DIR:"*) ;;
  *) echo "note: $INSTALL_DIR is not on your PATH; add it to your shell profile" ;;
esac
