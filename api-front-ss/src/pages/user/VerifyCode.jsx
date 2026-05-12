import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './VerifyCode.module.css';
import { motion } from 'framer-motion';
import translations from '../../i18n/translations';
import { verifyCode } from '../../services/api';

const VerifyCode = () => {
  const [codeArray, setCode] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation(); // Используется для получения параметров из URL
  const lang = localStorage.getItem('lang') || 'ru';
  const t = translations[lang];

  // Извлечение email из URL
  const email = new URLSearchParams(location.search).get('email');

  useEffect(() => {
    const countdown = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(countdown);
  }, []);

  const handleChange = (value, index) => {
    if (isNaN(value)) return;
    const newCode = [...codeArray];
    newCode[index] = value.slice(-1); // берём только 1 символ
    setCode(newCode);
    if (value && index < 3) {
      document.getElementById(`code-${index + 1}`).focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const code = codeArray.join(''); // Переименовали переменную, чтобы использовать "code"
    if (code.length < 4) {
      setError('Введите 4-значный код');
      return;
    }
  
    try {
      console.log('Отправляем запрос с данными:', { email, code }); // Отправляем "code"
      const response = await verifyCode(email, code); // Передаём "code" в запрос
      console.log('Ответ от сервера:', response);
      localStorage.setItem('token', response.token);
      localStorage.setItem('role', response.role);
      alert(t.codeConfirmed);
      navigate('/change-password'); // Перенаправляем на главную страницу
    } catch (err) {
      console.error('Ошибка верификации:', err);
      setError(err.message || t.errorCode);
    }
  };
  

  const handleResend = () => {
    setTimer(60);
    // Здесь вызовите ваш API заново, если нужно
    alert(t.resendCode);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
    >
      <div className={styles.container}>
        <h2 className={styles.title}>{t.enterCode}</h2>
        <p className={styles.description}>
          {t.codeSentTo} {email}
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.codeContainer}>
            {codeArray.map((digit, index) => (
              <input
                key={index}
                id={`code-${index}`}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(e.target.value, index)}
                className={styles.input}
              />
            ))}
          </div>

          {timer > 0 ? (
            <p className={styles.timer}>
              {t.youCanResend} {timer}{' '}
              {lang === 'ru' ? 'секунд' : 'seconds'}
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className={styles.resendButton}
            >
              {t.resendCode}
            </button>
          )}

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.button}>
            {t.continue}
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default VerifyCode;
