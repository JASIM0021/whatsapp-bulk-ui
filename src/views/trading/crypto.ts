// Client-side Cryptography (E2EE) helper using Web Crypto API

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(pin),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as any,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptToken(token: string, pin: string): Promise<{ ciphertext: string; salt: string; iv: string }> {
  const enc = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const key = await deriveKey(pin, salt);
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv as any
    },
    key,
    enc.encode(token)
  );
  
  // Base64 encode the binary data for transportation
  const ciphertext = btoa(String.fromCharCode(...new Uint8Array(ciphertextBuffer)));
  
  return {
    ciphertext,
    salt: bytesToHex(salt),
    iv: bytesToHex(iv)
  };
}

export async function decryptToken(ciphertext: string, pin: string, saltHex: string, ivHex: string): Promise<string> {
  const salt = hexToBytes(saltHex);
  const iv = hexToBytes(ivHex);
  
  const key = await deriveKey(pin, salt);
  
  // Decode Base64
  const binaryString = atob(ciphertext);
  const ciphertextBytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    ciphertextBytes[i] = binaryString.charCodeAt(i);
  }
  
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv as any
    },
    key,
    ciphertextBytes
  );
  
  const dec = new TextDecoder();
  return dec.decode(decryptedBuffer);
}
