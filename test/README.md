# SQL-MCP Tests

Comprehensive test suite using Testcontainers for integration testing with real databases.

## Prerequisites

- **Docker**: Testcontainers requires Docker to be running
- **Node.js**: 18.x or higher
- **Memory**: At least 4GB RAM for running multiple database containers

## Test Structure

```
test/
├── setup.js                    # Global test configuration
├── helpers/
│   └── containers.ts          # Testcontainers management
├── unit/                      # Unit tests (no external dependencies)
│   └── query-validator.test.ts
└── integration/               # Integration tests (require Docker)
    ├── adapters/
    │   ├── postgresql.test.ts
    │   └── mysql.test.ts
    └── connection-manager.test.ts
```

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests Only
```bash
npm run test:integration
```

### Watch Mode
```bash
npm run test:watch
```

## Test Containers

The test suite automatically spins up the following Docker containers:

| Database   | Image                                | Port | User      | Password          |
|------------|--------------------------------------|------|-----------|-------------------|
| PostgreSQL | `postgres:16-alpine`                 | 5432 | testuser  | testpass          |
| MySQL      | `mysql:8.4`                          | 3306 | testuser  | testpass          |
| MariaDB    | `mariadb:11.4`                       | 3306 | testuser  | testpass          |
| MSSQL      | `mcr.microsoft.com/mssql/server:2022`| 1433 | sa        | YourStrong@Passw0rd|

Containers are:
- Started automatically before tests
- Shared across all test suites for performance
- Cleaned up after all tests complete
- Isolated per test run (no data persistence between runs)

## Test Coverage

### Database Adapters
- ✅ Connection management
- ✅ Query execution with parameters
- ✅ Schema introspection
- ✅ Row limiting and truncation
- ✅ Read-only mode enforcement
- ✅ Error handling

### Connection Manager
- ✅ Multi-database connections
- ✅ Connection lifecycle (connect/disconnect/reconnect)
- ✅ Schema caching
- ✅ Connection metadata (name, env)

### Security
- ✅ Query classification
- ✅ Multi-statement detection
- ✅ Dangerous pattern blocking
- ✅ Read-only validation

## Writing Tests

### Unit Tests
Unit tests should not require external dependencies:

```typescript
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { someFunction } from '../../dist/some-module.js';

describe('Module Name', () => {
  it('should do something', () => {
    const result = someFunction();
    expect(result).to.equal('expected');
  });
});
```

### Integration Tests
Integration tests use testcontainers:

```typescript
import { describe, it, before } from 'mocha';
import { expect } from 'chai';
import { getTestContainers } from '../../helpers/containers.js';

describe('Integration Test', function() {
  this.timeout(60000); // Containers need time to start

  let config;

  before(async () => {
    const containers = await getTestContainers();
    config = containers.getConfig('postgresql');
  });

  it('should connect and query', async () => {
    // Your test code here
  });
});
```

## Troubleshooting

### Docker Not Running
```
Error: Docker is not running
```
**Solution**: Start Docker Desktop or Docker daemon

### Container Startup Timeout
```
Error: Container failed to start within timeout
```
**Solution**: Increase timeout in test or check Docker resources

### Port Conflicts
```
Error: Port already in use
```
**Solution**: Stop conflicting services or let testcontainers assign random ports

### Memory Issues
```
Error: Container OOM
```
**Solution**: Increase Docker memory limit in Docker Desktop settings

## CI/CD

Tests run automatically on:
- Push to `dev` branch
- Pull requests to `main` branch
- Scheduled nightly builds

GitHub Actions uses Docker-in-Docker to run testcontainers.

## Performance

- **Unit tests**: ~1-2 seconds
- **Integration tests**: ~30-60 seconds (includes container startup)
- **Full suite**: ~60-90 seconds

Container startup is parallelized for faster execution.
