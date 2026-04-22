package main

import (
	"fmt"
	"os"
	"strings"
)

func main() {
	if len(os.Args) != 2 {
		fmt.Fprintln(os.Stderr, "Usage: qrit <file|url>")
		os.Exit(2)
	}

	arg := os.Args[1]

	if strings.HasPrefix(arg, "http://") || strings.HasPrefix(arg, "https://") {
		ServeURL(arg)
	} else {
		ServeFile(arg)
	}
}
