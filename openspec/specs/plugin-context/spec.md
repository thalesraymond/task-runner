# plugin-context Specification

## Purpose
TBD - created by archiving change implement-plugin-system. Update Purpose after archive.
## Requirements
### Requirement: Expose EventBus to plugins

The `PluginContext` passed to `install` MUST expose the `EventBus` (or equivalent API) to allow listening to events.

#### Scenario: Listening to task events
Given a plugin is being installed
When it accesses `context.events`
Then it can subscribe to `taskStart` and `taskEnd` events

#### Scenario: Emitting custom events (Future)
Given a plugin
When it has access to the event bus
Then it should be able to emit events (if allowed by design)

