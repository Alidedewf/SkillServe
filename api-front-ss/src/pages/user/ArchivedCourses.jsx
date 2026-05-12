// src/pages/ArchivedCourses.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ArchivedCourses.module.css';
import Navbar from '../../components/user/Navbar';
import { FiArchive } from 'react-icons/fi';

const ArchivedCourses = () => {
  const [archivedCourses, setArchivedCourses] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchArchivedCourses = async () => {
      try {
        const response = await fetch('http://2.56.126.51:8080/course/archive'); // Замените на реальный URL
        const data = await response.json();
        setArchivedCourses(data);
      } catch (err) {
        setError('Ошибка загрузки архивных курсов');
      }
    };

    fetchArchivedCourses();
  }, []);

  const handleRestoreRequest = (courseId) => {
    console.log(`Запрос на восстановление курса с ID: ${courseId}`);
    // Здесь будет вызов API для запроса на восстановление
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.header}>
        <FiArchive size={24} className={styles.reset_icons} />
        <button onClick={() => navigate(-1)} className={styles.backButton}>
          Назад
        </button>
        </div>
        <h1 className={styles.title}>Архивные курсы</h1>
      </div>
      <div className={styles.courseList}>
        {error && <p className={styles.error}>{error}</p>}
        {archivedCourses.map((course) => (
          <div key={course.id} className={styles.courseCard}>
            <img src={course.image} alt={course.title} className={styles.courseImage} />
            <div className={styles.courseContent}>
              <h3 className={styles.courseTitle}>{course.title}</h3>
              <div className={styles.progressContainer}>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progress}
                    style={{ width: `${course.progress}%` }}
                  ></div>
                </div>
                <span className={styles.progressText}>{course.progress}%</span>
              </div>
              <button
                className={styles.restoreButton}
                onClick={() => handleRestoreRequest(course.id)}
              >
                Запрос на восстановление
              </button>
            </div>
          </div>
        ))}
      </div>
      <Navbar />
    </div>
  );
};

export default ArchivedCourses;
