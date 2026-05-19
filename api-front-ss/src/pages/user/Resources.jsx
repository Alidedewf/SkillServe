import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/user/Navbar';
import { fetchRating, fetchAchievements, fetchMyAchievements, fetchAchievementIcons } from '../../services/api';
import styles from './Resources.module.css';

const Resources = () => {
  const navigate = useNavigate();
  const [topUsers, setTopUsers] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [myAchievements, setMyAchievements] = useState([]);
  const [icons, setIcons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [ratingRes, achs, myAchs, iconsData] = await Promise.all([
          fetchRating(),
          fetchAchievements().catch(() => []),
          fetchMyAchievements().catch(() => []),
          fetchAchievementIcons().catch(() => [])
        ]);
        
        // Берем только топ-2 для превью
        const top2 = ratingRes.leaderboard.filter(u => u.rank <= 2).sort((a, b) => a.rank - b.rank);
        setTopUsers(top2);
        setAchievements(achs);
        setMyAchievements(myAchs);
        setIcons(iconsData);
      } catch (err) {
        console.error('Ошибка загрузки рейтинга', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const resolveIconUrl = (imgId) => {
    const found = icons.find(i => i.id === imgId);
    return found ? found.url : '';
  };

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
            {achievements.length === 0 ? (
              <p className={styles.emptyText}>Достижения скоро появятся</p>
            ) : (
              achievements.map((ach) => {
                const isEarned = myAchievements.some(ma => ma.id === ach.id);
                const imgSrc = resolveIconUrl(ach.image_url);
                return (
                  <div 
                    key={ach.id} 
                    className={`${styles.achievementCard} ${!isEarned ? styles.locked : ''}`}
                    title={ach.title + (ach.description ? ` - ${ach.description}` : '') + (!isEarned ? ' (Заблокировано)' : '')}
                  >
                    <img src={imgSrc} alt={ach.title} />
                  </div>
                );
              })
            )}
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
