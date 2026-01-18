
import { describe, it, expect, vi } from 'vitest';
import { TaskRunner } from '../src/TaskRunner.js';
import { TaskStep } from '../src/TaskStep.js';

describe('Concurrency Control', () => {
  it('should limit concurrency to 1', async () => {
    const context = {};
    const runner = new TaskRunner(context);

    let activeTasks = 0;
    let maxActiveTasks = 0;

    const createSlowTask = (name: string): TaskStep<typeof context> => ({
      name,
      run: async () => {
        activeTasks++;
        maxActiveTasks = Math.max(maxActiveTasks, activeTasks);
        await new Promise((resolve) => setTimeout(resolve, 50));
        activeTasks--;
        return { status: 'success' };
      },
    });

    const tasks = [
      createSlowTask('task1'),
      createSlowTask('task2'),
      createSlowTask('task3'),
    ];

    await runner.execute(tasks, { concurrency: 1 });

    expect(maxActiveTasks).toBe(1);
  });

  it('should limit concurrency to 2', async () => {
    const context = {};
    const runner = new TaskRunner(context);

    let activeTasks = 0;
    let maxActiveTasks = 0;

    const createSlowTask = (name: string): TaskStep<typeof context> => ({
      name,
      run: async () => {
        activeTasks++;
        maxActiveTasks = Math.max(maxActiveTasks, activeTasks);
        await new Promise((resolve) => setTimeout(resolve, 50));
        activeTasks--;
        return { status: 'success' };
      },
    });

    const tasks = [
      createSlowTask('task1'),
      createSlowTask('task2'),
      createSlowTask('task3'),
      createSlowTask('task4'),
    ];

    await runner.execute(tasks, { concurrency: 2 });

    expect(maxActiveTasks).toBeLessThanOrEqual(2);
    expect(maxActiveTasks).toBe(2);
  });

  it('should handle unlimited concurrency (default)', async () => {
    const context = {};
    const runner = new TaskRunner(context);

    let activeTasks = 0;
    let maxActiveTasks = 0;

    const createSlowTask = (name: string): TaskStep<typeof context> => ({
      name,
      run: async () => {
        activeTasks++;
        maxActiveTasks = Math.max(maxActiveTasks, activeTasks);
        await new Promise((resolve) => setTimeout(resolve, 50));
        activeTasks--;
        return { status: 'success' };
      },
    });

    const tasks = [
      createSlowTask('task1'),
      createSlowTask('task2'),
      createSlowTask('task3'),
    ];

    await runner.execute(tasks);

    expect(maxActiveTasks).toBe(3);
  });

  it('should run each task exactly once even when queued', async () => {
    const context = {};
    const runner = new TaskRunner(context);

    const taskExecutions: Record<string, number> = {};

    const createTrackedTask = (name: string): TaskStep<typeof context> => ({
      name,
      run: async () => {
        taskExecutions[name] = (taskExecutions[name] || 0) + 1;
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { status: 'success' };
      },
    });

    const tasks = [
      createTrackedTask('A'),
      createTrackedTask('B'),
      createTrackedTask('C'),
      createTrackedTask('D'),
    ];

    // Concurrency 1 ensures tasks are queued and processed sequentially
    // This maximizes the chance of re-processing dependencies if the bug exists
    await runner.execute(tasks, { concurrency: 1 });

    expect(taskExecutions['A']).toBe(1);
    expect(taskExecutions['B']).toBe(1);
    expect(taskExecutions['C']).toBe(1);
    expect(taskExecutions['D']).toBe(1);
  });
});
