/**
 * Web Crypto API utilities for ECDSA key pair generation.
 * Private key is stored in localStorage, public key is sent to the database.
 */

const PRIVATE_KEY_STORAGE_KEY = "proxipay_private_key";
const ALGORITHM = { name: "ECDSA", namedCurve: "P-256" };

/** Generate an ECDSA P-256 key pair */
export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(ALGORITHM, true, ["sign", "verify"]);
}

/** Export a CryptoKey to base64-encoded JWK JSON string */
async function exportKeyToBase64(key: CryptoKey): Promise<string> {
  const jwk = await crypto.subtle.exportKey("jwk", key);
  return btoa(JSON.stringify(jwk));
}

/** Import a public key from base64-encoded JWK JSON string */
export async function importPublicKey(base64: string): Promise<CryptoKey> {
  const jwk = JSON.parse(atob(base64));
  return crypto.subtle.importKey("jwk", jwk, ALGORITHM, true, ["verify"]);
}

/** Import a private key from base64-encoded JWK JSON string */
export async function importPrivateKey(base64: string): Promise<CryptoKey> {
  const jwk = JSON.parse(atob(base64));
  return crypto.subtle.importKey("jwk", jwk, ALGORITHM, true, ["sign"]);
}

/** Store the private key in localStorage (per user) */
export function storePrivateKey(userId: string, base64Key: string): void {
  localStorage.setItem(`${PRIVATE_KEY_STORAGE_KEY}_${userId}`, base64Key);
}

/** Retrieve the private key from localStorage (per user) */
export function getStoredPrivateKey(userId: string): string | null {
  return localStorage.getItem(`${PRIVATE_KEY_STORAGE_KEY}_${userId}`);
}

/** Generate key pair and return exportable base64 strings */
export async function generateAndExportKeyPair(): Promise<{
  publicKeyBase64: string;
  privateKeyBase64: string;
}> {
  const keyPair = await generateKeyPair();
  const [publicKeyBase64, privateKeyBase64] = await Promise.all([
    exportKeyToBase64(keyPair.publicKey),
    exportKeyToBase64(keyPair.privateKey),
  ]);
  return { publicKeyBase64, privateKeyBase64 };
}
