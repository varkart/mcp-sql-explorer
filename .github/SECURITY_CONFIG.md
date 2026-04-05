# Security Configuration Guide

This document outlines the security configurations for the mcp-sql-explorer repository.

## Automated Security Configurations

### ✅ Branch Protection (Enabled)

The `main` branch is protected with the following rules:

- **Pull Request Reviews Required**: At least 1 approval needed
- **Dismiss Stale Reviews**: Enabled when new commits are pushed
- **Status Checks Required**: Must pass before merge
  - `build` - CI build and tests across Node.js versions
  - `security` - npm audit security scan
- **Up-to-date Branches**: Must be current with base branch
- **Linear History**: Required (no merge commits)
- **Force Pushes**: Disabled
- **Branch Deletions**: Disabled
- **Conversation Resolution**: All review comments must be resolved
- **Admin Enforcement**: Rules apply to administrators

### ✅ Security Scanning

**CodeQL Analysis** (`.github/workflows/codeql.yml`):
- Runs on every push and pull request to `main` and `dev`
- Weekly scheduled scan (Mondays at 9:00 AM UTC)
- Extended security queries enabled
- Scans for:
  - SQL injection vulnerabilities
  - Command injection
  - Path traversal
  - XSS vulnerabilities
  - Authentication issues
  - Cryptographic weaknesses

**npm Audit** (`.github/workflows/ci.yml`):
- Runs on every push and pull request
- Fails CI if high-severity vulnerabilities detected
- Audit level: `high` (blocks critical and high severity issues)

### ✅ Dependency Management

**Dependabot** (`.github/dependabot.yml`):
- Weekly npm dependency updates (Mondays at 9:00 AM)
- Monthly GitHub Actions updates
- Automatic security updates
- Groups minor/patch updates
- Assigns to @varkart for review

### ✅ npm Publishing Security

**Publish Workflow** (`.github/workflows/publish.yml`):
- Requires GitHub release to trigger
- Protected environment: `npm-production`
- Required reviewer approval
- Provenance enabled (npm 9.5.0+)
- Minimal permissions (id-token: write, contents: read)
- Tests run before publish
- Package verification step

## Manual Configuration Required

### 🔧 GitHub Actions Permissions

**Current Status**: All actions allowed (permissive)
**Recommended**: Restrict to verified actions only

#### Steps to Configure:

1. Go to **Settings** → **Actions** → **General**
2. Under "Actions permissions", select **"Allow select actions and reusable workflows"**
3. Add these trusted action patterns:
   ```
   actions/*
   github/*
   ```
4. Click **Save**

**Why**: Limits workflow to official GitHub actions and explicitly approved third-party actions, reducing supply chain attack risk.

### 🔧 Optional: Automatic Branch Deletion

**Current Status**: Disabled
**Recommended**: Enable for cleaner repository

#### Steps to Configure:

1. Go to **Settings** → **General**
2. Scroll to "Pull Requests"
3. Check **"Automatically delete head branches"**
4. Click **Save changes**

**Why**: Automatically removes feature branches after PR merge, keeping repository tidy.

### 🔧 Optional: Standardize Merge Strategy

**Current Status**: All merge strategies enabled (merge commit, squash, rebase)
**Recommended**: Choose one for consistency

#### Steps to Configure:

1. Go to **Settings** → **General**
2. Scroll to "Pull Requests"
3. Choose **one** of:
   - ✅ **Squash merging** (recommended for cleaner history)
   - ⚪ Allow merge commits
   - ⚪ Allow rebase merging
4. Click **Save changes**

**Why**: Consistent merge strategy makes history easier to read and understand.

## Security Monitoring

### GitHub Security Features Enabled

- ✅ **Dependabot alerts**: Automatic vulnerability detection
- ✅ **Dependabot security updates**: Automatic PR creation for vulnerabilities
- ✅ **Code scanning**: CodeQL analysis for security issues
- ✅ **Secret scanning**: Detects accidentally committed secrets

### Secrets Management

The repository uses the following secrets:

- `NPM_TOKEN`: npm authentication token (used in publish workflow)
  - Stored in: Repository secrets
  - Used by: `npm-production` environment
  - Scope: Publish access to mcp-sql-explorer package

**Best Practices**:
- Secrets are never logged or exposed in workflow outputs
- npm token should have minimal scope (publish only)
- Rotate npm token every 90 days
- Use environment protection for sensitive deployments

## Security Checklist

Before each release:

- [ ] All CI checks passing
- [ ] No high/critical npm audit vulnerabilities
- [ ] CodeQL analysis shows no new issues
- [ ] Dependabot PRs reviewed and merged
- [ ] All PR conversations resolved
- [ ] At least 1 code review approval
- [ ] Tests passing on all supported Node.js versions
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json

## Incident Response

If a security vulnerability is discovered:

1. **DO NOT** create a public GitHub issue
2. Use GitHub Security Advisories or email security@varkart.com
3. Follow disclosure timeline in SECURITY.md
4. Coordinate patch release
5. Publish security advisory after fix is released

## Additional Resources

- [SECURITY.md](../SECURITY.md) - Security policy and vulnerability reporting
- [GitHub Actions Security Hardening](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
- [npm Package Provenance](https://docs.npmjs.com/generating-provenance-statements)
- [Branch Protection Best Practices](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)

---

**Last Updated**: 2026-04-05
**Maintained By**: @varkart
