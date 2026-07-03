import type { ExecuteOptions } from '../utils/types.js';

// Tuned for AI assistants: large inline results burn the model's context
// window; pagination and the query-result:// export resources cover bulk data.
export const MAX_QUERY_TIMEOUT = 60000;
export const MAX_ROW_LIMIT = 1000;
export const DEFAULT_QUERY_TIMEOUT = 25000;
export const DEFAULT_MAX_ROWS = 25;

export function clampOptions(options: ExecuteOptions): ExecuteOptions {
  const clamped: ExecuteOptions = { ...options };

  if (clamped.timeout !== undefined) {
    clamped.timeout = Math.min(clamped.timeout, MAX_QUERY_TIMEOUT);
  }

  if (clamped.maxRows !== undefined) {
    clamped.maxRows = Math.min(clamped.maxRows, MAX_ROW_LIMIT);
  }

  if (clamped.offset !== undefined) {
    clamped.offset = Math.max(0, Math.floor(clamped.offset));
  }

  return clamped;
}

export interface ExecuteDefaults {
  queryTimeout: number;
  maxRows: number;
  readOnly: boolean;
}

export function resolveExecuteDefaults(
  config: { defaults: Partial<ExecuteDefaults> } | undefined,
  readOnly: boolean
): ExecuteDefaults {
  return {
    queryTimeout: config?.defaults.queryTimeout ?? DEFAULT_QUERY_TIMEOUT,
    maxRows: config?.defaults.maxRows ?? DEFAULT_MAX_ROWS,
    readOnly,
  };
}

export function buildExecuteOptions(
  defaults: { queryTimeout: number; maxRows: number; readOnly: boolean },
  overrides: ExecuteOptions = {}
): ExecuteOptions {
  const options: ExecuteOptions = {
    timeout: overrides.timeout ?? defaults.queryTimeout,
    maxRows: overrides.maxRows ?? defaults.maxRows,
    offset: overrides.offset ?? 0,
    readOnly: overrides.readOnly ?? defaults.readOnly,
  };

  return clampOptions(options);
}
