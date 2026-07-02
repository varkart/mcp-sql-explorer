# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.1.0] - 2026-07-01

### Changed
- **Package renamed from `mcp-sql-explorer` to `sql-lens-mcp`** — final name; npm package, binary command, and GitHub repository all now `sql-lens-mcp`
- Config discovery paths renamed: `sql-lens-mcp.config.json`, `~/.sql-lens-mcp/config.json`, `~/.sql-lens-mcp.config.json` (previously `sql-mcp.*`)
- Connection persistence directory renamed to `~/.sql-lens-mcp`
- Environment variables renamed: `SQL_LENS_MCP_APPS_ENABLED`, `SQL_LENS_MCP_APP_CONNECTION_MANAGER_ENABLED` (previously `SQL_MCP_*`)
- MCP server identifier renamed to `sql-lens-mcp`

## [2.0.0] - 2026-07-01

### Changed
- **BREAKING: minimum Node.js version raised to 20** (dropped Node 18)
- better-sqlite3 upgraded to v12 — fixes source-build failures on Node 26 (prebuilt binaries now cover Node 20–26)
- All dependencies updated to latest majors: mssql 12, oracledb 7, zod 4, TypeScript 6, ESLint 10
- npm publishing switched to trusted publishing (OIDC) with provenance
- Package and GitHub repository renamed from `sql-mcp` to `mcp-sql-explorer` for npm uniqueness; binary command renamed to match
- CI matrix now tests Node 20, 22, 24, 26
- Moved CONTRIBUTING.md to project root
- **Major README overhaul** with improved hero section, clearer value propositions, and real-world examples (doubled in size to 4,600+ words)
- Enhanced package.json metadata with author and funding information

### Added
- Comprehensive open source documentation
- CODE_OF_CONDUCT.md for community guidelines
- CONTRIBUTORS.md for contributor recognition
- Enhanced CI/CD workflows (Dependabot, CodeQL, npm publish)
- **Real-world use cases section** with 5 detailed scenarios:
  - Data analysis (business analyst workflow)
  - Production debugging (developer investigation)
  - Incident response (SRE troubleshooting)
  - Legacy database migration (engineer exploration)
  - Interactive learning (student education)
- "Perfect For" section highlighting target audiences
- Enhanced value propositions with clear benefits
- Infrastructure as Code setup with Terraform (in separate templates directory)
- Comprehensive roadmap for v1.0.0 to v1.5.0 enhancements

### Fixed
- LICENSE copyright year corrected to 2024

## [1.0.0] - 2024-03-27

### Added
- Production-grade MCP server for multi-database SQL management
- Support for 6 database types: PostgreSQL, MySQL, SQLite, MSSQL, MariaDB, Oracle
- Natural language to SQL query conversion
- Comprehensive security features:
  - Read-only mode for production databases
  - Query validation and dangerous pattern detection
  - Multi-statement query blocking
  - Query timeout and row limit protection
- Connection persistence and management
- Schema introspection and visualization
- ASCII table and chart rendering
- Multiple MCP client support (Claude Desktop, Claude Code, Cursor, etc.)
- Comprehensive test suite with Testcontainers
- Docker-based E2E testing environment
- Detailed documentation and examples

### Security
- SQL injection prevention with parameterized queries
- Credential storage in ~/.mcp-sql-explorer with restricted permissions (0600)
- Environment variable support for sensitive configuration
- Security policy (SECURITY.md) with vulnerability reporting process

## Release Types

### Types of Changes
- `Added` for new features
- `Changed` for changes in existing functionality
- `Deprecated` for soon-to-be removed features
- `Removed` for now removed features
- `Fixed` for any bug fixes
- `Security` for vulnerability fixes

## Version History

[Unreleased]: https://github.com/varkart/sql-lens-mcp/compare/v2.1.0...HEAD
[2.1.0]: https://github.com/varkart/sql-lens-mcp/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/varkart/sql-lens-mcp/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/varkart/sql-lens-mcp/releases/tag/v1.0.0
