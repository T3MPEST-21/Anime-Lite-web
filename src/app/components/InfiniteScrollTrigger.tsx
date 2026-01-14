"use client";
import React, { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface InfiniteScrollTriggerProps {
    onIntersect: () => void;
    isLoading: boolean;
    hasMore: boolean;
    threshold?: number; // 0.0 to 1.0 (0 = trigger as soon as 1 pixel is visible)
    rootMargin?: string; // '200px' = trigger 200px BEFORE element comes into view
}

const InfiniteScrollTrigger = ({
    onIntersect,
    isLoading,
    hasMore,
    threshold = 0.1,
    rootMargin = '100px' // Trigger slightly before reaching bottom
}: InfiniteScrollTriggerProps) => {
    const triggerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // If loading or no more items, stop observing
        if (isLoading || !hasMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    onIntersect();
                }
            },
            {
                root: null, // Use browser viewport
                rootMargin,
                threshold
            }
        );

        if (triggerRef.current) {
            observer.observe(triggerRef.current);
        }

        return () => {
            if (triggerRef.current) {
                observer.unobserve(triggerRef.current);
            }
        };
    }, [isLoading, hasMore, onIntersect, rootMargin, threshold]);

    if (!hasMore) return null;

    return (
        <div
            ref={triggerRef}
            style={{
                width: '100%',
                padding: '20px 0',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '50px'
            }}
        >
            {isLoading && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--text-secondary)' }}>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Fetching more posts...</span>
                </div>
            )}
        </div>
    );
};

export default InfiniteScrollTrigger;
