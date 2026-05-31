package main

import (
	"fmt"
	"os"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	pw := "password123"
	if len(os.Args) > 1 {
		pw = os.Args[1]
	}
	h, err := bcrypt.GenerateFromPassword([]byte(pw), 12)
	if err != nil {
		panic(err)
	}
	fmt.Println(string(h))
}
