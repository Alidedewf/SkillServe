import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBook, FiUsers, FiCheckCircle, FiPlusCircle } from 'react-icons/fi';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminGetStats } from '../../services/adminApi';
import styles from './AdminDashboard.module.css';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className={styles.statCard}>
    <div className={styles.statIcon} style={{ background: color }}>
      <Icon size={22} color="#fff" />
    </div>
    <div>
      <p className={styles.statValue}>{value}</p>
      <p className={styles.statLabel}>{label}</p>
    </div>
  </div>
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    adminGetStats().then(setStats);
  }, []);

  return (
    <AdminLayout
      title="Обзор"
      action={
        <button className={styles.primaryBtn} onClick={() => navigate('/admin/courses/new')}>
          <FiPlusCircle size={18} />
          Новый курс
        </button>
      }
    >
      {stats && (
        <div className={styles.statsGrid}>
          <StatCard icon={FiBook}         label="Всего курсов"        value={stats.total_courses}    color="#006ffd" />
          <StatCard icon={FiCheckCircle}  label="Опубликованных"      value={stats.published_courses} color="#10b981" />
          <StatCard icon={FiUsers}        label="Пользователей"       value={stats.total_users}       color="#f59e0b" />
          <StatCard icon={FiCheckCircle}  label="Активных юзеров"     value={stats.active_users}      color="#8b5cf6" />
        </div>
      )}

      <div className={styles.quickLinks}>
        <h2 className={styles.sectionTitle}>Быстрые действия</h2>
        <div className={styles.linksGrid}>
          <div className={styles.linkCard} onClick={() => navigate('/admin/courses')}>
            <FiBook size={28} className={styles.linkIcon} />
            <span>Управление курсами</span>
          </div>
          <div className={styles.linkCard} onClick={() => navigate('/admin/users')}>
            <FiUsers size={28} className={styles.linkIcon} />
            <span>Управление пользователями</span>
          </div>
          <div className={styles.linkCard} onClick={() => navigate('/admin/courses/new')}>
            <FiPlusCircle size={28} className={styles.linkIcon} />
            <span>Создать курс</span>
          </div>
          <div className={styles.linkCard} onClick={() => navigate('/admin/users')}>
            <FiPlusCircle size={28} className={styles.linkIcon} />
            <span>Добавить сотрудника</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
