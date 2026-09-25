// Remembers where to return after login/signup for the OAuth "connect app" flow (/mcp-auth?…).
// sessionStorage survives the login ↔ signup switch, OTP verification and Google sign-in,
// unlike router state. Only same-site OAuth consent paths are ever stored.
const KEY = 'nx_post_auth_redirect';

const allowed = (path: string) => path.startsWith('/mcp-auth');

export function rememberPostAuthRedirect(path: string) {
  try {
    if (allowed(path)) sessionStorage.setItem(KEY, path);
  } catch {
    /* storage unavailable: fall back to router state only */
  }
}

export function pendingPostAuthRedirect(): string | null {
  try {
    const v = sessionStorage.getItem(KEY);
    return v && allowed(v) ? v : null;
  } catch {
    return null;
  }
}

export function clearPostAuthRedirect() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
