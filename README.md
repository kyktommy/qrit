# QR IT

A tiny Bun + Ink CLI that turns a QR code into a two-way file drop on your LAN. Scan with a phone, pick files to download, or send files back — uploads land straight in `~/Downloads`.

### Install

**Homebrew (recommended):**

```sh
brew install kyktommy/tap/qrit
```

**From source (requires [Bun](https://bun.sh) ≥ 1.1):**

```sh
bun install
bun link
```

### Usage

```sh
qrit https://example.com        # print-only QR for a URL
qrit report.pdf                 # share one file, also accept uploads
qrit a.pdf photo.jpg notes.txt  # share multiple files
qrit ./photos/                  # share a folder (downloads as a zip)
qrit ./photos/ notes.md         # mix files and folders
qrit                            # upload-only drop (no downloads offered)
qrit --port 8080 report.pdf     # pin a specific port
```

Scan the QR with any phone, hit the web page, tap a filename to download, tap a folder to download it as a zip, or tap "Download all as zip" to grab everything in one archive. Zips are streamed on the fly (no temp files). Use the Upload form to push files back — they're saved automatically to `~/Downloads` (collisions become `name (1).ext`, `name (2).ext`, ...).

The CLI keeps a live TUI showing shared files and incoming uploads. Press `q` or `Ctrl+C` to stop.

### Develop

```sh
bun install
bun run dev -- README.md        # run from source
bun run typecheck               # tsc --noEmit
bun run compile                 # build standalone binaries into dist/
```

### Releases

Tagging a commit with `vX.Y.Z` triggers `.github/workflows/release.yml`, which:

1. Compiles standalone binaries for `darwin-arm64`, `darwin-x64`, `linux-arm64`, `linux-x64` with `bun build --compile`.
2. Uploads the tarballs and a checksum file to the GitHub release.
3. (Optional) Regenerates the Homebrew formula in the tap repo — set `HOMEBREW_TAP_REPO` (variable) and `HOMEBREW_TAP_TOKEN` (secret) to enable this step.

### Reference

Inspired by <https://github.com/claudiodangelis/qrcp>.
