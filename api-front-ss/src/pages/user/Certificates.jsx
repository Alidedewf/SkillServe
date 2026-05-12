import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Certificates.module.css';
import { FiArrowLeft } from 'react-icons/fi';

const Certificates = () => {
  const navigate = useNavigate();

  const handleBackClick = () => {
    navigate(-1); // Возвращение на предыдущую страницу
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={handleBackClick} className={styles.backButton}>
          <FiArrowLeft size={24} color="#fff" />
        </button>
        <h3 className={styles.title} onClick={handleBackClick} >Сертификаты</h3>
      </div>
      <div className={styles.messageContainer}>
        <p className={styles.message}>Пройдите курсы для получения сертификата</p>
      </div>
    </div>
  );
};

export default Certificates;
