'use client';

import React from 'react';
import styles from './layout.module.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Bell, PlusSquare, User } from 'lucide-react';

const MainLayout = ({children}: {children: React.ReactNode}) => {

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
            {/* search */}
            <Link 
              href='/search' className={`${styles.navItem} ${isActive('/search') ? styles.active : ''}`}>
              <Search size={24} />
              <span className={styles.navText}>Search</span>
            </Link>
            {/* notification */}
            <Link 
              href='/notifications' className={`${styles.navItem} ${isActive('/notifications') ? styles.active : ''}`}>
              <Bell size={24} />
              <span className={styles.navText}>Notifications</span>
            </Link>

            {/* create */}
            <Link 
              href='/create' className={`${styles.navItem} ${isActive('/create') ? styles.active : ''}`}>
              <PlusSquare size={24} />
              <span className={styles.navText}>Create</span>
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
        {children}
      </main>
    </div>
  )
}

export default MainLayout