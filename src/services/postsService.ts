
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
                .from("post_comments")
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
    } catch (error: any) {
        console.error('exception creating post:', error)
        return { success: false, msg: error.message };
    }
}
