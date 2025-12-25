"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image"; // Optimization
import styles from "./Postcard.module.css";
import { Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react";
import ImageGrid from "./ImageGrid";
import ImageGallery from "./ImageGallery";
import { likePost, unlikePost } from "@/services/postsService";
import { supabase } from "@/lib/supabase"; // To get current user

interface PostProps {
  post: {
    id: string;
    body: string;
    created_at: string;
    user: {
      username: string;
      image: string | null;
      full_name?: string;
    };
    post_images: { image_url: string }[];
    post_likes: { count: number }[];
    post_comments: { count: number }[];
    isLiked?: boolean;
  };
}

const PostCard = ({ post }: PostProps) => {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // LOCAL STATE for Likes (This makes it feel instant!)
  const [liked, setLiked] = useState(post.isLiked || false);
  const [likeCount, setLikeCount] = useState(post.post_likes?.[0]?.count || 0);

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

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();

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
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              // Fallback: Re-verify status
              const { error } = await supabase
                .from('post_likes')
                .select('id')
                .eq('post_id', post.id)
                .eq('user_id', user.id)
                .single();

              if (error) { // If record not found, it means I am not liking it anymore
                setLiked(false);
              }
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
    // 1. Get current user
    const { data: { user } } = await supabase.auth.getUser();
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
      await likePost(post.id, user.id);
    } else {
      await unlikePost(post.id, user.id);
    }
  };

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
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
          {/* <span className={styles.username}>@{post.user?.username || 'user'}</span> */}
        </div>
        <button className={styles.actionButton} style={{ marginLeft: 'auto' }}>
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Body */}
      <div className={styles.body} dangerouslySetInnerHTML={{ __html: post.body }} />

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

        <button className={styles.actionButton}>
          <MessageCircle size={20} />
          <span>{post.post_comments?.[0]?.count || 0}</span>
        </button>

        <button className={styles.actionButton}>
          <Share2 size={20} />
        </button>
      </div>

      {/* Gallery */}
      <ImageGallery
        isOpen={isGalleryOpen}
        images={imageUrls}
        initialIndex={currentImageIndex}
        onClose={() => setIsGalleryOpen(false)}
      />
    </div>
  )
}

export default PostCard;