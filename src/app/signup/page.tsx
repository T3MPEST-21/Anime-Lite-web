'use client';

import React, {useState} from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import styles from './signup.module.css';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react'; 

const Signup = () => {
    const [fullname, setFullname] = useState('');
    const [username, setUsername] = useState('');   
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [repeatPassword, setRepeatPassword] = useState('');
    const [favoriteAnime, setFavoriteAnime] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    // for repeat password validation
    if (password !== repeatPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError(null);

    // call for supabase auth
    //pass the 'username' as metadata so it can be used as triggers or helpers
    const {data, error} = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullname,
          username: username,
          favorite_anime: favoriteAnime,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
        //check if email confirmation is required
        if (data?.session) {
            //success redirect to home
            router.push('/');
            router.refresh();
        } else {
            //no session means email confirmation is required, so redirect to login
            alert('Signup successful! Please check your email for confirmation');
            router.push('/login');
        }
    }
      }

    return (
       <div className={styles.container}>
        <div className={styles.card}>
            <h1 className={styles.title}>Create an account</h1>
            {error && <p style={{ color: 'var(--secondary)', textAlign: 'center' }}>{error}</p>}
            <form onSubmit={handleSignup} className={styles.form}>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Fullname</label>
                    <input
                        className={styles.input}
                        type="text"
                        value={fullname}
                        onChange={(e) => setFullname(e.target.value)}
                        placeholder="Enter your fullname"
                        required
                    />
                </div>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Username</label>
                    <input
                        className={styles.input}
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your username"
                        required
                    />
                </div>

                <div className={styles.inputGroup}>
                    <label className={styles.label}>Email</label>
                    <input
                        className={styles.input}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                    />
                </div>

                <div className={styles.inputGroup}>
                    <label className={styles.label}>Favorite Anime</label>
                    <input
                        className={styles.input}
                        type="text"
                        value={favoriteAnime}
                        onChange={(e) => setFavoriteAnime(e.target.value)}
                        placeholder="Enter your favorite anime (optional)"
                        required
                    />
                </div>


                <div className={styles.inputGroup}>
                    <label className={styles.label}>Password</label>
                    <div style={{position: 'relative'}}>
                      <input
                          className={styles.input}
                          type={showPassword ? 'text' : 'password'} //this will be for dynamic type
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          required
                      />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                     className={styles.showPasswordButton}
                    >
    {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
</button>
                    </div>
                </div>

                <div className={styles.inputGroup}>
                    <label className={styles.label}>Repeat Password</label>
                    <div style={{position: 'relative'}}>
                      <input
                          className={styles.input}
                          type={showPassword ? 'text' : 'password'} //this will be for dynamic type
                          value={repeatPassword}
                          onChange={(e) => setRepeatPassword(e.target.value)}
                          placeholder="Repeat your password"
                          required
                      />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                     className={styles.showPasswordButton}
                    >
    {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
</button>
                    </div>
                </div>

                <button type="submit" className={styles.button} disabled={loading}>
                    {loading ? "Signing up..." : "Sign Up"}
                </button>
                <p className={styles.linkText}>
                    Already have an account? <Link href="/login" className={styles.link}>Login</Link>
                </p>
            </form>
        </div>
       </div>
    )   
}

export default Signup