'use client';

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { fetchPosts } from "@/services/postsService";
import PostCard from "./components/Postcard";
import styles from "./page.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";


const Home = () => {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // redirect to the feed page
        router.replace('/feed');
      } else {
        // show the splash screen instead
        setLoading(false);
      }
    });
  }, [router]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Anime Lite</h1>
        <p className={styles.tagline}>
          Your favorite anime community, now on web
        </p>
        <Link href="/login" className={styles.buttonPrimary}>
          Get started
        </Link>
      </main>
    </div>
  )
}

export default Home;
