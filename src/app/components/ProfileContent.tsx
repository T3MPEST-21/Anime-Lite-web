"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getUserData } from "@/services/userService";
import { fetchPostsByUser } from "@/services/postsService";
import styles from "./ProfileContent.module.css";
import Image from "next/image";
import { ArrowLeft, Calendar, Settings } from "lucide-react";
import PostCard from "@/app/components/Postcard";
import { format } from "date-fns";
import EditProfileModal from "./EditProfileModal";
import InfiniteScrollTrigger from "./InfiniteScrollTrigger";

interface ProfileContentProps {
    userId?: string; // If not provided, fetch current user
    title?: string; // Optional title override
    showBackButton?: boolean;
}

const ProfileContent = ({ userId: propUserId, title, showBackButton = true }: ProfileContentProps) => {
    const router = useRouter();

    // State
    const [userId, setUserId] = useState<string | null>(propUserId || null);
    const [profile, setProfile] = useState<{
        id: string;
        username: string;
        image: string | null;
        full_name?: string;
        bio?: string;
        created_at?: string;
    } | null>(null);
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Pagination State
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    useEffect(() => {
        loadData(0, true);
    }, [propUserId]);

    const loadData = async (pageIndex: number, isRefresh = false) => {
        if (isRefresh) setLoading(true);
        else setLoadingMore(true);

        try {
            let targetUserId = propUserId;

            // If no propUserId, get current user (Logic moved here to ensure we have ID)
            if (!targetUserId) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    targetUserId = user.id;
                    if (isRefresh) setUserId(user.id);
                } else {
                    setLoading(false);
                    return;
                }
            }

            if (!targetUserId) return;

            // Fetch Profile (only on refresh/first load)
            if (isRefresh) {
                const { success: pSuccess, data: pData } = await getUserData(targetUserId);
                if (pSuccess) setProfile(pData);
            }

            // Fetch Posts with Pagination
            const { success: postsSuccess, data: postsData } = await fetchPostsByUser(targetUserId, targetUserId, pageIndex, 10);

            if (postsSuccess && postsData) {
                if (postsData.length < 10) setHasMore(false);
                else setHasMore(true);

                if (isRefresh) {
                    setPosts(postsData);
                } else {
                    setPosts(prev => [...prev, ...postsData]);
                }
                setPage(pageIndex);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const handleLoadMore = () => {
        loadData(page + 1, false);
    };

    const refreshProfile = async () => {
        // Just re-fetch profile data, not posts
        if (!userId) return;
        const { success: pSuccess, data: pData } = await getUserData(userId);
        if (pSuccess) setProfile(pData);
    };

    if (loading) {
        return <div className={styles.loading}>Loading...</div>;
    }

    if (!profile) {
        return <div className={styles.error}>User not found</div>;
    }

    // Determine if it's the current user's profile to show edit button
    const isOwner = userId && (!propUserId || userId === propUserId);

    return (
        <div className={styles.container}>
            {/* Header / Nav */}
            <div className={styles.navBar}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {showBackButton && (
                        <button onClick={() => router.back()} className={styles.backBtn}>
                            <ArrowLeft size={24} />
                        </button>
                    )}
                    <span className={styles.navTitle}>{title || profile.username}</span>
                </div>

                {isOwner && (
                    <button
                        onClick={() => router.push('/settings')}
                        className={styles.settingsBtn}
                        aria-label="Settings"
                    >
                        <Settings size={24} />
                    </button>
                )}
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

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h1 className={styles.username}>{profile.username}</h1>
                    {(userId && !propUserId) ? (
                        <button
                            className={styles.editBtn}
                            onClick={() => setIsEditModalOpen(true)}
                        >
                            Edit Profile
                        </button>
                    ) : null}
                </div>

                {profile?.bio && <p className={styles.bio}>{profile.bio}</p>}

                <div className={styles.statsRow}>
                    <div className={styles.statItem}>
                        <Calendar size={16} />
                        <span>Joined {profile?.created_at ? format(new Date(profile.created_at), 'MMMM yyyy') : 'Recently'}</span>
                    </div>
                </div>
            </div>

            {/* Posts Grid/List */}
            <div className={styles.postsContainer}>
                {posts.length === 0 ? (
                    <div className={styles.emptyState}>No posts yet</div>
                ) : (
                    <>
                        {posts.map(post => (
                            <div key={`${post.id}-${page}`} className={styles.postWrapper}>
                                <PostCard post={post} />
                            </div>
                        ))}
                        <InfiniteScrollTrigger
                            onIntersect={handleLoadMore}
                            isLoading={loadingMore}
                            hasMore={hasMore}
                            rootMargin="200px"
                        />
                    </>
                )}
            </div>

            {/* Edit Modal */}
            <EditProfileModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                currentProfile={profile}
                onProfileUpdate={refreshProfile}
            />
        </div>
    );
};

export default ProfileContent;
