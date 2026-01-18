
import { describe, it, expect } from 'vitest';
import { TaskRunner } from '../src/TaskRunner.js';
import { TaskStep } from '../src/TaskStep.js';

describe('Concurrency Control', () => {
  it('should respect concurrency limit', async () => {
    let activeTasks = 0;
    let maxActiveTasks = 0;

    const task = async () => {
      activeTasks++;
      if (activeTasks > maxActiveTasks) {
        maxActiveTasks = activeTasks;
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
      activeTasks--;
      return { status: 'success' } as const;
    };

    const steps: TaskStep<any>[] = [
      { name: 'A', run: task },
      { name: 'B', run: task },
      { name: 'C', run: task },
      { name: 'D', run: task },
      { name: 'E', run: task },
    ];

    const runner = new TaskRunner({});
    await runner.execute(steps, { concurrency: 2 });

    expect(maxActiveTasks).toBeLessThanOrEqual(2);
    expect(maxActiveTasks).toBeGreaterThan(0);
  });

  it('should run all tasks eventually with concurrency limit', async () => {
    const executed: string[] = [];
    const task = async (context: any) => {
      // Simulate work
      await new Promise((resolve) => setTimeout(resolve, 10));
      return { status: 'success' } as const;
    };

    const steps: TaskStep<any>[] = [
      { name: 'A', run: async () => { executed.push('A'); return { status: 'success' } as const; } },
      { name: 'B', run: async () => { executed.push('B'); return { status: 'success' } as const; } },
      { name: 'C', run: async () => { executed.push('C'); return { status: 'success' } as const; } },
      { name: 'D', run: async () => { executed.push('D'); return { status: 'success' } as const; } },
    ];

    const runner = new TaskRunner({});
    const results = await runner.execute(steps, { concurrency: 1 });

    expect(results.size).toBe(4);
    expect(executed).toHaveLength(4);
    expect(executed).toContain('A');
    expect(executed).toContain('B');
    expect(executed).toContain('C');
    expect(executed).toContain('D');
  });

  it('should handle dependencies correctly with concurrency limit', async () => {
    // A -> B
    // C -> D
    // With concurrency 2, we expect A and C to run, then B and D.
    // We want to ensure B doesn't run until A is done, D doesn't run until C is done.
    // And total active <= 2.

    let activeTasks = 0;
    let maxActiveTasks = 0;

    const task = async () => {
      activeTasks++;
      if (activeTasks > maxActiveTasks) {
        maxActiveTasks = activeTasks;
      }
      await new Promise((resolve) => setTimeout(resolve, 20));
      activeTasks--;
      return { status: 'success' } as const;
    };

    const steps: TaskStep<any>[] = [
      { name: 'A', run: task },
      { name: 'B', run: task, dependencies: ['A'] },
      { name: 'C', run: task },
      { name: 'D', run: task, dependencies: ['C'] },
    ];

    const runner = new TaskRunner({});
    const results = await runner.execute(steps, { concurrency: 2 });

    expect(maxActiveTasks).toBeLessThanOrEqual(2);
    expect(results.size).toBe(4);
    expect(results.get('B')?.status).toBe('success');
    expect(results.get('D')?.status).toBe('success');
  });
});
