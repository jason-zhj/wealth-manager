import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import styles from './Layout.module.css';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const { isGuest, signInWithGoogle } = useAuth();

  return (
    <div className={styles.appLayout}>
      <header className={styles.mobileHeader}>
        <button
          className={styles.hamburger}
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          ☰
        </button>
        <span className={styles.mobileBrand}>💰 Wealth Manager</span>
      </header>

      {sidebarOpen && (
        <div
          className={styles.backdrop}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className={styles.mainContent}>
        {isGuest && !bannerDismissed && (
          <div className={styles.guestBanner}>
            <span>
              Your data is saved locally in this browser.{' '}
              <button
                className={styles.guestBannerLink}
                onClick={signInWithGoogle}
              >
                Sign in
              </button>{' '}
              to sync across devices.
            </span>
            <button
              className={styles.guestBannerClose}
              onClick={() => setBannerDismissed(true)}
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
