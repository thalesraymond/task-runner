// Just fixing the issue that we missed previously with sleep.js negative logic in tests
const fs = require('fs');

testCode = fs.readFileSync('tests/cancellation.test.ts', 'utf8');
if (!testCode.includes('should handle timeout correctly if ms is negative or zero')) {
  testCode = testCode.replace(/}\);\n$/, `
  it("should handle timeout correctly if ms is negative or zero", async () => {
    let resolved = false;
    await sleep(0).then(() => { resolved = true; });
    expect(resolved).toBe(true);

    resolved = false;
    await sleep(-10).then(() => { resolved = true; });
    expect(resolved).toBe(true);

    const controller = new AbortController();
    controller.abort();
    let rejected = false;
    await sleep(0, controller.signal).catch(() => { rejected = true; });
    expect(rejected).toBe(false);

    let rejected2 = false;
    await sleep(-5, controller.signal).catch(() => { rejected2 = true; });
    expect(rejected2).toBe(false);
  });

  it("should cleanup correctly when sleep aborts or resolves", async () => {
    const ac = new AbortController();
    const p = sleep(10, ac.signal);
    ac.abort();
    await expect(p).rejects.toThrow("AbortError");

    const ac2 = new AbortController();
    await expect(sleep(5, ac2.signal)).resolves.toBeUndefined();
  });

  it("should trigger immediate abort in sleep if already aborted", async () => {
    const ac = new AbortController();
    ac.abort(new Error("already aborted"));
    await expect(sleep(10, ac.signal)).rejects.toThrow("AbortError");
  });

  it("should trigger early return on aborted signal during positive ms", async () => {
    const controller = new AbortController();
    const p = sleep(10, controller.signal);
    controller.abort();
    await expect(p).rejects.toThrow();

    const controller2 = new AbortController();
    await sleep(1, controller2.signal);
  });

  it("should trigger cleanup empty block mutant", async () => {
    const controller = new AbortController();
    const originalRemove = controller.signal.removeEventListener;
    let removedEvent = '';
    controller.signal.removeEventListener = (event: any, handler: any) => {
      removedEvent = event;
      originalRemove.call(controller.signal, event, handler);
    };

    await sleep(1, controller.signal);
    expect(removedEvent).toBe('abort');
  });

  it("should trigger early resolve empty block mutant", async () => {
    const start = Date.now();
    await sleep(-10);
    const end = Date.now();
    expect(end - start).toBeLessThan(10);
  });

  it("should handle empty block mutant in sleep promise", async () => {
    let resolved = false;
    await sleep(-10).then(() => { resolved = true; });
    expect(resolved).toBe(true);

    const controller = new AbortController();
    await sleep(10, controller.signal).catch(() => {});
  });
});
`);
  fs.writeFileSync('tests/cancellation.test.ts', testCode);
}
