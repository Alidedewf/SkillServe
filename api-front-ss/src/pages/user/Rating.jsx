import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX } from 'react-icons/fi';
import styles from './Rating.module.css';
import { fetchRating } from '../../services/api';
import Navbar from '../../components/user/Navbar';


const Rating = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await fetchRating();
        setData(result);
      } catch (err) {
        console.error('Ошибка загрузки рейтинга', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleClose = () => {
    navigate(-1);
  };

  if (loading || !data) {
    return <div className={styles.loading}>Загрузка рейтинга...</div>;
  }

  const { currentUserInfo, leaderboard } = data;

  // Извлекаем топ 3 для подиума
  const top1 = leaderboard.find(u => u.rank === 1);
  const top2 = leaderboard.find(u => u.rank === 2);
  const top3 = leaderboard.find(u => u.rank === 3);

  // Остальные
  const others = leaderboard.filter(u => u.rank > 3);

  return (
    <div className={styles.container}>
      {/* ── ХЕДЕР ──────────────────────────────────────── */}
      <div className={styles.header}>
        <button className={styles.closeButton} onClick={handleClose}>
          <FiX size={28} color="#fff" />
        </button>
        <h1 className={styles.title}>Рейтинг</h1>
      </div>

      <div className={styles.content}>
        {/* Блок с информацией о текущем игроке */}
        {currentUserInfo && (
          <div className={styles.infoCard}>
            <div className={styles.infoRankBadge}>#{currentUserInfo.rank}</div>
            <p className={styles.infoMessage}>{currentUserInfo.message}</p>
          </div>
        )}

        {/* ── ПОДИУМ (Топ-3) ───────────────────────────── */}
        <div className={styles.podiumContainer}>
          
          {/* ВТОРОЕ МЕСТО */}
          {top2 && (
            <div className={`${styles.podiumItem} ${styles.secondPlace}`}>
              <div className={styles.avatarWrapper}>
                <div className={styles.xpBadge}>{top2.xp} XP</div>
                <img src={top2.photo} alt={top2.name} className={styles.avatar} />
                <div className={styles.silverMedal}></div>
              </div>
              <p className={styles.winnerName}>{top2.name}</p>
              <div className={styles.podiumColumn}>
                <span className={styles.podiumNumber}>2</span>
              </div>
            </div>
          )}

          {/* ПЕРВОЕ МЕСТО */}
          {top1 && (
            <div className={`${styles.podiumItem} ${styles.firstPlace}`}>
              <div className={styles.avatarWrapper}>
                <div className={styles.xpBadgeGold}>{top1.xp} XP</div>
                <img src={top1.photo} alt={top1.name} className={styles.avatar} />
                <div className={styles.goldMedal}></div>
              </div>
              <p className={styles.winnerName}>{top1.name}</p>
              <div className={styles.podiumColumn}>
                <span className={styles.podiumNumber}>1</span>
              </div>
            </div>
          )}

          {/* ТРЕТЬЕ МЕСТО */}
          {top3 && (
            <div className={`${styles.podiumItem} ${styles.thirdPlace}`}>
              <div className={styles.avatarWrapper}>
                {/* Бейдж таймера или XP */}
                <div className={styles.xpBadgeBronze}>{top3.xp} XP</div>
                <img src={top3.photo} alt={top3.name} className={styles.avatar} />
                <div className={styles.bronzeMedal}></div>
              </div>
              <p className={styles.winnerName}>{top3.name}</p>
              <div className={styles.podiumColumn}>
                <span className={styles.podiumNumber}>3</span>
              </div>
            </div>
          )}
        </div>

        {/* ── СПИСОК ОСТАЛЬНЫХ ─────────────────────────── */}
        <div className={styles.listContainer}>
          {others.map((user) => (
            <div key={user.id} className={styles.listItem}>
              <div className={styles.listRank}>{user.rank}</div>
              <div className={styles.listAvatar}>
                <img src={user.photo} alt={user.name} />
              </div>
              <div className={styles.listInfo}>
                <h4 className={styles.listName}>{user.name}</h4>
                <p className={styles.listXp}>{user.xp} XP</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Navbar/>
    </div>
  );
};

export default Rating;
