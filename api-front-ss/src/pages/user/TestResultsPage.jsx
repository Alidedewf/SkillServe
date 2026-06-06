import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import styles from './TestResultsPage.module.css';
import icon from '../../assets/images/image.svg';

const TestResultsPage = () => {
  const { state: results } = useLocation();
  const { courseID, testID } = useParams();
  const navigate = useNavigate();
  const lang = localStorage.getItem('lang') || 'ru';

  if (!results) {
    return <p className={styles.error}>Нет данных о результатах теста.</p>;
  }

  const { correct_count, total_questions, coins, ranking } = results;

  // Рассчитываем успешность сдачи теста (проходной балл 70% на бэкенде)
  const scorePct = total_questions > 0 ? (correct_count / total_questions) * 100 : 0;
  const isPassed = scorePct >= 70;

  const handleClose = () => {
    navigate(`/course/${courseID}`);
  };

  const handleActionClick = () => {
    if (isPassed) {
      navigate('/home');
    } else {
      navigate(`/course/${courseID}/test/${testID}`);
    }
  };

  // Тексты в зависимости от языка
  const texts = {
    ru: {
      passedTitle: 'Тест успешно пройден!',
      failedTitle: 'Тест не пройден',
      passedDesc: 'Поздравляем! Вы успешно завершили обучение по данному курсу.',
      failedDesc: `Необходимо набрать минимум 70% верных ответов (минимум ${Math.ceil(total_questions * 0.7)} из ${total_questions}).`,
      tryAgain: 'Попробовать снова',
      goHome: 'На главную',
      coinsReceived: 'Монет получено',
      ratingPlace: 'Место в рейтинге',
    },
    kz: {
      passedTitle: 'Тест сәтті өтті!',
      failedTitle: 'Тест тапсырылмады',
      passedDesc: 'Құттықтаймыз! Сіз осы курс бойынша оқуды сәтті аяқтадыңыз.',
      failedDesc: `Сұрақтардың кем дегенде 70% дұрыс жауап беру керек (кем дегенде ${Math.ceil(total_questions * 0.7)} сұраққа дұрыс).`,
      tryAgain: 'Қайтадан байқап көру',
      goHome: 'Басты бетке',
      coinsReceived: 'Монеталар алынды',
      ratingPlace: 'Рейтингтегі орны',
    }
  };

  const t = texts[lang] || texts.ru;

  return (
    <div className={styles.container}>
      <button className={styles.closeButton} onClick={handleClose}>
        ✕
      </button>
      <div className={styles.header}>
        <div className={styles.progressBar}>
          <div className={styles.progressText}>
            {correct_count}/{total_questions} {lang === 'kz' ? 'сұрақ' : 'вопросов'}
          </div>
          <div className={styles.timer}>{Math.round(scorePct)}%</div>
        </div>
        <div className={styles.medal}>
          <img
            src={icon}
            alt="Medal"
            className={`${styles.medalImage} ${!isPassed ? styles.grayMedal : ''}`}
          />
        </div>
        <h2 className={styles.resultTitle}>
          {isPassed ? t.passedTitle : t.failedTitle}
        </h2>
        <p className={styles.subText}>
          {isPassed ? t.passedDesc : t.failedDesc}
        </p>
      </div>

      {isPassed && (
        <div className={styles.statistics}>
          <div className={styles.statItem}>
            <span>{t.coinsReceived}</span>
            <strong>+{coins || 0}</strong>
          </div>
          <div className={styles.statItem}>
            <span>{t.ratingPlace}</span>
            <strong>{ranking || '-'}</strong>
          </div>
        </div>
      )}

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

      <button className={styles.retryButton} onClick={handleActionClick}>
        {isPassed ? t.goHome : t.tryAgain}
      </button>
    </div>
  );
};

export default TestResultsPage;
