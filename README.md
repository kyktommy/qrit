# QR IT

A tiny CLI that turns a QR code into a two-way file drop on your LAN. Scan with a phone, pick files to download, or send files back — uploads land straight in `~/Downloads`.

### Install

```sh
go install github.com/kyktommy/qrit@latest
```

### Usage

```sh
qrit https://example.com        # print-only QR for a URL
qrit report.pdf                 # share one file, also accept uploads
qrit a.pdf photo.jpg notes.txt  # share multiple files
qrit                            # upload-only drop (no downloads offered)
```

Scan the QR with any phone, hit the web page, tap a filename to download or use the Upload form to push files back. Uploads are saved automatically to `~/Downloads` (collisions become `name (1).ext`, `name (2).ext`, ...).

Press `Ctrl+C` to stop the server.

### Reference

Inspired by https://github.com/claudiodangelis/qrcp.
