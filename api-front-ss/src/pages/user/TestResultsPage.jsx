import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './TestResultsPage.module.css';
import icon from '../../assets/images/image.svg'

const TestResultsPage = () => {
  const { state: results } = useLocation();
  const navigate = useNavigate();

  if (!results) {
    return <p className={styles.error}>Нет данных о результатах теста.</p>;
  }

  const { correct_count, total_questions } = results;

  return (
    <div className={styles.container}>
      <button className={styles.closeButton} onClick={() => navigate(-1)}>
        ✕
      </button>
      <div className={styles.header}>
        <div className={styles.progressBar}>
          <div className={styles.progressText}>
            {correct_count}/{total_questions} вопросов
          </div>
          <div className={styles.timer}>1:00</div>
        </div>
        <div className={styles.medal}>
          <img
            src={icon}
            alt="Medal"
            className={styles.medalImage}
          />
        </div>
        <p className={styles.subText}>
          Необходимо 5 верных ответов
          <br />
          Попробуйте снова
        </p>
      </div>

      <div className={styles.statistics}>
        {/* <div className={styles.statItem}>
          <span>Монет получено</span>
          <strong>{coins}</strong>
        </div> */}
        {/* <div className={styles.statItem}>
          <span>Место в рейтинге</span>
          <strong>{ranking}</strong>
        </div> */}
      </div>

      <div className={styles.questions}>
        {results.test.questions.map((question) => (
          <div
            key={question.id}
            className={`${styles.questionCard} ${
              question.is_correct ? styles.correct : styles.incorrect
            }`}
          >
            <div className={styles.icon}>
              {question.is_correct ? '✔' : '✘'}
            </div>
            <p>{question.content}</p>
          </div>
        ))}
      </div>

      <button className={styles.retryButton} onClick={() => navigate(`/courses`)}>
        Пройти снова
      </button>
    </div>
  );
};

export default TestResultsPage;
