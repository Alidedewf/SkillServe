import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './FAQ.module.css';
import { FiArrowLeft, FiChevronDown } from 'react-icons/fi';

const FAQS = [
  {
    id: 1,
    question: 'Как начать курс?',
    answer: 'Перейдите в раздел «Курсы», выберите нужный курс и нажмите кнопку «Начать обучение». Система сохраняет ваш прогресс автоматически.',
  },
  {
    id: 2,
    question: 'Как сдать тест?',
    answer: 'После прохождения всех уроков курса откроется тест. Выберите правильные ответы и нажмите «Завершить тест». Результат появится сразу.',
  },
  {
    id: 3,
    question: 'Как изменить язык интерфейса?',
    answer: 'Перейдите в «Профиль» → «Редактировать профиль» и выберите нужный язык в поле «Язык». Изменения применяются сразу.',
  },
  {
    id: 4,
    question: 'Что такое XP и рейтинг?',
    answer: 'XP (опыт) начисляется за прохождение тестов. Чем правильнее вы отвечаете, тем больше очков. Рейтинг показывает лучших сотрудников вашего заведения.',
  },
  {
    id: 5,
    question: 'Где посмотреть меню заведения?',
    answer: 'Раздел «Меню» в нижней навигации. Там доступны категории блюд и напитков, а также PDF-версия официального меню, если она загружена.',
  },
  {
    id: 6,
    question: 'Как получить сертификат?',
    answer: 'Сертификат выдаётся автоматически после успешного прохождения курса (все уроки + тест). Посмотреть их можно в разделе «Профиль» → «Сертификаты».',
  },
  {
    id: 7,
    question: 'Как связаться с администратором?',
    answer: 'Обратитесь к вашему менеджеру или администратору заведения. В приложении встроенного чата нет.',
  },
];

const FAQ = () => {
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState(null);

  const toggle = (id) => setActiveId((prev) => (prev === id ? null : id));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => navigate(-1)} className={styles.backButton}>
          <FiArrowLeft size={24} color="#fff" />
        </button>
        <h3 className={styles.title}>FAQ</h3>
      </div>

      <div className={styles.faqList}>
        {FAQS.map((faq) => (
          <div key={faq.id} className={styles.faqItem}>
            <div className={styles.question} onClick={() => toggle(faq.id)}>
              <span>{faq.question}</span>
              <FiChevronDown
                size={20}
                className={`${styles.arrow} ${activeId === faq.id ? styles.rotatedArrow : ''}`}
              />
            </div>
            {activeId === faq.id && (
              <div className={styles.answer}>{faq.answer}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQ;
