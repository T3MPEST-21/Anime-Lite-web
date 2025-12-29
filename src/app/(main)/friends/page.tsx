"use client";
import React from 'react';
import styles from './friends.module.css';

const FriendsPage = () => {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Friends</h1>
                <p>Manage your friend requests and connections</p>
            </div>

            <div className={styles.comingSoon}>
                <h2>Coming Soon!</h2>
                <p>The full friends management interface is under construction.</p>
                <p>For now, use the sidebar to see your friends list.</p>
            </div>
        </div>
    );
};

export default FriendsPage;
