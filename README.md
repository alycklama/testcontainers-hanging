# Hanging test-container

When running the test `testExample.test.ts` multiple times in sequence with
`run-tests.sh <count>`, at one stage the `node (vitest 1)` process hangs
indefinitely and starts using a full core at 100%.

```bash
$ run-tests.sh 50
```

```bash
$ watch-results.sh
```

# Code

I tried to create a concise code example. The tests are not doing anything, the
problem is somewhere in the test setup. The `useKafkaContainer` contains a bunch
of helper functionality:

| Hook         | Description               |
| ------------ | ------------------------- |
| `beforeAll`  | Starts the test container |
| `afterAll`   | Stops the test container  |
| `beforeEach` | Connect the admin         |
|              | Create random topic       |
|              | Create consumer           |
|              | Connect consumer          |
| `afterEach`  | Disconnect the consumer   |
|              | Disconnect the admin      |
