import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SuperAdminSidebar from '../../components/admin/SuperAdminSidebar';
import { superAdminGetRestaurants, adminGetStats } from '../../services/adminApi';
import styles from './SuperAdminDashboard.module.css';
import { FiHome, FiUsers, FiBook, FiEye } from 'react-icons/fi';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [stats, setStats] = useState({
    total_courses: 0,
    published_courses: 0,
    total_users: 0,
  });
  const [loading, setLoading] = useState(true);

  // Переводим страницу в полноэкранный desktop-режим
  useEffect(() => {
    document.body.classList.add('admin-mode');
    return () => document.body.classList.remove('admin-mode');
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [restsData, statsData] = await Promise.all([
          superAdminGetRestaurants(),
          adminGetStats(), // Запрос без контекста вернет общую SaaS статистику
        ]);
        setRestaurants(restsData);
        setStats(statsData);
      } catch (err) {
        console.error('Ошибка загрузки SaaS данных:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleImpersonate = (restaurantId, restaurantName) => {
    localStorage.setItem('active_restaurant_id', restaurantId);
    localStorage.setItem('active_restaurant_name', restaurantName);
    navigate('/admin');
  };

  return (
    <div className={styles.wrapper}>
      <SuperAdminSidebar />
      
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>Обзор SaaS платформы</h1>
          <p className={styles.subtitle}>Панель управления владельца продукта SkillServe LMS</p>
        </div>

        {loading ? (
          <p style={{ color: '#94a3b8' }}>Загрузка показателей...</p>
        ) : (
          <>
            {/* Карточки показателей */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={`${styles.statIcon} ${styles.iconPurple}`}>
                  <FiHome size={22} />
                </div>
                <div className={styles.statMeta}>
                  <span className={styles.statValue}>{restaurants.length}</span>
                  <span className={styles.statLabel}>Всего ресторанов</span>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={`${styles.statIcon} ${styles.iconBlue}`}>
                  <FiUsers size={22} />
                </div>
                <div className={styles.statMeta}>
                  <span className={styles.statValue}>{stats.total_users}</span>
                  <span className={styles.statLabel}>Всего сотрудников</span>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={`${styles.statIcon} ${styles.iconGreen}`}>
                  <FiBook size={22} />
                </div>
                <div className={styles.statMeta}>
                  <span className={styles.statValue}>{stats.total_courses}</span>
                  <span className={styles.statLabel}>Всего курсов</span>
                </div>
              </div>
            </div>

            {/* Список ресторанов для имперсонации */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Реестр ресторанов для управления</h2>
              </div>

              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.th}>Ресторан</th>
                      <th className={styles.th}>Статус</th>
                      <th className={styles.th}>Сотрудники</th>
                      <th className={styles.th}>Курсы</th>
                      <th className={styles.th}>Дата создания</th>
                      <th className={styles.th} style={{ textAlign: 'right' }}>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {restaurants.length === 0 ? (
                      <tr>
                        <td colSpan="6" className={styles.noData}>
                          Рестораны пока не зарегистрированы
                        </td>
                      </tr>
                    ) : (
                      restaurants.map((r) => (
                        <tr key={r.id}>
                          <td className={styles.td}>
                            <div className={styles.restNameBlock}>
                              <span className={styles.restName}>{r.name}</span>
                              <span className={styles.restSlug}>/{r.slug}</span>
                            </div>
                          </td>
                          <td className={styles.td}>
                            <span
                              className={`${styles.statusBadge} ${
                                r.is_active ? styles.activeBadge : styles.inactiveBadge
                              }`}
                            >
                              {r.is_active ? 'Активен' : 'Заблокирован'}
                            </span>
                          </td>
                          <td className={styles.td}>{r._count?.users ?? 0}</td>
                          <td className={styles.td}>{r._count?.courses ?? 0}</td>
                          <td className={styles.td}>
                            {new Date(r.created_at).toLocaleDateString('ru-RU')}
                          </td>
                          <td className={styles.td} style={{ textAlign: 'right' }}>
                            <button
                              className={styles.manageBtn}
                              onClick={() => handleImpersonate(r.id, r.name)}
                              title={`Управлять рестораном ${r.name}`}
                            >
                              <FiEye size={14} />
                              <span>Управлять</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
