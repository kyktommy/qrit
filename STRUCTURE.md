# Structure

Flat layout — all source in repo root, single `package main`.

```
qrit/
├── main.go          entry point, arg routing
├── ip.go            LAN IP discovery + random ephemeral port
├── qr.go            terminal QR rendering (qrterminal/v3 wrapper)
├── serve-file.go    file mode: HTTP server + QR of download URL
├── serve-http.go    URL mode: QR of a given http(s):// URL
├── test.txt         fixture for manual testing
├── go.mod / go.sum
├── CLAUDE.md        instructions for Claude
├── STRUCTURE.md     this file
└── README.md        user-facing docs
```

## File responsibilities

### `main.go`
- Parses `os.Args`, expects exactly one argument.
- Routes to `ServeURL` (starts with `http://`/`https://`) or `ServeFile`.
- Prints usage + `os.Exit(2)` on misuse.

### `ip.go`
- `GetIP() (string, error)` — first up, non-loopback interface with an RFC1918 IPv4 (via `ip.IsPrivate()`). Returns an error if none found.
- `GetRandomPort() string` — ephemeral range `[32768, 61000]` using `math/rand/v2`.

### `qr.go`
- `RenderString(s string)` — writes a half-block ANSI QR to stdout.
- On Windows: falls back to full-block via `go-colorable`.
- Color codes use `\x1b[...m` sequences. The v3 `qrterminal.Config` owns layout; we override the four character slots.

### `serve-file.go`
- `ServeFile(filename string)`:
  1. Resolves absolute path, stats it, rejects missing / directory.
  2. Computes safe `outputName` (spaces → dashes).
  3. Gets LAN IP + random port, builds `addr` with `net.JoinHostPort`.
  4. Registers `/send/` on a local `http.ServeMux` that serves the file with `Content-Disposition: attachment`.
  5. Prints download URL, renders QR, starts server (blocking).
- Fatal errors go through `log.Fatal*`.

### `serve-http.go`
- `ServeURL(url string)` — prints the URL and renders its QR. That's it.

## Call graph

```
main
├── ServeURL  ──────────────→ RenderString
└── ServeFile ──┬→ GetIP
                ├→ GetRandomPort
                ├→ RenderString
                └→ http.Server.ListenAndServe
```

## Dependencies

- `github.com/mdp/qrterminal/v3` — QR rendering.
- `github.com/mattn/go-colorable` — Windows ANSI fallback.
- Transitive: `rsc.io/qr`, `golang.org/x/sys`, `golang.org/x/term`, `github.com/mattn/go-isatty`.
