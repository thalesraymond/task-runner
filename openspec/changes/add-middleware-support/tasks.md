## 1. Implementation

- [ ] 1.1 Define `Middleware` and `MiddlewareNext` types in `src/contracts/Middleware.ts`.
- [ ] 1.2 Update `TaskRunner` class to store a list of middleware functions.
- [ ] 1.3 Implement `composeMiddleware` utility to create the onion chain.
- [ ] 1.4 Update `WorkflowExecutor` or `TaskRunner` (wherever strategy is invoked) to wrap the strategy execution with composed middleware.
- [ ] 1.5 Update `TaskRunnerBuilder` to expose `.use(middleware)` method.
- [ ] 1.6 Add unit tests for Middleware composition and execution order.
- [ ] 1.7 Add integration test demonstrating a Logging Middleware and a Policy Middleware (skipping task).
