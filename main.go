package main

import (
	"fmt"
	"net/http"
	"os"
	"path"
	"strings"
)

func main() {
	if len(os.Args) != 2 {
		panic("Usage: qr test.txt")
	}

	filename := os.Args[1]
	pwd, _ := os.Getwd()
	filepath := path.Join(pwd, filename)
	stat, err := os.Stat(filepath)
	if os.IsNotExist(err) {
		panic("file not exit")
	}
	if stat.IsDir() {
		panic("directory not support")
	}

	outputName := path.Base(filepath)
	outputName = strings.ReplaceAll(outputName, " ", "-")

	ip, err := GetIp()
	if err != nil {
		panic(err)
	}

	addr := ip + ":8282"
	server := &http.Server{Addr: addr}
	http.HandleFunc("/send/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Disposition", "attachment; filename="+outputName)
		http.ServeFile(w, r, filepath)
	})

	downloadURL := "http://" + addr + "/send/" + outputName
	fmt.Println(downloadURL)
	RenderString(downloadURL)

	server.ListenAndServe()
}
