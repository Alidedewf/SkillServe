import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './CourseLessonsPage.module.css';
import { FiPlayCircle, FiFileText, FiClock, FiX, FiStar, FiClipboard, FiCheckCircle } from 'react-icons/fi';
import { fetchCourseName, fetchLessons, fetchTests } from '../../services/api';

const CourseLessonsPage = () => {
  const { id: courseID } = useParams(); 
  const navigate = useNavigate();
  const [courseName, setCourseName] = useState('');
  const [lessons, setLessons] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [courseNameData, lessonsData, testsData] = await Promise.all([
          fetchCourseName(courseID),
          fetchLessons(courseID),
          fetchTests(courseID),
        ]);

        setCourseName(courseNameData.course_name);
        setLessons(lessonsData);
        setTests(testsData);
      } catch (error) {
        console.error('Ошибка загрузки данных курса:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [courseID]);

  const handleLessonClick = (lesson) => {
    navigate(`/course/${courseID}/lessons/${lesson.id}`);
  };

  const handleTestClick = (testId) => {
    navigate(`/course/${courseID}/test/${testId}`);
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button onClick={() => navigate('/courses')} className={styles.closeBtn}>
            <FiX size={24} />
          </button>
          <div className={styles.skeletonTitle}></div>
        </div>
        <div className={styles.content}>
          <div className={styles.skeletonSectionTitle}></div>
          <div className={styles.cardGroup}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={styles.skeletonCard}>
                <div className={styles.skeletonCircle}></div>
                <div className={styles.skeletonInfo}>
                  <div className={styles.skeletonLine}></div>
                  <div className={styles.skeletonLineSm}></div>
                </div>
                <div className={styles.skeletonIcon}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* ─── Dark Header ──────────────────────────────────────── */}
      <div className={styles.header}>
        <button onClick={() => navigate('/courses')} className={styles.closeBtn}>
          <FiX size={24} />
        </button>
        <h1 className={styles.courseTitle}>{courseName}</h1>
      </div>

      {/* ─── Content ──────────────────────────────────────────── */}
      <div className={styles.content}>

        {/* Уроки */}
        <h3 className={styles.sectionTitle}>Уроки курса</h3>
        <div className={styles.cardGroup}>
          {lessons.map((lesson, i) => (
            <div
              key={lesson.id}
              className={`${styles.card} ${lesson.is_completed ? styles.cardCompleted : ''}`}
              onClick={() => handleLessonClick(lesson)}
            >
              <div className={lesson.is_completed ? styles.orderCircleCompleted : styles.orderCircle}>
                {lesson.is_completed ? <FiCheckCircle size={20} /> : String(i + 1).padStart(2, '0')}
              </div>
              <div className={styles.cardInfo}>
                <h4 className={styles.cardTitle}>{lesson.title}</h4>
                <div className={styles.cardMeta}>
                  {lesson.is_completed ? (
                    <><FiCheckCircle size={14} color="#10b981" /><span style={{color:'#10b981'}}>Пройден</span></>
                  ) : (
                    <><FiClock size={14} color="#8E8E93" /><span>{lesson.type === 'video' ? '10 мин' : '15 мин чтения'}</span></>
                  )}
                </div>
              </div>
              <div className={styles.cardAction}>
                {lesson.is_completed ? (
                  <FiCheckCircle size={28} color="#10b981" />
                ) : lesson.type === 'video' ? (
                  <FiPlayCircle size={28} />
                ) : (
                  <FiFileText size={28} />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Тесты */}
        {tests.length > 0 && (
          <>
            <h3 className={styles.sectionTitle}>Тестовое задание/Практика</h3>
            <div className={styles.cardGroup}>
              {tests.map((test) => (
                <div
                  key={test.id}
                  className={styles.card}
                  onClick={() => handleTestClick(test.id)}
                >
                  <div className={styles.testCircle}>
                    <FiClipboard size={20} />
                  </div>
                  <div className={styles.cardInfo}>
                    <h4 className={styles.cardTitle}>{test.title}</h4>
                    <div className={styles.cardMeta}>
                      <FiStar size={14} color="#8E8E93" />
                      <span>{test.score?.current || 0}/{test.score?.max || 0} баллов</span>
                    </div>
                  </div>
                  <div className={styles.cardAction}>
                    <FiPlayCircle size={28} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CourseLessonsPage;