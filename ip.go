package main

import (
	"errors"
	"math/rand/v2"
	"net"
	"strconv"
)

func GetIP() (string, error) {
	ifaces, err := net.Interfaces()
	if err != nil {
		return "", err
	}
	for _, iface := range ifaces {
		if iface.Flags&net.FlagUp == 0 || iface.Flags&net.FlagLoopback != 0 {
			continue
		}
		addrs, err := iface.Addrs()
		if err != nil {
			return "", err
		}
		for _, addr := range addrs {
			ipNet, ok := addr.(*net.IPNet)
			if !ok {
				continue
			}
			ip := ipNet.IP.To4()
			if ip == nil || !ip.IsPrivate() {
				continue
			}
			return ip.String(), nil
		}
	}
	return "", errors.New("no private IPv4 address found on any interface")
}

func GetRandomPort() string {
	// Ephemeral range: 32768 - 61000
	return strconv.Itoa(rand.IntN(61001-32768) + 32768)
}
