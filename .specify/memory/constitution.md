<!--
    Sync Impact Report

    - Version change: 1.0.0 → 1.1.0
    - Modified principles: None (added new sections)
    - Added sections:
        - Development Standards (Principle VII, VIII)
        - Quality Gates (Principle IX, X)
        - Governance (Rules for Amendments and Compliance)
    - Removed sections: None
    - Templates requiring updates:
        - ✅ .specify/templates/plan-template.md (No changes needed, but principles are now enforceable)
        - ✅ .specify/templates/spec-template.md (No changes needed)
        - ✅ .specify/templates/tasks-template.md (No changes needed, but principles are now enforceable)
    - Follow-up TODOs: None
-->

# task-runner Constitution

## Core Principles

### I. Test-First (NON-NEGOTIABLE)
The system MUST target 100% unit test coverage for all new code. Tests must be written before or alongside the implementation, following a Red-Green-Refactor cycle where possible. This ensures that all code is verifiable, and regressions can be caught early.

### II. Type Safety
The `any` type is strictly forbidden in the codebase. Devs should use specific types, generics, or `unknown` with appropriate type-checking and guards. This leverages TypeScript's compiler to catch errors at build time, not runtime.

### III. API Documentation
All public-facing classes, methods, properties, and types MUST be documented using JSDoc-style comments. This provides critical Intellisense and developer guidance for library consumers directly in their editor.

### IV. Principle of Least Exposure
The public API surface MUST be minimal. Only export functions, classes, and types that are essential for the client to consume the library. Internal utilities and types should not be exported, reducing coupling and hiding implementation details.

### V. Code Style Consistency
The project MUST use double quotes (`"`) for all string literals, imports, and other syntax. This maintains a single, consistent style across the entire codebase, enforced automatically by Prettier and ESLint.

### VI. Software Design Principles
The codebase SHOULD adhere to SOLID principles (Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion) to promote maintainable, scalable, and robust software architecture.

## Development Standards

### VII. Code Review Process
All code changes MUST undergo a peer code review process. Reviews MUST ensure adherence to all defined principles, code style, and architectural patterns.

### VIII. Continuous Integration
All code MUST pass automated build, test, and linting checks in a Continuous Integration (CI) pipeline before being merged into the main branch.

## Quality Gates

### IX. Release Process
New releases MUST follow semantic versioning. Major versions require backward-incompatible changes, minor versions for new features, and patch versions for bug fixes.

### X. Security Best Practices
All development MUST adhere to industry-standard security best practices, including but not limited to input validation, secure coding patterns, and dependency vulnerability scanning.

## Governance

### Amendments
This constitution can be amended by a supermajority (2/3) vote of the core development team. Proposed amendments MUST be documented and reviewed by all stakeholders.

### Compliance
Adherence to this constitution is mandatory for all contributors. Violations will result in code rejection and require remediation.

**Version**: 1.1.0 | **Ratified**: 2026-01-17 | **Last Amended**: 2026-01-17