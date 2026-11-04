const KEY = 'eq.quotes.lastQuery';

/** Remembers the filters and page of the quotes list, so "Volver" from a detail returns to the same list. */
export function rememberQuotesQuery(query: string): void {
  try {
    window.sessionStorage.setItem(KEY, query);
  } catch {
    // ignore: it is only a convenience
  }
}

export function lastQuotesHref(): string {
  try {
    const query = window.sessionStorage.getItem(KEY);
    return query ? `/quotes?${query}` : '/quotes';
  } catch {
    return '/quotes';
  }
}
