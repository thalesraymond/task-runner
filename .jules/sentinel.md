## 2024-05-22 - Mermaid Graph Sanitization Vulnerability
**Vulnerability:** The Mermaid graph generation logic in `TaskRunner.getMermaidGraph` used a weak sanitization method (only replacing spaces, colons, and quotes) which allowed special characters like `[]`, `()`, `{}` to pass through. This could result in invalid Mermaid syntax or potentially malicious graph structures if user input controlled task names.
**Learning:** Blocklists (replacing specific characters) are often insufficient because it's hard to predict all problematic characters.
**Prevention:** Use strict allowlists (e.g., `/[^a-zA-Z0-9_-]/g`) for identifiers that are used in structured output formats like Mermaid, ensuring only safe characters are included.
