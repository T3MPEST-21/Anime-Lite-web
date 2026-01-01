'use client';

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { fetchPosts } from "@/services/postsService";
import PostCard from "../../components/Postcard";
import styles from "./feed.module.css";

type Post = {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
  user: {
    id?: string;
    username: string;
    image: string | null;
    full_name?: string;
  };
  post_images: { image_url: string }[];
  post_likes: { count: number }[];
  post_comments: { count: number }[];
  isLiked?: boolean;
};

const FeedPage = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    const loadFeed = async () => {
        // first, get the current user
        const { data: { user } } = await supabase.auth.getUser();

        // second, get their id to fetchPosts
        const res = await fetchPosts(user?.id);
        if (res.success) {
            setPosts(res.data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        const loadData = async () => {
            await loadFeed();
        };
        loadData();
    }, []);

    if (loading) return <div style={{ padding: 20, color: 'var(--text)' }}>Loading...</div>;

    return (
        <div className={styles.container}>
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