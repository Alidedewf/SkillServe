import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/user/Navbar';
import CourseCard from '../../components/user/CourseCard';
import { fetchHomePage } from '../../services/api';
import styles from './Dashboard.module.css';
import avatar from '../../assets/images/default-avatar.svg';
import { FiBell, FiBook, FiInfo } from 'react-icons/fi';
import illustration from '../../assets/images/illustration.svg';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [allCourses, setAllCourses] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        // Авторизация по httpOnly-cookie; маршрут уже защищён ProtectedRoute.
        const data = await fetchHomePage();
        setUser({
          name: data.user.name,
          progress: data.user.progress.percentage,
          avatar: data.user.avatar || avatar,
          restaurant: data.user.restaurant,
        });
        setAllCourses(data.courses);
      } catch (err) {
        console.error('Ошибка загрузки данных:', err);
        setError('Ошибка загрузки данных');
      }
    };
    loadData();
  }, []);

  // Курс, который сотрудник реально проходит сейчас (не только "почти готов") —
  // берём с наибольшим прогрессом среди незавершённых, это и есть следующий шаг.
  const activeCourse = allCourses
    .filter(c => c.progress > 0 && c.progress < 100)
    .sort((a, b) => b.progress - a.progress)[0];

  // Статичная подсказка на случай, если продолжать нечего (курс ещё не начат).
  // Без авто-ротации: она никогда не должна отвлекать от кнопки "Продолжить".
  const dayTip = new Date().getDate() % 2 === 0
    ? { icon: FiBook, label: 'Совет дня', text: 'Учись по 15 минут в день — и через месяц ты станешь экспертом!' }
    : { icon: FiInfo, label: 'Лайфхак', text: 'Повторяй материал через 24 часа после изучения. Запоминаемость возрастает в 2 раза.' };

  return (
    <div className={styles.dashboard}>

      {/* ── ХЕДЕР (градиент с переходом в белый) ───────────────── */}
      <div className={styles.headerBackground}></div>
      <div className={styles.header}>
        <img src={user ? user.avatar : avatar} alt="Avatar" className={styles.profileAvatar} />
        <div className={styles.profileInfo}>
          <h2 className={styles.profileName}>{user ? user.name : '...'}</h2>
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
        <button className={styles.notificationButton} onClick={() => navigate('/notifications')}>
          <FiBell size={24} color="var(--color-on-primary)" />
        </button>
      </div>

      {/* ── КОНТЕНТ ─────────────────────────────── */}
      <div className={styles.content}>

        {/* Приоритетный блок: продолжить обучение (статично, без ротации —
            это единственное реальное действие на экране, оно не должно
            конкурировать за внимание со случайными подсказками). */}
        <div className={styles.banner}>
          <img src={illustration} alt="Illustration" className={styles.bannerIllustration} />

          <div className={styles.slideContent}>
            {activeCourse ? (
              <div
                className={styles.bannerCourseCard}
                onClick={() => navigate(`/course/${activeCourse.id}`)}
              >
                {activeCourse.image && (
                  <div className={styles.bannerCourseImg}>
                    <img src={activeCourse.image} alt={activeCourse.title} />
                  </div>
                )}
                <div className={styles.bannerCourseInfo}>
                  <p className={styles.bannerCourseTitle}>{activeCourse.title}</p>
                  <span className={styles.bannerCoursePct}>{activeCourse.progress}%</span>
                  <div className={styles.bannerCourseBar}>
                    <div className={styles.bannerCourseFill} style={{ width: `${activeCourse.progress}%` }} />
                  </div>
                  <button className={styles.bannerContinueBtn}>
                    Продолжить учиться <span className={styles.playIcon}>▶</span>
                  </button>
                </div>
              </div>
            ) : (() => {
              const TipIcon = dayTip.icon;
              return (
                <div className={styles.infoSlide}>
                  <div className={styles.infoSlideEmoji}>
                    <TipIcon size={22} aria-hidden="true" />
                  </div>
                  <div>
                    <span className={styles.infoSlideLabel}>{dayTip.label}</span>
                    <p className={styles.infoSlideText}>{dayTip.text}</p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Прогресс-карточка (ПОД банером) — реальный % по всем курсам,
            без выдуманных "минут из 60" */}
        {user && (
          <div className={styles.progressCard}>
            <span className={styles.progressLabel}>Прогресс обучения</span>
            <div className={styles.progressTime}>
              <span className={styles.progressDone}>{user.progress}%</span>
              <span className={styles.progressTotal}>выполнено</span>
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${user.progress}%` }} />
            </div>
          </div>
        )}

        {/* Мои курсы */}
        <div className={styles.courseSection}>
          <h2 className={styles.sectionTitle}>Мои курсы</h2>
          {error ? (
            <p className={styles.error}>{error}</p>
          ) : (
            <div className={styles.coursesGrid}>
              {allCourses.map(course => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>

      </div>

      <Navbar />
    </div>
  );
};

export default Dashboard;