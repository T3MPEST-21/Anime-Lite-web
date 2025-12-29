"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getUserData } from "@/services/userService";
import { fetchPostsByUser } from "@/services/postsService";
import styles from "./ProfileContent.module.css";
import Image from "next/image";
import { ArrowLeft, Calendar } from "lucide-react";
import PostCard from "@/app/components/Postcard";
import { format } from "date-fns";

interface ProfileContentProps {
    userId?: string; // If not provided, fetch current user
    title?: string; // Optional title override
    showBackButton?: boolean;
}

const ProfileContent = ({ userId: propUserId, title, showBackButton = true }: ProfileContentProps) => {
    const router = useRouter();

    // State
    const [userId, setUserId] = useState<string | null>(propUserId || null);
    const [profile, setProfile] = useState<any>(null);
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            let targetUserId = propUserId;

            // If no propUserId, get current user
            if (!targetUserId) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    targetUserId = user.id;
                    setUserId(user.id);
                } else {
                    // Not logged in and no prop? Redirect or show error
                    setLoading(false);
                    return;
                }
            }

            if (!targetUserId) return;

            // Fetch Profile
            const { success: pSuccess, data: pData } = await getUserData(targetUserId);
            if (pSuccess) setProfile(pData);

            // Fetch Posts
            const { success: postsSuccess, data: postsData } = await fetchPostsByUser(targetUserId, targetUserId); // passing same ID for likely "liked" check context
            if (postsSuccess) setPosts(postsData || []);

            setLoading(false);
        };

        loadData();
    }, [propUserId]);

    if (loading) {
        return <div className={styles.loading}>Loading...</div>;
    }

    if (!profile) {
        return <div className={styles.error}>User not found</div>;
    }

    return (
        <div className={styles.container}>
            {/* Header / Nav */}
            <div className={styles.navBar}>
                {showBackButton && (
                    <button onClick={() => router.back()} className={styles.backBtn}>
                        <ArrowLeft size={24} />
                    </button>
                )}
                <span className={styles.navTitle}>{title || profile.username}</span>
            </div>

            {/* Profile Info */}
            <div className={styles.profileHeader}>
                <div className={styles.avatarWrapper}>
                    <Image
                        src={profile.image || `https://ui-avatars.com/api/?background=random&name=${profile.username}`}
                        alt={profile.username}
                        fill
                        className={styles.avatar}
                        unoptimized
                    />
                </div>

                <h1 className={styles.username}>{profile.username}</h1>
                {profile.bio && <p className={styles.bio}>{profile.bio}</p>}

                <div className={styles.statsRow}>
                    <div className={styles.statItem}>
                        <Calendar size={16} />
                        <span>Joined {format(new Date(profile.created_at), 'MMMM yyyy')}</span>
                    </div>
                </div>
            </div>

            {/* Posts Grid/List */}
            <div className={styles.postsContainer}>
                {posts.length === 0 ? (
                    <div className={styles.emptyState}>No posts yet</div>
                ) : (
                    posts.map(post => (
                        <div key={post.id} className={styles.postWrapper}>
                            <PostCard post={post} />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ProfileContent;
