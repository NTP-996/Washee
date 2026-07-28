import { useCallback, useEffect, useRef, useState } from 'react';

// Exported so callers can request PAGE_LIMIT + 1 rows from the backend (the
// limit+1 keyset-pagination convention used across every admin list endpoint).
export const PAGE_LIMIT = 50;

// Shared keyset-pagination client for the admin panels (customers, coupons,
// audit log, reviews): fetchPage requests limit+1 rows and the caller trims
// to PAGE_LIMIT, using the extra row purely to detect "more exist" — mirrors
// the backend's own limit+1 convention, so no response envelope is needed.
export function useAdminPagedList<T>(
  fetchPage: (before: string) => Promise<T[]>,
  cursorOf: (item: T) => string,
) {
  const [items, setItems] = useState<T[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  // Generation counter: reload bumps it, and any response (first page or
  // loadMore append) from an older generation is dropped — a slow request for
  // the previous filter can't overwrite the current filter's rows.
  const gen = useRef(0);

  const reload = useCallback(async (): Promise<void> => {
    const g = ++gen.current;
    setError('');
    try {
      const page = await fetchPage('');
      if (g !== gen.current) return;
      setItems(page.slice(0, PAGE_LIMIT));
      setHasMore(page.length > PAGE_LIMIT);
    } catch (err) {
      if (g !== gen.current) return;
      setError(err instanceof Error ? err.message : 'Failed to load');
      setItems([]);
      setHasMore(false);
    }
  }, [fetchPage]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function loadMore(): Promise<void> {
    if (items.length === 0) return;
    const g = gen.current;
    setLoadingMore(true);
    setError('');
    try {
      const page = await fetchPage(cursorOf(items[items.length - 1]));
      if (g !== gen.current) return;
      setItems((prev) => [...prev, ...page.slice(0, PAGE_LIMIT)]);
      setHasMore(page.length > PAGE_LIMIT);
    } catch (err) {
      if (g !== gen.current) return;
      setError(err instanceof Error ? err.message : 'Failed to load more');
    } finally {
      setLoadingMore(false);
    }
  }

  return { items, setItems, hasMore, loadingMore, error, reload, loadMore };
}
