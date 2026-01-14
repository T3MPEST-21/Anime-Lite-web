import { supabase } from '@/lib/supabase';

export type FriendshipStatus = 'NONE' | 'FRIENDS' | 'REQUEST_SENT' | 'REQUEST_RECEIVED';

/**
 * Checks the friendship status between two users.
 */
export const getFriendshipStatus = async (targetUserId: string): Promise<{ status: FriendshipStatus; requestId?: string; error?: any }> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { status: 'NONE' };
        const currentUserId = user.id;

        // 1. Check if friends (in friendships table)
        const { data: friendship, error: friendError } = await supabase
            .from('friendships')
            .select('*')
            .or(`and(user_id_a.eq.${currentUserId},user_id_b.eq.${targetUserId}),and(user_id_a.eq.${targetUserId},user_id_b.eq.${currentUserId})`)
            .single();

        if (friendship) return { status: 'FRIENDS' };

        // 2. Check if request sent (outgoing)
        const { data: sentReq } = await supabase
            .from('friend_requests')
            .select('id')
            .eq('requester_id', currentUserId)
            .eq('addressee_id', targetUserId)
            .eq('status', 'pending')
            .single();

        if (sentReq) return { status: 'REQUEST_SENT', requestId: sentReq.id };

        // 3. Check if request received (incoming)
        const { data: receivedReq } = await supabase
            .from('friend_requests')
            .select('id')
            .eq('requester_id', targetUserId)
            .eq('addressee_id', currentUserId)
            .eq('status', 'pending')
            .single();

        if (receivedReq) return { status: 'REQUEST_RECEIVED', requestId: receivedReq.id };

        return { status: 'NONE' };

    } catch (error) {
        console.error("Error checking friendship status:", error);
        return { status: 'NONE', error };
    }
};

// Send a friend request
export const sendFriendRequest = async (addresseeId: string) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Unauthorized");
        const requesterId = user.id;

        // Check if a request already exists
        const { data: existing, error: existingError } = await supabase
            .from('friend_requests')
            .select('*')
            .or(`and(requester_id.eq.${requesterId},addressee_id.eq.${addresseeId}),and(requester_id.eq.${addresseeId},addressee_id.eq.${requesterId})`)
            .in('status', ['pending', 'accepted']);

        if (existingError) throw existingError;
        if (existing && existing.length > 0) {
            return { error: 'Request already exists or you are already friends.' };
        }
        // Insert new friend request
        const { data, error } = await supabase
            .from('friend_requests')
            .insert({ requester_id: requesterId, addressee_id: addresseeId, status: 'pending' })
            .select()
            .single();
        if (error) throw error;
        return { data };
    } catch (error) {
        return { error };
    }
};

// Accept a friend request
export const acceptFriendRequest = async (requestId: string) => {
    try {
        // Use RPC for atomic transaction: update request + create friendship
        const { data, error } = await supabase.rpc('accept_friend_request_v2', {
            p_request_id: requestId
        });

        if (error) throw error;

        if (!data.success) {
            throw new Error(data.error || "Failed to accept friend request");
        }

        return { data: data.data };
    } catch (error) {
        console.error("Error accepting friend request:", error);
        return { error };
    }
};

// Reject a friend request
export const rejectFriendRequest = async (requestId: string) => {
    try {
        const { data, error } = await supabase
            .from('friend_requests')
            .update({ status: 'rejected', updated_at: new Date().toISOString() })
            .eq('id', requestId)
            .select()
            .single();
        if (error) throw error;
        return { data };
    } catch (error) {
        return { error };
    }
};

// Remove a friend
export const removeFriend = async (userIdB: string) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Unauthorized");
        const userIdA = user.id;

        const { error } = await supabase
            .from('friendships')
            .delete()
            .or(`and(user_id_a.eq.${userIdA},user_id_b.eq.${userIdB}),and(user_id_a.eq.${userIdB},user_id_b.eq.${userIdA})`);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        return { error };
    }
};

// List friends for a user
export const getFriends = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .from('friendships')
            .select('*')
            .or(`user_id_a.eq.${userId},user_id_b.eq.${userId}`);

        if (error) throw error;
        // Map to friend user IDs
        const friendIds = data.map((row: any) => row.user_id_a === userId ? row.user_id_b : row.user_id_a);
        return { data: friendIds };
    } catch (error) {
        return { error };
    }
};

// List incoming friend requests
export const getIncomingFriendRequests = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .from('friend_requests')
            .select('*')
            .eq('addressee_id', userId)
            .eq('status', 'pending');
        if (error) throw error;
        return { data };
    } catch (error) {
        return { error };
    }
};

// List outgoing friend requests
export const getOutgoingFriendRequests = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .from('friend_requests')
            .select('*')
            .eq('requester_id', userId)
            .eq('status', 'pending');
        if (error) throw error;
        return { data };
    } catch (error) {
        return { error };
    }
};
