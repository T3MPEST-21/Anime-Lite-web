"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getUnreadCount } from "@/services/chatService";
import { useAuth } from "./AuthContext";

interface UnreadMessagesContextType {
    unreadCount: number;
    refreshUnreadCount: () => Promise<void>;
}

const UnreadMessagesContext = createContext<UnreadMessagesContextType | undefined>(undefined);

export const UnreadMessagesProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    const refreshUnreadCount = async () => {
        if (user) {
            const { count } = await getUnreadCount(user.id);
            console.log(`DEBUG: Unread count updated to ${count}`);
            setUnreadCount(count);
        }
    };

    useEffect(() => {
        if (!user) {
            setUnreadCount(0);
            return;
        }

        refreshUnreadCount();

        // Subscribe to changes in messages table
        const channel = supabase
            .channel(`global_messages_unread-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*', // INSERT (new msg), UPDATE (read status changed)
                    schema: 'public',
                    table: 'messages',
                },
                (payload) => {
                    console.log('DEBUG: Real-time message change detected:', payload);
                    refreshUnreadCount();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    return (
        <UnreadMessagesContext.Provider value={{ unreadCount, refreshUnreadCount }}>
            {children}
        </UnreadMessagesContext.Provider>
    );
};

export const useUnreadMessages = () => {
    const context = useContext(UnreadMessagesContext);
    if (context === undefined) {
        throw new Error("useUnreadMessages must be used within a UnreadMessagesProvider");
    }
    return context;
};
