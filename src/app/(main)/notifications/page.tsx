"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchNotifications, markAsRead, Notification } from '@/services/notificationService';
import NotificationItem from '@/app/components/NotificationItem';
import styles from './notifications.module.css';
import { Loader2, BellOff } from 'lucide-react';

const NotificationsPage = () => {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const { refreshUnreadCount } = useNotifications(); // Hook for global badge

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

    useEffect(() => {
        loadNotifications();
    }, []);

    const handleNotificationClick = async (notification: Notification) => {
        // 1. Optimistic update (mark read locally)
        const updated = notifications.map(n => n.id === notification.id ? { ...n, read: true } : n);
        setNotifications(updated);

        // 2. Mark on server
        await markAsRead(notification.id);

        // 3. Refresh global badge count
        await refreshUnreadCount();

        // 4. Navigate based on type
        // The mobile app navigates to Profile for 'follows' (friend request?) or Post for 'likes/comments'
        // Notification types: 'like' | 'comment'
        // We might add 'follow' later correctly.

        // However, I need to know the POST ID or USER ID.
        // The Notification Interface has 'posts' object but we need post_id.
        // Let's check the service. fetchNotifications selects `posts:post_id (body)`.
        // Wait, standard Supabase response includes the FK column if requested or implied.
        // But `fetchNotifications` code:
        /*
            .select(`
          id,
          type, ...
          posts:post_id (body)
        `)
        */
        // Does it return post_id at the top level? NO.
        // I need to update the service to select `post_id` and `actor_id` explicitly if I want to use them for navigation.
        // Or access them if they are returned.

        // Actually, let's look at the object.
        // Usually Supabase returns the foreign key column too if not hidden.
        // But let's verify.

        // Assuming I can get post_id from the notification object if I add it to the select.
        // AND actor_id.

        // For now, I will modify the Service FIRST to include post_id and actor_id in the select.

        if (notification.type === 'like' || notification.type === 'comment') {
            if (notification.post_id) {
                // We don't have a single post page yet, so maybe just open the user profile or do nothing?
                // Wait, do we have a post page? /feed is the main place.
                // Mobile app likely opens a PostDetail screen.
                // We should check if we have dynamic routing for posts.
                // Checking file structure... we don't seem to have /post/[id] yet.
                // But we have Profiles.

                // For now, let's navigate to the user's profile who interacted?
                // OR better, create a Post Detail page in the future.
                // Let's check if the user asked for Post Detail feature? No.

                // Workaround: Navigate to the User's profile who liked/commented.
                // OR stay on page.

                // Let's assume we want to see the post.
                // If I cannot see the post, maybe I should navigate to the actor's profile.
                if (notification.actor_id) {
                    router.push(`/user/${notification.actor_id}`);
                }
            }
        } else {
            // Default fall back
            if (notification.actor_id) {
                router.push(`/user/${notification.actor_id}`);
            }
        }
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
