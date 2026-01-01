"use client";
import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
            onClick={toggleTheme}
            style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px',
                borderRadius: '50%',
                color: 'var(--text)',
                transition: 'transform 0.2s ease, color 0.2s ease',
            }}
            aria-label="Toggle Theme"
        >
            {theme === 'dark' ? (
                <Moon size={24} fill="currentColor" />
            ) : (
                <Sun size={24} />
            )}
        </button>
        <span>Theme</span>
        </div>
    );
};

export default ThemeToggle;
