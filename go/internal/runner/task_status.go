package runner

// TaskStatus represents the discrete outcome of a task's execution.
// Using a named integer type allows exhaustive switch checks and a human-readable String method.
type TaskStatus int

const (
	// StatusSuccess indicates the task completed without errors.
	StatusSuccess TaskStatus = iota
	// StatusFailure indicates the task encountered an error during execution.
	StatusFailure
	// StatusSkipped indicates the task was skipped (e.g., its condition evaluated to false).
	StatusSkipped
	// StatusCancelled indicates the task was aborted via context cancellation.
	StatusCancelled
)

// String returns the canonical lower-case name of the TaskStatus.
// It satisfies the fmt.Stringer interface for convenient logging and serialisation.
func (s TaskStatus) String() string {
	switch s {
	case StatusSuccess:
		return "success"
	case StatusFailure:
		return "failure"
	case StatusSkipped:
		return "skipped"
	case StatusCancelled:
		return "cancelled"
	default:
		return "unknown"
	}
}
