import type { JSX, MutableRefObject, ReactNode } from 'react';

import TopLineLoading from 'components/Loading/TopLineLoading';
import { throttle } from 'lodash';
import { useEffect, useRef } from 'react';
import { useWindowSize } from 'hooks';

interface IInfiniteScroll {
  children: ReactNode;
  hasMore?: boolean | null;
  loading: boolean;
  onLoadMore: () => void;
}

function InfiniteScroll({
  children,
  hasMore,
  loading,
  onLoadMore,
}: IInfiniteScroll): JSX.Element | null {
  const ref: MutableRefObject<HTMLDivElement | null> = useRef(null);
  const isMounted: MutableRefObject<boolean> = useRef(true);
  useEffect(() => {
    const scrollHandler = (): typeof onLoadMore | undefined | void => {
      if (!ref.current) {
        return;
      }

      if (
        ref.current.scrollTop + ref.current.clientHeight >=
        ref.current.scrollHeight
      ) {
        // Fix for the issue where the scroll event is triggered multiple times
        if (hasMore && isMounted.current) {
          onLoadMore();
          return;
        }

        isMounted.current = false;
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

  const size = useWindowSize();

  const windowHeight = size?.height - 500;

  return (
    <div
      style={{
        height: windowHeight,
        overflowX: 'hidden',
        overflowY: 'scroll',
        paddingBottom: '500px',
      }}
      ref={ref}
    >
      {children}
    </div>
  );
}

export default InfiniteScroll;
