export class DependencyGraph {
  private dependencies = new Map<string, string[]>();
  private nodes = new Set<string>();

  addNode(name: string, dependencies: string[] = []) {
    this.nodes.add(name);
    this.dependencies.set(name, dependencies);
  }

  validate(): void {
    // 1. Check for missing dependencies
    for (const [node, deps] of this.dependencies) {
      for (const dep of deps) {
        if (!this.nodes.has(dep)) {
          throw new Error(
            `Missing dependency detected: ${dep} required by ${node}`
          );
        }
      }
    }

    // 2. Check for cycles
    this.detectCycles();
  }

  private detectCycles(): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    for (const node of this.nodes) {
      if (this.detectCycleUtil(node, visited, recursionStack)) {
        throw new Error("Circular dependency detected");
      }
    }
  }

  private detectCycleUtil(
    node: string,
    visited: Set<string>,
    recursionStack: Set<string>
  ): boolean {
    if (recursionStack.has(node)) return true;
    if (visited.has(node)) return false;

    visited.add(node);
    recursionStack.add(node);

    const deps = this.dependencies.get(node) || [];
    for (const dep of deps) {
      if (this.detectCycleUtil(dep, visited, recursionStack)) {
        return true;
      }
    }

    recursionStack.delete(node);
    return false;
  }
}
