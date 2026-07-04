import { describe, it, before, after } from 'mocha';
import { expect } from 'chai';
import { MSSQLAdapter } from '../../../dist/connections/adapters/mssql.js';
import { getTestContainers } from '../../helpers/containers.js';
import type { ConnectionConfig } from '../../../dist/utils/types.js';

describe('MSSQL Adapter Integration', function () {
  this.timeout(300000);

  let adapter: MSSQLAdapter;
  let config: ConnectionConfig;

  before(async () => {
    const containers = await getTestContainers();
    const mssqlConfig = containers.getConfig('mssql');
    if (!mssqlConfig) {
      throw new Error('MSSQL container not available');
    }
    config = mssqlConfig;
    adapter = new MSSQLAdapter();
  });

  after(async () => {
    if (adapter && adapter.isConnected()) {
      await adapter.disconnect();
    }
  });

  describe('Connection', () => {
    it('should connect to MSSQL', async () => {
      await adapter.connect(config);
      expect(adapter.isConnected()).to.be.true;
    });

    it('should disconnect from MSSQL', async () => {
      await adapter.disconnect();
      expect(adapter.isConnected()).to.be.false;
      await adapter.connect(config);
    });
  });

  describe('Query Execution', () => {
    before(async () => {
      if (!adapter.isConnected()) {
        await adapter.connect(config);
      }
    });

    it('should create test tables', async () => {
      const result = await adapter.execute(`
        IF OBJECT_ID('dbo.test_categories', 'U') IS NULL
        CREATE TABLE dbo.test_categories (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name VARCHAR(100) NOT NULL
        )
      `);

      await adapter.execute(`
        IF OBJECT_ID('dbo.test_items', 'U') IS NULL
        CREATE TABLE dbo.test_items (
          id INT IDENTITY(1,1) PRIMARY KEY,
          category_id INT NOT NULL,
          name VARCHAR(100) NOT NULL,
          CONSTRAINT fk_test_items_category
            FOREIGN KEY (category_id) REFERENCES dbo.test_categories(id)
        )
      `);

      expect(result).to.have.property('executionTimeMs');
    });

    it('should insert and select data', async () => {
      await adapter.execute(
        'INSERT INTO dbo.test_categories (name) VALUES (@param0), (@param1)',
        ['Books', 'Games']
      );
      await adapter.execute(
        'INSERT INTO dbo.test_items (category_id, name) VALUES (@param0, @param1), (@param2, @param3)',
        [1, 'Novel', 2, 'Chess']
      );

      const result = await adapter.execute('SELECT * FROM dbo.test_items ORDER BY id');

      expect(result.rows).to.have.lengthOf(2);
      expect(result.rows[0]).to.have.property('name', 'Novel');
    });

    it('should handle parameterized queries', async () => {
      const result = await adapter.execute(
        'SELECT * FROM dbo.test_items WHERE name = @param0',
        ['Chess']
      );

      expect(result.rows).to.have.lengthOf(1);
      expect(result.rows[0]).to.have.property('name', 'Chess');
    });
  });

  describe('Schema Introspection', () => {
    before(async () => {
      if (!adapter.isConnected()) {
        await adapter.connect(config);
      }
    });

    it('should retrieve schema information', async () => {
      const schema = await adapter.getSchema();

      expect(schema).to.have.property('tables');
      expect(schema.databaseType).to.equal('mssql');

      const testItemsTable = schema.tables.find(t => t.name === 'test_items');
      expect(testItemsTable).to.exist;
      expect(testItemsTable?.schema).to.equal('dbo');
      expect(testItemsTable?.primaryKey).to.deep.equal(['id']);

      const fk = testItemsTable?.foreignKeys.find(f => f.column === 'category_id');
      expect(fk).to.exist;
      expect(fk?.referencesTable).to.equal('test_categories');
      expect(fk?.referencesColumn).to.equal('id');
    });
  });

  describe('Read-Only Mode', () => {
    it('should reject writes via the adapter guard in read-only mode', async () => {
      if (!adapter.isConnected()) {
        await adapter.connect(config);
      }

      await adapter.setReadOnly(true);

      try {
        await adapter.execute('INSERT INTO dbo.test_categories (name) VALUES (@param0)', ['Toys']);
        expect.fail('Should have thrown an error in read-only mode');
      } catch (error) {
        expect((error as Error).message).to.match(/read-only/i);
      }

      const result = await adapter.execute('SELECT * FROM dbo.test_categories');
      expect(result.rows).to.have.lengthOf(2);

      await adapter.setReadOnly(false);
    });
  });

  describe('Schema Intelligence', () => {
    before(async () => {
      if (!adapter.isConnected()) {
        await adapter.connect(config);
      }
    });

    it('should execute a sample query', async () => {
      const sql = adapter.buildSampleQuery('test_items', 'dbo', 1);
      const result = await adapter.execute(sql);

      expect(result.rows).to.have.lengthOf(1);
      expect(result.rows[0]).to.have.property('name');
    });

    it('should explain a query', async () => {
      const result = await adapter.explain('SELECT * FROM dbo.test_items WHERE id = 1');

      expect(result.rows.length).to.be.greaterThan(0);
    });

    it('should describe foreign key relationships', async () => {
      const relationships = await adapter.getRelationships('dbo');

      const rel = relationships.find(r => r.fromTable === 'test_items');
      expect(rel).to.exist;
      expect(rel?.toTable).to.equal('test_categories');
      expect(rel?.fromColumns).to.deep.equal(['category_id']);
      expect(rel?.toColumns).to.deep.equal(['id']);
    });
  });
});
