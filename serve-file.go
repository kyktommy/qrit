package main

import (
	"errors"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

func ServeFile(filename string) {
	absPath, err := filepath.Abs(filename)
	if err != nil {
		log.Fatalf("resolve path: %v", err)
	}

	stat, err := os.Stat(absPath)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			log.Fatalf("file not found: %s", absPath)
		}
		log.Fatalf("stat file: %v", err)
	}
	if stat.IsDir() {
		log.Fatalf("directory not supported: %s", absPath)
	}

	outputName := strings.ReplaceAll(filepath.Base(absPath), " ", "-")

	ip, err := GetIP()
	if err != nil {
		log.Fatal(err)
	}

	addr := net.JoinHostPort(ip, GetRandomPort())

	mux := http.NewServeMux()
	mux.HandleFunc("/send/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Disposition", "attachment; filename="+outputName)
		http.ServeFile(w, r, absPath)
	})

	downloadURL := "http://" + addr + "/send/" + outputName
	fmt.Println(downloadURL)
	RenderString(downloadURL)
	fmt.Println("Press CTRL+C to exit once you get the file.")

	server := &http.Server{Addr: addr, Handler: mux}
	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatalf("serve: %v", err)
	}
}
