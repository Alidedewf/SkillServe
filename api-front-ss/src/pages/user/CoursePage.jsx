import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './CoursePage.module.css';
import { FiArrowLeft } from 'react-icons/fi';
import { fetchCourseName, fetchLessons, fetchTests } from '../../services/api';

const CoursePage = () => {
  const navigate = useNavigate();
  const { id: courseID } = useParams(); // Получение id курса из URL
  const [courseName, setCourseName] = useState('');
  const [lessons, setLessons] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      } catch (err) {
        setError('Ошибка загрузки данных');
        console.error('Ошибка загрузки курса:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [courseID]);

  const handleBackClick = () => {
    navigate(-1); // Возвращение на предыдущую страницу
  };

  if (loading) {
    return <p className={styles.loading}>Загрузка...</p>;
  }

  if (error) {
    return <p className={styles.error}>{error}</p>;
  }

  return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button onClick={handleBackClick} className={styles.backButton}>
            <FiArrowLeft size={20} className={styles.icon} />
            <span className={styles.header_title}>Назад</span>
          </button>
        </div>
        <h1 className={styles.courseName}>{courseName}</h1>

        {/* Уроки */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Уроки</h3>
          <div className={styles.lessonList}>
            {lessons.map((lesson) => (
                <div key={lesson.id} className={styles.lessonCard}>
                  <div className={styles.orderCircle}>{lesson.order}</div>
                  <div className={styles.lessonInfo}>
                    <h3 className={styles.lessonTitle}>{lesson.title}</h3>
                    <p className={styles.lessonType}>
                      Тип: {lesson.type === 'video' ? 'Видео' : 'Текст'}
                    </p>
                  </div>
                </div>
            ))}
          </div>
        </div>

        {/* Тесты */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Тесты</h3>
          <div className={styles.testList}>
            {tests.map((test) => (
                <div key={test.id} className={styles.testCard}>
                  <div className={styles.orderCircle}>★</div>
                  <div className={styles.testInfo}>
                    <h3 className={styles.testTitle}>{test.title}</h3>
                    <p className={styles.testScore}>
                      Баллы: {test.score.current}/{test.score.max}
                    </p>
                  </div>
                </div>
            ))}
          </div>
        </div>
      </div>
  );
};

export default CoursePage;