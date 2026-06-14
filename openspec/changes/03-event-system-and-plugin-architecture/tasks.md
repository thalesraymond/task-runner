## 1. Core Event Interfaces

- [ ] 1.1 Define core event structs (e.g., `TaskStartEvent`, `TaskEndEvent`) in a dedicated package (e.g., `events` or within `runner`).
- [ ] 1.2 Define specific listener interfaces for each event type (e.g., `TaskStartListener`).

## 2. Event Dispatcher

- [ ] 2.1 Implement `EventDispatcher` struct with a buffered channel for async event delivery.
- [ ] 2.2 Add plugin registration logic to `EventDispatcher` using type assertions on listener interfaces.
- [ ] 2.3 Implement the background dispatcher goroutine that reads from the channel and calls the appropriate plugin methods safely.
- [ ] 2.4 Add shutdown and cleanup logic for the `EventDispatcher` (e.g., closing the channel and waiting for the dispatcher goroutine to finish).

## 3. Runner Integration

- [ ] 3.1 Update the main `Runner` to initialize an `EventDispatcher` at startup.
- [ ] 3.2 Update `Runner` to accept a list of plugins (structs) and register them with the dispatcher.
- [ ] 3.3 Replace any existing hardcoded telemetry or hooks in the Go runner with event emissions to the dispatcher.
