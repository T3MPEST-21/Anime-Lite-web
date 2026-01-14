"use client";
import React, { useState, useEffect } from 'react';
import styles from './friends.module.css';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

// ... imports
import { getFriends } from '@/services/friendService';
import { getUserData } from '@/services/userService';
import { supabase } from '@/lib/supabase';
import { Loader2, UserPlus, Users } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const FriendsPage = () => {
    const router = useRouter();
    const [friends, setFriends] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFriends = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: friendIds } = await getFriends(user.id);
                if (friendIds) {
                    const friendsData = await Promise.all(
                        friendIds.map((fid: string) => getUserData(fid))
                    );
                    setFriends(friendsData.map(f => f.data).filter(Boolean));
                }
            }
            setLoading(false);
        };
        fetchFriends();
    }, []);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1>Friends</h1>
                        <p>Manage your connections</p>
                    </div>
                </div>

                <Link href="/friends/requests" className={styles.requestsBanner}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: 'var(--primary)', padding: '8px', borderRadius: '50%', color: 'white' }}>
                            <UserPlus size={20} />
                        </div>
                        <div>
                            <span style={{ fontWeight: '600', display: 'block' }}>Friend Requests</span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>View incoming and sent requests</span>
                        </div>
                    </div>
                    <div style={{ color: 'var(--primary)', fontWeight: '600' }}>View &rarr;</div>
                </Link>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                    <Loader2 size={32} className="animate-spin" />
                </div>
            ) : friends.length === 0 ? (
                <div className={styles.comingSoon}>
                    <Users size={48} style={{ marginBottom: '16px', color: 'var(--text-secondary)' }} />
                    <h2>No friends yet</h2>
                    <p>Search for users to add them as friends!</p>
                    <button
                        onClick={() => router.push('/search')}
                        style={{
                            marginTop: '16px',
                            padding: '10px 20px',
                            backgroundColor: 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            fontWeight: '600'
                        }}
                    >
                        Find People
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>
                    {friends.map(friend => (
                        <div key={friend.id} onClick={() => router.push(`/profile?id=${friend.id}`)} style={{
                            backgroundColor: 'var(--surface)',
                            borderRadius: '12px',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            cursor: 'pointer',
                            border: '1px solid var(--border)'
                        }}>
                            <div style={{ position: 'relative', width: '64px', height: '64px', marginBottom: '12px' }}>
                                <Image
                                    src={friend.image || `https://ui-avatars.com/api/?background=random&name=${friend.username}`}
                                    alt={friend.username}
                                    fill
                                    style={{ borderRadius: '50%', objectFit: 'cover' }}
                                />
                            </div>
                            <span style={{ fontWeight: '600', marginBottom: '4px' }}>{friend.username}</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>View Profile</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FriendsPage;
