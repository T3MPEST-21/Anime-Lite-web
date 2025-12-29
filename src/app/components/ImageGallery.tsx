"use client";
import React, { useEffect, useState, useRef } from 'react';
import styles from './ImageGallery.module.css';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

import { useModalBehavior } from "@/hooks/useModalBehavior";

interface ImageGalleryProps {
    isOpen: boolean;
    images: { image_url: string }[];
    initialIndex: number;
    onClose: () => void;
}

const ImageGallery = ({ isOpen, images, initialIndex, onClose }: ImageGalleryProps) => {
    // Apply Modal UX Behavior
    useModalBehavior(isOpen, onClose);

    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const touchStart = useRef<{ x: number, y: number } | null>(null);

    // Reset index when opening and show toast
    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(initialIndex);
            toast('Tap Left/Right to navigate. Swipe Up/Down to close.', {
                icon: '👆',
                duration: 4000,
                style: {
                    borderRadius: '10px',
                    background: '#333',
                    color: '#fff',
                },
            });
        }
    }, [isOpen, initialIndex]);

    // Handle keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') showPrev();
            if (e.key === 'ArrowRight') showNext();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, currentIndex]); // eslint-disable-line

    if (!isOpen || !images) return null;

    const showNext = () => {
        if (currentIndex < images.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const showPrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    // 50/50 Touch/Click Logic
    const handleOverlayClick = (e: React.MouseEvent) => {
        const width = window.innerWidth;
        const x = e.clientX;

        // Left 50% -> Previous
        if (x < width * 0.5) {
            showPrev();
        }
        // Right 50% -> Next
        else {
            showNext();
        }
    };

    // Swipe Logic (Touch)
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStart.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        };
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStart.current) return;

        const touchEndY = e.changedTouches[0].clientY;
        const startY = touchStart.current.y;
        const diffY = touchStart.current.y - touchEndY;

        // If moved vertically more than 50px (swipe up or down)
        if (Math.abs(diffY) > 50) {
            onClose(); // Close the gallery
        }

        touchStart.current = null;
    };

    return (
        <div
            className={styles.overlay}
            onClick={handleOverlayClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <div className={styles.content}>

                <div className={styles.counter}>
                    {currentIndex + 1} / {images.length}
                </div>

                <button
                    className={styles.closeButton}
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                >
                    <X size={24} />
                </button>

                {currentIndex > 0 && (
                    <button
                        className={`${styles.navButton} ${styles.prev}`}
                        onClick={(e) => { e.stopPropagation(); showPrev(); }}
                    >
                        <ChevronLeft size={32} />
                    </button>
                )}

                <img
                    src={images[currentIndex].image_url}
                    className={styles.image}
                    alt={`Gallery item ${currentIndex + 1}`}
                /* Prevent click propagation from image so it doesn't trigger 50/50 nav if you don't want it to, 
                   OR let it bubble up so clicking image also navs. 
                   User asked for "touch right part of screen to see next", implying the whole screen. 
                   I will let it bubble up. */
                />

                {currentIndex < images.length - 1 && (
                    <button
                        className={`${styles.navButton} ${styles.next}`}
                        onClick={(e) => { e.stopPropagation(); showNext(); }}
                    >
                        <ChevronRight size={32} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default ImageGallery;
