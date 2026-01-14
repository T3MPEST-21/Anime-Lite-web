'use client';

import React, { useEffect, useState } from "react";
import { fetchPosts } from "@/services/postsService";
import PostCard from "../../components/Postcard";
import styles from "./feed.module.css";
import { supabase } from "@/lib/supabase";
import InfiniteScrollTrigger from "@/app/components/InfiniteScrollTrigger";

const FeedPage = () => {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        loadPosts(0, true);
    }, []);

    const loadPosts = async (pageIndex: number, isRefresh = false) => {
        if (isRefresh) setLoading(true);
        else setLoadingMore(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const currentUserId = user?.id;

            const { success, data } = await fetchPosts(currentUserId, pageIndex, 10);

            if (success && data) {
                if (data.length < 10) setHasMore(false);
                else setHasMore(true);

                if (isRefresh) {
                    setPosts(data);
                } else {
                    setPosts(prev => [...prev, ...data]);
                }
                setPage(pageIndex);
            } else {
                setError(true);
            }
        } catch (e) {
            console.error(e);
            setError(true);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const handleLoadMore = () => {
        loadPosts(page + 1, false);
    };

    if (loading) {
        return (
            <div style={{
                padding: 20,
                color: 'var(--text)',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '200px'
            }}>
                <div className="animate-spin" style={{
                    border: '3px solid var(--border)',
                    borderTop: '3px solid var(--primary)',
                    borderRadius: '50%',
                    width: '30px',
                    height: '30px'
                }}></div>
            </div>
        );
    }

    if (error && posts.length === 0) {
        return (
            <div style={{
                padding: 20,
                color: 'var(--text)',
                textAlign: 'center'
            }}>
                Failed to load posts. Please try again.
                <button
                    onClick={() => loadPosts(0, true)}
                    style={{
                        display: 'block',
                        margin: '10px auto',
                        padding: '8px 16px',
                        background: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {posts.length === 0 ? (
                <div className={styles.emptyState}>
                    No posts found.
                    <button
                        onClick={() => loadPosts(0, true)}
                        style={{
                            display: 'block',
                            margin: '10px auto',
                            padding: '8px 16px',
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            cursor: 'pointer'
                        }}
                    >
                        Refresh
                    </button>
                </div>
            ) : (
                <>
                    {posts.map((post) => (
                        <PostCard key={`${post.id}-${page}`} post={post} />
                    ))}

                    <InfiniteScrollTrigger
                        onIntersect={handleLoadMore}
                        isLoading={loadingMore}
                        hasMore={hasMore}
                        rootMargin="200px" // Trigger 200px before reaching the bottom
                    />
                </>
            )}
        </div>
    )
}

export default FeedPage