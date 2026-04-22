package main

import (
	"os"
	"runtime"

	"github.com/mattn/go-colorable"
	"github.com/mdp/qrterminal/v3"
)

func RenderString(s string) {
	qrConfig := qrterminal.Config{
		HalfBlocks:     true,
		Level:          qrterminal.L,
		Writer:         os.Stdout,
		BlackWhiteChar: "\x1b[37m\x1b[40m▄\x1b[0m",
		BlackChar:      "\x1b[30m\x1b[40m█\x1b[0m",
		WhiteBlackChar: "\x1b[30m\x1b[47m▅\x1b[0m",
		WhiteChar:      "\x1b[37m\x1b[47m█\x1b[0m",
	}
	if runtime.GOOS == "windows" {
		qrConfig.HalfBlocks = false
		qrConfig.Writer = colorable.NewColorableStdout()
		qrConfig.BlackChar = qrterminal.BLACK
		qrConfig.WhiteChar = qrterminal.WHITE
	}

	qrterminal.GenerateWithConfig(s, qrConfig)
}
