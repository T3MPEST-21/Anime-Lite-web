"use client";
import React, { useEffect, useState } from "react";
import styles from "./ProfileModal.module.css";
import { X, Calendar, MapPin, Loader2, UserPlus, UserCheck, Clock } from "lucide-react";
import Image from "next/image";
import { useModalBehavior } from "@/hooks/useModalBehavior";
import { getUserData } from "@/services/userService";
import { fetchPostsByUser } from "@/services/postsService";
import PostCard from "./Postcard";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { getFriendshipStatus, sendFriendRequest, acceptFriendRequest, removeFriend, FriendshipStatus } from '@/services/friendService';

interface ProfileModalProps {
    isOpen: boolean;
    userId: string | null;
    onClose: () => void;
}

const ProfileModal = ({ isOpen, userId, onClose }: ProfileModalProps) => {
    // UX Hook
    useModalBehavior(isOpen, onClose);

    // State
    const { user } = useAuth();
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

    // Friend Logic State
    const [friendStatus, setFriendStatus] = useState<FriendshipStatus>('NONE');
    const [requestId, setRequestId] = useState<string | undefined>(undefined);
    const [actionLoading, setActionLoading] = useState(false);

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setProfile(null);
            setPosts([]);
            setLoading(true);
            setFriendStatus('NONE');
            setRequestId(undefined);
        }
    }, [isOpen]);

    // Load data when modal opens
    useEffect(() => {
        if (!isOpen || !userId) return;

        const loadData = async () => {
            setLoading(true);

            const currId = user?.id || null;

            // Fetch Profile
            const { success: pSuccess, data: pData } = await getUserData(userId);
            if (pSuccess) setProfile(pData as any);

            // Fetch Posts
            const { success: postsSuccess, data: postsData } = await fetchPostsByUser(userId, currId);
            if (postsSuccess) setPosts(postsData || []);

            // Check Friend Status
            if (currId && currId !== userId) {
                const { status, requestId } = await getFriendshipStatus(userId);
                setFriendStatus(status);
                setRequestId(requestId);
            }

            setLoading(false);
        };

        loadData();
    }, [isOpen, userId, user]);

    const handleFriendAction = async () => {
        if (!userId || !user) return;
        setActionLoading(true);

        try {
            if (friendStatus === 'NONE') {
                // Send Request
                const res = await sendFriendRequest(userId);
                if (res.data) {
                    setFriendStatus('REQUEST_SENT');
                    setRequestId(res.data.id);
                }
            } else if (friendStatus === 'REQUEST_RECEIVED' && requestId) {
                // Accept Request
                await acceptFriendRequest(requestId);
                setFriendStatus('FRIENDS');
            } else if (friendStatus === 'FRIENDS') {
                // Remove Friend
                if (confirm("Are you sure you want to remove this friend?")) {
                    await removeFriend(userId);
                    setFriendStatus('NONE');
                }
            }
        } catch (error) {
            console.error(error);
        }
        setActionLoading(false);
    };

    const renderFriendButton = () => {
        if (!user || !profile || user.id === profile.id) return null;

        let label = "Add Friend";
        let icon = <UserPlus size={16} />;
        let styleClass = styles.followButton; // Using existing class as base

        if (friendStatus === 'FRIENDS') {
            label = "Friends";
            icon = <UserCheck size={16} />;
            styleClass = styles.followingButton; // Will need to ensure this class exists or reuse
        } else if (friendStatus === 'REQUEST_SENT') {
            label = "Request Sent";
            icon = <Clock size={16} />;
            styleClass = styles.pendingButton;
        } else if (friendStatus === 'REQUEST_RECEIVED') {
            label = "Accept Request";
            icon = <UserPlus size={16} />;
            styleClass = styles.acceptButton;
        }

        return (
            <button
                className={`${styleClass} ${actionLoading ? styles.loading : ''}`}
                onClick={handleFriendAction}
                disabled={actionLoading || friendStatus === 'REQUEST_SENT'}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '10px',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    backgroundColor: friendStatus === 'FRIENDS' || friendStatus === 'REQUEST_SENT' ? 'var(--surface)' : 'var(--primary)',
                    color: friendStatus === 'FRIENDS' || friendStatus === 'REQUEST_SENT' ? 'var(--text)' : '#fff',
                    border: friendStatus === 'FRIENDS' || friendStatus === 'REQUEST_SENT' ? '1px solid var(--border)' : 'none',
                    cursor: friendStatus === 'REQUEST_SENT' ? 'default' : 'pointer'
                }}
            >
                {actionLoading ? <Loader2 size={16} className="animate-spin" /> : icon}
                {label}
            </button>
        );
    };

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

                            {renderFriendButton()}

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
