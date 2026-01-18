
# 🧠 Project Skills Registry

This file documents the **Agentic Skills** available in this repository. These skills are "system prompt injections" that provide specialized capabilities, workflows, and strict operational protocols for AI assistants.

## 🚀 How to Use

When a task requires specific expertise, the AI should **read the corresponding `SKILL.md` file** to "load" that skill into its context.

**Example:**
> "I am starting a complex refactor. Loading `skills/systematic-debugging/SKILL.md` to guide my process."

## 📂 Active Skills Library

The following skills are installed in `.gemini/skills/` and recommended for this project:

### 📋 Planning & Architecture
| Skill                     | Path                    | Use Case                                                               |
| :------------------------ | :---------------------- | :--------------------------------------------------------------------- |
| **Concise Planning**      | `concise-planning`      | **Default for all tasks.** Forces strict, atomic checklist generation. |
| **Writing Plans**         | `writing-plans`         | For complex multi-step features requiring deep research first.         |
| **Software Architecture** | `software-architecture` | When designing new systems or major refactors.                         |
| **Senior Architect**      | `senior-architect`      | High-level decision making and trade-off analysis.                     |

### 🛠️ Development Standards
| Skill                    | Path                     | Use Case                                                      |
| :----------------------- | :----------------------- | :------------------------------------------------------------ |
| **Backend Guidelines**   | `backend-dev-guidelines` | **Mandatory** for Node.js/TypeScript work. Enforces patterns. |
| **React Best Practices** | `react-best-practices`   | **Mandatory** for any frontend work (if applicable).          |
| **TypeScript Mastery**   | `javascript-mastery`     | Advanced TS/JS concepts and patterns.                         |
| **MCP Builder**          | `mcp-builder`            | If building Model Context Protocol servers.                   |

### 🧪 Quality & Verification
| Skill                    | Path                             | Use Case                                                         |
| :----------------------- | :------------------------------- | :--------------------------------------------------------------- |
| **TDD**                  | `test-driven-development`        | **Mandatory** for new features. Write tests *before* code.       |
| **Systematic Debugging** | `systematic-debugging`           | When fixing bugs or test failures. Prevents "shotgun debugging". |
| **Testing Patterns**     | `testing-patterns`               | Best practices for Jest/Vitest.                                  |
| **Verification**         | `verification-before-completion` | **CRITICAL.** Must run before claiming "Done".                   |

### 🔐 Security (AppSec)
| Skill                 | Path                      | Use Case                                          |
| :-------------------- | :------------------------ | :------------------------------------------------ |
| **Security Scanning** | `scanning-tools`          | For proactive security auditing.                  |
| **OWASP Top 10**      | `top-web-vulnerabilities` | Reference when validating input/security designs. |

## 🔄 Workflow Automations
| Skill           | Path                     | Use Case                                               |
| :-------------- | :----------------------- | :----------------------------------------------------- |
| **Git Pushing** | `git-pushing`            | Enforces conventional commits and safe push practices. |
| **Code Review** | `requesting-code-review` | Self-review checklist before user handover.            |
| **Tech Debt**   | `kaizen`                 | Continuous improvement and refactoring strategies.     |

---

> **Note:** Full library available at `.gemini/skills/README.md`.
