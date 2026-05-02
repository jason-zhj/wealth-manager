import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Login.module.css';

export default function Login() {
  const { user, loading, signInWithGoogle, enterGuestMode } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleGuestMode = () => {
    enterGuestMode();
    navigate('/', { replace: true });
  };

  return (
    <div className={styles.page}>
      {/* Hero */}
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.logo}>💰</div>
          <h1 className={styles.heroTitle}>Wealth Manager</h1>
          <p className={styles.heroSubtitle}>
            Take control of your financial future — track, analyse, and grow your wealth with confidence.
          </p>
        </div>
      </header>

      {/* Features */}
      <section className={styles.features}>
        <div className={styles.featuresInner}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📊</div>
            <h3 className={styles.featureTitle}>Clear Wealth Overview</h3>
            <p className={styles.featureDesc}>
              Get an instant snapshot of your total wealth and asset structure across all categories and currencies.
            </p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📈</div>
            <h3 className={styles.featureTitle}>Track Changes Over Time</h3>
            <p className={styles.featureDesc}>
              Record periodic snapshots and visualise how your wealth has grown month by month and year over year.
            </p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🎯</div>
            <h3 className={styles.featureTitle}>Predict & Plan Ahead</h3>
            <p className={styles.featureDesc}>
              Project future wealth growth and discover exactly when you'll hit your financial goal or reach financial freedom.
            </p>
          </div>
        </div>
      </section>

      {/* Get Started */}
      <section className={styles.getStarted}>
        <div className={styles.getStartedCard}>
          <h2 className={styles.getStartedTitle}>Get started</h2>
          <p className={styles.getStartedDesc}>Sign in to sync your data across devices, or try it out right away without an account.</p>

          <button className={styles.googleBtn} onClick={signInWithGoogle}>
            <svg className={styles.googleIcon} viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>

          <div className={styles.divider}>
            <span className={styles.dividerText}>or</span>
          </div>

          <button className={styles.guestBtn} onClick={handleGuestMode}>
            Continue without login
          </button>

          <p className={styles.guestNote}>
            Guest data is saved in your browser's local storage only.
          </p>
        </div>
      </section>
    </div>
  );
}
