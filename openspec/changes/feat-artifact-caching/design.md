# Design: Artifact Caching

## Context

We want to skip task execution if the inputs (files, environment variables) haven't changed since the last successful run. This requires hashing inputs and storing outputs (artifacts).

## Goals

- **Correctness**: Only skip execution if inputs are guaranteed to be identical.
- **Performance**: Hashing and cache retrieval should be faster than task execution.
- **Pluggability**: Support different storage backends (e.g., local, S3, remote cache) in the future.

## Decisions

### 1. Hashing Strategy
- We will use **SHA-256** for hashing file contents and environment variable values.
- Input hash = `SHA256( sort(file_hashes) + sort(env_hashes) + task_name )`.
- Sorting ensures deterministic hashes regardless of file enumeration order.

### 2. Cache Key Structure
- The cache key will be the computed hash.
- Metadata (like original inputs, timestamps) will be stored alongside the artifact to allow for debugging and verification.

### 3. Storage
- **Local Filesystem**: Default implementation.
- Path: `.task-runner/cache/<hash>/`.
- Content:
  - `meta.json`: Inputs used, timestamp, duration.
  - `output.tar.gz`: Compressed artifacts (files/directories).

### 4. Integration with Execution Strategy
- `CachingExecutionStrategy` will be a decorator (wrapper) around other strategies.
- Order: `Caching(Retrying(Standard))`.
- If cache hit: Unpack `output.tar.gz` to original locations, return `TaskResult` with `status: 'skipped'` (or new `cached` status).
- If cache miss: Run inner strategy. If success, pack outputs and write to cache.

## Open Questions

- **Symlinks**: How to handle symlinks in inputs/outputs? (Decision: Follow symlinks for inputs, preserve for outputs if possible, or fail).
- **Large Files**: Should we stream large artifacts? (Decision: MVP will load into memory/buffer for simplicity, streaming later).
