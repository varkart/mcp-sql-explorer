# Manual Testing Guide

This guide covers manual testing of sql-mcp with both in-memory SQLite and Docker-based databases.

## Overview

You have two options for manual testing:

1. **In-Memory SQLite** - Fast, no Docker required, pre-seeded data
2. **Docker Containers** - Real database engines (PostgreSQL, MySQL, MariaDB, MSSQL)

## Option 1: In-Memory SQLite (Recommended for Quick Testing)

### Quick Start

```bash
# Build the project
npm run build

# Run the demo to see sample data
npx tsc create-test-db.ts demo-test-db.ts --module nodenext --moduleResolution nodenext --target es2022 --lib es2022 --esModuleInterop
node demo-test-db.js
```

### Using with MCP Server

1. **Start the MCP server** in debug mode:
   ```bash
   node dist/index.js --stdio --debug
   ```

2. **Connect to the in-memory database** from your MCP client:
   ```json
   {
     "tool": "connect_database",
     "connectionId": "test-sqlite",
     "config": {
       "type": "sqlite",
       "database": ":memory:"
     }
   }
   ```

3. **Run test queries**:
   ```json
   {
     "tool": "execute_query",
     "connectionId": "test-sqlite",
     "sql": "SELECT * FROM users LIMIT 5"
   }
   ```

### Files

- **`create-test-db.ts`** - Core module that creates and seeds the database
- **`demo-test-db.ts`** - Interactive demo showing various SQL queries
- **`test-with-db.ts`** - Example integration with SQLite adapter

## Option 2: Docker Test Containers (Full Database Testing)

### Prerequisites

- Docker Desktop running
- 4GB+ RAM recommended
- ~2GB disk space for images

### Method A: Docker Compose (Recommended)

**Start all databases:**
```bash
docker-compose up -d
```

This starts 4 databases with fixed ports:
- **PostgreSQL**: `localhost:5432`
- **MySQL**: `localhost:3306`
- **MariaDB**: `localhost:3307`
- **MSSQL**: `localhost:1433`

**Seed test data:**
```bash
chmod +x seed-databases.sh
./seed-databases.sh
```

**Connection configs:**
```json
{
  "postgresql": {
    "type": "postgresql",
    "host": "localhost",
    "port": 5432,
    "database": "testdb",
    "user": "testuser",
    "password": "testpass"
  },
  "mysql": {
    "type": "mysql",
    "host": "localhost",
    "port": 3306,
    "database": "testdb",
    "user": "testuser",
    "password": "testpass"
  },
  "mariadb": {
    "type": "mariadb",
    "host": "localhost",
    "port": 3307,
    "database": "testdb",
    "user": "testuser",
    "password": "testpass"
  },
  "mssql": {
    "type": "mssql",
    "host": "localhost",
    "port": 1433,
    "database": "master",
    "user": "sa",
    "password": "TestPass123!"
  }
}
```

**Stop containers:**
```bash
docker-compose down
```

**Remove data volumes:**
```bash
docker-compose down -v
```

### Method B: Testcontainers (For Integration Tests)

This method uses random ports assigned by Docker:

```bash
# Build the project first
npm run build

# Start all test databases
node start-dbs.js
```

This will:
- Start 4 database containers with random ports
- Save connection configs to `test-connections.json`
- Keep containers running until you stop the process

**Stop containers:**
Press `Ctrl+C` in the terminal running `start-dbs.js`

### Using with MCP Server

1. **Start databases** (choose Method A or B)
   ```bash
   docker-compose up -d
   ```

2. **Seed data** (optional)
   ```bash
   ./seed-databases.sh
   ```

3. **Start MCP server**
   ```bash
   node dist/index.js --stdio --debug
   ```

4. **Connect from MCP client** using the connection configs above

## Database Schema

### Tables

1. **users** (10 rows)
   - id, username, email, full_name, created_at, is_active, age, country

2. **products** (15 rows)
   - id, name, description, price, stock_quantity, category, created_at

3. **orders** (25 rows)
   - id, user_id, order_date, total_amount, status, shipping_address

4. **order_items** (~72 rows)
   - id, order_id, product_id, quantity, unit_price

5. **reviews** (30 rows)
   - id, product_id, user_id, rating, comment, created_at

### Relationships

- Foreign keys enabled
- `orders.user_id` → `users.id`
- `order_items.order_id` → `orders.id`
- `order_items.product_id` → `products.id`
- `reviews.user_id` → `users.id`
- `reviews.product_id` → `products.id`

## Example Queries

### Basic Queries

```sql
-- Get all users
SELECT * FROM users;

-- Get products by category
SELECT * FROM products WHERE category = 'Electronics';

-- Get orders by status
SELECT * FROM orders WHERE status = 'pending';
```

### Advanced Queries

```sql
-- Top selling products
SELECT
  p.name,
  COUNT(DISTINCT o.id) as order_count,
  SUM(oi.quantity) as total_sold
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id
GROUP BY p.id
ORDER BY total_sold DESC;

-- User spending summary
SELECT
  u.username,
  COUNT(o.id) as order_count,
  SUM(o.total_amount) as total_spent
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id
ORDER BY total_spent DESC;

-- Products with average ratings
SELECT
  p.name,
  AVG(r.rating) as avg_rating,
  COUNT(r.id) as review_count
FROM products p
LEFT JOIN reviews r ON p.id = r.product_id
GROUP BY p.id
HAVING review_count > 0;
```

### Complex Queries

```sql
-- Customer lifetime value with order details
SELECT
  u.username,
  u.country,
  COUNT(DISTINCT o.id) as total_orders,
  COUNT(DISTINCT oi.product_id) as unique_products,
  SUM(o.total_amount) as lifetime_value,
  AVG(o.total_amount) as avg_order_value
FROM users u
JOIN orders o ON u.id = o.user_id
JOIN order_items oi ON o.id = oi.order_id
GROUP BY u.id
ORDER BY lifetime_value DESC;
```

## Features

- **In-Memory**: Fast and ephemeral, perfect for testing
- **Realistic Data**: Random but realistic test data
- **Foreign Keys**: Proper relationships between tables
- **Variety**: Multiple data types, aggregates, and JOIN scenarios
- **Repeatable**: Fresh data on each run

## Use Cases

1. **Testing SQL Queries**: Validate query syntax and logic
2. **MCP Server Development**: Test database adapters and tools
3. **Integration Tests**: Automated testing with disposable data
4. **Learning SQL**: Practice queries on realistic data
5. **Debugging**: Isolate issues with known data

## Notes

- Database is created in memory (`:memory:`)
- All data is lost when the connection closes
- Data is randomly generated on each run
- ~150 rows total across 5 tables
- Supports all standard SQLite features

## Cleanup

Since the database is in-memory, no cleanup is needed. Simply close the database connection:

```typescript
db.close();
```
