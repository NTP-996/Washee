import { useEffect, useState } from 'react';
import { formatElapsed } from './format';

// Ticks every second and returns a live "mm:ss" elapsed-time readout against
// `sinceIso`, or null while there's nothing to time. Shared by the driver's
// job-sheet timer and the customer's "wash in progress" panel so both render
// the exact same clock.
export function useElapsed(sinceIso: string | null | undefined): string | null {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!sinceIso) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [sinceIso]);

  if (!sinceIso) return null;
  return formatElapsed(sinceIso, now);
}
