# qrit

Small Go CLI that prints a terminal QR code for a URL, or serves a local file over LAN HTTP and prints a QR for the download URL.

## Commands

```bash
go build -o qrit ./...        # build
go vet ./...                   # lint
go run . <file|url>            # run from source
./qrit test.txt                # serve a file
./qrit https://example.com     # QR for a URL
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

## Testing by hand

File mode end-to-end:

```bash
./qrit test.txt &
PID=$!
sleep 1
URL=$(ps ... | ...)   # or read from the program's stdout
curl -sS -D - "$URL/send/test.txt"
kill $PID
```

See git log entry around the v3 upgrade for the exact smoke-test commands used.
