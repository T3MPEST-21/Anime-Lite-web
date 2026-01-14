import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch posts with optimized joins
    const { data: posts, error } = await supabase
      .from("posts")
      .select(`
        *,
        profiles (
          username,
          image
        ),
        post_images (
          image_url
        ),
        post_likes (
          id,
          user_id
        ),
        comments (
          id
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }

    // Transform data
    const postsWithData = posts?.map((post: any) => {
      const likeCount = post.post_likes?.length || 0;
      const commentCount = post.comments?.length || 0;
      const isLiked = post.post_likes?.some((like: any) => like.user_id === user.id) || false;

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

    return NextResponse.json({
      success: true,
      data: postsWithData
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}