package main

import (
	"fmt"
	"net/http"
	"os"
	"path"
	"strings"
)

func ServeFile(filename string) {
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

	addr := ip + ":" + GetRandomPort()
	server := &http.Server{Addr: addr}
	http.HandleFunc("/send/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Disposition", "attachment; filename="+outputName)
		http.ServeFile(w, r, filepath)
	})

	downloadURL := "http://" + addr + "/send/" + outputName
	fmt.Println(downloadURL)
	RenderString(downloadURL)
	fmt.Println("Press CTRL+C to exit once you get the file.")

	server.ListenAndServe()
}
