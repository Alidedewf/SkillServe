import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FiGrid, FiHome, FiLogOut } from 'react-icons/fi';
import { adminLogout } from '../../services/adminApi';
import styles from './SuperAdminSidebar.module.css';

const SuperAdminSidebar = () => {
  const navigate = useNavigate();

  const navItems = [
    { to: '/superadmin', label: 'Обзор (SaaS)', icon: FiGrid, end: true },
    { to: '/superadmin/restaurants', label: 'Рестораны', icon: FiHome },
  ];

  const handleLogout = () => {
    adminLogout();
    // Очистим также и активный ресторан, если был выбран
    localStorage.removeItem('active_restaurant_id');
    localStorage.removeItem('active_restaurant_name');
    navigate('/login');
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>SS</span>
        <span className={styles.logoText}>SkillServe SaaS</span>
        <span className={styles.adminBadge}>SaaS Root</span>
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

export default SuperAdminSidebar;
