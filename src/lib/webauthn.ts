// WebAuthn (passkey) client helpers. Bridges the JSON options the backend
// emits (go-webauthn: base64url-encoded binary fields) to the ArrayBuffers the
// browser API needs, and serializes the resulting credential back to the JSON
// the backend parser expects.
import { api } from './api';
import type { AuthResult } from '../types';

export function passkeySupported(): boolean {
  return typeof window !== 'undefined' && !!window.PublicKeyCredential;
}

function b64urlToBuf(s: string): ArrayBuffer {
  const pad = '='.repeat((4 - (s.length % 4)) % 4);
  const b64 = (s + pad).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

function bufToB64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 1) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

interface DescriptorJSON {
  id: string;
  type: PublicKeyCredentialType;
  transports?: AuthenticatorTransport[];
}
function decodeDescriptors(list?: DescriptorJSON[]): PublicKeyCredentialDescriptor[] | undefined {
  return list?.map((d) => ({ id: b64urlToBuf(d.id), type: d.type, transports: d.transports }));
}

// serializeCredential renders a PublicKeyCredential (registration or assertion)
// into the plain JSON the backend's go-webauthn parser reads.
function serializeCredential(cred: PublicKeyCredential): unknown {
  const res = cred.response as AuthenticatorResponse & Record<string, ArrayBuffer | null>;
  const response: Record<string, string> = {
    clientDataJSON: bufToB64url(res.clientDataJSON),
  };
  if ('attestationObject' in res && res.attestationObject) {
    response.attestationObject = bufToB64url(res.attestationObject as ArrayBuffer);
  }
  if ('authenticatorData' in res && res.authenticatorData) {
    response.authenticatorData = bufToB64url(res.authenticatorData as ArrayBuffer);
    response.signature = bufToB64url(res.signature as ArrayBuffer);
    if (res.userHandle) response.userHandle = bufToB64url(res.userHandle as ArrayBuffer);
  }
  return {
    id: cred.id,
    rawId: bufToB64url(cred.rawId),
    type: cred.type,
    response,
    clientExtensionResults: cred.getClientExtensionResults(),
  };
}

interface BeginResponse {
  handle: string;
  options: { publicKey: Record<string, unknown> };
}

// registerPasskey runs the registration ceremony for the logged-in user and
// stores the credential server-side. Returns false if the user cancels.
export async function registerPasskey(label?: string): Promise<boolean> {
  const begin = await api<BeginResponse>('/api/auth/passkey/register/begin', { method: 'POST' });
  const pk = begin.options.publicKey as unknown as PublicKeyCredentialCreationOptions & {
    challenge: string;
    user: { id: string; name: string; displayName: string };
    excludeCredentials?: DescriptorJSON[];
  };
  const publicKey: PublicKeyCredentialCreationOptions = {
    ...pk,
    challenge: b64urlToBuf(pk.challenge),
    user: { ...pk.user, id: b64urlToBuf(pk.user.id) },
    excludeCredentials: decodeDescriptors(pk.excludeCredentials),
  };
  let cred: PublicKeyCredential | null;
  try {
    cred = (await navigator.credentials.create({ publicKey })) as PublicKeyCredential | null;
  } catch {
    return false; // user dismissed the prompt
  }
  if (!cred) return false;
  await api('/api/auth/passkey/register/finish', {
    method: 'POST',
    body: { handle: begin.handle, response: serializeCredential(cred), label },
  });
  return true;
}

// loginWithPasskey runs the discoverable login ceremony (no email typed) and
// returns the washee session. Returns null if the user cancels.
export async function loginWithPasskey(): Promise<AuthResult | null> {
  const begin = await api<BeginResponse>('/api/auth/passkey/login/begin', {
    method: 'POST',
    auth: false,
  });
  const pk = begin.options.publicKey as unknown as PublicKeyCredentialRequestOptions & {
    challenge: string;
    allowCredentials?: DescriptorJSON[];
  };
  const publicKey: PublicKeyCredentialRequestOptions = {
    ...pk,
    challenge: b64urlToBuf(pk.challenge),
    allowCredentials: decodeDescriptors(pk.allowCredentials),
  };
  let cred: PublicKeyCredential | null;
  try {
    cred = (await navigator.credentials.get({ publicKey })) as PublicKeyCredential | null;
  } catch {
    return null;
  }
  if (!cred) return null;
  return api<AuthResult>('/api/auth/passkey/login/finish', {
    method: 'POST',
    auth: false,
    body: { handle: begin.handle, response: serializeCredential(cred) },
  });
}
