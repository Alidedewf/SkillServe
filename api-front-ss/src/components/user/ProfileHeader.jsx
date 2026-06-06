import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ProfileHeader.module.css';
import { FiBell, FiEdit2 } from 'react-icons/fi';
import avatarPlaceholder from '../../assets/images/default-avatar.svg';

const ProfileHeader = ({ user }) => {
  const navigate = useNavigate();

  const handleNotificationsClick = () => {
    navigate('/notifications');
  };

  const handleEditProfileClick = () => {
    navigate('/edit-profile');
  };

  return (
    <div className={styles.header}>
      <div className={styles.topContainer}>
        <h1 className={styles.title}>Профиль</h1>
        <button className={styles.notificationButton}
          onClick={handleNotificationsClick}>
          <FiBell size={24} className={styles.notification} />
        </button>
      </div>
      <div className={styles.profileContainer}>
        <div className={styles.avatarContainer}>
          <img
            src={user?.avatar || avatarPlaceholder}
            alt="Аватар"
            className={styles.avatar}
          />
          <button
            className={styles.editButton}
            onClick={handleEditProfileClick} >
            <FiEdit2 size={16} color="#fff" />
          </button>
        </div>
        <h2 className={styles.name}>{(user?.full_name || user?.name || '').toLowerCase()}</h2>
        <p className={styles.email}>@{user?.email?.split('@')[0] || ''}</p>
        {user?.restaurant && (
          <div className={styles.restaurantBadge}>
            {user.restaurant.logo_url ? (
              <img src={user.restaurant.logo_url} alt="Logo" className={styles.restaurantMiniLogo} />
            ) : (
              <span className={styles.restaurantMiniIcon}>{user.restaurant.name.slice(0, 2).toUpperCase()}</span>
            )}
            <span className={styles.restaurantText}>{user.restaurant.name}</span>
          </div>
        )}
      </div>

    </div>
  );
};

export default ProfileHeader;
