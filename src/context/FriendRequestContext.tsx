"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getIncomingFriendRequests } from '@/services/friendService';
import { useAuth } from './AuthContext';

interface FriendRequestContextType {
    requestCount: number;
    refreshRequestCount: () => Promise<void>;
}

const FriendRequestContext = createContext<FriendRequestContextType | undefined>(undefined);

export const FriendRequestProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const [requestCount, setRequestCount] = useState(0);

    const refreshRequestCount = async () => {
        if (!user) return;

        // We only care about pending incoming requests for the badge
        const { data } = await getIncomingFriendRequests(user.id);
        if (data) {
            setRequestCount(data.length);
        }
    };

    useEffect(() => {
        if (!user) {
            setRequestCount(0);
            return;
        }

        refreshRequestCount();

        // Subscribe to changes for this specific user's requests
        const channel = supabase
            .channel(`friend-request-count-changes-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'friend_requests',
                    filter: `addressee_id=eq.${user.id}`
                },
                (payload) => {
                    console.log('Friend request change detected:', payload);
                    refreshRequestCount();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    return (
        <FriendRequestContext.Provider value={{ requestCount, refreshRequestCount }}>
            {children}
        </FriendRequestContext.Provider>
    );
};

export const useFriendRequests = () => {
    const context = useContext(FriendRequestContext);
    if (context === undefined) {
        throw new Error('useFriendRequests must be used within a FriendRequestProvider');
    }
    return context;
};
