import { useCallback, useState } from 'react';

export function useStockSearch() {
  const [query, setQuery] = useState('');

  const clearSearch = useCallback(() => {
    setQuery('');
  }, []);

  return { query, setQuery, clearSearch };
}
