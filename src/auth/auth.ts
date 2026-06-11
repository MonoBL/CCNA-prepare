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
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
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
