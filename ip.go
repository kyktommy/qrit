package main

import (
	"math/rand"
	"net"
	"strconv"
	"strings"
	"time"
)

func GetIp() (string, error) {
	ifaces, err := net.Interfaces()
	if err != nil {
		return "", err
	}
	// handle err
	for _, i := range ifaces {
		addrs, err := i.Addrs()
		if err != nil {
			return "", err
		}
		// handle err
		for _, addr := range addrs {
			var ip net.IP
			switch v := addr.(type) {
			case *net.IPNet:
				ip = v.IP
			case *net.IPAddr:
				ip = v.IP
			}
			// process IP address
			if strings.HasPrefix(ip.String(), "192.168") {
				return ip.String(), nil
			}
		}
	}
	return "", nil
}

func GetRandomPort() string {
	// 61000 - 32768
	rand.Seed(time.Now().UnixNano())
	return strconv.Itoa(rand.Intn(61001-32768) + 32768)
}
