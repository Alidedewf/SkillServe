import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchUserNotifications } from '../../services/api'; // Функция для запроса уведомлений
import styles from './Notifications.module.css';
import { FiArrowLeft, FiBell, FiClock } from 'react-icons/fi';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]); // Инициализируем как пустой массив
  const navigate = useNavigate();

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const data = await fetchUserNotifications(); // Загружаем уведомления с API
        setNotifications(data || []); // Защита от null
      } catch (error) {
        console.error('Ошибка загрузки уведомлений:', error);
        setNotifications([]); // Если ошибка, устанавливаем пустой массив
      }
    };

    loadNotifications();
  }, []);

  const handleBackClick = () => {
    navigate('/profile');
  };

  const formatDate = (dateString) => {
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', options);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={handleBackClick} className={styles.backButton}>
          <FiArrowLeft size={24} color="#000" />
        </button>
        <h3 className={styles.notification_title}>Уведомления</h3>
      </div>
      <div className={styles.notifications}>
        {notifications && notifications.length > 0 ? ( // Проверяем, что массив не пуст
          notifications.map((notification) => (
            <div key={notification.id} className={styles.notification}>
              <div className={styles.notificationHeader}>
                <span>{formatDate(notification.created_at)}</span>
                {notification.is_read ? <FiClock size={20} color="var(--color-primary)" /> : <FiBell size={20} color="var(--color-primary)" />}
              </div>
              <div className={styles.notificationBody}>
                <p>{notification.title}</p>
                <span>{notification.message}</span>
                <span>{new Date(notification.created_at).toLocaleTimeString('ru-RU')}</span>
              </div>
            </div>
          ))
        ) : (
          <p className={styles.noNotifications}>Нет новых уведомлений</p> // Сообщение, если уведомлений нет
        )}
      </div>
    </div>
  );
};

export default Notifications;
