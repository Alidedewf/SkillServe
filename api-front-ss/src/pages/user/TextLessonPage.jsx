import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './TextLessonPage.module.css';
import { FiArrowLeft } from 'react-icons/fi';

const TextLessonPage = () => {
  const { lessonId } = useParams(); // Получение id урока из URL
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Заглушка для урока
    const fetchLesson = async () => {
      const mockLesson = {
        id: '908403f2-4e94-488d-9a94-09e1f2d0cc04',
        title: 'Работа в команде',
        blocks: [
          {
            order: 1,
            type: 'text',
            content: 'Основные роли в бригадной системе...',
          },
        ],
      }; // Пример данных
      setLesson(mockLesson);
      setLoading(false);
    };

    fetchLesson();
  }, [lessonId]);

  if (loading) {
    return <p>Загрузка...</p>;
  }

   return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => navigate(-1)} className={styles.backButton}>
          <FiArrowLeft size={20} />
          Назад
        </button>
      </div>
      <h1 className={styles.title}>{lesson.title}</h1>
      <div className={styles.content}>
        <div className={styles.textBlock}>
          <h3>Основной текст:</h3>
          <p>{lesson.content}</p>
        </div>
      </div>
    </div>
  );
};


export default TextLessonPage;
