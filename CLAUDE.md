# qrit

Small Go CLI that prints a terminal QR code for a URL, or starts a 2-way LAN share: a phone scans the QR, opens a web page, and can download any of the shared files or upload new ones. Uploads are auto-accepted and saved to `~/Downloads` (created if missing); name collisions get ` (1)`, ` (2)`, ... suffixes.

## Commands

```bash
go build -o qrit ./...              # build
go vet ./...                         # lint
go run . <file...|url>               # run from source
./qrit https://example.com           # QR for a URL (print-only, no server)
./qrit test.txt                      # share a single file (also accepts uploads)
./qrit a.pdf b.jpg c.zip             # share multiple files
./qrit                               # upload-only (no files shared for download)
```

Module: `github.com/kyktommy/qrit`. Binary: `qrit`. Go 1.24.

## Conventions

- Keep it a single `package main`. No subpackages unless the file count genuinely justifies it.
- Errors that abort the CLI use `log.Fatal*` (not `panic`) so output is clean.
- User-input errors go to stderr with `os.Exit(2)`; runtime failures use `log.Fatal` (exit 1).

## Gotchas

- **ANSI escapes**: Go strings need `\x1b` (or ``/`\033`) — NOT `\e`. The QR rendering in `qr.go` depends on this; a bare `[37m...` literal will not render colors.
- **LAN IP detection** (`ip.go`): uses `ip.IsPrivate()` so all RFC1918 ranges work (`10/8`, `172.16/12`, `192.168/16`). Don't narrow it back to a `strings.HasPrefix("192.168")` check — that broke file mode on other networks.
- **qrterminal v3**: `Config` struct fields used here (`HalfBlocks`, `Level`, `Writer`, `BlackChar`, `BlackWhiteChar`, `WhiteChar`, `WhiteBlackChar`) are stable across v3.x. If bumping past v3.2.1, re-check `qr.go` compiles.
- **`math/rand/v2`**: no `Seed` needed (auto-seeded). Use `rand.IntN`, not `rand.Intn`.
- **HTTP server**: uses a local `http.ServeMux`, not the default global mux — do not switch to `http.HandleFunc` (the top-level one registers on the default mux and leaks state across test runs).
- **Share endpoints**: `GET /` renders the page, `GET /send/<name>` streams a shared file (lookup is by map key, so path-traversal attempts 404), `POST /upload` accepts multipart form field `files` (repeatable) and auto-accepts everything — no CLI prompt.
- **Upload landing spot**: `downloadsDir()` = `$HOME/Downloads` (created if missing). `uniquePath` deduplicates — existing names get ` (1)`, ` (2)`, etc. Filenames are passed through `filepath.Base` to strip client-supplied path components.
- **Double-slash gotcha in tests**: if `$URL` already ends with `/`, don't concatenate `$URL/upload` — Go's mux normalises `//upload` to `/upload` with a 307 redirect that curl won't follow without `-L`. Browsers submitting the real form don't hit this.

## Testing by hand

URL mode prints only:

```bash
./qrit https://example.com
```

Share mode end-to-end (needs a TTY for the prompt, or a fifo on stdin):

```bash
./qrit test.txt            # scan the QR, tap the file link, tap Upload
```

Automated smoke test uses a named pipe for stdin so `echo y > fifo` answers prompts. See the commit adding the 2-way share for the exact script.
