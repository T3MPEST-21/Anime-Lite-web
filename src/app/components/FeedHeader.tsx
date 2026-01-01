"use client";
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, PlusSquare } from 'lucide-react';
import styles from './FeedHeader.module.css';
import { supabase } from '@/lib/supabase';
import ThemeToggle from './ThemeToggle';

const FeedHeader = () => {
    const router = useRouter();
    const [userAvatar, setUserAvatar] = useState<string | null>(null);
    const [userName, setUserName] = useState<string>('User');

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

    useEffect(() => {
        const loadData = async () => {
            await loadUserData();
        };
        loadData();
    }, []);

    return (
        <header className={styles.header}>
            <div className={styles.topBar}>
                <div className={styles.leftSection}>
                    <h1 className={styles.appName}>Anime Light</h1>
                </div>

                <div className={styles.rightSection}>
                    <ThemeToggle />


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
                            width={38}
                            height={38}
                            className={styles.avatar}
                            unoptimized
                        />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default FeedHeader;
