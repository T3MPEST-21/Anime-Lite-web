"use client";
import React from 'react';
import styles from './chat.module.css';

const ChatPage = () => {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Messages</h1>
                <p>Your conversations</p>
            </div>

            <div className={styles.comingSoon}>
                <h2>Coming Soon!</h2>
                <p>The messaging interface is being built.</p>
                <p>Click on a friend from the sidebar to start a chat!</p>
            </div>
        </div>
    );
};

export default ChatPage;
