"use client";
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from "@/lib/supabase";
import { fetchComments, addComment } from "@/services/postsService";
import styles from './CommentsModal.module.css';
import Image from 'next/image';
import { X, Send, MessageCircle } from 'lucide-react';

interface CommentsModalProps {
    isOpen: boolean;
    onClose: () => void;
    post: {
        id: string;
        user: {
            username: string;
            image: string | null;
        };
        body: string;
    } | null;
}

interface Comment {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    profiles: {
        username: string;
        image: string | null;
    } | null;
}

import { useModalBehavior } from "@/hooks/useModalBehavior";

const CommentsModal = ({ isOpen, onClose, post }: CommentsModalProps) => {
    // Apply Modal UX Behavior (Scroll Lock + Back Button)
    useModalBehavior(isOpen, onClose);

    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const commentsEndRef = useRef<HTMLDivElement>(null);

    // Fetch user on mount
    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Fetch profile image if needed, or use metadata
                const { data: profile } = await supabase.from('profiles').select('image').eq('id', user.id).single();
                setCurrentUser({ ...user, image: profile?.image });
            }
        };
        getUser();
    }, []);

    // Fetch Comments & Subscribe when Open
    useEffect(() => {
        if (!isOpen || !post) return;

        const loadComments = async () => {
            setLoading(true);
            const { success, data } = await fetchComments(post.id, sortOrder);
            if (success && data) {
                setComments(data);
                scrollToBottom();
            }
            setLoading(false);
        };

        loadComments();
    }, [isOpen, post, sortOrder]);

    // Realtime subscription
    useEffect(() => {
        if (!isOpen || !post) return;

        // Realtime Subscription
        const channel = supabase
            .channel(`realtime:comments:${post.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'comments',
                    filter: `post_id=eq.${post.id}`,
                },
                async (payload) => {
                    // Skip if this is our own comment (already optimistically added)
                    if (currentUser && payload.new.user_id === currentUser.id) {
                        // Update the optimistic comment with real data (id, timestamp)
                        setComments((prev) => prev.map(c =>
                            c.id === 'temp' ? { ...payload.new, profiles: c.profiles } as Comment : c
                        ));
                        return;
                    }

                    // Fetch the profile for the new comment
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('username, image')
                        .eq('id', payload.new.user_id)
                        .single();

                    const newCommentWithProfile = {
                        ...payload.new,
                        profiles: profile
                    } as Comment;

                    setComments((prev) =>
                        sortOrder === 'newest'
                            ? [newCommentWithProfile, ...prev]
                            : [...prev, newCommentWithProfile]
                    );
                    if (sortOrder === 'oldest') scrollToBottom();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isOpen, post, currentUser, sortOrder]);

    const scrollToBottom = () => {
        setTimeout(() => {
            commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const handleSend = async () => {
        if (!newComment.trim() || !post || !currentUser) return;

        const commentText = newComment.trim();
        setNewComment(""); // Optimistic clear

        // Optimistic update - add immediately
        const optimisticComment: Comment = {
            id: 'temp',
            content: commentText,
            created_at: new Date().toISOString(),
            user_id: currentUser.id,
            profiles: {
                username: currentUser.email?.split('@')[0] || 'You',
                image: currentUser.image
            }
        };

        setComments((prev) =>
            sortOrder === 'newest'
                ? [optimisticComment, ...prev]
                : [...prev, optimisticComment]
        );
        if (sortOrder === 'oldest') scrollToBottom();

        // Send to server (realtime will update with real data)
        const { success } = await addComment(post.id, currentUser.id, commentText);
        if (!success) {
            alert("Failed to send comment");
            setComments((prev) => prev.filter(c => c.id !== 'temp'));
            setNewComment(commentText);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <span className={styles.title}>Comments</span>
                    <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: '1px solid var(--border, #ddd)',
                            background: 'var(--background, #424040ff)',
                            fontSize: '0.85rem',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="newest">Newest first</option>
                        <option value="oldest">Oldest first</option>
                    </select>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className={styles.content}>
                    {/* Empty State */}
                    {!loading && comments.length === 0 && (
                        <div className={styles.emptyState}>
                            <MessageCircle size={48} opacity={0.2} />
                            <p>No comments yet. Start the conversation!</p>
                        </div>
                    )}

                    <div className={styles.commentList}>
                        {comments.map((comment) => (
                            <div key={comment.id} className={styles.commentItem}>
                                <div className={styles.avatarWrapper}>
                                    <Image
                                        src={comment.profiles?.image || `https://ui-avatars.com/api/?name=${comment.profiles?.username || 'User'}&background=random`}
                                        alt="User"
                                        fill
                                        style={{ objectFit: 'cover' }}
                                        unoptimized
                                    />
                                </div>
                                <div className={styles.commentBody}>
                                    <div className={styles.commentHeader}>
                                        <span className={styles.username}>{comment.profiles?.username || 'Unknown'}</span>
                                        <span className={styles.time}>{new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <p className={styles.text}>{comment.content}</p>
                                </div>
                            </div>
                        ))}
                        <div ref={commentsEndRef} />
                    </div>
                </div>

                {/* Footer / Input */}
                <div className={styles.footer}>
                    <div className={styles.avatarWrapper} style={{ width: 32, height: 32, marginBottom: 6 }}>
                        {currentUser && (
                            <Image
                                src={currentUser.image || `https://ui-avatars.com/api/?name=${currentUser.email || 'Me'}&background=random`}
                                alt="Me"
                                fill
                                style={{ objectFit: 'cover' }}
                                unoptimized
                            />
                        )}
                    </div>
                    <textarea
                        className={styles.input}
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                    />
                    <button
                        className={styles.sendBtn}
                        onClick={handleSend}
                        disabled={!newComment.trim()}
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CommentsModal;
