# qrit

Bun + Ink CLI that prints a terminal QR code for a URL, or starts a 2-way LAN share: a phone scans the QR, opens a web page, downloads any shared file/folder (folders and the "Download all" button stream as zip), or uploads new ones. Uploads auto-save to `~/Downloads`; name collisions get ` (1)`, ` (2)`, ... suffixes.

## Commands

```sh
bun install                          # deps
bun run dev -- test.txt              # run from source
bun run typecheck                    # tsc --noEmit
bun run lint                         # biome
bun run compile                      # standalone binaries in dist/
bun link                             # expose `qrit` on PATH locally
```

Runtime: Bun ≥ 1.1. Entry: `src/cli.tsx`. Published binary name: `qrit`.

## Layout

- `src/cli.tsx` — arg parsing + Ink `render`.
- `src/components/` — Ink views (`UrlView`, `ShareView`, `QRCode`).
- `src/server/index.ts` — `ShareServer` (Bun.serve); emits `upload` / `error` events.
- `src/server/page.ts` — HTML template served at `/`. Folders render with a folder icon linking to `/zip/<name>`; a "Download all as zip" row appears when there are ≥ 2 entries or any folder is shared.
- `src/server/zip.ts` — streams an `archiver` zip directly to the response body (no temp file).
- `src/lib/network.ts` — LAN IPv4 detection + random ephemeral port (32768–61000).
- `src/lib/files.ts` — resolve shares, human size.
- `src/lib/downloads.ts` — `~/Downloads` dir, sanitize + uniquePath, `isURL`.
- `src/lib/qr.ts` — ANSI half-block QR renderer (upper-half `▀`).

## Conventions

- Single package, flat `src/` layout. No deep subpackages unless file count genuinely justifies one.
- User-input errors go to stderr with `process.exit(2)`; runtime failures exit 1.
- The server is an `EventEmitter`; `ShareView` subscribes to `upload` for the live feed. Keep it that way — don't bypass the emitter.

## Gotchas

- **ANSI escapes**: JS/TS strings use `\x1b` for ESC. Don't switch to literal `\e` — it isn't a JS escape.
- **Half-block QR (`src/lib/qr.ts`)**: ▀ (upper half) renders the top pixel with FG and the bottom pixel with BG. Keep polarity: top-black → `FG_BLACK`, bottom-black → `BG_BLACK`. Swapping renders an inverted QR that scanners reject.
- **LAN IP detection (`src/lib/network.ts`)**: checks all RFC1918 ranges (`10/8`, `172.16/12`, `192.168/16`) via an inline `isPrivateIPv4`. Don't narrow it to a `startsWith("192.168")` check — that broke file mode on other networks in the Go predecessor.
- **`Bun.serve` per instance**: `ShareServer` creates its own `Bun.serve` with an explicit `fetch` handler. Each instance is isolated — don't reach for a shared global.
- **Share endpoints**: `GET /` renders the page, `GET /send/<name>` streams a shared **file** (404 for dirs or unknown names — lookup is by `Map` key so path-traversal attempts 404), `GET /zip/<name>` streams a zip of a single entry (file or dir), `GET /zip` streams a zip of everything as `qrit-bundle.zip`, `POST /upload` accepts multipart form field `files` (repeatable) and auto-accepts everything.
- **Zips are streamed, not buffered**: `archiver` is piped directly into the response body via `Readable.toWeb`. No temp file is ever written, so there's nothing to unlink. If the client cancels, cancelling the web stream destroys the archiver.
- **Upload landing spot**: `downloadsDir()` = `$HOME/Downloads` (created if missing). `uniquePath()` deduplicates — existing names become ` (1)`, ` (2)`, etc. Filenames are passed through `sanitizeFilename()` (`path.basename`) to strip client-supplied path components.
- **File writes use `flags: 'wx'`** — exclusive create — so we never overwrite a pre-existing file even if `uniquePath` races.
- **qrcode library**: `QRCode.create(text, { errorCorrectionLevel: 'L' })` returns `{ modules: { size, data: Uint8ClampedArray } }`. If bumping past `qrcode@^1.5`, re-verify the field names.

## Testing by hand

URL mode prints QR only:

```sh
bun run dev -- https://example.com
```

Share mode end-to-end:

```sh
bun run dev -- test.txt
# scan the QR, tap the file to download, or pick files to upload
```

Quit the TUI with `q` or `Ctrl+C`.

## Release / Homebrew

Tag `vX.Y.Z` → `.github/workflows/release.yml` builds standalone Bun-compiled binaries for `darwin/linux × arm64/x64`, uploads them + a SHA-256 checksum file to the GitHub release, and (if `HOMEBREW_TAP_REPO` var + `HOMEBREW_TAP_TOKEN` secret are set) regenerates `Formula/qrit.rb` in the tap repo.

`Formula/qrit.rb.template` is kept in-repo for reference / manual taps.
