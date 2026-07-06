// Global test setup
import fs from 'fs';
import os from 'os';
import path from 'path';

process.env.NODE_ENV = 'test';

// Isolate connection persistence to a throwaway directory so test runs
// never read or write the developer's real ~/.sql-lens-mcp/connections.json.
const testHome = fs.mkdtempSync(path.join(os.tmpdir(), 'sql-lens-mcp-test-'));
process.env.SQL_LENS_MCP_HOME = testHome;

if (typeof global.after === 'function') {
  global.after(() => {
    fs.rmSync(testHome, { recursive: true, force: true });
  });
}

// Increase default timeout for container startup
if (typeof global.beforeEach === 'function') {
  global.timeout = 60000;
}
