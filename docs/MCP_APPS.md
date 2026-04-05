# MCP Apps

MCP Apps are interactive UI components that extend the SQL MCP server with rich visual interfaces. They're built using React and served through the Model Context Protocol.

## Available Apps

### Connection Manager

An interactive dashboard for viewing and managing all database connections.

**Features:**
- Real-time connection status (🟢 connected, 🔴 failed, ⚪ disconnected)
- Connection details: ID, name, environment, database type
- Table count and uptime tracking
- Error display for failed connections
- Filter by status, environment, or database type
- Search connections by ID, name, type, or environment
- Auto-refresh every 5 seconds

**Usage:**
Simply ask Claude Code to "view my database connections" and the interactive dashboard will open.

## Configuration

MCP Apps are enabled by default with zero configuration required. You can control them through your `sql-mcp.config.json` file or environment variables.

### Configuration File

```json
{
  "apps": {
    "enabled": true,
    "connectionManager": {
      "enabled": true
    }
  }
}
```

### Environment Variables

- `SQL_MCP_APPS_ENABLED`: Enable/disable all MCP Apps (default: `true`)
- `SQL_MCP_APP_CONNECTION_MANAGER_ENABLED`: Enable/disable Connection Manager app (default: `true`)

To disable all apps:
```bash
export SQL_MCP_APPS_ENABLED=false
```

To disable only the Connection Manager:
```bash
export SQL_MCP_APP_CONNECTION_MANAGER_ENABLED=false
```

## Development

### Building UI Components

UI components are stored in `ui/` and built to `dist/ui/`:

```bash
# Build UI components
npm run build:ui

# Build everything (TypeScript + UI)
npm run build:all
```

### UI Structure

```
ui/
└── connection-manager/
    ├── index.html          # HTML template
    └── app.tsx            # React component

dist/ui/
└── connection-manager/
    └── index.html         # Built bundle (single file)
```

### Creating New Apps

1. Create UI component in `ui/your-app/`
2. Add build configuration in `build-ui.js`
3. Create registration in `src/tools/apps/your-app/index.ts`
4. Export from `src/tools/apps/index.ts`
5. Register in `src/tools/index.ts`
6. Add configuration to `ServerConfig` type

## Technical Details

- **Framework**: React 19 with TypeScript
- **Bundler**: esbuild (single-file HTML output)
- **MCP Integration**: `@modelcontextprotocol/ext-apps` App class
- **Protocol**: Resources served via `ui://` URIs
- **Auto-refresh**: Data endpoints polled every 5 seconds

## Tool Registration

Apps are registered as MCP tools with `_meta.ui` field:

```typescript
server.registerTool(
  'view_database_connections',
  {
    description: 'Open an interactive dashboard',
    _meta: {
      ui: {
        type: 'app',
        title: 'Database Connections',
        description: 'View connection status',
      },
    },
  },
  async () => {
    // Return HTML resource
  }
);
```

## Browser Requirements

MCP Apps require a client that supports:
- MCP Apps specification
- Resource content type in tool responses
- HTML rendering with JavaScript execution

Claude Code supports all these features natively.
