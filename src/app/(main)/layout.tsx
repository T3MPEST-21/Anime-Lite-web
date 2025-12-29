'use client';

import React from 'react';
import styles from './layout.module.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Bell, User, Users, MessageSquare } from 'lucide-react';
import MobileNavBar from '../components/MobileNavBar';
import FeedHeader from '../components/FeedHeader';
import RightSidebar from '../components/RightSidebar';

const MainLayout = ({ children }: { children: React.ReactNode }) => {

  const pathname = usePathname();
  // this will help me check if link is active
  const isActive = (path: string) => pathname === path;

  return (
    <div className={styles.container}>
      {/* sidebar container */}
      <aside className={styles.sidebar}>
        <div>
          <div className={styles.logo}>
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