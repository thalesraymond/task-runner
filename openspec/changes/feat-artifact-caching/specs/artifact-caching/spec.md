## ADDED Requirements

### Requirement: Task Output Caching

The system SHALL support caching task outputs (artifacts) based on input hashes to avoid redundant execution.

#### Scenario: Cache Miss (First Run)
- **GIVEN** a task with `cache` configuration for inputs and outputs
- **AND** no cache entry exists for the current input hash
- **WHEN** the task is executed
- **THEN** the task logic runs
- **AND** the specified output files/directories are archived and stored in the cache.

#### Scenario: Cache Hit (Subsequent Run)
- **GIVEN** a task with `cache` configuration
- **AND** a valid cache entry exists for the current input hash
- **WHEN** the task is executed
- **THEN** the task logic DOES NOT run
- **AND** the outputs are restored from the cache to their original locations
- **AND** the returned `TaskResult` has status `cached` (or `skipped` with reason).

### Requirement: Input Hashing

The system SHALL compute a deterministic hash of all specified inputs.

#### Scenario: File Content Hashing
- **GIVEN** a task configuration specifying input files
- **WHEN** the input hash is computed
- **THEN** it includes the SHA-256 hash of the content of each file.
- **AND** changing the file content changes the hash.

#### Scenario: Environment Variable Hashing
- **GIVEN** a task configuration specifying environment variables
- **WHEN** the input hash is computed
- **THEN** it includes the value of each specified environment variable.
- **AND** changing the variable value changes the hash.
