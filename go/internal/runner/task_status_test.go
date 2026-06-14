package runner_test

import (
	"testing"

	"github.com/thalesraymond/task-runner/go/internal/runner"
)

func TestTaskStatusConstants(t *testing.T) {
	t.Run("StatusSuccess is the zero value", func(t *testing.T) {
		var s runner.TaskStatus
		if s != runner.StatusSuccess {
			t.Errorf("expected zero value to be StatusSuccess, got %d", s)
		}
	})

	t.Run("all constants are distinct", func(t *testing.T) {
		statuses := []runner.TaskStatus{
			runner.StatusSuccess,
			runner.StatusFailure,
			runner.StatusSkipped,
			runner.StatusCancelled,
		}
		seen := make(map[runner.TaskStatus]bool)
		for _, s := range statuses {
			if seen[s] {
				t.Errorf("duplicate TaskStatus value: %d", s)
			}
			seen[s] = true
		}
	})
}

func TestTaskStatusString(t *testing.T) {
	tests := []struct {
		status   runner.TaskStatus
		expected string
	}{
		{runner.StatusSuccess, "success"},
		{runner.StatusFailure, "failure"},
		{runner.StatusSkipped, "skipped"},
		{runner.StatusCancelled, "cancelled"},
	}

	for _, tc := range tests {
		tc := tc
		t.Run(tc.expected, func(t *testing.T) {
			got := tc.status.String()
			if got != tc.expected {
				t.Errorf("TaskStatus(%d).String() = %q, want %q", tc.status, got, tc.expected)
			}
		})
	}
}

func TestTaskStatusString_UnknownValue(t *testing.T) {
	unknown := runner.TaskStatus(99)
	got := unknown.String()
	if got != "unknown" {
		t.Errorf("expected \"unknown\" for undefined status, got %q", got)
	}
}
