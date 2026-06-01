import React, { useEffect, useState, useCallback } from 'react';
import SuperAdminSidebar from '../../components/admin/SuperAdminSidebar';
import {
  superAdminGetRestaurants,
  superAdminCreateRestaurant,
  superAdminDeleteRestaurant,
  superAdminUpdateRestaurant,
} from '../../services/adminApi';
import styles from './SuperAdminRestaurants.module.css';
import { FiPlus, FiTrash2, FiHome, FiUsers, FiBook, FiX, FiCheck, FiUnlock, FiLock, FiEdit2 } from 'react-icons/fi';

const SuperAdminRestaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Переводим страницу в полноэкранный desktop-режим
  useEffect(() => {
    document.body.classList.add('admin-mode');
    return () => document.body.classList.remove('admin-mode');
  }, []);

  // Form state
  const [form, setForm] = useState({
    name: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    logo_url: '',
  });
  const [saving, setSaving] = useState(false);

  // Edit state
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', logo_url: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await superAdminGetRestaurants();
      setRestaurants(data);
    } catch (err) {
      console.error('Ошибка загрузки ресторанов:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.adminEmail.trim() || !form.adminPassword.trim() || !form.adminName.trim()) {
      alert('Все поля обязательны');
      return;
    }
    setSaving(true);
    try {
      await superAdminCreateRestaurant(form);
      setForm({ name: '', adminName: '', adminEmail: '', adminPassword: '', logo_url: '' });
      setShowModal(false);
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEdit = (restaurant) => {
    setEditingRestaurant(restaurant);
    setEditForm({
      name: restaurant.name,
      logo_url: restaurant.logo_url || '',
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      alert('Название обязательно');
      return;
    }
    setSaving(true);
    try {
      await superAdminUpdateRestaurant(editingRestaurant.id, {
        name: editForm.name,
        logo_url: editForm.logo_url,
      });
      setEditingRestaurant(null);
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id, currentStatus, name) => {
    const action = currentStatus ? 'заблокировать' : 'разблокировать';
    if (!window.confirm(`Вы уверены, что хотите ${action} ресторан "${name}"?`)) return;

    try {
      await superAdminUpdateRestaurant(id, { is_active: !currentStatus });
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Удалить ресторан "${name}" и ВСЕ его данные? Это действие необратимо!`)) return;
    try {
      await superAdminDeleteRestaurant(id);
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className={styles.wrapper}>
      <SuperAdminSidebar />

      <main className={styles.main}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Реестр ресторанов</h1>
            <p className={styles.subtitle}>Регистрация новых заведений HoReCa и управление их доступом</p>
          </div>
          <button className={styles.createBtn} onClick={() => setShowModal(true)}>
            <FiPlus size={18} />
            <span>Создать ресторан</span>
          </button>
        </div>

        {/* ─── Create Modal ──────────────────── */}
        {showModal && (
          <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>Новый ресторан</h3>
                <button className={styles.modalClose} onClick={() => setShowModal(false)}>
                  <FiX size={18} />
                </button>
              </div>
              <form onSubmit={handleCreate} className={styles.modalForm}>
                 <div className={styles.field}>
                  <label className={styles.label}>Название ресторана*</label>
                  <input
                    className={styles.input}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Бристоль, Kaizen..."
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Ссылка на логотип (URL)</label>
                  <input
                    className={styles.input}
                    value={form.logo_url}
                    onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Имя администратора*</label>
                  <input
                    className={styles.input}
                    value={form.adminName}
                    onChange={(e) => setForm({ ...form, adminName: e.target.value })}
                    placeholder="Иван Петров"
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Email администратора*</label>
                  <input
                    className={styles.input}
                    type="email"
                    value={form.adminEmail}
                    onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                    placeholder="admin@restaurant.kz"
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Пароль администратора*</label>
                  <input
                    className={styles.input}
                    type="password"
                    value={form.adminPassword}
                    onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                    placeholder="Минимум 6 символов"
                    required
                  />
                </div>
                <div className={styles.modalFooter}>
                  <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>
                    Отмена
                  </button>
                  <button type="submit" className={styles.submitBtn} disabled={saving}>
                    <FiCheck size={16} />
                    <span>{saving ? 'Создание...' : 'Создать'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── Restaurant Grid ───────────────── */}
        {loading ? (
          <p style={{ color: '#94a3b8' }}>Загрузка ресторанов...</p>
        ) : restaurants.length === 0 ? (
          <div className={styles.emptyState}>
            <FiHome size={48} />
            <p>Ресторанов пока не зарегистрировано</p>
            <button className={styles.createBtn} onClick={() => setShowModal(true)}>
              <FiPlus size={18} />
              <span>Создать первый ресторан</span>
            </button>
          </div>
        ) : (
          <div className={styles.grid}>
            {restaurants.map((r) => (
              <div key={r.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardLogo}>
                    {r.logo_url ? (
                      <img src={r.logo_url} alt={r.name} />
                    ) : (
                      <span>{r.name[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <div className={styles.cardTitleBlock}>
                    <h3 className={styles.cardName}>{r.name}</h3>
                    <span className={styles.cardSlug}>/{r.slug}</span>
                  </div>
                  <span className={`${styles.statusBadge} ${r.is_active ? styles.active : styles.inactive}`}>
                    {r.is_active ? 'Активен' : 'Заблокирован'}
                  </span>
                </div>

                <div className={styles.statsRow}>
                  <div className={styles.stat}>
                    <FiUsers size={16} />
                    <span>{r._count?.users ?? 0} сотр.</span>
                  </div>
                  <div className={styles.stat}>
                    <FiBook size={16} />
                    <span>{r._count?.courses ?? 0} курсов</span>
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <span className={styles.date}>
                    От {new Date(r.created_at).toLocaleDateString('ru-RU')}
                  </span>
                   <div className={styles.actionsBlock}>
                    <button
                      className={styles.blockBtn}
                      onClick={() => handleOpenEdit(r)}
                      title="Редактировать ресторан"
                    >
                      <FiEdit2 size={16} />
                    </button>
                    <button
                      className={styles.blockBtn}
                      onClick={() => handleToggleActive(r.id, r.is_active, r.name)}
                      title={r.is_active ? 'Заблокировать доступ' : 'Разблокировать доступ'}
                    >
                      {r.is_active ? <FiLock size={16} /> : <FiUnlock size={16} />}
                    </button>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDelete(r.id, r.name)}
                      title="Удалить ресторан"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── Edit Modal ──────────────────── */}
        {editingRestaurant && (
          <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && setEditingRestaurant(null)}>
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>Редактировать ресторан</h3>
                <button className={styles.modalClose} onClick={() => setEditingRestaurant(null)}>
                  <FiX size={18} />
                </button>
              </div>
              <form onSubmit={handleUpdate} className={styles.modalForm}>
                <div className={styles.field}>
                  <label className={styles.label}>Название ресторана*</label>
                  <input
                    className={styles.input}
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="Бристоль, Kaizen..."
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Ссылка на логотип (URL)</label>
                  <input
                    className={styles.input}
                    value={editForm.logo_url}
                    onChange={(e) => setEditForm({ ...editForm, logo_url: e.target.value })}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div className={styles.modalFooter}>
                  <button type="button" className={styles.cancelBtn} onClick={() => setEditingRestaurant(null)}>
                    Отмена
                  </button>
                  <button type="submit" className={styles.submitBtn} disabled={saving}>
                    <FiCheck size={16} />
                    <span>{saving ? 'Сохранение...' : 'Сохранить'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SuperAdminRestaurants;
