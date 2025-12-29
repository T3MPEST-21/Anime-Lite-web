"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchNotifications, markAsRead, Notification } from '@/services/notificationService';
import NotificationItem from '@/app/components/NotificationItem';
import styles from './notifications.module.css';
import { Loader2, BellOff } from 'lucide-react';

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { success, data } = await fetchNotifications(user.id);
            if (success && data) {
                setNotifications(data);
            }
        }
        setLoading(false);
    };

    const handleNotificationClick = async (id: string) => {
        // Mark locally
        const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
        setNotifications(updated);

        // Mark on server
        await markAsRead(id);

        // Optionally navigate to the post (not implemented yet, just marking read for now)
    };

    if (loading) {
        return (
            <div className={styles.center}>
                <Loader2 className={styles.spinner} size={32} />
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Notifications</h1>
            </div>

            {notifications.length === 0 ? (
                <div className={styles.emptyState}>
                    <BellOff size={48} />
                    <p>No notifications yet</p>
                </div>
            ) : (
                <div className={styles.list}>
                    {notifications.map(n => (
                        <NotificationItem
                            key={n.id}
                            notification={n}
                            onClick={handleNotificationClick}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;
