
import { supabase } from "@/lib/supabase";

/**
 * Fetch all posts with their creators' profiles, likes (count), and comments (count).
 * This joins the 'users' (or 'profiles') table.
 */
export const fetchPosts = async (currentUserId?: string) => {
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

            // Check if current user liked
            let isLiked = false;
            if (currentUserId) {
                const { data: likeData } = await supabase
                    .from("post_likes")
                    .select("id")
                    .eq("post_id", post.id)
                    .eq("user_id", currentUserId) // check if THIS user liked it
                    .single();
                isLiked = !!likeData;
            }

            // Fetch Comment Count
            const { count: commentCount } = await supabase
                .from("comments")
                .select("id", { count: "exact", head: true })
                .eq("post_id", post.id);

            // Fetch Images
            const { data: postImages } = await supabase
                .from("post_images")
                .select("image_url")
                .eq("post_id", post.id);

            return {
                ...post,
                user: user || { username: 'Unknown', image: null }, // Fallback
                post_likes: [{ count: likeCount || 0 }],
                post_comments: [{ count: commentCount || 0 }],
                post_images: postImages || [],
                isLiked: isLiked
            };
        }));

        return { success: true, data: postsWithData };
    } catch (error) {
        console.error("Exception in fetchPosts:", error);
        return { success: false, msg: "Exception fetching posts" };
    }
};

/**
 * Fetch posts for a specific user
 */
export const fetchPostsByUser = async (userId: string, currentUserId?: string) => {
    try {
        // 1. Fetch raw posts for the user
        const { data: posts, error } = await supabase
            .from("posts")
            .select(`*`)
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching user posts:", error);
            return { success: false, msg: "Could not fetch posts" };
        }

        // 2. Enrich posts with profile, likes, comments (Reuse logic if possible, or duplicate for now)
        // Since we already have the user profile (it's the same user), we can optimize this.
        // But for consistency with PostCard, let's keep the structure identical.

        const postsWithData = await Promise.all(posts.map(async (post) => {
            // We know the user, but let's fetch strictly to match the shape or just use the known ID?
            // Actually, for the Feed we fetch profiles. Here we can do the same to ensure valid data.
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

            // Check if current user liked
            let isLiked = false;
            if (currentUserId) {
                const { data: likeData } = await supabase
                    .from("post_likes")
                    .select("id")
                    .eq("post_id", post.id)
                    .eq("user_id", currentUserId)
                    .single();
                isLiked = !!likeData;
            }

            // Fetch Comment Count
            const { count: commentCount } = await supabase
                .from("comments")
                .select("id", { count: "exact", head: true })
                .eq("post_id", post.id);

            // Fetch Images
            const { data: postImages } = await supabase
                .from("post_images")
                .select("image_url")
                .eq("post_id", post.id);

            return {
                ...post,
                user: user || { username: 'Unknown', image: null },
                post_likes: [{ count: likeCount || 0 }],
                post_comments: [{ count: commentCount || 0 }],
                post_images: postImages || [],
                isLiked: isLiked
            };
        }));

        return { success: true, data: postsWithData };
    } catch (error) {
        console.error("Exception in fetchPostsByUser:", error);
        return { success: false, msg: "Exception fetching user posts" };
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
        .from("comments")
        .insert([{ post_id: postId, user_id: userId, content: comment }]);
    if (error) {
        console.error("Error adding comment:", error);
        return { success: false, error };
    }
    return { success: true, data };
};

// Fetch comments for a post
export const fetchComments = async (postId: string, sortOrder: 'newest' | 'oldest' = 'newest') => {
    try {
        const { data, error } = await supabase
            .from("comments")
            .select(`
                id,
                content,
                created_at,
                user_id,
                profiles!user_id (
                    username,
                    image
                )
            `)
            .eq("post_id", postId)
            .order("created_at", { ascending: sortOrder === 'oldest' });

        if (error) {
            console.error("Error fetching comments:", error);
            return { success: false, error };
        }

        // Flatten the profiles array if necessary
        const formattedData = data.map((item: any) => ({
            ...item,
            profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
        }));

        return { success: true, data: formattedData };
    } catch (e) {
        console.error("Exception in fetchComments:", e);
        return { success: false, error: e };
    }
};

// create a new post
export const createPost = async (userId: string, body: string, imageFiles: File[]) => {
    try {
        // first, create the post entry
        const { data: postData, error: postError } = await supabase
            .from("posts")
            .insert([{
                body,
                user_id: userId,
            }])
            .select() //return a new post
            .single();

        if (postError) {
            console.error('error creating the post', postError);
            return { success: false, msg: postError.message };
        }

        const postId = postData.id;
        // second, if (image) {upload image}
        if (imageFiles.length > 0) {
            for (const file of imageFiles) {
                // upload to storage
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random()}.${fileExt}`;
                const filePath = `posts/${userId}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('uploads')
                    .upload(filePath, file);

                if (uploadError) {
                    console.error('error uploading image', uploadError);
                    continue;
                }

                // get public url
                const { data: { publicUrl } } = supabase.storage
                    .from('uploads')
                    .getPublicUrl(filePath);

                // link to post in database
                await supabase
                    .from('post_images')
                    .insert({
                        post_id: postId,
                        image_url: publicUrl,
                    });
            }
        }

        return { success: true, data: postData };
    } catch (error: unknown) {
        console.error('exception creating post:', error)
        return { success: false, msg: error instanceof Error ? error.message : 'Unknown error' };
    }
}
