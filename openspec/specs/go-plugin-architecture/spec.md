## Purpose

This document specifies the plugin architecture for the Go task runner. It defines how external plugins are registered with the event dispatcher and how events are selectively delivered to plugins based on the listener interfaces they implement.

## Requirements

### Requirement: Plugin Registration
The system SHALL allow plugins to be registered with the central event dispatcher.

#### Scenario: Registering a plugin
- **WHEN** a plugin struct is passed to the dispatcher registration function
- **THEN** the dispatcher evaluates which listener interfaces the plugin implements and registers it for those specific events

### Requirement: Event Delivery to Plugins
The system SHALL deliver events only to plugins that have implemented the corresponding listener interface.

#### Scenario: Delivering TaskStart event
- **WHEN** a TaskStart event is broadcast
- **THEN** only plugins implementing `TaskStartListener` have their `OnTaskStart` method called with the event payload
