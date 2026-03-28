---
name: Bug Report
about: Create a report to help us improve
title: '[BUG] '
labels: bug
assignees: ''
---

## Bug Description

<!-- A clear and concise description of what the bug is -->

## Steps to Reproduce

1.
2.
3.
4.

## Expected Behavior

<!-- What you expected to happen -->

## Actual Behavior

<!-- What actually happened -->

## Environment

**System Information**:
- OS: <!-- e.g., macOS 14.0, Ubuntu 22.04, Windows 11 -->
- Node.js Version: <!-- output of `node --version` -->
- npm Version: <!-- output of `npm --version` -->
- sql-mcp Version: <!-- version number or commit hash -->
- Docker Version: <!-- if running integration tests -->

**Database Information** (if applicable):
- Database Type: <!-- e.g., PostgreSQL, MySQL, SQLite -->
- Database Version: <!-- e.g., PostgreSQL 16, MySQL 8.4 -->
- Connection Type: <!-- e.g., local, remote, Docker container -->

## Error Messages / Logs

<!-- Include relevant error messages, stack traces, or logs -->

```
Paste error messages here
```

## Configuration

<!-- If relevant, share your configuration (remove sensitive data) -->

```json
{
  "defaults": {
    "readOnly": true,
    "queryTimeout": 30000,
    "maxRows": 1000
  },
  "connections": {
    ...
  }
}
```

## Code Sample

<!-- If applicable, provide a minimal code sample that reproduces the issue -->

```typescript
// Your code here
```

## Screenshots

<!-- If applicable, add screenshots to help explain the problem -->

## Additional Context

<!-- Add any other context about the problem here -->

## Possible Solution

<!-- If you have suggestions on how to fix the bug, please share -->

## Checklist

- [ ] I have searched existing issues to avoid duplicates
- [ ] I have included all relevant information above
- [ ] I have tested with the latest version
- [ ] I can reproduce this bug consistently
- [ ] I have included error messages/logs
- [ ] I have removed sensitive information from logs/config
