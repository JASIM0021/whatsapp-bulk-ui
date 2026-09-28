import { useSearchParams } from 'react-router-dom';

/**
 * Keeps a page's active sidebar tab in `?tab=` (same approach as the SEO
 * screen) so it survives reloads and can be linked to.
 *
 * Returns [tab, setTab, isExplicit] — isExplicit is true when the URL names
 * the tab, letting pages skip auto-redirects (e.g. "connected → compose")
 * when the user deliberately opened a tab.
 *
 * `storageKey` optionally remembers the last tab in localStorage as a
 * fallback for when the URL has none.
 */
export function useUrlTab<T extends string>(
  valid: readonly T[],
  fallback: T,
  storageKey?: string,
): [T, (next: T) => void, boolean] {
  const [searchParams, setSearchParams] = useSearchParams();
  const param = searchParams.get('tab') as T | null;
  const isExplicit = !!param && valid.includes(param);

  let tab: T = fallback;
  if (isExplicit) {
    tab = param as T;
  } else if (storageKey) {
    try {
      const saved = localStorage.getItem(storageKey) as T | null;
      if (saved && valid.includes(saved)) tab = saved;
    } catch { /* storage unavailable */ }
  }

  const setTab = (next: T) => {
    if (storageKey) {
      try { localStorage.setItem(storageKey, next); } catch { /* storage unavailable */ }
    }
    setSearchParams(prev => {
      const params = new URLSearchParams(prev);
      params.set('tab', next);
      return params;
    }, { replace: true });
  };

  return [tab, setTab, isExplicit];
}
