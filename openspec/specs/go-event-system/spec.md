## Purpose

This document specifies the event dispatching infrastructure for the Go task runner. It defines a central, asynchronous event dispatcher and strongly-typed listener interfaces that allow components to react to task lifecycle events without tight coupling.

## Requirements

### Requirement: Central Event Dispatcher
The system SHALL provide a central event dispatcher to broadcast lifecycle events asynchronously.

#### Scenario: Dispatching an event
- **WHEN** the runner emits a lifecycle event (e.g., TaskStart)
- **THEN** the dispatcher pushes the event to a buffered channel for asynchronous processing

### Requirement: Interface-Based Event Listeners
The system SHALL define strongly-typed interfaces for each lifecycle event type.

#### Scenario: Defining event listeners
- **WHEN** a new event type is needed
- **THEN** a specific interface (e.g., `TaskStartListener`) with a typed method is provided
