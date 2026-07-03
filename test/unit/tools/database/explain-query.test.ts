import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { registerExplainQueryTool } from '../../../../dist/tools/database/explain-query.js';
import { SQLiteAdapter } from '../../../../dist/connections/adapters/sqlite.js';
import { createMockContext, createToolCapture } from '../../../helpers/mock-server.js';

describe('Explain Query Tool', () => {
  let context: ReturnType<typeof createMockContext>;
  let capture: ReturnType<typeof createToolCapture>;

  beforeEach(async () => {
    context = createMockContext();
    capture = createToolCapture();
    registerExplainQueryTool(capture.server, context);

    await context.manager.connect('test-db', {
      type: 'sqlite',
      path: ':memory:',
      readOnly: false,
    });

    const adapter = context.manager.getAdapter('test-db');
    await adapter!.execute('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');
    await adapter!.execute("INSERT INTO users (name) VALUES ('Alice'), ('Bob')");
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

  it('should return an EXPLAIN QUERY PLAN result for a SELECT', async () => {
    const response = await capture.call('explain_query', {
      connectionId: 'test-db',
      sql: 'SELECT * FROM users WHERE id = 1',
      format: 'json',
    });

    const result = JSON.parse(response.content[0].text);
    expect(result.rows.length).to.be.greaterThan(0);
    expect(JSON.stringify(result.rows)).to.match(/SEARCH|SCAN/);
    expect(result.statement).to.include('EXPLAIN QUERY PLAN');
  });

  it('should not execute the statement being planned', async () => {
    const response = await capture.call('explain_query', {
      connectionId: 'test-db',
      sql: "INSERT INTO users (name) VALUES ('Mallory')",
      format: 'json',
    });

    expect(response.content[0].text).to.not.include('Explain failed');

    const adapter = context.manager.getAdapter('test-db');
    const check = await adapter!.execute('SELECT COUNT(*) as count FROM users');
    expect(check.rows[0].count).to.equal(2);
  });

  it('should reject write statements on read-only connections', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'sql-lens-explain-'));
    const dbPath = join(dir, 'explain.db');

    try {
      const writer = new SQLiteAdapter();
      await writer.connect({ type: 'sqlite', path: dbPath });
      await writer.execute('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');
      await writer.disconnect();

      await context.manager.connect('ro-db', {
        type: 'sqlite',
        path: dbPath,
        readOnly: true,
      });

      const writes = [
        "INSERT INTO users (name) VALUES ('Mallory')",
        "UPDATE users SET name = 'x'",
        'DELETE FROM users',
        'DROP TABLE users',
      ];

      for (const sql of writes) {
        const response = await capture.call('explain_query', {
          connectionId: 'ro-db',
          sql,
        });
        expect(response.content[0].text, sql).to.include('Explain failed');
      }

      const readResponse = await capture.call('explain_query', {
        connectionId: 'ro-db',
        sql: 'SELECT * FROM users',
        format: 'json',
      });
      expect(JSON.parse(readResponse.content[0].text).rows.length).to.be.greaterThan(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('should reject multiple statements', async () => {
    const response = await capture.call('explain_query', {
      connectionId: 'test-db',
      sql: 'SELECT 1; SELECT 2',
    });

    expect(response.content[0].text).to.include('Explain failed');
    expect(response.content[0].text).to.include('Multiple statements');
  });

  it('should fail cleanly for unknown connections', async () => {
    const response = await capture.call('explain_query', {
      connectionId: 'missing',
      sql: 'SELECT 1',
    });

    expect(response.content[0].text).to.include('not found');
  });
});
