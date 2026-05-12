import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import UserCreateModal from '../../components/admin/UserCreateModal';
import PositionCreateModal from '../../components/admin/PositionCreateModal';
import { adminGetUsers, adminGetPositions, adminDeleteUser, adminDeletePosition, adminUpdateUser } from '../../services/adminApi';
import styles from './AdminUsers.module.css';

const TABS = [
  { key: 'active',   label: 'Активный персонал' },
  { key: 'all',      label: 'Все сотрудники' },
  { key: 'inactive', label: 'Отключенные' },
  { key: 'positions', label: 'Должности' },
];

const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('active');
  const [selected, setSelected] = useState(null); // id выбранного пользователя
  const [filters, setFilters] = useState({ keyword: '', position: '' });
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [positions, setPositions] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    const [uData, pData] = await Promise.all([adminGetUsers(), adminGetPositions()]);
    setUsers(uData);
    setPositions(pData);
    setSelected(null);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Фильтрация по вкладке
  const filteredByTab = users.filter((u) => {
    if (activeTab === 'active')   return u.is_active;
    if (activeTab === 'inactive') return !u.is_active;
    return true; // all
  });

  // Фильтрация по поисковым полям
  const filtered = filteredByTab.filter((u) => {
    const kw = filters.keyword.toLowerCase();
    const pos = filters.position.toLowerCase();
    const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
    return (
      (!kw || fullName.includes(kw) || u.email.toLowerCase().includes(kw)) &&
      (!pos || u.position?.toLowerCase().includes(pos))
    );
  });

  const selectedUser = users.find((u) => u.id === selected);

  // ─── Actions ────────────────────────────────────────────────────
  const handleToggleActive = async () => {
    if (!selected) return;
    await adminUpdateUser(selected, { is_active: !selectedUser?.is_active });
    load();
  };

  const handleDelete = async () => {
    if (!selected) return;
    if (!window.confirm(`Удалить сотрудника ${selectedUser?.first_name} ${selectedUser?.last_name}?`)) return;
    await adminDeleteUser(selected);
    load();
  };

  return (
    <AdminLayout>
      {showCreateModal && (
        <UserCreateModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { setShowCreateModal(false); load(); }}
        />
      )}
      {showPositionModal && (
        <PositionCreateModal
          onClose={() => setShowPositionModal(false)}
          onCreated={() => { setShowPositionModal(false); load(); }}
        />
      )}
      <div className={styles.page}>

        {/* ─── LEFT: Tabs + Filters ──────────────────────────── */}
        <aside className={styles.left}>
          <div className={styles.tabs}>
            {TABS.map((tab) => (
              <button
                key={tab.key}
                className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
                onClick={() => { setActiveTab(tab.key); setSelected(null); }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className={styles.filterBox}>
            <p className={styles.filterTitle}>Фильтры</p>
            <label className={styles.filterLabel}>Поиск (Имя/Email)</label>
            <input
              className={styles.filterInput}
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            />
            <label className={styles.filterLabel}>Должность</label>
            <input
              className={styles.filterInput}
              value={filters.position}
              onChange={(e) => setFilters({ ...filters, position: e.target.value })}
              placeholder="бармен"
            />
            <button className={styles.searchBtn}>поиск</button>
          </div>
        </aside>

        {/* ─── CENTER: User or Position List ───────────────────────────── */}
        <section className={styles.center}>
          <div className={styles.centerHeader}>
            <h2 className={styles.centerTitle}>
              {TABS.find((t) => t.key === activeTab)?.label}
            </h2>
          </div>

          {loading ? (
            <p className={styles.empty}>Загрузка...</p>
          ) : activeTab === 'positions' ? (
            <div className={styles.list}>
              {positions.map((pos) => (
                <div 
                  key={pos.id} 
                  className={`${styles.card} ${selected === pos.id ? styles.cardSelected : ''}`}
                  onClick={() => setSelected(selected === pos.id ? null : pos.id)}
                >
                  <div className={styles.posIcon}>🏷️</div>
                  <div className={styles.cardInfo}>
                    <p className={styles.cardTitle}>{pos.name}</p>
                  </div>
                  <button className={styles.deleteMini} onClick={(e) => {
                    e.stopPropagation();
                    adminDeletePosition(pos.id).then(load);
                  }}>×</button>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className={styles.empty}>Сотрудники не найдены</p>
          ) : (
            <div className={styles.list}>
              {filtered.map((user) => (
                <div
                  key={user.id}
                  className={`${styles.card} ${selected === user.id ? styles.cardSelected : ''}`}
                  onClick={() => setSelected(selected === user.id ? null : user.id)}
                >
                  <div className={styles.avatar}>
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="avatar" />
                    ) : (
                      <div className={styles.avatarPlaceholder}>
                        {user.first_name?.[0]}{user.last_name?.[0]}
                      </div>
                    )}
                  </div>
                  <div className={styles.cardInfo}>
                    <p className={styles.cardTitle}>{user.first_name} {user.last_name}</p>
                    <span className={styles.cardSpecialty}>
                      {user.position || 'без должности'} • {user.role}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={selected === user.id}
                    onChange={() => setSelected(selected === user.id ? null : user.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ─── RIGHT: Actions ───────────────────────────────── */}
        <aside className={styles.right}>
          {activeTab === 'positions' ? (
            <button
              className={styles.actionBtn}
              onClick={() => setShowPositionModal(true)}
            >
              Создать должность
            </button>
          ) : (
            <>
              <button
                className={styles.actionBtn}
                onClick={() => setShowCreateModal(true)}
              >
                Создать
              </button>
              <button
                className={`${styles.actionBtn} ${!selected ? styles.actionDisabled : ''}`}
                disabled={!selected}
                onClick={() => navigate(`/admin/users/${selected}`)}
              >
                Редактировать
              </button>
              <button
                className={`${styles.actionBtn} ${!selected ? styles.actionDisabled : ''}`}
                disabled={!selected}
                onClick={handleToggleActive}
              >
                {selectedUser?.is_active ? 'Отключить' : 'Активировать'}
              </button>
              <button
                className={`${styles.actionBtn} ${styles.actionDanger} ${!selected ? styles.actionDisabled : ''}`}
                disabled={!selected}
                onClick={handleDelete}
              >
                Удалить
              </button>
            </>
          )}
        </aside>

      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
