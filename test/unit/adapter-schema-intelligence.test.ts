import { describe, it } from 'mocha';
import { expect } from 'chai';
import { clampSampleLimit, groupRelationshipRows } from '../../dist/connections/adapters/base.js';
import { SQLiteAdapter } from '../../dist/connections/adapters/sqlite.js';
import { PostgreSQLAdapter } from '../../dist/connections/adapters/postgresql.js';
import { MySQLAdapter } from '../../dist/connections/adapters/mysql.js';
import { MariaDBAdapter } from '../../dist/connections/adapters/mariadb.js';
import { MSSQLAdapter } from '../../dist/connections/adapters/mssql.js';
import { OracleAdapter } from '../../dist/connections/adapters/oracle.js';
import { DuckDBAdapter } from '../../dist/connections/adapters/duckdb.js';

describe('Adapter Schema Intelligence', () => {
  describe('clampSampleLimit', () => {
    it('should default to 10', () => {
      expect(clampSampleLimit(undefined)).to.equal(10);
      expect(clampSampleLimit(NaN)).to.equal(10);
    });

    it('should cap at 100', () => {
      expect(clampSampleLimit(5000)).to.equal(100);
    });

    it('should floor to at least 1', () => {
      expect(clampSampleLimit(0)).to.equal(1);
      expect(clampSampleLimit(-10)).to.equal(1);
    });

    it('should truncate fractions', () => {
      expect(clampSampleLimit(7.9)).to.equal(7);
    });
  });

  describe('quoteIdentifier', () => {
    it('should double-quote for PostgreSQL, SQLite, Oracle and DuckDB', () => {
      for (const adapter of [new PostgreSQLAdapter(), new SQLiteAdapter(), new OracleAdapter(), new DuckDBAdapter()]) {
        expect(adapter.quoteIdentifier('users'), adapter.type).to.equal('"users"');
      }
    });

    it('should backtick-quote for MySQL and MariaDB', () => {
      for (const adapter of [new MySQLAdapter(), new MariaDBAdapter()]) {
        expect(adapter.quoteIdentifier('users'), adapter.type).to.equal('`users`');
      }
    });

    it('should bracket-quote for MSSQL', () => {
      expect(new MSSQLAdapter().quoteIdentifier('users')).to.equal('[users]');
    });

    it('should escape embedded quote characters', () => {
      expect(new PostgreSQLAdapter().quoteIdentifier('us"ers')).to.equal('"us""ers"');
      expect(new MySQLAdapter().quoteIdentifier('us`ers')).to.equal('`us``ers`');
      expect(new MSSQLAdapter().quoteIdentifier('us]ers')).to.equal('[us]]ers]');
    });
  });

  describe('buildSampleQuery', () => {
    it('should use LIMIT for PostgreSQL, MySQL, MariaDB, SQLite and DuckDB', () => {
      expect(new PostgreSQLAdapter().buildSampleQuery('users', 'public', 10))
        .to.equal('SELECT * FROM "public"."users" LIMIT 10');
      expect(new MySQLAdapter().buildSampleQuery('users', undefined, 10))
        .to.equal('SELECT * FROM `users` LIMIT 10');
      expect(new MariaDBAdapter().buildSampleQuery('users', 'shop', 10))
        .to.equal('SELECT * FROM `shop`.`users` LIMIT 10');
      expect(new SQLiteAdapter().buildSampleQuery('users', undefined, 10))
        .to.equal('SELECT * FROM "users" LIMIT 10');
      expect(new DuckDBAdapter().buildSampleQuery('users', undefined, 10))
        .to.equal('SELECT * FROM "users" LIMIT 10');
    });

    it('should use TOP for MSSQL', () => {
      expect(new MSSQLAdapter().buildSampleQuery('users', 'dbo', 10))
        .to.equal('SELECT TOP (10) * FROM [dbo].[users]');
    });

    it('should use FETCH FIRST for Oracle', () => {
      expect(new OracleAdapter().buildSampleQuery('USERS', undefined, 10))
        .to.equal('SELECT * FROM "USERS" FETCH FIRST 10 ROWS ONLY');
    });

    it('should clamp the interpolated limit', () => {
      expect(new SQLiteAdapter().buildSampleQuery('users', undefined, 99999))
        .to.equal('SELECT * FROM "users" LIMIT 100');
    });
  });

  describe('groupRelationshipRows', () => {
    it('should group composite constraints by name', () => {
      const grouped = groupRelationshipRows([
        { constraintName: 'fk_a', fromTable: 'inventory', fromColumn: 'maker', toTable: 'parts', toColumn: 'maker' },
        { constraintName: 'fk_a', fromTable: 'inventory', fromColumn: 'model', toTable: 'parts', toColumn: 'model' },
        { constraintName: 'fk_b', fromTable: 'orders', fromColumn: 'customer_id', toTable: 'customers', toColumn: 'id' },
      ]);

      expect(grouped).to.have.length(2);
      expect(grouped[0].fromColumns).to.deep.equal(['maker', 'model']);
      expect(grouped[0].toColumns).to.deep.equal(['maker', 'model']);
      expect(grouped[1].fromColumns).to.deep.equal(['customer_id']);
    });

    it('should not merge same-named constraints on different tables', () => {
      const grouped = groupRelationshipRows([
        { constraintName: 'fk', fromTable: 'a', fromColumn: 'x', toTable: 'c', toColumn: 'id' },
        { constraintName: 'fk', fromTable: 'b', fromColumn: 'y', toTable: 'c', toColumn: 'id' },
      ]);

      expect(grouped).to.have.length(2);
    });
  });

  describe('SQLite explain', () => {
    it('should produce a query plan without executing', async () => {
      const adapter = new SQLiteAdapter();
      await adapter.connect({ type: 'sqlite', path: ':memory:' });

      try {
        await adapter.execute('CREATE TABLE t (id INTEGER PRIMARY KEY)');
        const result = await adapter.explain('SELECT * FROM t WHERE id = 1');

        expect(result.rows.length).to.be.greaterThan(0);
        expect(JSON.stringify(result.rows)).to.match(/SEARCH|SCAN/);
      } finally {
        await adapter.disconnect();
      }
    });
  });
});
