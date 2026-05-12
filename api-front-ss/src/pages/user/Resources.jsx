import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/user/Navbar';
import { fetchRating } from '../../services/api';
import styles from './Resources.module.css';

// Импорт заглушек для достижений
import ach1 from '../../assets/images/achievements/achievement_1_1778142948685.png';
import ach2 from '../../assets/images/achievements/achievement_2_1778142961390.png';
import ach3 from '../../assets/images/achievements/achievement_3_1778142973565.png';
import ach4 from '../../assets/images/achievements/achievement_4_1778142989448.png';

const Resources = () => {
  const navigate = useNavigate();
  const [topUsers, setTopUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await fetchRating();
        // Берем только топ-2 для превью
        const top2 = result.leaderboard.filter(u => u.rank <= 2).sort((a, b) => a.rank - b.rank);
        setTopUsers(top2);
      } catch (err) {
        console.error('Ошибка загрузки рейтинга', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const achievements = [
    { id: 1, image: ach1 },
    { id: 2, image: ach2 },
    { id: 3, image: ach3 },
    { id: 4, image: ach4 },
  ];

  return (
    <div className={styles.container}>
      {/* ── ХЕДЕР С ГРАДИЕНТОМ ────────────────────── */}
      <div className={styles.header}>
        <h1 className={styles.title}>Ресурсы</h1>
      </div>

      <div className={styles.content}>
        
        {/* ── ДОСТИЖЕНИЯ ────────────────────────────── */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Достижения</h2>
            <button className={styles.seeAllBtn}>Все</button>
          </div>
          
          <div className={styles.achievementsScroll}>
            {achievements.map((ach) => (
              <div key={ach.id} className={styles.achievementCard}>
                <img src={ach.image} alt={`Achievement ${ach.id}`} />
              </div>
            ))}
          </div>
        </div>

        {/* ── РЕЙТИНГ (Превью) ──────────────────────── */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Рейтинг</h2>
            <button className={styles.seeAllBtn} onClick={() => navigate('/rating')}>
              Все
            </button>
          </div>

          <div className={styles.ratingBox}>
            {loading ? (
              <p className={styles.loadingText}>Загрузка...</p>
            ) : (
              topUsers.map((user) => (
                <div key={user.id} className={styles.ratingItem}>
                  <div className={styles.rankBadge}>{user.rank}</div>
                  <div className={styles.userAvatar}>
                    <img src={user.photo} alt={user.name} />
                  </div>
                  <div className={styles.userInfo}>
                    <h4 className={styles.userName}>{user.name}</h4>
                    <p className={styles.userXp}>{user.xp} XP</p>
                  </div>
                  {/* Иконка короны (золотая для первого, серебряная для второго) */}
                  <div className={user.rank === 1 ? styles.goldCrown : styles.silverCrown}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5ZM19 19C19 19.5523 18.5523 20 18 20H6C5.44772 20 5 19.5523 5 19V18H19V19Z" />
                    </svg>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      <Navbar />
    </div>
  );
};

export default Resources;
