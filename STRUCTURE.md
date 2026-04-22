# Structure

Flat layout — all source in repo root, single `package main`.

```
qrit/
├── main.go          entry point, arg routing
├── ip.go            LAN IP discovery + random ephemeral port
├── qr.go            terminal QR rendering (qrterminal/v3 wrapper)
├── serve-share.go   2-way share: HTTP server, download routes, upload handler + CLI prompt
├── page.go          HTML template rendered at `/`
├── serve-http.go    URL mode: QR of a given http(s):// URL
├── test.txt         fixture for manual testing
├── go.mod / go.sum
├── CLAUDE.md        instructions for Claude
├── STRUCTURE.md     this file
└── README.md        user-facing docs
```

## File responsibilities

### `main.go`
- Parses `os.Args`. One arg that starts with `http://` / `https://` → `ServeURL`.
- Everything else (zero or more filenames) → `ServeShare`.
- User-input errors go to stderr with `os.Exit(2)`.

### `ip.go`
- `GetIP() (string, error)` — first up, non-loopback interface with an RFC1918 IPv4 (via `ip.IsPrivate()`). Returns an error if none found.
- `GetRandomPort() string` — ephemeral range `[32768, 61000]` using `math/rand/v2`.

### `qr.go`
- `RenderString(s string)` — writes a half-block ANSI QR to stdout.
- On Windows: falls back to full-block via `go-colorable`.

### `serve-share.go`
- `ServeShare(args []string) error` — validates files, starts HTTP server on `LAN-IP:rand-port`, prints QR for `http://host:port/`.
- Routes:
  - `GET /` → `renderIndex` (in `page.go`).
  - `GET /send/<name>` → streams one of the shared files with `Content-Disposition: attachment`. Lookup is via `map[string]sharedFile`, so unknown names 404 and path traversal is not possible.
  - `POST /upload` → parses multipart field `files`, auto-saves each to `downloadsDir()` (= `$HOME/Downloads`, created on demand) via `uniquePath` with mode `0o644`. Returns a plain-text `received:` summary.
- Fatal setup errors use `log.Fatal*`; arg errors return from `ServeShare` so `main` can exit 2.

### `page.go`
- `indexHTML` — single inline `html/template` with download list + multi-file upload form. Minimal JS submits the form via `fetch` and prints the CLI's response in a status line.
- `renderIndex(w, files)` — executes the template.

### `serve-http.go`
- `ServeURL(url string)` — prints the URL and renders its QR. No server.

## Call graph

```
main
├── ServeURL  ──────────────→ RenderString
└── ServeShare ─┬→ resolveShares
                ├→ GetIP
                ├→ GetRandomPort
                ├→ RenderString
                └→ http.Server.ListenAndServe
                    ├→ renderIndex            (GET /)
                    ├→ http.ServeFile         (GET /send/<name>)
                    └→ handleUpload           (POST /upload)
                        └→ saveUpload         (downloadsDir + uniquePath + io.Copy)
```

## Dependencies

- `github.com/mdp/qrterminal/v3` — QR rendering.
- `github.com/mattn/go-colorable` — Windows ANSI fallback.
- Transitive: `rsc.io/qr`, `golang.org/x/sys`, `golang.org/x/term`, `github.com/mattn/go-isatty`.
