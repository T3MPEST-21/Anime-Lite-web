"use client";
import React from 'react';
import styles from './friends.module.css';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

const FriendsPage = () => {
    const router = useRouter();

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1>Friends</h1>
                        <p>Manage your friend requests and connections</p>
                    </div>
                    <button
                        onClick={() => router.push('/search')}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text)',
                            padding: '8px'
                        }}
                        aria-label="Search"
                    >
                        <Search size={24} />
                    </button>
                </div>
            </div>

            <div className={styles.comingSoon}>
                <h2>Coming Soon!</h2>
                <p>The full friends management interface is under construction.</p>
                <p>For now, use the sidebar to see your friends list.</p>
            </div>
        </div>
    );
};

export default FriendsPage;
