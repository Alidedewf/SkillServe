import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FiGrid, FiBook, FiUsers, FiLogOut } from 'react-icons/fi';
import { adminLogout } from '../../services/adminApi';
import styles from './AdminSidebar.module.css';

const navItems = [
  { to: '/admin',         label: 'Обзор',         icon: FiGrid,  end: true },
  { to: '/admin/courses', label: 'Курсы',          icon: FiBook },
  { to: '/admin/users',   label: 'Пользователи',   icon: FiUsers },
];

const AdminSidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    adminLogout();
    navigate('/admin/login');
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>SM</span>
        <span className={styles.logoText}>StaffMenu</span>
        <span className={styles.adminBadge}>Admin</span>
      </div>

      <nav className={styles.nav}>
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
            }
          >
            <Icon size={20} className={styles.navIcon} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <button className={styles.logoutBtn} onClick={handleLogout}>
        <FiLogOut size={18} />
        <span>Выйти</span>
      </button>
    </aside>
  );
};

export default AdminSidebar;
