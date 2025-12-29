"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { searchUsers } from '@/services/userService';
import styles from './search.module.css';
import Image from 'next/image';
import { Loader2, Search as SearchIcon } from 'lucide-react';
import ProfileModal from '@/app/components/ProfileModal';
// import { useAuth } from '@/context/authContext'; 

const SearchPage = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Profile Modal State
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    useEffect(() => {
        getCurrentUser();
    }, []);

    const getCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setCurrentUserId(user.id);
    };

    const handleSearch = async (val: string) => {
        setQuery(val);
        if (!val.trim()) {
            setResults([]);
            return;
        }

        setLoading(true);
        // Debounce could be good, but for now simple onChange
        const { success, data } = await searchUsers(val, currentUserId || undefined);
        if (success) {
            setResults(data || []);
        }
        setLoading(false);
    };

    // Simple debounce effect
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query) handleSearch(query);
        }, 500);

        return () => clearTimeout(timer);
    }, [query]);
    // Wait, the handleSearch is being called by the effect, so I don't need to call it on onChange directly if I just setQuery.
    // Let's refactor:
    // onChange -> setQuery
    // useEffect [query] -> searchUsers

    const performSearch = async () => {
        if (!query.trim()) {
            setResults([]);
            return;
        }
        setLoading(true);
        const { success, data } = await searchUsers(query, currentUserId || undefined);
        if (success) {
            setResults(data || []);
        }
        setLoading(false);
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            performSearch();
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);


    const openProfile = (userId: string) => {
        setSelectedUserId(userId);
        setIsProfileOpen(true);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Search</h1>
                <div style={{ position: 'relative' }}>
                    <input
                        type="text"
                        placeholder="Search users..."
                        className={styles.searchBar}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    {/* <SearchIcon size={20} style={{ position: 'absolute', right: 12, top: 22, color: 'var(--text-secondary)' }} /> */}
                </div>
            </div>

            <div className={styles.resultsList}>
                {loading ? (
                    <div className={styles.loading}>
                        <Loader2 className={styles.spinner} size={24} style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                ) : results.length > 0 ? (
                    results.map(user => (
                        <div key={user.id} className={styles.userRow} onClick={() => openProfile(user.id)}>
                            <div className={styles.avatarWrapper}>
                                <Image
                                    src={user.image || `https://ui-avatars.com/api/?background=random&name=${user.username}`}
                                    alt={user.username}
                                    fill
                                    className={styles.avatar}
                                    unoptimized
                                />
                            </div>
                            <span className={styles.username}>{user.username}</span>
                        </div>
                    ))
                ) : query && (
                    <div className={styles.emptyState}>
                        No users found
                    </div>
                )}
            </div>

            {/* Profile Modal */}
            {selectedUserId && (
                <ProfileModal
                    isOpen={isProfileOpen}
                    onClose={() => setIsProfileOpen(false)}
                    userId={selectedUserId}
                />
            )}
        </div>
    );
};

export default SearchPage;
