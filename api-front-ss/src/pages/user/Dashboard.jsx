import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/user/Navbar';
import CourseCard from '../../components/user/CourseCard';
import { fetchHomePage } from '../../services/api';
import styles from './Dashboard.module.css';
import avatar from '../../assets/images/default-avatar.svg';
import { FiBell } from 'react-icons/fi';
import illustration from '../../assets/images/illustration.svg';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [allCourses, setAllCourses] = useState([]);
  const [error, setError] = useState('');
  const [slide, setSlide] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Токен отсутствует');
        const data = await fetchHomePage(token);
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

  // Автопрокрутка карусели
  useEffect(() => {
    const timer = setInterval(() => {
      setSlide(prev => (prev + 1) % 5);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const nearlyDoneCourse = allCourses.find(c => c.progress > 85 && c.progress < 100);
  const totalMin = 60;
  const doneMin = user ? Math.round((user.progress / 100) * totalMin) : 0;

  // Слайды карусели
  const slides = [
    // Слайд 0: Курс в процессе (если есть)
    nearlyDoneCourse ? {
      type: 'course',
      data: nearlyDoneCourse,
    } : {
      type: 'tip',
      emoji: '📚',
      label: 'Совет дня',
      text: 'Учись по 15 минут в день — и через месяц ты станешь экспертом!',
    },
    // Слайд 1: Совет дня
    {
      type: 'tip',
      emoji: '💡',
      label: 'Лайфхак',
      text: 'Повторяй материал через 24 часа после изучения. Запоминаемость возрастает в 2 раза.',
    },
    // Слайд 2: Достижение
    {
      type: 'achievement',
      emoji: '🏆',
      label: 'Твоё достижение',
      text: 'Ты прошёл 3 курса за этот месяц. Отличный результат!',
    },
    // Слайд 3: Напоминание
    {
      type: 'reminder',
      emoji: '⏰',
      label: 'Напоминание',
      text: 'Не забудь пройти итоговый тест по стандартам сервировки.',
    },
    // Слайд 4: Рейтинг
    {
      type: 'rating',
      emoji: '📊',
      label: 'Рейтинг команды',
      text: 'Ты на 3 месте среди всех сотрудников. До 2 места — ещё 2 курса!',
    },
  ];

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
          <FiBell size={24} color="#fff" />
        </button>
      </div>

      {/* ── КОНТЕНТ ─────────────────────────────── */}
      <div className={styles.content}>

        {/* Умный Банер / Карусель */}
        <div className={styles.banner}>
          <img src={illustration} alt="Illustration" className={styles.bannerIllustration} />

          {/* Контент текущего слайда */}
          <div className={styles.slideContent}>
            {slides[slide].type === 'course' && (
              <div
                className={styles.bannerCourseCard}
                onClick={() => navigate(`/course/${slides[slide].data.id}`)}
              >
                {slides[slide].data.image && (
                  <div className={styles.bannerCourseImg}>
                    <img
                      src={slides[slide].data.image}
                      alt={slides[slide].data.title}
                    />
                  </div>
                )}
                <div className={styles.bannerCourseInfo}>
                  <p className={styles.bannerCourseTitle}>{slides[slide].data.title}</p>
                  <span className={styles.bannerCoursePct}>{slides[slide].data.progress}%</span>
                  <div className={styles.bannerCourseBar}>
                    <div className={styles.bannerCourseFill} style={{ width: `${slides[slide].data.progress}%` }} />
                  </div>
                  <button className={styles.bannerContinueBtn}>
                    Продолжить учиться <span className={styles.playIcon}>▶</span>
                  </button>
                </div>
              </div>
            )}
            {slides[slide].type !== 'course' && (
              <div className={styles.infoSlide}>
                <div className={styles.infoSlideEmoji}>{slides[slide].emoji}</div>
                <div>
                  <span className={styles.infoSlideLabel}>{slides[slide].label}</span>
                  <p className={styles.infoSlideText}>{slides[slide].text}</p>
                </div>
              </div>
            )}
          </div>

          {/* Кликабельные точки пагинации */}
          <div className={styles.paginationDots}>
            {slides.map((_, i) => (
              <span
                key={i}
                className={i === slide ? styles.dotActive : styles.dot}
                onClick={() => setSlide(i)}
              />
            ))}
          </div>
        </div>

        {/* Прогресс-карточка (ПОД банером) */}
        {user && (
          <div className={styles.progressCard}>
            <span className={styles.progressLabel}>Прогресс</span>
            <div className={styles.progressTime}>
              <span className={styles.progressDone}>{doneMin}мин</span>
              <span className={styles.progressTotal}>/ {totalMin}мин</span>
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