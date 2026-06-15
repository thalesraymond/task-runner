## 1. Core Event Interfaces

- [x] 1.1 Define core event structs (e.g., `TaskStartEvent`, `TaskEndEvent`) in a dedicated package (e.g., `events` or within `runner`).
- [x] 1.2 Define specific listener interfaces for each event type (e.g., `TaskStartListener`).

## 2. Event Dispatcher

- [x] 2.1 Implement `EventDispatcher` struct with a buffered channel for async event delivery.
- [x] 2.2 Add plugin registration logic to `EventDispatcher` using type assertions on listener interfaces.
- [x] 2.3 Implement the background dispatcher goroutine that reads from the channel and calls the appropriate plugin methods safely.
- [x] 2.4 Add shutdown and cleanup logic for the `EventDispatcher` (e.g., closing the channel and waiting for the dispatcher goroutine to finish).

## 3. Runner Integration

- [x] 3.1 Update the main `Runner` to initialize an `EventDispatcher` at startup.
- [x] 3.2 Update `Runner` to accept a list of plugins (structs) and register them with the dispatcher.
- [x] 3.3 Replace any existing hardcoded telemetry or hooks in the Go runner with event emissions to the dispatcher.
