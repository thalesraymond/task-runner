package runner

import (
	"testing"
)

func TestNewRunner(t *testing.T) {
	r := New(5)
	if r == nil {
		t.Fatal("expected non-nil Runner")
	}
	if r.concurrency != 5 {
		t.Errorf("expected concurrency 5, got %d", r.concurrency)
	}
}
