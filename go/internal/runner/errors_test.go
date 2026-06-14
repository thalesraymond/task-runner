package runner

import (
	"errors"
	"testing"
)

func TestValidationErrors(t *testing.T) {
	t.Run("CycleError", func(t *testing.T) {
		err := error(&CycleError{CyclePath: []string{"A", "B", "A"}})
		var cycleErr *CycleError
		if !errors.As(err, &cycleErr) {
			t.Errorf("expected error to be of type *CycleError")
		}
		expectedMsg := "cycle detected: A -> B -> A"
		if err.Error() != expectedMsg {
			t.Errorf("expected %q, got %q", expectedMsg, err.Error())
		}
	})

	t.Run("MissingDependencyError", func(t *testing.T) {
		err := error(&MissingDependencyError{TaskID: "A", MissingDependencyID: "B"})
		var missingErr *MissingDependencyError
		if !errors.As(err, &missingErr) {
			t.Errorf("expected error to be of type *MissingDependencyError")
		}
		expectedMsg := "task 'A' depends on missing task 'B'"
		if err.Error() != expectedMsg {
			t.Errorf("expected %q, got %q", expectedMsg, err.Error())
		}
	})

	t.Run("DuplicateTaskError", func(t *testing.T) {
		err := error(&DuplicateTaskError{TaskID: "A"})
		var dupErr *DuplicateTaskError
		if !errors.As(err, &dupErr) {
			t.Errorf("expected error to be of type *DuplicateTaskError")
		}
		expectedMsg := "duplicate task detected with ID: A"
		if err.Error() != expectedMsg {
			t.Errorf("expected %q, got %q", expectedMsg, err.Error())
		}
	})

	t.Run("ValidationErrors_Unwrap", func(t *testing.T) {
		cycleErr := &CycleError{CyclePath: []string{"A", "A"}}
		missingErr := &MissingDependencyError{TaskID: "C", MissingDependencyID: "D"}

		errs := ValidationErrors{cycleErr, missingErr}
		var err error = errs

		var outCycle *CycleError
		if !errors.As(err, &outCycle) {
			t.Errorf("expected errors.As to find *CycleError inside ValidationErrors")
		} else if outCycle.CyclePath[0] != "A" {
			t.Errorf("extracted CycleError has wrong data")
		}

		var outMissing *MissingDependencyError
		if !errors.As(err, &outMissing) {
			t.Errorf("expected errors.As to find *MissingDependencyError inside ValidationErrors")
		}

		expectedMsg := "task graph validation failed: cycle detected: A -> A; task 'C' depends on missing task 'D'"
		if err.Error() != expectedMsg {
			t.Errorf("expected %q, got %q", expectedMsg, err.Error())
		}
	})

	t.Run("ValidationErrors_Empty", func(t *testing.T) {
		var errs ValidationErrors
		expectedMsg := "no validation errors"
		if errs.Error() != expectedMsg {
			t.Errorf("expected %q, got %q", expectedMsg, errs.Error())
		}
	})
}
