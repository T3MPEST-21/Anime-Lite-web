"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getUnreadNotificationCount } from '@/services/notificationService';
import { useAuth } from './AuthContext';

interface NotificationContextType {
    unreadCount: number;
    refreshUnreadCount: () => Promise<void>;
    markAllReadLocally: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    const refreshUnreadCount = async () => {
        if (!user) return;

        const { success, count } = await getUnreadNotificationCount(user.id);
        if (success) {
            setUnreadCount(count);
        }
    };

    const markAllReadLocally = () => {
        setUnreadCount(0);
    }

    useEffect(() => {
        if (!user) {
            setUnreadCount(0);
            return;
        }

        refreshUnreadCount();

        const channel = supabase
            .channel(`notification-count-changes-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    console.log('New notification!', payload);
                    setUnreadCount(prev => prev + 1);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        }
    }, [user]);

    return (
        <NotificationContext.Provider value={{ unreadCount, refreshUnreadCount, markAllReadLocally }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
