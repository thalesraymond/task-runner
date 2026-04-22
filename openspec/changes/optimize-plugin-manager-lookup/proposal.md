# Change: Optimize PluginManager duplicate lookup

## Why
The current implementation of `PluginManager.use` uses `Array.prototype.some` to check for duplicate plugin names. This is an O(n) operation, which can become a bottleneck when many plugins are registered. Switching to a `Set` for lookups reduces this to O(1).

## What Changes
- Introduced a `Set` in `PluginManager` to store registered plugin names.
- Updated `PluginManager.use` to use the `Set` for O(1) duplicate checks.

## Impact
- Affected code: `src/PluginManager.ts`
- Performance: Measurable improvement in plugin registration time for large numbers of plugins.
