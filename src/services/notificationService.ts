import { supabase } from "@/lib/supabase";

export interface Notification {
    id: string;
    type: 'like' | 'comment';
    content?: string;
    read: boolean;
    created_at: string;
    actor_profiles: {
        username: string;
        image: string;
    } | null;
    posts: {
        body: string;
    } | null;
}

export const fetchNotifications = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select(`
          id,
          type,
          content,
          read,
          created_at,
          actor_profiles:actor_id (
            username,
            image
          ),
          posts:post_id (
            body
          )
        `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching notifications:', error);
            return { success: false, msg: error.message };
        }

        // Transform data to match interface if needed (single object vs array from join)
        const formattedData = (data || []).map((notification: any) => ({
            ...notification,
            actor_profiles: notification.actor_profiles || null, // Supabase join usually returns object for single relation if configured, or array. Mobile app handled array check.
            // Let's assume standard 1:1 join returns object or we handle it.
            // checking mobile: actor_profiles: notification.actor_profiles?.[0] || null
            // We should check how it comes back. Usually !inner implies object?
            // Let's safeguard like mobile app just in case, but usually simple join is an object if foreign key is unique, or array.
            // Safe bet involves checking if it's an array.
        }));

        // Actually, let's keep it simple and refine if type mismatch occurs.
        // Mobile app did: actor_profiles: notification.actor_profiles?.[0] || null
        // We will return data as is and let the component handle it or map it here.
        // Let's map it here to be safe and clean.

        const cleanData = (data || []).map((n: any) => ({
            ...n,
            actor_profiles: Array.isArray(n.actor_profiles) ? n.actor_profiles[0] : n.actor_profiles,
            posts: Array.isArray(n.posts) ? n.posts[0] : n.posts
        }));

        return { success: true, data: cleanData as Notification[] };

    } catch (error) {
        console.error("Exception in fetchNotifications:", error);
        return { success: false, msg: "Exception fetching notifications" };
    }
};

export const markAsRead = async (notificationId: string) => {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId);

        if (error) {
            console.error('Error marking notification as read:', error);
            return { success: false, msg: error.message };
        }
        return { success: true };
    } catch (error) {
        return { success: false, msg: "Exception marking read" };
    }
};
