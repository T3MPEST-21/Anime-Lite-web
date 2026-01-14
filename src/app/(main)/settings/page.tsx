"use client";
import React from "react";
import { useRouter } from "next/navigation";
import styles from "./settings.module.css";
import { LogOut, Monitor, Moon, Sun, ChevronRight, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";

const SettingsPage = () => {
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.replace("/auth/login");
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Settings</h1>
            </div>

            <div className={styles.section}>
                <h3>Appearance</h3>
                <div className={styles.item} onClick={toggleTheme}>
                    <div className={styles.itemLeft}>
                        {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                        <span>Dark Mode</span>
                    </div>
                    <div className={styles.itemRight}>
                        <div className={`${styles.toggle} ${theme === 'dark' ? styles.active : ''}`}>
                            <div className={styles.toggleKnob}></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.section}>
                <h3>Account</h3>
                <div className={styles.item} onClick={() => router.push('/profile')}>
                    <div className={styles.itemLeft}>
                        <User size={20} />
                        <span>Edit Profile</span>
                    </div>
                    <ChevronRight size={16} color="var(--text-secondary)" />
                </div>

                <div className={styles.item} onClick={handleLogout} style={{ color: '#ff4d4d' }}>
                    <div className={styles.itemLeft}>
                        <LogOut size={20} />
                        <span>Log Out</span>
                    </div>
                </div>
            </div>

            <div className={styles.footer}>
                <p>Anime Light Web v1.0.0</p>
            </div>
        </div>
    );
};

export default SettingsPage;
