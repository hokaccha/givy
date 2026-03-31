package main

import "testing"

func TestAdd(t *testing.T) {
	got := add(2, 3)
	if got != 5 {
		t.Errorf("add(2, 3) = %d, want 5", got)
	}
}
