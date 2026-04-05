import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@modelcontextprotocol/ext-apps';

interface Connection {
  id: string;
  name: string;
  env: string;
  type: string;
  status: 'connected' | 'disconnected' | 'failed';
  error?: string;
  tableCount: number;
  connectedAt?: string;
  uptime: number;
}

const statusIcons = {
  connected: '🟢',
  failed: '🔴',
  disconnected: '⚪',
};

const statusColors = {
  connected: '#10b981',
  failed: '#ef4444',
  disconnected: '#6b7280',
};

function formatUptime(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function ConnectionManager() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [filter, setFilter] = useState<'all' | 'connected' | 'failed' | 'disconnected'>('all');
  const [envFilter, setEnvFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const app = new App();

  const fetchConnections = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await app.readResource('ui://connection-manager/data');
      const data = JSON.parse(response.contents[0].text);
      setConnections(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();

    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchConnections, 5000);

    return () => clearInterval(interval);
  }, []);

  const filteredConnections = connections.filter(conn => {
    // Status filter
    if (filter !== 'all' && conn.status !== filter) return false;

    // Environment filter
    if (envFilter !== 'all' && conn.env !== envFilter) return false;

    // Type filter
    if (typeFilter !== 'all' && conn.type !== typeFilter) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        conn.id.toLowerCase().includes(query) ||
        conn.name.toLowerCase().includes(query) ||
        conn.type.toLowerCase().includes(query) ||
        conn.env.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const environments = Array.from(new Set(connections.map(c => c.env)));
  const types = Array.from(new Set(connections.map(c => c.type)));

  const stats = {
    total: connections.length,
    connected: connections.filter(c => c.status === 'connected').length,
    failed: connections.filter(c => c.status === 'failed').length,
    disconnected: connections.filter(c => c.status === 'disconnected').length,
  };

  if (loading && connections.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading connections...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>Error: {error}</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Database Connections</h1>
        <div style={styles.stats}>
          <span style={styles.stat}>Total: {stats.total}</span>
          <span style={styles.stat}>{statusIcons.connected} {stats.connected}</span>
          <span style={styles.stat}>{statusIcons.failed} {stats.failed}</span>
          <span style={styles.stat}>{statusIcons.disconnected} {stats.disconnected}</span>
        </div>
      </header>

      <div style={styles.filters}>
        <input
          type="text"
          placeholder="Search connections..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.search}
        />

        <select value={filter} onChange={(e) => setFilter(e.target.value as any)} style={styles.select}>
          <option value="all">All Status</option>
          <option value="connected">Connected</option>
          <option value="failed">Failed</option>
          <option value="disconnected">Disconnected</option>
        </select>

        <select value={envFilter} onChange={(e) => setEnvFilter(e.target.value)} style={styles.select}>
          <option value="all">All Environments</option>
          {environments.map(env => (
            <option key={env} value={env}>{env}</option>
          ))}
        </select>

        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={styles.select}>
          <option value="all">All Types</option>
          {types.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      <div style={styles.connectionList}>
        {filteredConnections.length === 0 ? (
          <div style={styles.empty}>No connections match your filters</div>
        ) : (
          filteredConnections.map(conn => (
            <div key={conn.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardTitle}>
                  <span style={styles.statusIcon}>{statusIcons[conn.status]}</span>
                  <span style={styles.connectionName}>{conn.name}</span>
                  <span style={styles.connectionId}>({conn.id})</span>
                </div>
                <span style={{
                  ...styles.badge,
                  backgroundColor: statusColors[conn.status] + '20',
                  color: statusColors[conn.status],
                }}>
                  {conn.status}
                </span>
              </div>

              <div style={styles.cardBody}>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Environment:</span>
                  <span style={styles.value}>{conn.env}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Type:</span>
                  <span style={styles.value}>{conn.type}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Tables:</span>
                  <span style={styles.value}>{conn.tableCount}</span>
                </div>
                {conn.connectedAt && (
                  <div style={styles.infoRow}>
                    <span style={styles.label}>Uptime:</span>
                    <span style={styles.value}>{formatUptime(conn.uptime)}</span>
                  </div>
                )}
                {conn.error && (
                  <div style={styles.errorRow}>
                    <span style={styles.label}>Error:</span>
                    <span style={styles.errorText}>{conn.error}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <footer style={styles.footer}>
        <span style={styles.footerText}>Auto-refreshing every 5 seconds</span>
        <button onClick={fetchConnections} style={styles.refreshButton}>
          Refresh Now
        </button>
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#f9fafb',
    minHeight: '100vh',
  },
  header: {
    marginBottom: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#111827',
    margin: '0 0 12px 0',
  },
  stats: {
    display: 'flex',
    gap: '16px',
    fontSize: '14px',
    color: '#6b7280',
  },
  stat: {
    display: 'inline-block',
  },
  filters: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  search: {
    flex: '1',
    minWidth: '200px',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
  },
  select: {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'white',
    cursor: 'pointer',
    outline: 'none',
  },
  connectionList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '16px',
    marginBottom: '20px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    paddingBottom: '12px',
    borderBottom: '1px solid #e5e7eb',
  },
  cardTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  statusIcon: {
    fontSize: '16px',
  },
  connectionName: {
    fontWeight: '600',
    color: '#111827',
    fontSize: '16px',
  },
  connectionId: {
    color: '#6b7280',
    fontSize: '14px',
  },
  badge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
  },
  label: {
    color: '#6b7280',
    fontWeight: '500',
  },
  value: {
    color: '#111827',
  },
  errorRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginTop: '4px',
    padding: '8px',
    backgroundColor: '#fef2f2',
    borderRadius: '4px',
  },
  errorText: {
    color: '#dc2626',
    fontSize: '13px',
    fontFamily: 'monospace',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  footerText: {
    fontSize: '14px',
    color: '#6b7280',
  },
  refreshButton: {
    padding: '8px 16px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '16px',
    color: '#6b7280',
  },
  error: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '16px',
    color: '#dc2626',
  },
  empty: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '16px',
    color: '#6b7280',
    gridColumn: '1 / -1',
  },
};

const root = createRoot(document.getElementById('root')!);
root.render(<ConnectionManager />);
