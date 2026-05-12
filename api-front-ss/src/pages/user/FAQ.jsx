import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './FAQ.module.css';
import { FiArrowLeft, FiChevronRight } from 'react-icons/fi';

const FAQ = () => {
  const navigate = useNavigate();
  const [faqs, setFaqs] = useState([]);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const response = await fetch('/user/profile/faq/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`, // Добавляем токен из localStorage
          },
        });

        if (!response.ok) {
          throw new Error('Ошибка загрузки данных');
        }

        const data = await response.json();
        setFaqs(data);
      } catch (error) {
        console.error('Ошибка при загрузке FAQ:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFaqs();
  }, []);

  const handleBackClick = () => {
    navigate(-1); // Возвращение на предыдущую страницу
  };

  const toggleQuestion = (id) => {
    setActiveQuestion((prev) => (prev === id ? null : id));
  };

  if (loading) {
    return <p className={styles.loading}>Загрузка...</p>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={handleBackClick} className={styles.backButton}>
          <FiArrowLeft size={24} color="#fff" />
        </button>
        <h3 className={styles.title} onClick={handleBackClick}>
          FAQ
        </h3>
      </div>
      <div className={styles.faqList}>
        {faqs.map((faq) => (
          <div key={faq.id} className={styles.faqItem}>
            <div
              className={styles.question}
              onClick={() => toggleQuestion(faq.id)}
            >
              <span>{faq.question}</span>
              <FiChevronRight
                size={24}
                className={`${styles.arrow} ${
                  activeQuestion === faq.id ? styles.rotatedArrow : ''
                }`}
              />
            </div>
            {activeQuestion === faq.id && (
              <div className={styles.answer}>{faq.answer}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQ;
