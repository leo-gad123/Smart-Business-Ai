import crypto from 'crypto';

/**
 * Generate a prefixed unique identifier (e.g. "sub-a1b2c3...").
 */
export function newUuid(prefix = 'id'): string {
  return `${prefix}-${crypto.randomUUID()}`;
}