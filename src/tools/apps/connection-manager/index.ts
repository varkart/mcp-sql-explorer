import type { ToolRegistration } from '../../types.js';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const registerConnectionManagerApp: ToolRegistration = (server, { manager, config }) => {
  // Check if apps are enabled
  const appsEnabled = config?.apps?.enabled !== false;
  const connectionManagerEnabled = config?.apps?.connectionManager?.enabled !== false;

  if (!appsEnabled || !connectionManagerEnabled) {
    return;
  }

  // Register the tool
  server.registerTool(
    'view_database_connections',
    {
      description: 'Open an interactive dashboard to view and manage all database connections',
      inputSchema: undefined,
      _meta: {
        ui: {
          type: 'app' as const,
          title: 'Database Connections',
          description: 'View connection status, schema info, and statistics for all databases',
        },
      },
    },
    async () => {
      // Load the bundled HTML file
      const htmlPath = join(__dirname, '../../../../dist/ui/connection-manager/index.html');
      try {
        const html = await fs.readFile(htmlPath, 'utf-8');
        return {
          content: [{
            type: 'resource' as const,
            resource: {
              uri: 'ui://connection-manager',
              text: html,
              mimeType: 'text/html',
            },
          }],
        };
      } catch (error) {
        const err = error as Error;
        return {
          content: [{
            type: 'text' as const,
            text: `Failed to load Connection Manager UI: ${err.message}`,
          }],
        };
      }
    }
  );

  // Register the UI resource
  server.registerResource(
    'connection-manager-ui',
    'ui://connection-manager',
    {
      description: 'Interactive dashboard for database connections',
      mimeType: 'text/html',
    },
    async () => {
      // Load the bundled HTML file
      const htmlPath = join(__dirname, '../../../../dist/ui/connection-manager/index.html');
      try {
        const html = await fs.readFile(htmlPath, 'utf-8');
        return {
          contents: [{
            uri: 'ui://connection-manager',
            mimeType: 'text/html',
            text: html,
          }],
        };
      } catch (error) {
        const err = error as Error;
        throw new Error(`Failed to load Connection Manager UI: ${err.message}`);
      }
    }
  );

  // Register data endpoint resource for the app
  server.registerResource(
    'connection-manager-data',
    'ui://connection-manager/data',
    {
      description: 'Live connection data for the dashboard',
      mimeType: 'application/json',
    },
    async () => {
      const connections = manager.listConnections();
      const data = connections.map(conn => ({
        id: conn.id,
        name: conn.name || conn.id,
        env: conn.env || 'default',
        type: conn.config.type,
        status: conn.status,
        error: conn.error,
        tableCount: conn.schema?.tables.length || 0,
        connectedAt: conn.connectedAt?.toISOString(),
        uptime: conn.connectedAt ? Date.now() - conn.connectedAt.getTime() : 0,
      }));

      return {
        contents: [{
          uri: 'ui://connection-manager/data',
          mimeType: 'application/json',
          text: JSON.stringify(data, null, 2),
        }],
      };
    }
  );
};
