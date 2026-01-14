"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image"; // Optimization
import styles from "./Postcard.module.css";
import { Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react";
import ImageGrid from "./ImageGrid";
import ImageGallery from "./ImageGallery";
import { likePost, unlikePost } from "@/services/postsService";
import { supabase } from "@/lib/supabase"; // To get current user
import DOMPurify from "dompurify";
import { useAuth } from "@/context/AuthContext";

import dynamic from 'next/dynamic';

// Dynamic imports for code splitting
const CommentsModal = dynamic(() => import("./CommentsModal"), {
  loading: () => <div>Loading comments...</div>
});
const ProfileModal = dynamic(() => import("./ProfileModal"), {
  loading: () => <div>Loading profile...</div>
});

interface PostProps {
  post: {
    id: string;
    user_id: string; // Ensure this is typed
    body: string;
    created_at: string;
    user: {
      id?: string; // Add optional ID since it might be needed for profile fetch
      username: string;
      image: string | null;
      full_name?: string;
    };
    post_images: { image_url: string }[];
    post_likes: { count: number }[];
    post_comments: { count: number }[];
    isLiked?: boolean;
  };
  onPostUpdate?: () => void;
}

const PostCard = React.memo(({ post, onPostUpdate }: PostProps) => {
  const { user } = useAuth();
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false); // Profile Modal State
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // LOCAL STATE for Likes (This makes it feel instant!)
  const [liked, setLiked] = useState(post.isLiked || false);
  const [likeCount, setLikeCount] = useState(post.post_likes?.[0]?.count || 0);
  const [commentCount, setCommentCount] = useState(post.post_comments?.[0]?.count || 0);

  // REALTIME SUBSCRIPTION
  useEffect(() => {
    // console.log('Setting up subscription for post:', post.id);

    const channel = supabase
      .channel(`realtime:post_likes:${post.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT and DELETE
          schema: 'public',
          table: 'post_likes',
          filter: `post_id=eq.${post.id}`,
        },
        async (payload) => {
          // console.log('Realtime change received!', payload);

          if (payload.eventType === 'INSERT') {
            // console.log('New Like detected');

            // If this is MY like, I already incremented optimistically, so skip count update
            if (user && payload.new.user_id === user.id) {
              // But DO update the liked state for cross-device sync
              setLiked(true);
            } else {
              // Someone else liked it, so increment count
              setLikeCount((prev) => prev + 1);
            }
          }
          else if (payload.eventType === 'DELETE') {
            // console.log('Unlike detected');
            setLikeCount((prev) => Math.max(0, prev - 1));

            // If *I* unliked it on another device, turn my heart grey
            if (user && payload.old.user_id === user.id) {
              setLiked(false);
            }
          }
        }
      )
      .subscribe((status) => {
        // console.log(`Subscription status for ${post.id}:`, status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [post.id, user]);

  // REALTIME SUBSCRIPTION FOR COMMENTS
  useEffect(() => {
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
        () => {
          // Increment count when new comment is added
          setCommentCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [post.id]);

  // Avatar fallback
  const avatarUrl = post.user?.image
    ? post.user.image
    : 'https://ui-avatars.com/api/?background=random&name=' + (post.user?.username || 'User');

  const imageUrls = post.post_images?.map(img => img.image_url) || [];

  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
    setIsGalleryOpen(true);
  };

  // THE LIKE LOGIC ❤️
  const handleLike = async () => {
    if (!user) {
      alert("Please login to like posts");
      return;
    }

    // 2. Optimistic UI Update (Update screen BEFORE waiting for server)
    const newLikedStatus = !liked;
    setLiked(newLikedStatus);
    setLikeCount(prev => newLikedStatus ? prev + 1 : prev - 1);

    // 3. Call Server
    if (newLikedStatus) {
      await likePost(post.id);
    } else {
      await unlikePost(post.id);
    }
  };

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <div
          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flex: 1 }}
          onClick={() => setIsProfileOpen(true)}
        >
          <div style={{ position: 'relative', width: '40px', height: '40px', marginRight: '12px' }}>
            <Image
              src={avatarUrl}
              alt="Avatar"
              fill
              className={styles.avatar}
              style={{ objectFit: 'cover', borderRadius: '50%' }}
              sizes="40px"
              unoptimized
            />
          </div>
          <div className={styles.userInfo}>
            <span className={styles.name}>{post.user?.username || 'Unknown User'}</span>
          </div>
        </div>
        <button className={styles.actionButton} style={{ marginLeft: 'auto' }}>
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Body */}
      <div
        className={styles.body}
        dangerouslySetInnerHTML={{ __html: typeof window !== 'undefined' ? DOMPurify.sanitize(post.body) : post.body }}
      />

      {/* Grid */}
      <ImageGrid images={imageUrls} onImageClick={handleImageClick} />

      {/* Actions */}
      <div className={styles.actions}>

        {/* LIKE BUTTON */}
        <button className={styles.actionButton} onClick={handleLike}>
          {/* Fill the heart if liked! */}
          <Heart size={20} fill={liked ? "red" : "none"} color={liked ? "red" : "currentColor"} />
          <span>{likeCount}</span>
        </button>

        <button className={styles.actionButton} onClick={() => setIsCommentsOpen(true)}>
          <MessageCircle size={20} />
          <span>{commentCount}</span>
        </button>

        <button className={styles.actionButton}>
          <Share2 size={20} />
        </button>
      </div>

      {/* Gallery */}
      <ImageGallery
        isOpen={isGalleryOpen}
        images={post.post_images || []}
        initialIndex={currentImageIndex}
        onClose={() => setIsGalleryOpen(false)}
      />


      {/* Comments Modal */}
      <CommentsModal
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
        post={post}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userId={post.user_id}
      />
    </div>
  );
});

PostCard.displayName = 'PostCard';

export default PostCard;