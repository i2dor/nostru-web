import { describe, it, expect } from 'vitest';
import { validateName, validatePubkey, NAME_RESERVED } from './validate';

describe('validateName', () => {
  it('accepts simple lowercase names', () => {
    expect(validateName('alice')).toBeNull();
    expect(validateName('bob123')).toBeNull();
    expect(validateName('satoshi')).toBeNull();
  });

  it('accepts names with hyphens and underscores mid-word', () => {
    expect(validateName('alice-bob')).toBeNull();
    expect(validateName('hello_world')).toBeNull();
  });

  it('accepts single character names', () => {
    expect(validateName('a')).toBeNull();
    expect(validateName('z')).toBeNull();
  });

  it('accepts 30-char name (max)', () => {
    expect(validateName('a'.repeat(30))).toBeNull();
  });

  it('rejects empty string', () => {
    expect(validateName('')).not.toBeNull();
  });

  it('rejects names longer than 30 chars', () => {
    expect(validateName('a'.repeat(31))).not.toBeNull();
  });

  it('rejects uppercase letters', () => {
    expect(validateName('Alice')).not.toBeNull();
    expect(validateName('ALICE')).not.toBeNull();
  });

  it('rejects names with spaces', () => {
    expect(validateName('alice bob')).not.toBeNull();
  });

  it('rejects names with special chars', () => {
    expect(validateName('alice@bob')).not.toBeNull();
    expect(validateName('alice.bob')).not.toBeNull();
    expect(validateName('alice+bob')).not.toBeNull();
  });

  it('rejects leading hyphen', () => {
    expect(validateName('-alice')).not.toBeNull();
  });

  it('rejects trailing hyphen', () => {
    expect(validateName('alice-')).not.toBeNull();
  });

  it('rejects leading underscore', () => {
    expect(validateName('_alice')).not.toBeNull();
  });

  it('rejects trailing underscore', () => {
    expect(validateName('alice_')).not.toBeNull();
  });

  it('rejects all reserved names', () => {
    for (const name of NAME_RESERVED) {
      expect(validateName(name)).not.toBeNull();
    }
  });

  it('rejects reserved names case-insensitively (input already lowercased)', () => {
    expect(validateName('admin')).not.toBeNull();
    expect(validateName('nostru')).not.toBeNull();
  });
});

describe('validatePubkey', () => {
  const VALID = 'a'.repeat(64);

  it('accepts a valid 64-char lowercase hex pubkey', () => {
    expect(validatePubkey(VALID)).toBeNull();
    expect(validatePubkey('0'.repeat(63) + '1')).toBeNull();
  });

  it('rejects wrong length', () => {
    expect(validatePubkey('a'.repeat(63))).not.toBeNull();
    expect(validatePubkey('a'.repeat(65))).not.toBeNull();
    expect(validatePubkey('')).not.toBeNull();
  });

  it('rejects non-hex characters', () => {
    expect(validatePubkey('g'.repeat(64))).not.toBeNull();
    expect(validatePubkey('A'.repeat(64))).not.toBeNull();
  });

  it('rejects all-zero pubkey', () => {
    expect(validatePubkey('0'.repeat(64))).not.toBeNull();
  });
});
