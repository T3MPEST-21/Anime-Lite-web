"use client";
import React from "react";
import { useParams } from "next/navigation";
import ProfileContent from "@/app/components/ProfileContent";

const PublicProfilePage = () => {
    const params = useParams();
    const userId = params?.id as string;

    if (!userId) return null;

    return <ProfileContent userId={userId} />;
};

export default PublicProfilePage;
