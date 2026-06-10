import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FiHome, FiBook, FiUsers, FiLogOut, FiAward, FiList } from 'react-icons/fi';
import { adminLogout, getCurrentRole } from '../../services/adminApi';
import styles from './AdminLayout.module.css';

const navItems = [
  { to: '/admin',         label: 'Главная',    icon: FiHome,  end: true },
  { to: '/admin/courses', label: 'Курсы',       icon: FiBook },
  { to: '/admin/users',   label: 'Персонал',    icon: FiUsers },
  { to: '/admin/achievements', label: 'Достижения', icon: FiAward },
  { to: '/admin/menu',    label: 'Меню',        icon: FiList },
];

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const [adminName, setAdminName] = useState('');
  const [adminInitials, setAdminInitials] = useState('');
  const [restaurant, setRestaurant] = useState(null);
  const role = getCurrentRole();
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const activeRestaurantName = localStorage.getItem('active_restaurant_name') || 'Ресторан';

  // SUPER_ADMIN без выбранного ресторана — редирект на выбор
  useEffect(() => {
    if (isSuperAdmin && !localStorage.getItem('active_restaurant_id')) {
      navigate('/superadmin', { replace: true });
    }
  }, [isSuperAdmin, navigate]);

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

  // Загружаем реальное имя админа из бэкенда
  useEffect(() => {
    const loadAdmin = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/users/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        const name = data.name || 'Админ';
        setAdminName(name);
        const parts = name.split(' ');
        setAdminInitials(parts.map(p => p[0]).join('').toUpperCase().slice(0, 2));
        
        if (data.restaurant) {
          setRestaurant(data.restaurant);
        }
      } catch (err) {
        console.error('[AdminLayout] Ошибка загрузки профиля:', err);
      }
    };
    loadAdmin();
  }, []);

  // Переводим страницу в полноэкранный desktop-режим
  useEffect(() => {
    document.body.classList.add('admin-mode');
    return () => document.body.classList.remove('admin-mode');
  }, []);

  const getRestaurantInitials = () => {
    const name = restaurant?.name || activeRestaurantName;
    if (!name || name === 'Ресторан') return 'SM';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className={styles.wrapper}>
      {/* ─── Top Header ───────────────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.logo}>
          {restaurant?.logo_url ? (
            <img src={restaurant.logo_url} className={styles.logoImg} alt={restaurant.name} />
          ) : (
            <div className={styles.logoIcon}>{getRestaurantInitials()}</div>
          )}
        </div>

        {isSuperAdmin && (
          <div className={styles.impersonationBadge}>
            <span className={styles.impersonationText} title={activeRestaurantName}>
              🏠 {activeRestaurantName}
            </span>
            <button className={styles.backToSaaSBtn} onClick={handleBackToSaaS} title="Вернуться к управлению SaaS">
              SaaS Панель
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
                `${styles.navItem} ${isActive ? styles.navActive : ''}`
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.userBlock}>
          <div className={styles.avatar}>{adminInitials}</div>
          <span className={styles.userName}>{adminName}</span>
          <button className={styles.logoutBtn} onClick={handleLogout} title="Выйти">
            <FiLogOut size={18} />
          </button>
        </div>
      </header>

      {/* ─── Page Content ─────────────────────────────────────── */}
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
