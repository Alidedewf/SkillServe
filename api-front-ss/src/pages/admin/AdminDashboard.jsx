import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBook, FiUsers, FiCheckCircle, FiPlusCircle, FiAward, FiZap, FiAlertTriangle, FiArrowRight } from 'react-icons/fi';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminGetDashboard } from '../../services/adminApi';
import styles from './AdminDashboard.module.css';

const KpiCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className={styles.statCard}>
    <div className={styles.statIcon} style={{ background: color }}>
      <Icon size={22} color="var(--color-on-primary)" />
    </div>
    <div>
      <p className={styles.statValue}>{value}</p>
      <p className={styles.statLabel}>{label}</p>
      {sub && <p className={styles.statSub}>{sub}</p>}
    </div>
  </div>
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGetDashboard()
      .then(setData)
      .catch((err) => console.error('[AdminDashboard]', err))
      .finally(() => setLoading(false));
  }, []);

  const t = data?.training || {};
  const m = data?.menuTraining || {};
  const a = data?.attention || {};

  const attentionItems = [
    { n: a.dishesWithoutGuide, label: 'блюд без «Советов по продаже»', to: '/admin/menu' },
    { n: a.coursesWithoutTests, label: 'курсов без тестов', to: '/admin/courses' },
    { n: a.usersWithoutPosition, label: 'сотрудников без должности', to: '/admin/users' },
    { n: a.notStarted, label: 'сотрудников не начали обучение', to: '/admin/users' },
  ].filter((x) => x.n > 0);

  const guidePct = m.totalDishes ? Math.round((m.dishesWithGuide / m.totalDishes) * 100) : 0;

  return (
    <AdminLayout
      title="Обзор"
      action={
        <button className={styles.primaryBtn} onClick={() => navigate('/admin/courses/new')}>
          <FiPlusCircle size={18} /> Новый курс
        </button>
      }
    >
      {loading ? (
        <p style={{ color: 'var(--color-text-muted)' }}>Загрузка…</p>
      ) : (
        <>
          {/* A. Метрики обучения */}
          <div className={styles.statsGrid}>
            <KpiCard icon={FiUsers} label="Сотрудников" value={t.totalUsers ?? 0} color="var(--color-primary)" />
            <KpiCard icon={FiCheckCircle} label="Завершили обучение" value={`${t.completionRate ?? 0}%`} sub={`${t.completedCount ?? 0} из ${t.totalUsers ?? 0}`} color="var(--color-success)" />
            <KpiCard icon={FiAward} label="Средний балл тестов" value={`${t.avgScore ?? 0}%`} sub={`${t.testAttempts ?? 0} попыток`} color="var(--color-purple)" />
            <KpiCard icon={FiAlertTriangle} label="Не начали" value={t.notStarted ?? 0} sub="сотрудников" color="var(--color-warning)" />
          </div>

          {/* B + C */}
          <div className={styles.panelsGrid}>
            {/* B. Обучение по меню */}
            <div className={styles.panel}>
              <div className={styles.panelHead}>
                <FiZap className={styles.panelHeadIcon} />
                <h3 className={styles.panelTitle}>Обучение по меню</h3>
              </div>
              {m.hasCourse ? (
                <>
                  <p className={styles.panelText}>
                    Курс «Продажи по меню» создан
                    {m.courseUpdatedAt && ` · обновлён ${new Date(m.courseUpdatedAt).toLocaleDateString('ru-RU')}`}.
                  </p>
                  <div className={styles.progressWrap}>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ width: `${guidePct}%` }} />
                    </div>
                    <span className={styles.progressLabel}>Советы по продаже: {m.dishesWithGuide} / {m.totalDishes} блюд</span>
                  </div>
                  <div className={styles.panelActions}>
                    <button className={styles.panelBtn} onClick={() => navigate(`/admin/courses/${m.courseId}`)}>Открыть курс</button>
                    <button className={styles.panelBtnGhost} onClick={() => navigate('/admin/menu')}>Меню</button>
                  </div>
                </>
              ) : (
                <>
                  <p className={styles.panelText}>
                    Автокурс по меню ещё не создан{m.totalDishes ? ` · в меню ${m.totalDishes} блюд` : ''}.
                  </p>
                  <div className={styles.panelActions}>
                    <button className={styles.panelBtn} onClick={() => navigate('/admin/menu')}>Сгенерировать обучение</button>
                  </div>
                </>
              )}
            </div>

            {/* C. Требует внимания */}
            <div className={styles.panel}>
              <div className={styles.panelHead}>
                <FiAlertTriangle className={styles.panelHeadIcon} />
                <h3 className={styles.panelTitle}>Требует внимания</h3>
              </div>
              {attentionItems.length === 0 ? (
                <p className={styles.panelText} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FiCheckCircle size={16} style={{ color: 'var(--color-success)' }} aria-hidden="true" /> Всё в порядке — ничего не требует внимания.
                </p>
              ) : (
                <div className={styles.attentionList}>
                  {attentionItems.map((x, i) => (
                    <button key={i} className={styles.attentionRow} onClick={() => navigate(x.to)}>
                      <span className={styles.attentionNum}>{x.n}</span>
                      <span className={styles.attentionLabel}>{x.label}</span>
                      <FiArrowRight size={16} className={styles.attentionArrow} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Быстрые действия */}
          <div className={styles.quickLinks}>
            <h2 className={styles.sectionTitle}>Быстрые действия</h2>
            <div className={styles.linksGrid}>
              <div className={styles.linkCard} onClick={() => navigate('/admin/courses')}>
                <FiBook size={28} className={styles.linkIcon} />
                <span>Управление курсами</span>
              </div>
              <div className={styles.linkCard} onClick={() => navigate('/admin/users')}>
                <FiUsers size={28} className={styles.linkIcon} />
                <span>Управление персоналом</span>
              </div>
              <div className={styles.linkCard} onClick={() => navigate('/admin/menu')}>
                <FiZap size={28} className={styles.linkIcon} />
                <span>Меню и обучение</span>
              </div>
              <div className={styles.linkCard} onClick={() => navigate('/admin/courses/new')}>
                <FiPlusCircle size={28} className={styles.linkIcon} />
                <span>Создать курс</span>
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
