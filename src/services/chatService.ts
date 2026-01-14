import { supabase } from "@/lib/supabase";

// Type definitions for our chat data
export interface Conversation {
    id: string;
    last_message_at: string;
    other_participant: {
        id: string;
        username: string;
        image: string | null;
    };
    last_message: {
        content: string;
        sender_id: string;
    } | null;
}

export interface Message {
    id: string;
    created_at: string;
    content: string;
    sender_id: string;
    conversation_id: string;
    status: "pending" | "sent" | "delivered" | "read" | "failed";
    profile: {
        username: string;
        image: string | null;
    } | null;
}

/**
 * Fetches all conversations for the currently logged-in user.
 */
export const getConversations = async (
    userId: string
): Promise<{ success: boolean; data?: Conversation[]; error?: any }> => {
    try {
        const { data, error } = await supabase.rpc("get_user_conversations", {
            p_user_id: userId,
        });

        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (error) {
        console.error("Error fetching conversations:", error);
        return { success: false, error };
    }
};

/**
 * Creates a new conversation with another user if one doesn't already exist,
 * or returns the ID of the existing conversation.
 */
export const createOrGetConversation = async (
    otherUserId: string
): Promise<{ success: boolean; data?: string; error?: any }> => {
    try {
        const { data, error } = await supabase.rpc("create_or_get_conversation", {
            other_user_id: otherUserId,
        });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error("Error creating or getting conversation:", error);
        return { success: false, error };
    }
};

/**
 * Fetches all messages for a specific conversation.
 */
export const getMessages = async (
    conversationId: string
): Promise<{ success: boolean; data?: Message[]; error?: any }> => {
    try {
        const { data, error } = await supabase
            .from("messages")
            .select(
                `
        id,
        created_at,
        content,
        sender_id,
        conversation_id,
        status,
        profile:profiles (
          username,
          image
        )
      `
            )
            .eq("conversation_id", conversationId)
            .order("created_at", { ascending: false });

        if (error) throw error;

        const formattedData = (data || []).map((msg: any) => ({
            ...msg,
            profile: Array.isArray(msg.profile) ? msg.profile[0] : msg.profile,
        }));

        return { success: true, data: formattedData };
    } catch (error) {
        console.error("Error fetching messages:", error);
        return { success: false, error };
    }
};

/**
 * Sends a new message in a conversation.
 */
export const sendMessage = async (
    conversation_id: string,
    content: string
): Promise<{ success: boolean; data?: Message; error?: any }> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Unauthorized: Please login.");

        const { data, error: messageError } = await supabase
            .from("messages")
            .insert({
                conversation_id,
                sender_id: user.id,
                content: content.trim(),
                status: "sent",
            })
            .select(
                `
        id,
        created_at,
        content,
        sender_id,
        conversation_id,
        status,
        profile:profiles (
          username,
          image
        )
      `
            )
            .single();

        if (messageError) throw messageError;
        if (!data) throw new Error("No message data returned after insert.");

        // Update the last_message_at in the parent conversation table
        await supabase
            .from("conversations")
            .update({ last_message_at: new Date().toISOString() })
            .eq("id", conversation_id);

        const formattedData = {
            ...data,
            profile: Array.isArray(data.profile) ? data.profile[0] : data.profile,
        };

        return { success: true, data: formattedData };
    } catch (error) {
        console.error("Error sending message:", error);
        return { success: false, error };
    }
};

/**
 * Marks messages in a conversation as 'read' for the current user.
 */
export const markMessagesAsRead = async (
    conversation_id: string
) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: "Unauthorized" };
        const currentUserId = user.id;

        console.log(`DEBUG: Marking messages as read for conversation ${conversation_id}, user ${currentUserId}`);

        // First, let's see what messages exist in this conversation
        const { data: existingMessages, error: selectError } = await supabase
            .from("messages")
            .select('id, sender_id, status, content')
            .eq("conversation_id", conversation_id);

        if (selectError) {
            console.error("Error selecting messages:", selectError);
        } else {
            console.log(`DEBUG: Found ${existingMessages?.length || 0} total messages in conversation:`, existingMessages);
        }

        // Now update unread messages
        const { data, error } = await supabase
            .from("messages")
            .update({ status: "read" })
            .eq("conversation_id", conversation_id)
            .neq("sender_id", currentUserId)
            .neq("status", "read")
            .select('id, status');

        if (error) {
            console.error("Error updating messages:", error);
            throw error;
        }

        console.log(`DEBUG: Updated ${data?.length || 0} messages to read status:`, data);
        return { success: true };
    } catch (error) {
        console.error("Error marking messages as read:", error);
        return { success: false, error };
    }
};

/**
 * Marks messages as delivered (background op usually, doing here for parity)
 */
export const markMessagesAsDelivered = async (
    conversationId: string,
    currentUserId: string
) => {
    try {
        const { error } = await supabase
            .from("messages")
            .update({ status: "delivered" })
            .eq("conversation_id", conversationId)
            .neq("sender_id", currentUserId)
            .eq("status", "sent");

        if (error) console.error("Error in markMessagesAsDelivered:", error);
    } catch (error) {
        console.error("Exception in markMessagesAsDelivered:", error);
    }
};

/**
 * Marks ALL unread messages for the current user as read.
 */
export const markAllMessagesAsRead = async (userId: string): Promise<{ success: boolean; error?: any }> => {
    try {
        // 1. Fetch exact IDs of unread messages first to ensure we target them
        const { data: unreadMsgs, error: fetchError } = await supabase
            .from('messages')
            .select('id')
            .neq('sender_id', userId)
            .neq('status', 'read');

        if (fetchError) throw fetchError;

        if (unreadMsgs && unreadMsgs.length > 0) {
            const ids = unreadMsgs.map(m => m.id);
            console.log(`Debug: Marking ${ids.length} messages as read:`, ids);

            // 2. Update these specific messages
            const { error: updateError } = await supabase
                .from("messages")
                .update({ status: "read" })
                .in('id', ids);

            if (updateError) throw updateError;
        }

        return { success: true };
    } catch (error) {
        console.error("Error marking all messages as read:", error);
        return { success: false, error };
    }
};
/**
 * Gets the number of conversations with unread messages for the current user.
 */
export const getUnreadCount = async (userId: string): Promise<{ count: number; error?: any }> => {
    try {
        // Fetch all unread messages
        const { data, error } = await supabase
            .from('messages')
            .select('conversation_id, sender_id, status')
            .neq('sender_id', userId)
            .neq('status', 'read');

        if (error) throw error;

        // Count unique conversations with unread messages
        const uniqueConversations = new Set((data || []).map(m => m.conversation_id));
        const unreadConversationCount = uniqueConversations.size;

        if (unreadConversationCount > 0) {
            console.log(`DEBUG: Found ${data?.length || 0} unread messages across ${unreadConversationCount} conversations`);
        }

        return { count: unreadConversationCount };
    } catch (error) {
        console.error("Error fetching unread count:", error);
        return { count: 0, error };
    }
};

