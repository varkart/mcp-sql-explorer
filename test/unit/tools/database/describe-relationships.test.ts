import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import { registerDescribeRelationshipsTool } from '../../../../dist/tools/database/describe-relationships.js';
import { createMockContext, createToolCapture } from '../../../helpers/mock-server.js';
import type { TableRelationship } from '../../../../dist/utils/types.js';

describe('Describe Relationships Tool', () => {
  let context: ReturnType<typeof createMockContext>;
  let capture: ReturnType<typeof createToolCapture>;

  beforeEach(async () => {
    context = createMockContext();
    capture = createToolCapture();
    registerDescribeRelationshipsTool(capture.server, context);

    await context.manager.connect('test-db', {
      type: 'sqlite',
      path: ':memory:',
      readOnly: false,
    });

    const adapter = context.manager.getAdapter('test-db');
    await adapter!.execute('CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT)');
    await adapter!.execute(`
      CREATE TABLE orders (
        id INTEGER PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id)
      )
    `);
    await adapter!.execute('CREATE TABLE parts (maker TEXT, model TEXT, PRIMARY KEY (maker, model))');
    await adapter!.execute(`
      CREATE TABLE inventory (
        id INTEGER PRIMARY KEY,
        maker TEXT,
        model TEXT,
        FOREIGN KEY (maker, model) REFERENCES parts(maker, model)
      )
    `);
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

  it('should return the foreign-key graph as JSON', async () => {
    const response = await capture.call('describe_relationships', {
      connectionId: 'test-db',
      format: 'json',
    });

    const relationships = JSON.parse(response.content[0].text) as TableRelationship[];
    expect(relationships).to.have.length(2);

    const orderFk = relationships.find(rel => rel.fromTable === 'orders');
    expect(orderFk).to.exist;
    expect(orderFk!.fromColumns).to.deep.equal(['customer_id']);
    expect(orderFk!.toTable).to.equal('customers');
    expect(orderFk!.toColumns).to.deep.equal(['id']);
    expect(orderFk!.constraintName).to.be.a('string');
  });

  it('should group composite foreign keys into one relationship', async () => {
    const response = await capture.call('describe_relationships', {
      connectionId: 'test-db',
      format: 'json',
    });

    const relationships = JSON.parse(response.content[0].text) as TableRelationship[];
    const composite = relationships.find(rel => rel.fromTable === 'inventory');

    expect(composite).to.exist;
    expect(composite!.fromColumns).to.deep.equal(['maker', 'model']);
    expect(composite!.toTable).to.equal('parts');
    expect(composite!.toColumns).to.deep.equal(['maker', 'model']);
  });

  it('should render a compact text summary by default', async () => {
    const response = await capture.call('describe_relationships', {
      connectionId: 'test-db',
    });

    const text = response.content[0].text;
    expect(text).to.include('Foreign key relationships');
    expect(text).to.include('orders(customer_id) -> customers(id)');
    expect(text).to.include('inventory(maker, model) -> parts(maker, model)');
  });

  it('should report when no relationships exist', async () => {
    await context.manager.connect('empty-db', {
      type: 'sqlite',
      path: ':memory:',
      readOnly: false,
    });

    const adapter = context.manager.getAdapter('empty-db');
    await adapter!.execute('CREATE TABLE standalone (id INTEGER PRIMARY KEY)');

    const response = await capture.call('describe_relationships', {
      connectionId: 'empty-db',
    });

    expect(response.content[0].text).to.include('No foreign key relationships found');
  });

  it('should reject invalid schema identifiers', async () => {
    const response = await capture.call('describe_relationships', {
      connectionId: 'test-db',
      schema: "main'; DROP TABLE customers",
    });

    expect(response.content[0].text).to.include('Invalid schema name');
  });

  it('should fail cleanly for unknown connections', async () => {
    const response = await capture.call('describe_relationships', {
      connectionId: 'missing',
    });

    expect(response.content[0].text).to.include('not found');
  });
});
