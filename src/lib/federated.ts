// Google / Apple sign-in client helpers. Each dynamically loads the provider
// SDK and resolves with the provider's ID token, which the caller posts to
// POST /api/auth/oauth. These stay dormant until the matching client id is
// configured (the SPA only shows the buttons when GET /api/auth/methods
// reports the provider enabled).

let googleScript: Promise<void> | null = null;
let appleScript: Promise<void> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`failed to load ${src}`));
    document.head.appendChild(s);
  });
}

interface GoogleCredentialResponse {
  credential: string;
}
interface GoogleId {
  initialize(cfg: {
    client_id: string;
    callback: (r: GoogleCredentialResponse) => void;
    auto_select?: boolean;
  }): void;
  prompt(): void;
}
interface AppleAuth {
  init(cfg: { clientId: string; scope: string; redirectURI: string; usePopup: boolean }): void;
  signIn(): Promise<{ authorization: { id_token: string } }>;
}
declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
    AppleID?: { auth: AppleAuth };
  }
}

// signInWithGoogle triggers Google Identity Services and resolves with the ID
// token from the One Tap / button callback.
export async function signInWithGoogle(clientId: string): Promise<string> {
  if (!googleScript) googleScript = loadScript('https://accounts.google.com/gsi/client');
  await googleScript;
  const gid = window.google?.accounts.id;
  if (!gid) throw new Error('Google SDK unavailable');
  return new Promise<string>((resolve, reject) => {
    gid.initialize({
      client_id: clientId,
      callback: (r) => (r.credential ? resolve(r.credential) : reject(new Error('no credential'))),
    });
    gid.prompt();
  });
}

// signInWithApple triggers AppleID JS and resolves with the id_token.
export async function signInWithApple(clientId: string): Promise<string> {
  if (!appleScript) {
    appleScript = loadScript(
      'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js',
    );
  }
  await appleScript;
  const appleAuth = window.AppleID?.auth;
  if (!appleAuth) throw new Error('Apple SDK unavailable');
  appleAuth.init({
    clientId,
    scope: 'name email',
    redirectURI: window.location.origin,
    usePopup: true,
  });
  const res = await appleAuth.signIn();
  return res.authorization.id_token;
}
