import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FiHome, FiBook, FiUsers, FiLogOut } from 'react-icons/fi';
import { adminLogout } from '../../services/adminApi';
import styles from './AdminLayout.module.css';

const navItems = [
  { to: '/admin',         label: 'Главная',    icon: FiHome,  end: true },
  { to: '/admin/courses', label: 'Курсы',       icon: FiBook },
  { to: '/admin/users',   label: 'Персонал',    icon: FiUsers },
];

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const [adminName, setAdminName] = useState('');
  const [adminInitials, setAdminInitials] = useState('');

  const handleLogout = () => {
    adminLogout();
    navigate('/login');
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

  return (
    <div className={styles.wrapper}>
      {/* ─── Top Header ───────────────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>SM</div>
        </div>

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
