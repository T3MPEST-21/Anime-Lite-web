'use client';

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { fetchPosts } from "@/services/postsService";
import PostCard from "../../components/Postcard";
import styles from "./feed.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";


const FeedPage = () => {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFeed();
    }, []);

    const loadFeed = async () => {
        // first, get the current user
        const { data: { user } } = await supabase.auth.getUser();

        // second, get their id to fetchPosts
        const res = await fetchPosts(user?.id);
        if (res.success) {
            setPosts(res.data || []);
        }
        setLoading(false);
    }

    if (loading) return <div style={{ padding: 20, color: 'var(--text)' }}>Loading...</div>;

    return (
        <div className={styles.container}>
            <h1 className={styles.header}>Feed</h1>
            {posts.length === 0 ? (
                <div className={styles.emptyState}>
                    No posts found.
                </div>
            ) : (
                posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                ))
            )}


        </div>
    )
}

export default FeedPage