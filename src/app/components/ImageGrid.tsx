import React from 'react';
import Image from 'next/image';
import styles from './ImageGrid.module.css';

interface ImageGridProps {
    images: string[];
    onImageClick: (index: number) => void;
}

const ImageGrid = ({ images, onImageClick }: ImageGridProps) => {
    if (!images || images.length === 0) return null;

    // 1. Single Image
    if (images.length === 1) {
        return (
            <div className={styles.gridContainer}>
                <div
                    className={`${styles.imageWrapper} ${styles.singleImageWrapper}`}
                    onClick={() => onImageClick(0)}
                    style={{ position: 'relative', width: '100%', height: '100%' }}
                >
                    <Image
                        src={images[0]}
                        alt="Post content"
                        fill
                        className={styles.image}
                        style={{ objectFit: 'cover' }}
                        sizes="(max-width: 768px) 100vw, 600px"
                    />
                </div>
            </div>
        );
    }

    // 2. Two Images
    if (images.length === 2) {
        return (
            <div className={`${styles.gridContainer} ${styles.twoImagesContainer}`}>
                <div
                    className={`${styles.imageWrapper} ${styles.twoImageWrapper}`}
                    onClick={() => onImageClick(0)}
                    style={{ position: 'relative', width: '100%', height: '100%' }}
                >
                    <Image
                        src={images[0]}
                        alt="Post content 1"
                        fill
                        className={styles.image}
                        style={{ objectFit: 'cover' }}
                        sizes="(max-width: 768px) 50vw, 300px"
                    />
                </div>
                <div
                    className={`${styles.imageWrapper} ${styles.twoImageWrapper}`}
                    onClick={() => onImageClick(1)}
                    style={{ position: 'relative', width: '100%', height: '100%' }}
                >
                    <Image
                        src={images[1]}
                        alt="Post content 2"
                        fill
                        className={styles.image}
                        style={{ objectFit: 'cover' }}
                        sizes="(max-width: 768px) 50vw, 300px"
                    />
                </div>
            </div>
        );
    }

    // 3. Three or More Images
    return (
        <div className={`${styles.gridContainer} ${styles.threeImagesContainer}`}>
            {/* Top Image (First) */}
            <div
                className={`${styles.imageWrapper} ${styles.topImageWrapper}`}
                onClick={() => onImageClick(0)}
                style={{ position: 'relative', width: '100%', height: '100%' }}
            >
                <Image
                    src={images[0]}
                    alt="Post content 1"
                    fill
                    className={styles.image}
                    style={{ objectFit: 'cover' }}
                    sizes="(max-width: 768px) 100vw, 600px"
                />
            </div>

            {/* Bottom Row */}
            <div className={styles.bottomRow}>
                {/* Bottom Left (Second) */}
                <div
                    className={`${styles.imageWrapper} ${styles.bottomImageWrapper}`}
                    onClick={() => onImageClick(1)}
                    style={{ position: 'relative', width: '100%', height: '100%' }}
                >
                    <Image
                        src={images[1]}
                        alt="Post content 2"
                        fill
                        className={styles.image}
                        style={{ objectFit: 'cover' }}
                        sizes="(max-width: 768px) 50vw, 300px"
                    />
                </div>

                {/* Bottom Right (Third) + Overlay */}
                <div
                    className={`${styles.moreContainer} ${styles.imageWrapper}`}
                    onClick={() => onImageClick(2)}
                    style={{ position: 'relative', width: '100%', height: '100%' }}
                >
                    <Image
                        src={images[2]}
                        alt="Post content 3"
                        fill
                        className={styles.image}
                        style={{ objectFit: 'cover' }}
                        sizes="(max-width: 768px) 50vw, 300px"
                    />
                    {images.length > 3 && (
                        <div className={styles.overlay}>
                            +{images.length - 3}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImageGrid;
