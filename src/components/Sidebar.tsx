import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Sidebar.module.css';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const { signOut } = useAuth();

  const handleNavClick = () => {
    onClose?.();
  };

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
      <div className={styles.brand}>
        <span className={styles.brandIcon}>💰</span>
        <span className={styles.brandName}>Wealth Manager</span>
        <button
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close menu"
        >
          ✕
        </button>
      </div>

      <nav className={styles.nav}>
        <NavLink
          to="/"
          end
          className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
          onClick={handleNavClick}
        >
          <span className={styles.icon}>📊</span>
          Home
        </NavLink>
        <NavLink
          to="/records"
          className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
          onClick={handleNavClick}
        >
          <span className={styles.icon}>📋</span>
          Records
        </NavLink>
        <NavLink
          to="/records/new"
          className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
          onClick={handleNavClick}
        >
          <span className={styles.icon}>➕</span>
          Add Record
        </NavLink>
      </nav>

      <button className={styles.logoutBtn} onClick={signOut}>
        <span className={styles.icon}>🚪</span>
        Log out
      </button>
    </aside>
  );
}
