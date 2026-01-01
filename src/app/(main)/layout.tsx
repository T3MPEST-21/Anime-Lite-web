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

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('image')
          .eq('id', user.id)
          .single();
        if (data?.image) setUserAvatar(data.image);
      }
    };
    loadUser();
  }, []);

  // this will help me check if link is active
  const isActive = (path: string) => pathname === path;

  return (
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
              href='/friends' className={`${styles.navItem} ${isActive('/friends') ? styles.active : ''}`}>
              <Users size={24} />
              <span className={styles.navText}>Friends</span>
            </Link>

            {/* chat */}
            <Link
              href='/chat' className={`${styles.navItem} ${isActive('/chat') ? styles.active : ''}`}>
              <MessageSquare size={24} />
              <span className={styles.navText}>Chat</span>
            </Link>

            {/* notification */}
            <Link
              href='/notifications' className={`${styles.navItem} ${isActive('/notifications') ? styles.active : ''}`}>
              <Bell size={24} />
              <span className={styles.navText}>Notifications</span>
            </Link>

            {/* profile */}
            <Link
              href='/profile' className={`${styles.navItem} ${isActive('/profile') ? styles.active : ''}`}>
              <User size={24} />
              <span className={styles.navText}>Profile</span>
            </Link>
          </nav>
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
  )
}

export default MainLayout