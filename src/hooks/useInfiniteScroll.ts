import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions<T> {
  items: T[];
  itemsPerPage?: number;
}

export function useInfiniteScroll<T>({ items, itemsPerPage = 12 }: UseInfiniteScrollOptions<T>) {
  const [displayedItems, setDisplayedItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Reset when items change
  useEffect(() => {
    setPage(1);
    setDisplayedItems(items.slice(0, itemsPerPage));
    setHasMore(items.length > itemsPerPage);
  }, [items, itemsPerPage]);

  // Load more items
  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    
    // Simulate a small delay for smoother UX
    setTimeout(() => {
      const nextPage = page + 1;
      const startIndex = 0;
      const endIndex = nextPage * itemsPerPage;
      const newItems = items.slice(startIndex, endIndex);
      
      setDisplayedItems(newItems);
      setPage(nextPage);
      setHasMore(endIndex < items.length);
      setIsLoading(false);
    }, 300);
  }, [items, page, itemsPerPage, isLoading, hasMore]);

  // Set up intersection observer
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMore, hasMore, isLoading]);

  return {
    displayedItems,
    hasMore,
    isLoading,
    loadMoreRef,
    totalItems: items.length,
  };
}
