import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ResetPassword.module.css';
import { motion } from 'framer-motion';
import { FiArrowLeft } from 'react-icons/fi';
import translations from '../../i18n/translations';
import { resetPasswordRequest } from '../../services/api';

const ResetPassword = () => {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const lang = localStorage.getItem('lang') || 'ru';
  const t = translations[lang];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await resetPasswordRequest(emailOrPhone);
      alert(t.instructionsSent);
      navigate(`/verify-code?email=${encodeURIComponent(emailOrPhone)}&lang=${lang}`); // Передаём email через URL
    } catch (err) {
      setError(err.message || t.errorServer);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
    >
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header} onClick={handleGoBack}>
            <button className={styles.backButton}>
              <FiArrowLeft size={24} className={styles.reset_icons} color="#006ffd" />
            </button>
            <h2 className={styles.title}>
              {t.resetPassword}
            </h2>
          </div>

          <p className={styles.description}>{t.resetPasswordDesc}</p>

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder={t.emailOrPhone}
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              required
              className={styles.input}
            />
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" className={styles.button}>
              {t.continue}
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
};

export default ResetPassword;
