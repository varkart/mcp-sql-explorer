import { SecurityError } from '../utils/errors.js';

const IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-z0-9_$]*$/;
const MAX_IDENTIFIER_LENGTH = 128;

export function isValidIdentifier(value: string): boolean {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= MAX_IDENTIFIER_LENGTH &&
    IDENTIFIER_PATTERN.test(value)
  );
}

export function assertValidIdentifier(value: string, kind = 'identifier'): void {
  if (!isValidIdentifier(value)) {
    throw new SecurityError(
      `Invalid ${kind} '${String(value).slice(0, 64)}': only letters, digits, underscore and $ are allowed (must start with a letter or underscore, max ${MAX_IDENTIFIER_LENGTH} chars)`
    );
  }
}
