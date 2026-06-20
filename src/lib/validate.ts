export const NAME_RESERVED = new Set([
  'admin', 'administrator', 'api', 'check', 'claim', 'contact',
  'help', 'info', 'mail', 'me', 'nip05', 'nostru', 'nostr',
  'postmaster', 'root', 'security', 'support', 'system',
  'webmaster', 'well-known', 'www', '_', '__',
]);

const NAME_RE = /^[a-z0-9][a-z0-9_-]{0,28}[a-z0-9]$|^[a-z0-9]$/;
const HEX64_RE = /^[0-9a-f]{64}$/;

export function validateName(name: string): string | null {
  if (!name) return 'Name is required';
  if (name.length > 30) return 'Name must be 30 characters or fewer';
  if (!NAME_RE.test(name)) return 'Name must be lowercase letters, digits, hyphens, or underscores; cannot start or end with a hyphen or underscore';
  if (NAME_RESERVED.has(name)) return `"${name}" is reserved`;
  return null;
}

export function validatePubkey(pubkey: string): string | null {
  if (!HEX64_RE.test(pubkey)) return 'Pubkey must be a 64-character lowercase hex string';
  if (pubkey === '0'.repeat(64)) return 'Pubkey must not be the zero key';
  return null;
}
