import React from 'react';
import { useNavigate } from 'react-router-dom'; 
import styles from './CourseCard.module.css';
import { FiPlayCircle } from 'react-icons/fi';

const CourseCard = ({ course }) => {
  const navigate = useNavigate(); 

  const handleContinueCourse = () => {
    navigate(`/course/${course.id}`); 
  };

  return (
    <div className={styles.card}>
      <div className={styles.imageContainer}>
        <img src={course.image} alt={course.title} className={styles.image} />
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{course.title}</h3>
        <span className={styles.progress_span}>{course.progress}%</span>
        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div
              className={styles.progress}
              style={{ width: `${course.progress}%` }}
            ></div>
          </div>
        </div>
        <button className={styles.linkButton} onClick={handleContinueCourse}>
          <FiPlayCircle size={20} className={styles.icon} />
          Продолжить учиться
        </button>
      </div>
    </div>
  );
};

export default CourseCard;
