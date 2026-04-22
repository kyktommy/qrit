package main

import (
	"errors"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

type sharedFile struct {
	Name  string // sanitized, used in URL
	Path  string // absolute path on disk
	Size  int64
	SizeH string
}

func ServeShare(args []string) error {
	files, err := resolveShares(args)
	if err != nil {
		return err
	}

	ip, err := GetIP()
	if err != nil {
		log.Fatal(err)
	}
	addr := net.JoinHostPort(ip, GetRandomPort())

	byName := make(map[string]sharedFile, len(files))
	for _, f := range files {
		byName[f.Name] = f
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			http.NotFound(w, r)
			return
		}
		renderIndex(w, files)
	})
	mux.HandleFunc("/send/", func(w http.ResponseWriter, r *http.Request) {
		name := strings.TrimPrefix(r.URL.Path, "/send/")
		f, ok := byName[name]
		if !ok {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Disposition", "attachment; filename="+f.Name)
		http.ServeFile(w, r, f.Path)
	})
	mux.HandleFunc("/upload", handleUpload)

	pageURL := "http://" + addr + "/"
	fmt.Println(pageURL)
	RenderString(pageURL)
	if len(files) > 0 {
		fmt.Printf("Sharing %d file(s). ", len(files))
	}
	fmt.Println("Uploads land in ~/Downloads. Press CTRL+C to exit.")

	server := &http.Server{Addr: addr, Handler: mux}
	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatalf("serve: %v", err)
	}
	return nil
}

func resolveShares(args []string) ([]sharedFile, error) {
	out := make([]sharedFile, 0, len(args))
	for _, a := range args {
		abs, err := filepath.Abs(a)
		if err != nil {
			return nil, fmt.Errorf("resolve %q: %w", a, err)
		}
		stat, err := os.Stat(abs)
		if err != nil {
			if errors.Is(err, os.ErrNotExist) {
				return nil, fmt.Errorf("file not found: %s", abs)
			}
			return nil, fmt.Errorf("stat %q: %w", a, err)
		}
		if stat.IsDir() {
			return nil, fmt.Errorf("directory not supported: %s", abs)
		}
		out = append(out, sharedFile{
			Name:  strings.ReplaceAll(filepath.Base(abs), " ", "-"),
			Path:  abs,
			Size:  stat.Size(),
			SizeH: humanSize(stat.Size()),
		})
	}
	return out, nil
}

func handleUpload(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if err := r.ParseMultipartForm(32 << 20); err != nil {
		http.Error(w, "bad form: "+err.Error(), http.StatusBadRequest)
		return
	}
	if r.MultipartForm == nil || len(r.MultipartForm.File["files"]) == 0 {
		http.Error(w, "no files", http.StatusBadRequest)
		return
	}

	var saved []string
	for _, fh := range r.MultipartForm.File["files"] {
		dst, err := saveUpload(fh)
		if err != nil {
			fmt.Printf("  save failed for %s: %v\n", fh.Filename, err)
			http.Error(w, "save: "+err.Error(), http.StatusInternalServerError)
			return
		}
		saved = append(saved, dst)
		fmt.Printf("  received %s (%s) from %s\n", dst, humanSize(fh.Size), r.RemoteAddr)
	}

	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	fmt.Fprintf(w, "received: %s\n", strings.Join(saved, ", "))
}

func saveUpload(fh *multipart.FileHeader) (string, error) {
	src, err := fh.Open()
	if err != nil {
		return "", err
	}
	defer src.Close()

	dir, err := downloadsDir()
	if err != nil {
		return "", err
	}
	dst := uniquePath(filepath.Join(dir, sanitizeFilename(fh.Filename)))

	out, err := os.OpenFile(dst, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o644)
	if err != nil {
		return "", err
	}
	defer out.Close()
	if _, err := io.Copy(out, src); err != nil {
		return "", err
	}
	return dst, nil
}

func downloadsDir() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	dir := filepath.Join(home, "Downloads")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return "", err
	}
	return dir, nil
}

func sanitizeFilename(name string) string {
	base := filepath.Base(name)
	if base == "." || base == "/" || base == "" {
		return "upload"
	}
	return base
}

func uniquePath(p string) string {
	if _, err := os.Stat(p); errors.Is(err, os.ErrNotExist) {
		return p
	}
	dir := filepath.Dir(p)
	ext := filepath.Ext(p)
	stem := strings.TrimSuffix(filepath.Base(p), ext)
	for i := 1; ; i++ {
		candidate := filepath.Join(dir, fmt.Sprintf("%s (%d)%s", stem, i, ext))
		if _, err := os.Stat(candidate); errors.Is(err, os.ErrNotExist) {
			return candidate
		}
	}
}

func humanSize(n int64) string {
	const unit = 1024
	if n < unit {
		return fmt.Sprintf("%d B", n)
	}
	div, exp := int64(unit), 0
	for x := n / unit; x >= unit; x /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %cB", float64(n)/float64(div), "KMGTPE"[exp])
}
