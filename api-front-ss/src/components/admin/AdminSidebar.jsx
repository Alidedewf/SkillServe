import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FiGrid, FiBook, FiUsers, FiLogOut, FiLayers, FiArrowLeft } from 'react-icons/fi';
import { adminLogout, getCurrentRole } from '../../services/adminApi';
import styles from './AdminSidebar.module.css';

const AdminSidebar = () => {
  const navigate = useNavigate();
  const role = getCurrentRole();
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const activeRestaurantName = localStorage.getItem('active_restaurant_name') || 'Ресторан';

  const navItems = [
    { to: '/admin',              label: 'Обзор',           icon: FiGrid,   end: true },
    { to: '/admin/courses',      label: 'Курсы',           icon: FiBook },
    { to: '/admin/users',        label: 'Пользователи',    icon: FiUsers },
    { to: '/admin/org-structure', label: 'Оргструктура',   icon: FiLayers },
  ];

  const handleLogout = () => {
    adminLogout();
    localStorage.removeItem('active_restaurant_id');
    localStorage.removeItem('active_restaurant_name');
    navigate('/login');
  };

  const handleBackToSaaS = () => {
    localStorage.removeItem('active_restaurant_id');
    localStorage.removeItem('active_restaurant_name');
    navigate('/superadmin');
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>SM</span>
        <span className={styles.logoText}>StaffMenu</span>
        <span className={styles.adminBadge}>{isSuperAdmin ? 'Super' : 'Admin'}</span>
      </div>

      {isSuperAdmin && (
        <div className={styles.impersonationBlock}>
          <span className={styles.impersonationTitle}>Управление</span>
          <span className={styles.impersonationName} title={activeRestaurantName}>
            🏠 {activeRestaurantName}
          </span>
          <button className={styles.backToSaaSBtn} onClick={handleBackToSaaS}>
            <FiArrowLeft size={14} />
            <span>В SaaS-панель</span>
          </button>
        </div>
      )}

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
