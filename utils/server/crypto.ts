import { randomBytes } from 'crypto';

export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

export function generateSessionId(): string {
  return generateSecureToken(24);
}
