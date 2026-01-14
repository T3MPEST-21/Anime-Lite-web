"use client";
import React, { useState, useEffect } from "react";
import styles from "./EditProfileModal.module.css";
import { X, Loader2, Camera, Save } from "lucide-react";
import Image from "next/image";
import { useModalBehavior } from "@/hooks/useModalBehavior";
import { supabase } from "@/lib/supabase";
import { updateUserProfile } from "@/services/userService";
import { profileUpdateSchema } from "@/lib/validations";

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentProfile: {
        id: string;
        username: string;
        full_name?: string;
        bio?: string;
        image?: string | null;
    } | null;
    onProfileUpdate: () => void;
}

const EditProfileModal = ({ isOpen, onClose, currentProfile, onProfileUpdate }: EditProfileModalProps) => {
    useModalBehavior(isOpen, onClose);

    const [username, setUsername] = useState("");
    const [fullName, setFullName] = useState("");
    const [bio, setBio] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (currentProfile) {
            setUsername(currentProfile.username || "");
            setFullName(currentProfile.full_name || "");
            setBio(currentProfile.bio || "");
            setPreviewImage(currentProfile.image || null);
        }
    }, [currentProfile, isOpen]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSave = async () => {
        if (!currentProfile) return;
        setErrors({});

        // 1. Validate inputs locally
        const validated = profileUpdateSchema.safeParse({
            username,
            full_name: fullName,
            bio,
            image: currentProfile.image // Temporary, will be updated if file exists
        });

        if (!validated.success) {
            const fieldErrors: Record<string, string> = {};
            validated.error.issues.forEach((err: any) => {
                if (err.path[0]) {
                    fieldErrors[err.path[0] as string] = err.message;
                }
            });
            setErrors(fieldErrors);
            return;
        }

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Unauthorized");

            let imageUrl = currentProfile.image;

            // Upload Image if changed
            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${user.id}/${Date.now()}.${fileExt}`;
                const filePath = `avatars/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('uploads')
                    .upload(filePath, imageFile, { upsert: true });

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('uploads')
                    .getPublicUrl(filePath);

                imageUrl = publicUrl;
            }

            // Update Profile
            const { success, msg } = await updateUserProfile({
                username,
                full_name: fullName,
                bio,
                image: imageUrl || undefined
            });

            if (success) {
                onProfileUpdate();
                onClose();
            } else {
                alert("Failed to update profile: " + msg);
            }

        } catch (error) {
            console.error(error);
            alert("An error occurred while updating profile.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>Edit Profile</h2>
                    <button onClick={onClose} className={styles.closeBtn}>
                        <X size={24} />
                    </button>
                </div>

                <div className={styles.content}>
                    {/* Image Upload */}
                    <div className={styles.imageSection}>
                        <div className={styles.imageWrapper}>
                            <Image
                                src={previewImage || `https://ui-avatars.com/api/?background=random&name=${username}`}
                                alt="Profile"
                                fill
                                className={styles.avatar}
                                unoptimized
                            />
                            <label className={styles.cameraBtn}>
                                <Camera size={18} />
                                <input type="file" accept="image/*" onChange={handleImageChange} hidden />
                            </label>
                        </div>
                    </div>

                    {/* Form Fields */}
                </div>

                <div className={styles.footer}>
                    <button className={styles.saveBtn} onClick={handleSave} disabled={loading}>
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditProfileModal;
