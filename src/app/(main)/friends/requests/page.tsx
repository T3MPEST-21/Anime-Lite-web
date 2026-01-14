"use client";
import React, { useEffect, useState } from 'react';
import styles from './requests.module.css';
import { ArrowLeft, Check, X, User, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getIncomingFriendRequests, getOutgoingFriendRequests, acceptFriendRequest, rejectFriendRequest } from '@/services/friendService';
import { getUserData } from '@/services/userService';
import Image from 'next/image';

const FriendRequestsPage = () => {
    const router = useRouter();
    const [tab, setTab] = useState<'incoming' | 'pending'>('incoming');
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState<any[]>([]);

    useEffect(() => {
        fetchRequests();
    }, [tab]);

    const fetchRequests = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
            let data: any[] = [];
            if (tab === 'incoming') {
                const { data: incoming } = await getIncomingFriendRequests(user.id);
                // Enrich with user data
                if (incoming) {
                    data = await Promise.all(incoming.map(async (req: any) => {
                        const { data: userData } = await getUserData(req.requester_id);
                        return { ...userData, requestId: req.id };
                    }));
                }
            } else {
                const { data: outgoing } = await getOutgoingFriendRequests(user.id);
                if (outgoing) {
                    data = await Promise.all(outgoing.map(async (req: any) => {
                        const { data: userData } = await getUserData(req.addressee_id);
                        return { ...userData, requestId: req.id };
                    }));
                }
            }
            setRequests(data.filter(Boolean)); // Filter out nulls
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (requestId: string) => {
        await acceptFriendRequest(requestId);
        fetchRequests(); // Refresh
    };

    const handleReject = async (requestId: string) => {
        await rejectFriendRequest(requestId);
        fetchRequests(); // Refresh
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <button className={styles.backButton} onClick={() => router.back()}>
                    <ArrowLeft size={24} />
                </button>
                <h1>Friend Requests</h1>
            </div>

            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${tab === 'incoming' ? styles.activeTab : ''}`}
                    onClick={() => setTab('incoming')}
                >
                    Incoming
                </button>
                <button
                    className={`${styles.tab} ${tab === 'pending' ? styles.activeTab : ''}`}
                    onClick={() => setTab('pending')}
                >
                    Sent
                </button>
            </div>

            {loading ? (
                <div className={styles.loading}>
                    <Loader2 size={32} className="animate-spin" />
                </div>
            ) : requests.length === 0 ? (
                <div className={styles.statusMessage}>
                    <User size={48} />
                    <p>{tab === 'incoming' ? 'No incoming requests' : 'No sent requests'}</p>
                </div>
            ) : (
                <div className={styles.requestList}>
                    {requests.map((req) => (
                        <div key={req.requestId} className={styles.requestItem}>
                            <div className={styles.avatarWrapper}>
                                <Image
                                    src={req.image || `https://ui-avatars.com/api/?background=random&name=${req.username}`}
                                    alt={req.username}
                                    fill
                                    className={styles.avatar}
                                />
                            </div>
                            <div className={styles.userInfo}>
                                <span className={styles.username}>{req.username}</span>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    {req.full_name || `@${req.username}`}
                                </span>
                            </div>

                            <div className={styles.actions}>
                                {tab === 'incoming' ? (
                                    <>
                                        <button className={styles.acceptButton} onClick={() => handleAccept(req.requestId)}>
                                            <Check size={16} /> Accept
                                        </button>
                                        <button className={styles.rejectButton} onClick={() => handleReject(req.requestId)}>
                                            <X size={16} />
                                        </button>
                                    </>
                                ) : (
                                    <span className={styles.pendingBadge}>
                                        Pending
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FriendRequestsPage;

// Force dynamic rendering
export const dynamic = 'force-dynamic';
