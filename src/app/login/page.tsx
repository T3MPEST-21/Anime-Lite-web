'use client'
import React, {useState} from 'react'
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import styles from './login.module.css'
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react'; 

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // call for supabase auth
    const {error} = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      router.push('/');
      router.refresh();
    }
  }

  return (
    <div className={styles.container}>
        <div className={styles.card}>
            <h1 className={styles.title}>Hey, nice to see you again</h1>
            {error && <p style={{ color: 'var(--secondary)', textAlign: 'center' }}>{error}</p>}
            <form onSubmit={handleLogin} className={styles.form}>
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

                <button type="submit" className={styles.button} disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                </button>
                <p className={styles.linkText}>
                    Don&apos;t have an account? <Link href="/signup" className={styles.link}>Register</Link>
                </p>
            </form>
        </div>
    </div>
  )
}

export default LoginPage