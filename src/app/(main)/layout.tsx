'use client';

import React, { useEffect, useState } from 'react';
import styles from './layout.module.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Bell, User, Users, MessageSquare, Search, PlusSquare } from 'lucide-react';
import MobileNavBar from '../components/MobileNavBar';
import FeedHeader from '../components/FeedHeader';
import RightSidebar from '../components/RightSidebar';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import ThemeToggle from '../components/ThemeToggle';
import { UnreadMessagesProvider, useUnreadMessages } from '@/context/UnreadMessagesContext';
import { FriendRequestProvider, useFriendRequests } from '@/context/FriendRequestContext';
import { NotificationProvider, useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';

// Create a sub-component for the Navigation to use the hook safely
const SidebarNav = ({ isActive }: { isActive: (path: string) => boolean }) => {
  const { unreadCount } = useUnreadMessages();
  const { requestCount } = useFriendRequests();
  const { unreadCount: notificationCount } = useNotifications();

  return (
    <nav className={styles.nav}>
      {/* home */}
      <Link
        href="/feed"
        className={`${styles.navItem} ${isActive('/feed') ? styles.active : ''}`}
      >
        <Home size={24} />
        <span className={styles.navText}>Home</span>
      </Link>

      {/* search */}
      <Link
        href='/search' className={`${styles.navItem} ${isActive('/search') ? styles.active : ''}`}>
        <Search size={24} />
        <span className={styles.navText}>Search</span>
      </Link>

      {/* create */}
      <Link
        href='/create' className={`${styles.navItem} ${isActive('/create') ? styles.active : ''}`}>
        <PlusSquare size={24} />
        <span className={styles.navText}>Create</span>
      </Link>

      {/* friends */}
      <Link
        href='/friends'
        className={`${styles.navItem} ${isActive('/friends') ? styles.active : ''}`}
        style={{ position: 'relative' }}
      >
        <Users size={24} />
        <span className={styles.navText}>Friends</span>
        {requestCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '5px',
            left: '25px',
            backgroundColor: 'red',
            color: 'white',
            fontSize: '10px',
            borderRadius: '50%',
            minWidth: '16px',
            height: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            padding: '2px'
          }}>
            {requestCount > 99 ? '99+' : requestCount}
          </span>
        )}
      </Link>

      {/* chat */}
      <Link
        href='/chat'
        className={`${styles.navItem} ${isActive('/chat') ? styles.active : ''}`}
        style={{ position: 'relative' }}
      >
        <MessageSquare size={24} />
        <span className={styles.navText}>Chat</span>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '5px',
            left: '25px',
            backgroundColor: 'red',
            color: 'white',
            fontSize: '10px',
            borderRadius: '50%',
            minWidth: '16px',
            height: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            padding: '2px'
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Link>

      {/* notification */}
      <Link
        href='/notifications' className={`${styles.navItem} ${isActive('/notifications') ? styles.active : ''}`}
        style={{ position: 'relative' }}
      >
        <Bell size={24} />
        <span className={styles.navText}>Notifications</span>
        {notificationCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '5px',
            left: '25px',
            backgroundColor: 'red',
            color: 'white',
            fontSize: '10px',
            borderRadius: '50%',
            minWidth: '16px',
            height: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            padding: '2px'
          }}>
            {notificationCount > 99 ? '99+' : notificationCount}
          </span>
        )}
      </Link>

      {/* profile */}
      <Link
        href='/profile' className={`${styles.navItem} ${isActive('/profile') ? styles.active : ''}`}>
        <User size={24} />
        <span className={styles.navText}>Profile</span>
      </Link>
    </nav>
  );
};


const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const pathname = usePathname();
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('image')
          .eq('id', user.id)
          .single();
        if (data?.image) setUserAvatar(data.image);
      }
    };
    loadProfile();
  }, [user]);

  // this will help me check if link is active
  const isActive = (path: string) => pathname === path;

  return (
    <UnreadMessagesProvider>
      <FriendRequestProvider>
        <NotificationProvider>
          <div className={styles.container}>
            {/* sidebar container */}
            <aside className={styles.sidebar}>
              <div>
                <div className={styles.logo}>
                  <div className={styles.logoAvatar}>
                    <Image
                      src={userAvatar || `https://ui-avatars.com/api/?background=random&name=User`}
                      alt="Profile"
                      width={32}
                      height={32}
                      style={{ borderRadius: '50%', objectFit: 'cover' }}
                      unoptimized
                    />
                  </div>
                  <Link href="/">Anime Light</Link>
                </div>
                <SidebarNav isActive={isActive} />
              </div>

              {/* Todo: add mini profile at the bottom */}
              <div style={{ marginTop: 'auto', padding: '16px' }}>
                <ThemeToggle />
              </div>
            </aside>

            {/* content */}
            <main className={styles.content}>
              <FeedHeader />
              {children}
            </main>

            {/* Right Sidebar */}
            <RightSidebar />

            {/* Mobile Navigation */}
            <div className={styles.mobileNav}>
              <MobileNavBar />
            </div>
          </div>
        </NotificationProvider>
      </FriendRequestProvider>
    </UnreadMessagesProvider>
  )
}

export default MainLayout