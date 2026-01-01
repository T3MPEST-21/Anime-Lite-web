"use client";
import React, { useEffect, useState } from "react";
import styles from "./ProfileModal.module.css";
import { X, Calendar, MapPin, Loader2 } from "lucide-react";
import Image from "next/image";
import { useModalBehavior } from "@/hooks/useModalBehavior";
import { getUserData } from "@/services/userService";
import { fetchPostsByUser } from "@/services/postsService";
import PostCard from "./Postcard";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";

interface ProfileModalProps {
    isOpen: boolean;
    userId: string | null;
    onClose: () => void;
}

const ProfileModal = ({ isOpen, userId, onClose }: ProfileModalProps) => {
    // UX Hook
    useModalBehavior(isOpen, onClose);

    // State
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
    const [currentUser, setCurrentUser] = useState<string | null>(null);

    // Reset state when modal closes
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        if (!isOpen) {
            setProfile(null);
            setPosts([]);
            setLoading(true);
        }
    }, [isOpen]);
    /* eslint-enable react-hooks/set-state-in-effect */

    // Load data when modal opens
    useEffect(() => {
        if (!isOpen || !userId) return;

        const loadData = async () => {
            setLoading(true);

            // Get current user for context (likes etc)
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user ? user.id : null);

            // Fetch Profile
            const { success: pSuccess, data: pData } = await getUserData(userId);
            if (pSuccess) setProfile(pData);

            // Fetch Posts
            const { success: postsSuccess, data: postsData } = await fetchPostsByUser(userId, user?.id);
            if (postsSuccess) setPosts(postsData || []);

            setLoading(false);
        };

        loadData();
    }, [isOpen, userId]);

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose}>
                    <X size={24} />
                </button>

                {loading ? (
                    <div className={styles.loading}>
                        <Loader2 className={styles.spinner} size={32} />
                    </div>
                ) : !profile ? (
                    <div className={styles.error}>User not found</div>
                ) : (
                    <div className={styles.content}>
                        {/* Profile Header */}
                        <div className={styles.profileHeader}>
                            <div className={styles.avatarWrapper}>
                                <Image
                                    src={profile.image || `https://ui-avatars.com/api/?background=random&name=${profile.username}`}
                                    alt={profile.username}
                                    fill
                                    className={styles.avatar}
                                />
                            </div>
                            <h2 className={styles.username}>{profile.username}</h2>
                            {profile.bio && <p className={styles.bio}>{profile.bio}</p>}

                            <div className={styles.statsRow}>
                                <div className={styles.statItem}>
                                    <Calendar size={16} />
                                    <span>Joined {profile.created_at ? format(new Date(profile.created_at), 'MMM yyyy') : 'Recently'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Posts List */}
                        <div className={styles.postsList}>
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
                )}
            </div>
        </div>
    );
};

export default ProfileModal;
