import { supabase } from "@/lib/supabase";

export interface Notification {
    id: string;
    type: 'like' | 'comment';
    content?: string;
    read: boolean;
    created_at: string;
    actor_id: string;
    post_id: string | null;
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
          actor_id,
          post_id,
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

export const getUnreadNotificationCount = async (userId: string) => {
    try {
        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true }) // count only
            .eq('user_id', userId)
            .eq('read', false);

        if (error) {
            console.error('Error fetching unread count:', error);
            return { success: false, count: 0 };
        }
        return { success: true, count: count || 0 };
    } catch (error) {
        console.error("Exception in getUnreadNotificationCount:", error);
        return { success: false, count: 0 };
    }
}

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
    } catch (catchError) {
        console.error('Exception marking notification as read:', catchError);
        return { success: false, msg: "Exception marking read" };
    }
};
