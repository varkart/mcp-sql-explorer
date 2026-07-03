import { describe, it, beforeEach, afterEach, before, after } from 'mocha';
import { expect } from 'chai';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { registerSampleRowsTool } from '../../../../dist/tools/database/sample-rows.js';
import { SQLiteAdapter } from '../../../../dist/connections/adapters/sqlite.js';
import { createMockContext, createToolCapture } from '../../../helpers/mock-server.js';

describe('Sample Rows Tool', () => {
  let context: ReturnType<typeof createMockContext>;
  let capture: ReturnType<typeof createToolCapture>;

  beforeEach(async () => {
    context = createMockContext();
    capture = createToolCapture();
    registerSampleRowsTool(capture.server, context);

    await context.manager.connect('test-db', {
      type: 'sqlite',
      path: ':memory:',
      readOnly: false,
    });

    const adapter = context.manager.getAdapter('test-db');
    await adapter!.execute('CREATE TABLE nums (n INTEGER)');
    const values = Array.from({ length: 150 }, (_, i) => `(${i + 1})`).join(', ');
    await adapter!.execute(`INSERT INTO nums VALUES ${values}`);
  });

  afterEach(async () => {
    for (const conn of context.manager.listConnections()) {
      try {
        await context.manager.disconnect(conn.id);
      } catch {
        // ignore cleanup errors
      }
    }
  });

  function parseJson(response: { content: { text: string }[] }) {
    return JSON.parse(response.content[0].text);
  }

  it('should return rows from the table', async () => {
    const response = await capture.call('sample_rows', {
      connectionId: 'test-db',
      table: 'nums',
      limit: 5,
      format: 'json',
    });

    const result = parseJson(response);
    expect(result.rows).to.have.length(5);
    expect(result.rows[0]).to.have.property('n');
  });

  it('should default to 10 rows', async () => {
    const response = await capture.call('sample_rows', {
      connectionId: 'test-db',
      table: 'nums',
      format: 'json',
    });

    expect(parseJson(response).rows).to.have.length(10);
  });

  it('should clamp the limit to 100', async () => {
    const response = await capture.call('sample_rows', {
      connectionId: 'test-db',
      table: 'nums',
      limit: 5000,
      format: 'json',
    });

    expect(parseJson(response).rows).to.have.length(100);
  });

  it('should clamp non-positive limits to 1', async () => {
    const response = await capture.call('sample_rows', {
      connectionId: 'test-db',
      table: 'nums',
      limit: -5,
      format: 'json',
    });

    expect(parseJson(response).rows).to.have.length(1);
  });

  it('should render an ascii table by default', async () => {
    const response = await capture.call('sample_rows', {
      connectionId: 'test-db',
      table: 'nums',
      limit: 2,
    });

    expect(response.content[0].text).to.include('n');
    expect(response.content[0].text).to.not.include('Sampling failed');
  });

  it('should reject invalid table identifiers without executing', async () => {
    const attempts = [
      'nums; DROP TABLE nums',
      'nums"',
      "nums' OR '1'='1",
      'nums --',
      '`nums`',
      'nums​',
    ];

    for (const table of attempts) {
      const response = await capture.call('sample_rows', {
        connectionId: 'test-db',
        table,
      });
      expect(response.content[0].text, table).to.include('Sampling failed');
      expect(response.content[0].text, table).to.include('Invalid table name');
    }

    const adapter = context.manager.getAdapter('test-db');
    const check = await adapter!.execute('SELECT COUNT(*) as count FROM nums');
    expect(check.rows[0].count).to.equal(150);
  });

  it('should reject invalid schema identifiers', async () => {
    const response = await capture.call('sample_rows', {
      connectionId: 'test-db',
      table: 'nums',
      schema: 'main; DROP TABLE nums',
    });

    expect(response.content[0].text).to.include('Invalid schema name');
  });

  it('should fail cleanly for unknown connections', async () => {
    const response = await capture.call('sample_rows', {
      connectionId: 'missing',
      table: 'nums',
    });

    expect(response.content[0].text).to.include('not found');
  });

  it('should fail cleanly for unknown tables', async () => {
    const response = await capture.call('sample_rows', {
      connectionId: 'test-db',
      table: 'missing_table',
    });

    expect(response.content[0].text).to.include('Sampling failed');
  });

  describe('read-only connections', () => {
    let dir: string;
    let dbPath: string;

    before(async () => {
      dir = mkdtempSync(join(tmpdir(), 'sql-lens-sample-'));
      dbPath = join(dir, 'sample.db');

      const writer = new SQLiteAdapter();
      await writer.connect({ type: 'sqlite', path: dbPath });
      await writer.execute('CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT)');
      await writer.execute("INSERT INTO items (name) VALUES ('a'), ('b'), ('c')");
      await writer.disconnect();
    });

    after(() => {
      rmSync(dir, { recursive: true, force: true });
    });

    it('should sample rows on a read-only connection', async () => {
      await context.manager.connect('ro-db', {
        type: 'sqlite',
        path: dbPath,
        readOnly: true,
      });

      const response = await capture.call('sample_rows', {
        connectionId: 'ro-db',
        table: 'items',
        limit: 2,
        format: 'json',
      });

      expect(parseJson(response).rows).to.have.length(2);
    });
  });
});
