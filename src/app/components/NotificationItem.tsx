import React from 'react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle } from 'lucide-react';
import styles from './NotificationItem.module.css';
import { Notification } from '@/services/notificationService';

interface NotificationItemProps {
    notification: Notification;
    onClick: (id: string) => void;
}

const NotificationItem = ({ notification, onClick }: NotificationItemProps) => {
    const isLike = notification.type === 'like';
    const actor = notification.actor_profiles;
    const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true });

    return (
        <div
            className={`${styles.item} ${!notification.read ? styles.unread : ''}`}
            onClick={() => onClick(notification.id)}
        >
            <div className={styles.avatarWrapper}>
                <Image
                    src={actor?.image || `https://ui-avatars.com/api/?background=random&name=${actor?.username || 'User'}`}
                    alt={actor?.username || 'User'}
                    fill
                    className={styles.avatar}
                    unoptimized
                />
            </div>

            <div className={styles.content}>
                <div className={styles.message}>
                    <span className={styles.username}>{actor?.username || 'Someone'}</span>
                    {isLike ? ' liked your post' : ' commented on your post'}
                </div>

                {notification.content && !isLike && (
                    <div className={styles.preview}>"{notification.content}"</div>
                )}

                <div className={styles.time}>{timeAgo}</div>
            </div>

            <div className={styles.icon}>
                {isLike ? (
                    <Heart size={20} color="var(--primary)" fill="var(--primary)" />
                ) : (
                    <MessageCircle size={20} color="var(--text-secondary)" />
                )}
            </div>

            {!notification.read && <div className={styles.unreadDot} />}
        </div>
    );
};

export default NotificationItem;
