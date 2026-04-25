/**
 * Single-use signed payment tokens with 30-second TTL.
 * Tokens are signed locally with the device private key (ECDSA P-256).
 * Used token IDs are tracked in localStorage to enforce single-use.
 */

import {
  importPrivateKey,
  importPublicKey,
  getStoredPrivateKey,
} from "./crypto";

const USED_TOKENS_KEY = "proxipay_used_tokens";
export const TOKEN_TTL_MS = 30_000;

export interface PaymentTokenPayload {
  tokenId: string;
  senderId: string;
  amount: number;
  issuedAt: number;
  expiresAt: number;
}

export interface SignedPaymentToken {
  payload: PaymentTokenPayload;
  signature: string; // base64
}

function bufToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function base64ToBuf(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

/** Generate and sign a single-use payment token (TTL = 30s). */
export async function generatePaymentToken(
  senderId: string,
  amount: number,
): Promise<SignedPaymentToken> {
  const privateKeyB64 = getStoredPrivateKey(senderId);
  if (!privateKeyB64) {
    throw new Error("No device key found. Please re-login to provision keys.");
  }

  const privateKey = await importPrivateKey(privateKeyB64);
  const now = Date.now();
  const payload: PaymentTokenPayload = {
    tokenId: crypto.randomUUID(),
    senderId,
    amount,
    issuedAt: now,
    expiresAt: now + TOKEN_TTL_MS,
  };

  const data = new TextEncoder().encode(JSON.stringify(payload));
  const sigBuf = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privateKey,
    data,
  );

  return { payload, signature: bufToBase64(sigBuf) };
}

export type ValidationResult =
  | { valid: true }
  | { valid: false; reason: string };

/** Validate a signed token: signature, expiry, and single-use. */
export async function validatePaymentToken(
  token: SignedPaymentToken,
  senderPublicKeyBase64: string,
): Promise<ValidationResult> {
  // 1. Expiry check
  if (Date.now() > token.payload.expiresAt) {
    return { valid: false, reason: "Token expired" };
  }

  // 2. Single-use check
  if (isTokenUsed(token.payload.tokenId)) {
    return { valid: false, reason: "Token already used" };
  }

  // 3. Signature verification
  try {
    const publicKey = await importPublicKey(senderPublicKeyBase64);
    const data = new TextEncoder().encode(JSON.stringify(token.payload));
    const ok = await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      publicKey,
      base64ToBuf(token.signature),
      data,
    );
    if (!ok) return { valid: false, reason: "Invalid signature" };
  } catch {
    return { valid: false, reason: "Signature verification failed" };
  }

  return { valid: true };
}

function getUsedTokens(): string[] {
  try {
    return JSON.parse(localStorage.getItem(USED_TOKENS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function isTokenUsed(tokenId: string): boolean {
  return getUsedTokens().includes(tokenId);
}

/** Mark a token as consumed so it cannot be reused. */
export function markTokenUsed(tokenId: string): void {
  const used = getUsedTokens();
  if (!used.includes(tokenId)) {
    used.push(tokenId);
    // Cap to last 200 entries
    const trimmed = used.slice(-200);
    localStorage.setItem(USED_TOKENS_KEY, JSON.stringify(trimmed));
  }
}
