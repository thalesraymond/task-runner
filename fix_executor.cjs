const fs = require('fs');
let code = fs.readFileSync('src/WorkflowExecutor.ts', 'utf8');

code = code.replace(`
    finally {
      if (signal) {
        signal.removeEventListener("abort", onAbort);
      }
    }`, `
    finally {
      signal?.removeEventListener("abort", onAbort);
    }`);

fs.writeFileSync('src/WorkflowExecutor.ts', code);
