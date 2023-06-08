import type { MutableRefObject, JSX, ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { throttle } from 'lodash';
import TopLineLoading from 'components/Loading/TopLineLoading';

interface IInfiniteScroll {
  children: ReactNode;
  loading: boolean;
  onLoadMore: () => void;
  hasMore: boolean;
}

function InfiniteScroll({
  children,
  loading,
  onLoadMore,
  hasMore,
}: IInfiniteScroll): JSX.Element | null {
  const ref: MutableRefObject<HTMLDivElement | null> = useRef(null);
  const isMounted = useRef(true);
  useEffect(() => {
    const scrollHandler = (): void => {
      if (!ref.current) {
        return;
      }

      if (
        ref.current.scrollTop + ref.current.clientHeight >=
        ref.current.scrollHeight
      ) {
        console.log('onLoadMore', { hasMore, test: isMounted.current });

        if (hasMore && isMounted.current) {
          onLoadMore();
        }

        if (!hasMore) {
          isMounted.current = false;
        }
      }
    };
    function debounceScroll() {
      // execute the last handleScroll function call, in every 100ms
      return throttle(scrollHandler, 100);
    }

    ref?.current?.addEventListener('scroll', debounceScroll());
    return () => {
      ref?.current?.removeEventListener('scroll', debounceScroll());
    };
  }, [hasMore, onLoadMore]);

  if (loading) return <TopLineLoading />;
  const windowHeight = window.screen.height - 500;

  return (
    <div
      ref={ref}
      style={{
        height: windowHeight,
        overflowX: 'hidden',
        overflowY: 'scroll',
        paddingBottom: '500px',
      }}
    >
      {children}
      {loading && <h2>Loading...</h2>}
    </div>
  );
}

export default InfiniteScroll;
