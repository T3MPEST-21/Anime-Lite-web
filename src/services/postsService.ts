
import { supabase } from "@/lib/supabase";

/**
 * Fetch all posts with their creators' profiles, likes (count), and comments (count).
 * This joins the 'users' (or 'profiles') table.
 */
export const fetchPosts = async () => {
    try {
        // 1. Fetch the raw posts first (no joins yet)
        const { data: posts, error } = await supabase
            .from("posts")
            .select(`*`)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching posts:", error);
            return { success: false, msg: "Could not fetch posts" };
        }

        // 2. Manually fetch the user profile for each post
        // (This mimics the mobile app logic since foreign keys might be missing)
        const postsWithData = await Promise.all(posts.map(async (post) => {
            // Fetch User Profile
            const { data: user } = await supabase
                .from('profiles')
                .select('username, image')
                .eq('id', post.user_id)
                .single();

            // Fetch Like Count
            const { count: likeCount } = await supabase
                .from("post_likes")
                .select("id", { count: "exact", head: true })
                .eq("post_id", post.id);

            // Fetch Comment Count
            const { count: commentCount } = await supabase
                .from("post_comments")
                .select("id", { count: "exact", head: true })
                .eq("post_id", post.id);

            return {
                ...post,
                user: user || { username: 'Unknown', image: null }, // Fallback
                post_likes: [{ count: likeCount || 0 }],
                post_comments: [{ count: commentCount || 0 }]
            };
        }));

        return { success: true, data: postsWithData };
    } catch (error) {
        console.error("Exception in fetchPosts:", error);
        return { success: false, msg: "Exception fetching posts" };
    }
};

// Like a post
export const likePost = async (postId: string, userId: string) => {
    const { data, error } = await supabase
        .from("post_likes")
        .insert([{ post_id: postId, user_id: userId }]);
    if (error) {
        console.error("Error liking post:", error);
        return { success: false, error };
    }
    return { success: true, data };
};

// Unlike a post
export const unlikePost = async (postId: string, userId: string) => {
    const { error } = await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);
    if (error) {
        console.error("Error unliking post:", error);
        return { success: false, error };
    }
    return { success: true };
};

// Add a comment
export const addComment = async (
    postId: string,
    userId: string,
    comment: string
) => {
    const { data, error } = await supabase
        .from("post_comments")
        .insert([{ post_id: postId, user_id: userId, comment }]);
    if (error) {
        console.error("Error adding comment:", error);
        return { success: false, error };
    }
    return { success: true, data };
};
