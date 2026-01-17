# Research: File Structure Refactoring

## Decision: One Entity Per File

It has been decided that each class, interface, and type alias will be placed into its own distinct file.

## Rationale

This approach is a standard best practice within the TypeScript and broader software development community for several reasons:

1.  **Single Responsibility Principle (SRP)**: Each file has a single, clear purpose—to define a specific piece of the system. This makes the code easier to understand, test, and maintain.
2.  **Improved Navigability**: Developers can find code more quickly by looking for a file with a name that matches the entity they are interested in, rather than searching through a large, monolithic file.
3.  **Reduced Cognitive Load**: Smaller, focused files are easier to comprehend than large files with many unrelated or loosely related components.
4.  **Clearer Git Diffs**: Changes to a single entity are isolated to its own file, making pull requests easier to review and reducing the likelihood of merge conflicts.

## Alternatives Considered

- **Keep all entities in `index.ts`**: This is the current state and has been rejected as it leads to poor organization, difficulty in navigation, and a violation of SRP.
- **Group related entities by feature**: For a small library like this, grouping by entity type (e.g., a `types.ts`, `interfaces.ts`) is an option. However, separating every entity is a more scalable and consistent approach as the library grows. It was chosen for its simplicity and strict adherence to SRP.
