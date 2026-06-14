package runner

import (
	"fmt"
	"strings"
)

// CycleError represents a circular dependency error.
type CycleError struct {
	CyclePath []string
}

func (e *CycleError) Error() string {
	return fmt.Sprintf("cycle detected: %s", strings.Join(e.CyclePath, " -> "))
}

// MissingDependencyError represents an error where a task depends on a non-existent task.
type MissingDependencyError struct {
	TaskID              string
	MissingDependencyID string
}

func (e *MissingDependencyError) Error() string {
	return fmt.Sprintf("task '%s' depends on missing task '%s'", e.TaskID, e.MissingDependencyID)
}

// DuplicateTaskError represents an error where multiple tasks have the same ID.
type DuplicateTaskError struct {
	TaskID string
}

func (e *DuplicateTaskError) Error() string {
	return fmt.Sprintf("duplicate task detected with ID: %s", e.TaskID)
}

// ValidationErrors is a collection of validation errors.
// It implements the error interface and the Unwrap() []error method
// so that errors.Is and errors.As can inspect the individual errors.
type ValidationErrors []error

func (v ValidationErrors) Error() string {
	if len(v) == 0 {
		return "no validation errors"
	}
	var msgs []string
	for _, err := range v {
		msgs = append(msgs, err.Error())
	}
	return "task graph validation failed: " + strings.Join(msgs, "; ")
}

func (v ValidationErrors) Unwrap() []error {
	return v
}
