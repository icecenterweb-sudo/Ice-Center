'use client';

import React, { useEffect, useRef, useState } from 'react';

interface ScrollDriftIconProps {
  children: React.ReactNode;
  /** Max horizontal drift in px. The icon starts displaced by this amount and
   *  glides back to its home (offset 0) as the sticky box travels down. */
  distance?: number;
  className?: string;
}

/**
 * Wraps a boxed icon and drifts it horizontally in sync with how far its sticky
 * parent has traveled through the surrounding section. When the sticky box sits
 * at the top of its run the icon is displaced (by `distance`, toward the start of
 * the row); as the box glides toward the bottom of the section the icon returns
 * to its home position. Purely decorative — respects prefers-reduced-motion.
 *
 * It locates the nearest ancestor whose computed `position` is `sticky` and uses
 * that element's parent as the travel track. Falls back to a viewport-based
 * progress if no sticky ancestor exists.
 */
export default function ScrollDriftIcon({
  children,
  distance = 120,
  className,
}: ScrollDriftIconProps) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);
  const [offset, setOffset] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return 0;
    }
    return -distance;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      return;
    }

    // Walk up to the nearest sticky ancestor; its parent is the travel track.
    let stickyEl: HTMLElement | null = null;
    let node: HTMLElement | null = el.parentElement;
    while (node) {
      if (getComputedStyle(node).position === 'sticky') {
        stickyEl = node;
        break;
      }
      node = node.parentElement;
    }

    const update = () => {
      frame.current = null;
      const viewportH = window.innerHeight || document.documentElement.clientHeight;

      let progress: number;
      const track = stickyEl?.parentElement;
      if (stickyEl && track) {
        const stickyRect = stickyEl.getBoundingClientRect();
        const trackRect = track.getBoundingClientRect();
        const maxTravel = trackRect.height - stickyRect.height;
        // How far the sticky box currently sits below the track's top edge.
        const traveled = stickyRect.top - trackRect.top;
        progress = maxTravel > 0 ? traveled / maxTravel : 0;
      } else {
        // Fallback: progress as the element crosses the viewport.
        const rect = el.getBoundingClientRect();
        progress = 1 - (rect.top + rect.height / 2) / viewportH;
      }

      progress = Math.min(1, Math.max(0, progress));
      // Start displaced (-distance) and settle at home (0) as progress → 1.
      setOffset((progress - 1) * distance);
    };

    const onScroll = () => {
      if (frame.current == null) {
        frame.current = window.requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame.current != null) window.cancelAnimationFrame(frame.current);
    };
  }, [distance]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transform: `translateX(${offset}px)`,
        transition: 'transform 120ms linear',
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  );
}
