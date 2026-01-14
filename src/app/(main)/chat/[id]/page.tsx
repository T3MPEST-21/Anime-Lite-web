"use client";
import React, { useEffect, useState, useRef } from 'react';
import styles from './chatwindow.module.css';
import { getMessages, sendMessage, markMessagesAsRead, Message } from '@/services/chatService';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useUnreadMessages } from '@/context/UnreadMessagesContext';
import Image from 'next/image';
import { Send, ArrowLeft, Loader2, Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const ChatWindow = () => {
    const { refreshUnreadCount } = useUnreadMessages();
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const conversationId = params.id as string;
    // We can pass username as query param for quick header rendering
    const otherUserNameFromParam = searchParams.get('name');

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [currentUser, setCurrentUser] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Initial Load
    useEffect(() => {
        const init = async () => {
            console.log(`DEBUG: Chat window init for conversation ${conversationId}`);
            const { data: { user } } = await supabase.auth.getUser();
            console.log(`DEBUG: Current user:`, user);
            if (!user) return;
            setCurrentUser(user.id);

            const { success, data } = await getMessages(conversationId);
            console.log(`DEBUG: getMessages result: success=${success}, messages count=${data?.length || 0}`);
            if (success && data) {
                // Determine other user name if not in params (future improvement: fetch conversation details)
                setMessages(data);

                // Mark as read
                console.log(`DEBUG: About to mark messages as read`);
                const markResult = await markMessagesAsRead(conversationId);
                console.log(`DEBUG: markMessagesAsRead result:`, markResult);

                console.log(`DEBUG: About to refresh unread count`);
                await refreshUnreadCount();
                console.log(`DEBUG: Finished refreshing unread count`);
            }
            setLoading(false);
        };
        init();
    }, [conversationId, refreshUnreadCount]);

    // Real-time Subscription
    useEffect(() => {
        if (!conversationId) return;

        const channel = supabase
            .channel(`chat_room:${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`
                },
                (payload) => {
                    const newMsg = payload.new as Message;

                    setMessages((prev) => {
                        // Dedup: check if ID exists (optimistic updates might have temp ID, but here we get real DB ID)
                        if (prev.some(m => m.id === newMsg.id)) return prev;
                        return [newMsg, ...prev]; // Prepend because flex-direction: column-reverse
                    });

                    // If we are looking at this conversation, mark it as read immediately
                    // checking `document.visibilityState` is good practice too
                    if (newMsg.sender_id !== currentUser && document.visibilityState === 'visible') {
                        markMessagesAsRead(conversationId).then(() => {
                            refreshUnreadCount();
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim() || !currentUser || sending) return;

        const content = newMessage.trim();
        setNewMessage('');
        setSending(true);

        // Optimistic Update
        const tempId = Math.random().toString();
        const optimisticMsg: Message = {
            id: tempId,
            content: content,
            sender_id: currentUser,
            conversation_id: conversationId,
            created_at: new Date().toISOString(),
            status: 'pending',
            profile: null // We don't strictly need profile for our own bubbles usually
        };

        setMessages(prev => [optimisticMsg, ...prev]);

        // Send to DB
        const { success, data, error } = await sendMessage(conversationId, content);

        if (success && data) {
            // Replace optimistic with real
            setMessages(prev => prev.map(m => m.id === tempId ? data : m));
        } else {
            console.error("Failed to send", error);
            // Mark as failed (Visual feedback todo)
            setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m));
        }
        setSending(false);
    };

    if (loading) return <div className={styles.loading}><Loader2 className="animate-spin" /></div>;

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <button onClick={() => router.back()} className={styles.backButton}>
                    <ArrowLeft size={24} />
                </button>
                <div className={styles.headerInfo}>
                    <div className={styles.headerAvatar}>
                        <Image
                            src={`https://ui-avatars.com/api/?background=random&name=${otherUserNameFromParam || 'User'}`}
                            alt="User"
                            fill
                            className="object-cover"
                        />
                    </div>
                    <span className={styles.headerName}>{otherUserNameFromParam || 'Chat'}</span>
                </div>
            </div>

            {/* Messages (flex-direction: column-reverse handles scrolling to bottom) */}
            <div className={styles.messagesList} ref={scrollRef}>
                {messages.map((msg) => {
                    const isOwn = msg.sender_id === currentUser;
                    return (
                        <div key={msg.id} className={`${styles.messageWrapper} ${isOwn ? styles.sent : styles.received}`}>
                            <div className={styles.bubble}>
                                {msg.content}
                            </div>
                            <div className={styles.statusRow}>
                                <span className={styles.timestamp}>
                                    {format(new Date(msg.created_at), 'h:mm a')}
                                </span>
                                {isOwn && (
                                    <span className={styles.statusIcon} title={msg.status}>
                                        {msg.status === 'pending' && <Clock size={12} />}
                                        {msg.status === 'sent' && <Check size={12} />}
                                        {msg.status === 'delivered' && <CheckCheck size={12} />}
                                        {msg.status === 'read' && <CheckCheck size={12} color="#3b82f6" />}
                                        {msg.status === 'failed' && <AlertCircle size={12} color="#ef4444" />}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Input */}
            <form className={styles.inputArea} onSubmit={handleSend}>
                <input
                    type="text"
                    className={styles.input}
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit" className={styles.sendButton} disabled={!newMessage.trim() || sending}>
                    <Send size={20} />
                </button>
            </form>
        </div>
    );
};

export default ChatWindow;
