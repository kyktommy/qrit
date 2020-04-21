package main

import (
	"os"
	"strings"
)

func main() {
	if len(os.Args) != 2 {
		panic("Usage: qr test.txt")
	}

	filename := os.Args[1]

	if strings.HasPrefix(filename, "http") {
		ServeURL(filename)
	} else {
		ServeFile(filename)
	}
}
