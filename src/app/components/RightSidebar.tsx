"use client";
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import styles from './RightSidebar.module.css';
import { supabase } from '@/lib/supabase';
import { getFriends, getIncomingFriendRequests, acceptFriendRequest, rejectFriendRequest } from '@/services/friendsService';
import { getUserData } from '@/services/userService';

interface Friend {
    id: string;
    username: string;
    image?: string;
}

interface FriendRequest {
    id: string;
    requester_id: string;
    username?: string;
    image?: string;
}

const RightSidebar = () => {
    const router = useRouter();
    const [friends, setFriends] = useState<Friend[]>([]);
    const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Load friend requests
        const { data: requests } = await getIncomingFriendRequests(user.id);
        if (requests && requests.length > 0) {
            const requestsWithData = await Promise.all(
                requests.map(async (req: any) => {
                    const userData = await getUserData(req.requester_id);
                    return {
                        id: req.id,
                        requester_id: req.requester_id,
                        username: userData.data?.username || 'User',
                        image: userData.data?.image
                    };
                })
            );
            setFriendRequests(requestsWithData);
        }

        // Load friends
        const { data: friendIds } = await getFriends(user.id);
        if (friendIds && friendIds.length > 0) {
            const friendsData = await Promise.all(
                friendIds.slice(0, 8).map(async (fid: string) => {
                    const userData = await getUserData(fid);
                    return userData.success ? userData.data : null;
                })
            );
            setFriends(friendsData.filter(Boolean) as Friend[]);
        }

        setLoading(false);
    };

    const handleAccept = async (requestId: string) => {
        await acceptFriendRequest(requestId);
        loadData();
    };

    const handleReject = async (requestId: string) => {
        await rejectFriendRequest(requestId);
        loadData();
    };

    if (loading) {
        return (
            <aside className={styles.sidebar}>
                <div className={styles.loading}>
                    <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                </div>
            </aside>
        );
    }

    return (
        <aside className={styles.sidebar}>
            {/* Friend Requests Section */}
            {friendRequests.length > 0 && (
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h3 className={styles.title}>Friend requests</h3>
                        <a href="/friends" className={styles.seeAll}>See all</a>
                    </div>

                    <div className={styles.requestsList}>
                        {friendRequests.slice(0, 2).map((request) => (
                            <div key={request.id} className={styles.requestItem}>
                                <div className={styles.requestAvatar}>
                                    <Image
                                        src={request.image || `https://ui-avatars.com/api/?background=random&name=${request.username}`}
                                        alt={request.username || 'User'}
                                        fill
                                        style={{ objectFit: 'cover' }}
                                        unoptimized
                                    />
                                </div>

                                <div className={styles.requestInfo}>
                                    <div className={styles.requestName}>{request.username}</div>
                                    <div className={styles.requestActions}>
                                        <button
                                            className={styles.confirmBtn}
                                            onClick={() => handleAccept(request.id)}
                                        >
                                            Confirm
                                        </button>
                                        <button
                                            className={styles.deleteBtn}
                                            onClick={() => handleReject(request.id)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Contacts Section */}
            <div className={styles.section}>
                <h3 className={styles.title}>Contacts</h3>

                {friends.length === 0 ? (
                    <div className={styles.emptyState}>
                        No friends yet
                    </div>
                ) : (
                    <div className={styles.friendsList}>
                        {friends.map((friend) => (
                            <div
                                key={friend.id}
                                className={styles.friendItem}
                                onClick={() => router.push(`/user/${friend.id}`)}
                            >
                                <div className={styles.avatarWrapper}>
                                    <Image
                                        src={friend.image || `https://ui-avatars.com/api/?background=random&name=${friend.username}`}
                                        alt={friend.username}
                                        fill
                                        className={styles.avatar}
                                        unoptimized
                                    />
                                </div>

                                <div className={styles.friendInfo}>
                                    <div className={styles.friendName}>{friend.username}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </aside>
    );
};

export default RightSidebar;
