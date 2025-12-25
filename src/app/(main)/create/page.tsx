'use client';

import React, { useEffect, useRef, useState } from 'react';
import styles from './create.module.css';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { createPost } from '@/services/postsService';
import { Image as ImageIcon, Loader } from 'lucide-react';
import toast from 'react-hot-toast';



const CreatePost = () => {

    const [body, setBody] = useState('');
    const [imageFile, setImaeFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    // get user on mount
    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                setUserId(user.id);
            }
        });
    }, []);

    const handleImagePicker = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImaeFile(file);
            // create a fake url to show image immidiately
            const objectUrl = URL.createObjectURL(file);
            setImagePreview(objectUrl);
        }
    };

    const onSubmit = async () => {
        if (!userId) return;
        if (!body.trim() && !imageFile) {
            return;
        }
        setLoading(true);
        // call the service
        const res = await createPost(
            userId,
            body,
            imageFile ? [imageFile] : []
        );
        setLoading(false);

        if (res.success) {
            router.push('/feed'); //go back to feed 
            toast.success('Post created successfully');
        } else {
            alert('Failed to create post: ' + res.msg);
        }
    }

    return (
        <div className={styles.container}>
            <h2 className={styles.header}>New Post</h2>

            <div className={styles.form}>
                <textarea
                    className={styles.textArea}
                    placeholder="What's on your mind?"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                />
                {imagePreview && (
                    <img src={imagePreview} alt="Preview" className={styles.imagePreview} />
                )}
                <div className={styles.actions}>
                    <button className={styles.iconButton} onClick={handleImagePicker}>
                        <ImageIcon size={24} />
                    </button>
                    <input
                        type="file"
                        hidden
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                    <button
                        className={styles.submitButton}
                        onClick={onSubmit}
                        disabled={loading}
                    >
                        {loading ? "Posting..." : "Post"}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default CreatePost