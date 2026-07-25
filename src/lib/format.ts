// VND is a zero-decimal currency; group digits and append the ₫ sign.
export function formatVnd(n: number): string {
  return `${n.toLocaleString('vi-VN')}₫`;
}

// Elapsed time since an ISO timestamp, as mm:ss (hh:mm:ss past an hour) — used
// by the live "wash in progress" timer on both the driver and customer sides.
export function formatElapsed(sinceIso: string, nowMs: number): string {
  const totalSeconds = Math.max(0, Math.floor((nowMs - new Date(sinceIso).getTime()) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}
