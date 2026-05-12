import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import CourseCreateModal from '../../components/admin/CourseCreateModal';
import {
  adminGetCourses,
  adminDeleteCourse,
  adminUpdateCourse,
} from '../../services/adminApi';
import styles from './AdminCourses.module.css';

const TABS = [
  { key: 'active',   label: 'Активные курсы' },
  { key: 'all',      label: 'Все курсы' },
  { key: 'archived', label: 'Архивные курсы' },
];

const AdminCourses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [activeTab, setActiveTab] = useState('active');
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({ keyword: '', specialty: '', date: '' });
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await adminGetCourses();
    setCourses(data);
    setSelected(null);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Фильтрация по вкладке
  const filteredByTab = courses.filter((c) => {
    if (activeTab === 'active')   return c.is_published && !c.is_archived;
    if (activeTab === 'archived') return c.is_archived;
    return true; // all
  });

  // Фильтрация по поисковым полям
  const filtered = filteredByTab.filter((c) => {
    const kw = filters.keyword.toLowerCase();
    const sp = filters.specialty.toLowerCase();
    return (
      (!kw || c.title.toLowerCase().includes(kw) || c.description?.toLowerCase().includes(kw)) &&
      (!sp || c.specialty?.toLowerCase().includes(sp))
    );
  });

  const selectedCourse = courses.find((c) => c.id === selected);

  // ─── Actions ────────────────────────────────────────────────────
  const handleArchive = async () => {
    if (!selected) return;
    await adminUpdateCourse(selected, { is_archived: !selectedCourse?.is_archived, is_published: false });
    load();
  };

  const handleTogglePublish = async () => {
    if (!selected) return;
    await adminUpdateCourse(selected, { is_published: !selectedCourse?.is_published });
    load();
  };

  const handleDelete = async () => {
    if (!selected) return;
    if (!window.confirm(`Удалить курс "${selectedCourse?.title}"?`)) return;
    await adminDeleteCourse(selected);
    load();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // фильтрация происходит реактивно, кнопка для UX
  };

  return (
    <AdminLayout>
      {showCreateModal && (
        <CourseCreateModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { setShowCreateModal(false); load(); }}
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
            <form onSubmit={handleSearch}>
              <label className={styles.filterLabel}>Ключевые слова</label>
              <input
                className={styles.filterInput}
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                placeholder=""
              />
              <label className={styles.filterLabel}>Специальность</label>
              <input
                className={styles.filterInput}
                value={filters.specialty}
                onChange={(e) => setFilters({ ...filters, specialty: e.target.value })}
                placeholder="повар"
              />
              <label className={styles.filterLabel}>Дата</label>
              <input
                className={styles.filterInput}
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
              />
              <button type="submit" className={styles.searchBtn}>поиск</button>
            </form>
          </div>
        </aside>

        {/* ─── CENTER: Course List ───────────────────────────── */}
        <section className={styles.center}>
          <div className={styles.centerHeader}>
            <h2 className={styles.centerTitle}>
              {TABS.find((t) => t.key === activeTab)?.label}
            </h2>
          </div>

          {loading ? (
            <p className={styles.empty}>Загрузка...</p>
          ) : filtered.length === 0 ? (
            <p className={styles.empty}>Курсов не найдено</p>
          ) : (
            <div className={styles.list}>
              {filtered.map((course) => (
                <div
                  key={course.id}
                  className={`${styles.card} ${selected === course.id ? styles.cardSelected : ''}`}
                  onClick={() => setSelected(selected === course.id ? null : course.id)}
                >
                  <div className={styles.cardImage}>
                    {course.image_url
                      ? <img src={course.image_url} alt={course.title} />
                      : <div className={styles.cardImagePlaceholder}>📚</div>
                    }
                  </div>
                  <div className={styles.cardInfo}>
                    <p className={styles.cardTitle}>{course.title}</p>
                    <span className={styles.cardSpecialty}>
                      {course.specialty || 'общий'}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={selected === course.id}
                    onChange={() => setSelected(selected === course.id ? null : course.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ─── RIGHT: Actions ───────────────────────────────── */}
        <aside className={styles.right}>
          <button
            className={styles.actionBtn}
            onClick={() => setShowCreateModal(true)}
          >
            Создать
          </button>
          <button
            className={`${styles.actionBtn} ${!selected ? styles.actionDisabled : ''}`}
            disabled={!selected}
            onClick={() => navigate(`/admin/courses/${selected}`)}
          >
            Редактировать
          </button>
          <button
            className={`${styles.actionBtn} ${!selected ? styles.actionDisabled : ''}`}
            disabled={!selected}
            onClick={handleArchive}
          >
            {selectedCourse?.is_archived ? 'Разархивировать' : 'Архивировать'}
          </button>
          <button
            className={`${styles.actionBtn} ${!selected ? styles.actionDisabled : ''}`}
            disabled={!selected}
            onClick={handleTogglePublish}
          >
            {selectedCourse?.is_published ? 'Остановить' : 'Запустить'}
          </button>
          <button
            className={`${styles.actionBtn} ${styles.actionDanger} ${!selected ? styles.actionDisabled : ''}`}
            disabled={!selected}
            onClick={handleDelete}
          >
            Удалить
          </button>
        </aside>

      </div>
    </AdminLayout>
  );
};

export default AdminCourses;
