import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const { signOut } = useAuth();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.brandIcon}>💰</span>
        <span className={styles.brandName}>Wealth Manager</span>
      </div>

      <nav className={styles.nav}>
        <NavLink
          to="/"
          end
          className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
        >
          <span className={styles.icon}>📊</span>
          Home
        </NavLink>
        <NavLink
          to="/records"
          className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
        >
          <span className={styles.icon}>📋</span>
          Records
        </NavLink>
        <NavLink
          to="/records/new"
          className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
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
