export interface Env {
  NIP05: KVNamespace;
}

const NAME_KEY = (name: string) => `name:${name}`;
const PUBKEY_KEY = (pubkey: string) => `pubkey:${pubkey}`;

export async function lookupName(kv: KVNamespace, name: string): Promise<string | null> {
  return kv.get(NAME_KEY(name));
}

export async function lookupPubkey(kv: KVNamespace, pubkey: string): Promise<string | null> {
  return kv.get(PUBKEY_KEY(pubkey));
}

export async function claimName(kv: KVNamespace, name: string, pubkey: string): Promise<void> {
  const [existingPubkey, existingName] = await Promise.all([
    kv.get(NAME_KEY(name)),
    kv.get(PUBKEY_KEY(pubkey)),
  ]);
  if (existingPubkey !== null) throw new ClaimError('name_taken', 'Name is already claimed');
  if (existingName !== null) throw new ClaimError('pubkey_taken', `This pubkey already owns "${existingName}"`);
  await Promise.all([
    kv.put(NAME_KEY(name), pubkey),
    kv.put(PUBKEY_KEY(pubkey), name),
  ]);
}

export class ClaimError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = 'ClaimError';
  }
}
