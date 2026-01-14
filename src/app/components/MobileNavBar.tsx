"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, MessageSquare, Bell, User } from 'lucide-react';
import styles from './MobileNavBar.module.css';
import { useUnreadMessages } from '@/context/UnreadMessagesContext';
import { useFriendRequests } from '@/context/FriendRequestContext';
import { useNotifications } from '@/context/NotificationContext';

const MobileNavBar = () => {
    const { unreadCount } = useUnreadMessages();
    const { requestCount } = useFriendRequests();
    const { unreadCount: notificationCount } = useNotifications();

    const pathname = usePathname();
    const isActive = (path: string) => pathname === path;

    return (
        <nav className={styles.container}>
            <Link href="/feed" className={`${styles.navItem} ${isActive('/feed') ? styles.active : ''}`}>
                <Home size={24} className={styles.icon} />
            </Link>

            <Link href="/friends" className={`${styles.navItem} ${isActive('/friends') ? styles.active : ''}`} style={{ position: 'relative' }}>
                <Users size={24} className={styles.icon} />
                {requestCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '4px',
                        right: '12px',
                        backgroundColor: 'red',
                        color: 'white',
                        fontSize: '10px',
                        borderRadius: '50%',
                        minWidth: '16px',
                        height: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        zIndex: 10,
                        border: '1px solid var(--surface, #000)'
                    }}>
                        {requestCount > 99 ? '99+' : requestCount}
                    </span>
                )}
            </Link>

            <Link href="/chat" className={`${styles.navItem} ${isActive('/chat') ? styles.active : ''}`} style={{ position: 'relative' }}>
                <MessageSquare size={24} className={styles.icon} />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '4px',
                        right: '12px',
                        backgroundColor: 'red',
                        color: 'white',
                        fontSize: '10px',
                        borderRadius: '50%',
                        minWidth: '16px',
                        height: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        zIndex: 10,
                        border: '1px solid var(--surface, #000)'
                    }}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </Link>

            <Link href="/notifications" className={`${styles.navItem} ${isActive('/notifications') ? styles.active : ''}`} style={{ position: 'relative' }}>
                <Bell size={24} className={styles.icon} />
                {notificationCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '4px',
                        right: '12px',
                        backgroundColor: 'red',
                        color: 'white',
                        fontSize: '10px',
                        borderRadius: '50%',
                        minWidth: '16px',
                        height: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        zIndex: 10,
                        border: '1px solid var(--surface, #000)'
                    }}>
                        {notificationCount > 99 ? '99+' : notificationCount}
                    </span>
                )}
            </Link>

            <Link href="/profile" className={`${styles.navItem} ${isActive('/profile') ? styles.active : ''}`}>
                <User size={24} className={styles.icon} />
            </Link>
        </nav>
    );
};

export default MobileNavBar;
