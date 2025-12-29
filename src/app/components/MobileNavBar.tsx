"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, MessageSquare, Bell, User } from 'lucide-react';
import styles from './MobileNavBar.module.css';

const MobileNavBar = () => {
    const pathname = usePathname();
    const isActive = (path: string) => pathname === path;

    return (
        <nav className={styles.container}>
            <Link href="/feed" className={`${styles.navItem} ${isActive('/feed') ? styles.active : ''}`}>
                <Home size={24} className={styles.icon} />
            </Link>

            <Link href="/friends" className={`${styles.navItem} ${isActive('/friends') ? styles.active : ''}`}>
                <Users size={24} className={styles.icon} />
            </Link>

            <Link href="/chat" className={`${styles.navItem} ${isActive('/chat') ? styles.active : ''}`}>
                <MessageSquare size={24} className={styles.icon} />
            </Link>

            <Link href="/notifications" className={`${styles.navItem} ${isActive('/notifications') ? styles.active : ''}`}>
                <Bell size={24} className={styles.icon} />
            </Link>

            <Link href="/profile" className={`${styles.navItem} ${isActive('/profile') ? styles.active : ''}`}>
                <User size={24} className={styles.icon} />
            </Link>
        </nav>
    );
};

export default MobileNavBar;
