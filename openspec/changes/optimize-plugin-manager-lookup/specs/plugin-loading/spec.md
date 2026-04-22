## MODIFIED Requirements

### Requirement: Support registering plugins

The `TaskRunner` MUST allow registering plugins via a `use` method or configuration. Duplicate plugins (by name) MUST be rejected with O(1) time complexity.

#### Scenario: Registering a valid plugin
Given a `TaskRunner` instance
When I call `use` with a valid plugin object
Then the plugin is added to the internal plugin list

#### Scenario: Registering an invalid plugin
Given a `TaskRunner` instance
When I call `use` with an invalid object (missing install method)
Then it should throw an error or reject the plugin

#### Scenario: Registering a duplicate plugin
Given a `TaskRunner` instance with a registered plugin "test-plugin"
When I call `use` with another plugin named "test-plugin"
Then it should throw an error "Plugin with name 'test-plugin' is already registered."
