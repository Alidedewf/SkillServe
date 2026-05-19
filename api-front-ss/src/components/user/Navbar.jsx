import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './Navbar.module.css';
import { FiHome, FiBook, FiLayers, FiUser, FiList } from 'react-icons/fi';

const Navbar = () => {
  const links = [
    { to: '/home', label: 'Главная', Icon: FiHome },
    { to: '/courses', label: 'Курсы', Icon: FiBook },
    { to: '/menu', label: 'Меню', Icon: FiList },
    { to: '/resources', label: 'Ресурсы', Icon: FiLayers },
    { to: '/profile', label: 'Профиль', Icon: FiUser },
  ];

  return (
    <div className={styles.navbar}>
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            `${styles.navItem} ${isActive ? styles.active : ''}`
          }
        >
          {({ isActive }) => (
            <>
              <link.Icon className={styles.icon} size={20} strokeWidth={isActive ? 3 : 2} />
              <span>{link.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
};

export default Navbar;
