// Local two-user auth. No backend: passwords are checked against
// SHA-256 hashes via Web Crypto, and the active user is kept in
// localStorage so each session opens that user's own IndexedDB.
export interface AppUser {
  id: string;
  displayName: string;
  /** SHA-256 hex of the password */
  passwordHash: string;
  /** IndexedDB database name holding this user's progress */
  dbName: string;
}

// Nuno keeps the original "ccna-pwa" DB so pre-login progress is preserved.
export const USERS: AppUser[] = [
  {
    id: "nuno",
    displayName: "Nuno",
    passwordHash: "0b682ba04b77fbec8ff17b8b8fb1ddb9c6d5a34ef7d0d719a268f92c34ed9d82",
    dbName: "ccna-pwa"
  },
  {
    id: "chloe",
    displayName: "Chloe",
    passwordHash: "f5bd323fe4cfd46e3724ad716f1f321f4ae602436f64ff4835318fa0c8fd118a",
    dbName: "ccna-pwa-chloe"
  }
];

const SESSION_KEY = "ccna-user";
const TOKEN_KEY = "ccna-token";

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  // crypto.subtle only exists in secure contexts (HTTPS or localhost).
  // The app is served over plain HTTP on the LAN, so fall back to a
  // pure-JS SHA-256 there.
  if (crypto?.subtle) {
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  return sha256Js(data);
}

// Minimal SHA-256 (FIPS 180-4) for non-secure contexts.
function sha256Js(bytes: Uint8Array): string {
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];
  const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const rr = (x: number, n: number) => (x >>> n) | (x << (32 - n));

  const len = bytes.length;
  const bitLen = len * 8;
  const padded = new Uint8Array((((len + 8) >> 6) + 1) << 6);
  padded.set(bytes);
  padded[len] = 0x80;
  new DataView(padded.buffer).setUint32(padded.length - 4, bitLen >>> 0);
  new DataView(padded.buffer).setUint32(padded.length - 8, Math.floor(bitLen / 0x100000000));

  const w = new Array<number>(64);
  for (let i = 0; i < padded.length; i += 64) {
    const view = new DataView(padded.buffer, i, 64);
    for (let t = 0; t < 16; t++) w[t] = view.getUint32(t * 4);
    for (let t = 16; t < 64; t++) {
      const s0 = rr(w[t - 15], 7) ^ rr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
      const s1 = rr(w[t - 2], 17) ^ rr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let t = 0; t < 64; t++) {
      const S1 = rr(e, 6) ^ rr(e, 11) ^ rr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K[t] + w[t]) >>> 0;
      const S0 = rr(a, 2) ^ rr(a, 13) ^ rr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0;
      d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0; H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0; H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
  }
  return H.map((x) => x.toString(16).padStart(8, "0")).join("");
}

export function currentUser(): AppUser | null {
  const id = localStorage.getItem(SESSION_KEY);
  return USERS.find((u) => u.id === id) ?? null;
}

/** Token sent to the sync API (the verified password hash). */
export function authToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export async function login(userId: string, password: string): Promise<AppUser | null> {
  const user = USERS.find((u) => u.id === userId);
  if (!user) return null;
  const hash = await sha256Hex(password);
  if (hash !== user.passwordHash) return null;
  localStorage.setItem(SESSION_KEY, user.id);
  localStorage.setItem(TOKEN_KEY, hash);
  return user;
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(TOKEN_KEY);
  // Reload so the cached IndexedDB connection and all in-memory
  // progress state are dropped before the next user signs in.
  window.location.assign("/");
}
