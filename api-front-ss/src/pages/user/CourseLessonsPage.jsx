import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import OrderCircle from '../../components/user/OrderCircle'; 
import styles from './CourseLessonsPage.module.css';
import { FiPlayCircle, FiFileText, FiClock, FiArrowLeft } from 'react-icons/fi';
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
    navigate(`/course/${courseID}/lessons/${lesson.id}`); // Переход на страницу урока
  };

  const handleTestClick = (testId) => {
    navigate(`/course/${courseID}/test/${testId}`); // Переход на страницу теста
  };

  if (loading) {
    return <p className={styles.loading}>Загрузка...</p>;
  }

  return (
      <div className={styles.container}>
        <button onClick={() => navigate(-1)} className={styles.backButton}>
          <FiArrowLeft size={20} /> Назад
        </button>
        <h1 className={styles.courseName}>{courseName}</h1>

        {/* Уроки */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Уроки курса</h3>
          <div className={styles.lessonList}>
            {lessons.map((lesson) => (
                <div
                    key={lesson.id}
                    className={styles.lessonCard}
                    onClick={() => handleLessonClick(lesson)}
                >
                  <OrderCircle order={lesson.order} />
                  <div className={styles.lessonInfo}>
                    <h3 className={styles.lessonTitle}>{lesson.title}</h3>
                    <div className={styles.lessonClock}>
                      <FiClock className={styles.clockIcon} size={16} color="#71727A" />
                      <p className={styles.lessonType}>
                        {lesson.type === 'video' ? '10 мин' : '15 минут чтения'}
                      </p>
                    </div>
                  </div>
                  <div className={styles.iconContainer}>
                    {lesson.type === 'video' ? (
                        <FiPlayCircle className={styles.playIcon} size={24} color="#006ffd" />
                    ) : (
                        <FiFileText className={styles.documentIcon} size={24} color="#006ffd" />
                    )}
                  </div>
                </div>
            ))}
          </div>
        </div>

        {/* Тесты */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Тестовое задание/Практика</h3>
          <div className={styles.lessonList}>
            {tests.map((test) => (
                <div
                    key={test.id}
                    className={styles.lessonCard}
                    onClick={() => handleTestClick(test.id)}
                >
                  <OrderCircle order="🗒" /> 
                  <div className={styles.lessonInfo}>
                    <h3 className={styles.lessonTitle}>{test.title}</h3>
                    <p className={styles.lessonType}>
                      Баллы: {test.score.current}/{test.score.max}
                    </p>
                  </div>
                  <div className={styles.iconContainer}>
                    <FiPlayCircle size={24} color="#006ffd" />
                  </div>
                </div>
            ))}
          </div>
        </div>
      </div>
  );
};

export default CourseLessonsPage;