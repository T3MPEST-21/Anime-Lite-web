import react from "react";
import styles from "./Postcard.module.css";
import { Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react";

// Define the shape of my Post object
// i can move this to a types file later

interface PostProps {
  post: {
    id: string;
    body: string;
    created_at: string;
    user: {
      username: string;
      image: string | null;
      full_name?: string; // Optional or mapped from somewhere else if needed, but profiles only has username/image
    };
    post_likes: { count: number }[];
    post_comments: { count: number }[];
  };
}

const PostCard = ({ post }: PostProps) => {
  //get the count safely
  const likeCount = post.post_likes?.[0]?.count || 0;
  const commentCount = post.post_comments?.[0]?.count || 0;


  // this will be for the defsult avatar if user has none
  const avatarUrl = post.user?.image
    ? post.user.image
    : 'https://ui-avatars.com/api/?background=random&name=' + (post.user?.username || 'User');

  return (
    <div className={styles.card}>
      {/* Header: Avatar, Name, Time */}
      <div className={styles.header}>
        <img
          src={avatarUrl}
          alt="Avatar"
          className={styles.avatar}
        />
        <div className={styles.userInfo}>
          <span className={styles.name}>{post.user?.username || 'Unknown User'}</span>
          {/* <span className={styles.username}>@{post.user?.username}</span> */}
        </div>
        <button className={styles.actionButton} style={{ marginLeft: 'auto' }}>
          <MoreHorizontal size={20} />
        </button>
      </div>
      {/* Post Body */}
      <div className={styles.body}>
        {post.body}
      </div>
      {/* Actions: Like, Comment, Share */}
      <div className={styles.actions}>
        <button className={styles.actionButton}>
          <Heart size={20} />
          <span>{likeCount}</span>
        </button>

        <button className={styles.actionButton}>
          <MessageCircle size={20} />
          <span>{commentCount}</span>
        </button>

        <button className={styles.actionButton}>
          <Share2 size={20} />
        </button>
      </div>
    </div>
  )
}

export default PostCard;