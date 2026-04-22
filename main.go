package main

import (
	"fmt"
	"os"
	"strings"
)

func main() {
	args := os.Args[1:]

	if len(args) == 1 && isURL(args[0]) {
		ServeURL(args[0])
		return
	}

	if err := ServeShare(args); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(2)
	}
}

func isURL(s string) bool {
	return strings.HasPrefix(s, "http://") || strings.HasPrefix(s, "https://")
}
