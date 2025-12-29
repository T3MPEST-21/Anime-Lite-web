"use client";
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, PlusSquare, Image as ImageIcon, Video } from 'lucide-react';
import styles from './FeedHeader.module.css';
import { supabase } from '@/lib/supabase';

const FeedHeader = () => {
    const router = useRouter();
    const [userAvatar, setUserAvatar] = useState<string | null>(null);
    const [userName, setUserName] = useState<string>('User');

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase
                .from('profiles')
                .select('image, username')
                .eq('id', user.id)
                .single();

            if (data) {
                setUserAvatar(data.image);
                setUserName(data.username || 'User');
            }
        }
    };

    return (
        <header className={styles.header}>
            {/* Top Bar with Logo and Actions */}
            <div className={styles.topBar}>
                <div className={styles.leftSection}>
                    <Image
                        src="/goku-logo-2.png"
                        alt="Anime-Lite"
                        width={36}
                        height={36}
                        className={styles.logo}
                    />

                    <div className={styles.searchBox}>
                        <Search size={18} color="var(--text-secondary)" />
                        <input
                            type="text"
                            placeholder="Search Anime-Lite"
                            onClick={() => router.push('/search')}
                            readOnly
                        />
                    </div>
                </div>

                <div className={styles.rightSection}>
                    <button
                        className={styles.iconButton}
                        onClick={() => router.push('/create')}
                        aria-label="Create Post"
                    >
                        <PlusSquare size={20} />
                    </button>

                    <div
                        className={styles.avatarWrapper}
                        onClick={() => router.push('/profile')}
                    >
                        <Image
                            src={userAvatar || `https://ui-avatars.com/api/?background=random&name=${userName}`}
                            alt="Profile"
                            fill
                            className={styles.avatar}
                            unoptimized
                        />
                    </div>
                </div>
            </div>

            {/* Post Creation Box */}
            <div className={styles.createPost}>
                <div className={styles.createPostTop}>
                    <div className={styles.createPostAvatar}>
                        <Image
                            src={userAvatar || `https://ui-avatars.com/api/?background=random&name=${userName}`}
                            alt={userName}
                            width={40}
                            height={40}
                            style={{ borderRadius: '50%' }}
                            unoptimized
                        />
                    </div>
                    <input
                        type="text"
                        className={styles.postInput}
                        placeholder={`What's on your mind, ${userName}?`}
                        onClick={() => router.push('/create')}
                        readOnly
                    />
                </div>

                <div className={styles.createPostActions}>
                    <button className={styles.actionBtn} onClick={() => router.push('/create')}>
                        <ImageIcon size={20} color="#45bd62" />
                        Photo
                    </button>
                    <button className={styles.actionBtn} onClick={() => router.push('/create')}>
                        <Video size={20} color="#f3425f" />
                        Video
                    </button>
                </div>
            </div>
        </header>
    );
};

export default FeedHeader;
