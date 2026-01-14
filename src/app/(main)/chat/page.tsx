"use client";
import React, { useEffect, useState } from 'react';
import styles from './chat.module.css';
import { getConversations, Conversation, markAllMessagesAsRead } from '@/services/chatService';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Loader2, CheckCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUnreadMessages } from '@/context/UnreadMessagesContext';

const ChatListPage = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const { refreshUnreadCount } = useUnreadMessages();
    const [markingRead, setMarkingRead] = useState(false);
    const router = useRouter();

    const handleMarkAllRead = async () => {
        setMarkingRead(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await markAllMessagesAsRead(user.id);
            refreshUnreadCount();
        }
        setMarkingRead(false);
    };

    useEffect(() => {
        const fetchChats = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { success, data } = await getConversations(user.id);
                if (success && data) {
                    setConversations(data);
                }
            }
            setLoading(false);
        };

        fetchChats();
    }, []);

    if (loading) {
        return (
            <div className={styles.loading}>
                <Loader2 size={32} className="animate-spin" />
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1>Messages</h1>
                        <p>Your conversations</p>
                    </div>
                    <button
                        onClick={handleMarkAllRead}
                        disabled={markingRead}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 12px',
                            borderRadius: '20px',
                            border: '1px solid var(--border)',
                            backgroundColor: 'var(--surface)',
                            color: 'var(--text-secondary)',
                            cursor: markingRead ? 'default' : 'pointer',
                            fontSize: '13px',
                            opacity: markingRead ? 0.7 : 1
                        }}
                    >
                        {markingRead ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
                        Mark all read
                    </button>
                </div>
            </div>

            {conversations.length === 0 ? (
                <div className={styles.empty}>
                    <MessageSquare size={48} className={styles.emptyIcon} />
                    <p>No conversations yet.</p>
                    <p>Start a chat from your Friends list!</p>
                </div>
            ) : (
                <div className={styles.chatList}>
                    {conversations.map((chat) => (
                        <Link
                            href={`/chat/${chat.id}?name=${encodeURIComponent(chat.other_participant.username)}`}
                            key={chat.id}
                            className={styles.conversationItem}
                        >
                            <div className={styles.avatarWrapper}>
                                <Image
                                    src={chat.other_participant.image || `https://ui-avatars.com/api/?background=random&name=${chat.other_participant.username}`}
                                    alt={chat.other_participant.username}
                                    fill
                                    className={styles.avatar}
                                />
                            </div>
                            <div className={styles.content}>
                                <div className={styles.topRow}>
                                    <span className={styles.username}>{chat.other_participant.username}</span>
                                    {chat.last_message_at && (
                                        <span className={styles.time}>
                                            {formatDistanceToNow(new Date(chat.last_message_at), { addSuffix: true })}
                                        </span>
                                    )}
                                </div>
                                <p className={styles.lastMessage}>
                                    {chat.last_message
                                        ? (chat.last_message.sender_id === chat.other_participant.id ? '' : 'You: ') + chat.last_message.content
                                        : 'No messages yet'}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ChatListPage;
