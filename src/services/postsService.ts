
import { supabase } from "@/lib/supabase";

/**
 * Fetch all posts with their creators' profiles, likes (count), and comments (count).
 * Optimized with Supabase joins to avoid N+1 queries.
 */
/**
 * Fetch all posts with their creators' profiles, likes (count), and comments (count).
 * Optimized with Supabase joins to avoid N+1 queries.
 * Added Pagination to prevent fetching excessive data.
 */
export const fetchPosts = async (currentUserId?: string, page: number = 0, limit: number = 10) => {
    try {
        const from = page * limit;
        const to = from + limit - 1;

        // Explicit field selection for better security/performance
        const { data: posts, error } = await supabase
            .from("posts")
            .select(`
                id,
                body,
                created_at,
                user_id,
                profiles (
                    username,
                    image
                ),
                post_images (
                    image_url
                ),
                post_likes (
                    user_id
                ),
                comments (
                    id
                )
            `)
            .order("created_at", { ascending: false })
            .range(from, to);

        if (error) {
            console.error("Error fetching posts:", error);
            return { success: false, msg: "Could not fetch posts" };
        }

        // Transform the joined data to match your existing interface
        const postsWithData = posts?.map((post: any) => {
            const likeCount = post.post_likes?.length || 0;
            const commentCount = post.comments?.length || 0;
            const isLiked = currentUserId
                ? post.post_likes?.some((like: any) => like.user_id === currentUserId) || false
                : false;

            // Handle profiles being an array or object
            const userData = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;

            return {
                ...post,
                user: userData || { username: 'Unknown', image: null },
                post_likes: [{ count: likeCount }],
                post_comments: [{ count: commentCount }],
                post_images: post.post_images || [],
                isLiked: isLiked
            };
        }) || [];

        return { success: true, data: postsWithData };
    } catch (error) {
        console.error("Exception in fetchPosts:", error);
        return { success: false, msg: "Exception fetching posts" };
    }
};

/**
 * Fetch posts for a specific user - optimized with joins
 */
/**
 * Fetch posts for a specific user - optimized with joins
 * Added Pagination
 */
export const fetchPostsByUser = async (userId: string, currentUserId?: string | null, page: number = 0, limit: number = 10) => {
    try {
        const from = page * limit;
        const to = from + limit - 1;

        // Single query with joins - much more efficient!
        const { data: posts, error } = await supabase
            .from("posts")
            .select(`
                id,
                body,
                created_at,
                user_id,
                profiles (
                    username,
                    image
                ),
                post_images (
                    image_url
                ),
                post_likes (
                    user_id
                ),
                comments (
                    id
                )
            `)
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .range(from, to);

        if (error) {
            console.error("Error fetching user posts:", error);
            return { success: false, msg: "Could not fetch posts" };
        }

        // Transform the joined data to match your existing interface
        const postsWithData = posts?.map((post: any) => {
            const likeCount = post.post_likes?.length || 0;
            const commentCount = post.comments?.length || 0;
            const isLiked = currentUserId
                ? post.post_likes?.some((like: any) => like.user_id === currentUserId) || false
                : false;

            // Handle profiles being an array or object
            const userData = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;

            return {
                ...post,
                user: userData || { username: 'Unknown', image: null },
                post_likes: [{ count: likeCount }],
                post_comments: [{ count: commentCount }],
                post_images: post.post_images || [],
                isLiked: isLiked
            };
        }) || [];

        return { success: true, data: postsWithData };
    } catch (error) {
        console.error("Exception in fetchPostsByUser:", error);
        return { success: false, msg: "Exception fetching user posts" };
    }
};

// Like a post
export const likePost = async (postId: string) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Unauthorized");

        const { data, error } = await supabase
            .from("post_likes")
            .insert([{ post_id: postId, user_id: user.id }]);

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error("Error liking post:", error);
        return { success: false, error };
    }
};

// Unlike a post
export const unlikePost = async (postId: string) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Unauthorized");

        const { error } = await supabase
            .from("post_likes")
            .delete()
            .eq("post_id", postId)
            .eq("user_id", user.id);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error("Error unliking post:", error);
        return { success: false, error };
    }
};

// Add a comment
export const addComment = async (
    postId: string,
    comment: string
) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Unauthorized");

        const { data, error } = await supabase
            .from("comments")
            .insert([{ post_id: postId, user_id: user.id, content: comment }]);

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error("Error adding comment:", error);
        return { success: false, error };
    }
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
export const createPost = async (body: string, imageFiles: File[]) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Unauthorized");

        // first, create the post entry
        const { data: postData, error: postError } = await supabase
            .from("posts")
            .insert([{
                body,
                user_id: user.id,
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
                const filePath = `posts/${user.id}/${fileName}`;

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
