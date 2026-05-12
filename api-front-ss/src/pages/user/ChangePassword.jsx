import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ChangePassword.module.css';
import { motion } from 'framer-motion';
import translations from '../../i18n/translations';
import { changePassword } from '../../services/api';
import { FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

const ChangePassword = () => {
  const [new_password, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Для переключения видимости пароля
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const lang = localStorage.getItem('lang') || 'ru' || 'kz';
  const t = translations[lang];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (new_password !== confirmPassword) {
      setError(t.passwordMismatch);
      return;
    }

    try {
      await changePassword(new_password); // Отправка нового пароля
      navigate('/home'); // Перенаправляем на страницу home
    } catch (err) {
      setError('err.message || t.errorServer');
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const toggleShowPassword = () => setShowPassword(!showPassword);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
    >
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header} onClick={handleGoBack}>
            <button className={styles.backButton}>{t.back}</button>
          </div>

          <h2 className={styles.title}>{t.changePassword}</h2>

          <form onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
            <span className={styles.icon_lock}>
                <FiLock size={20} color="#71727A" />
            </span>
              <input
                type={showPassword ? 'text' : 'password'} // Переключаем тип поля
                placeholder={t.newPassword || 'Новый пароль'}
                value={new_password}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className={styles.input}
              />
              <span
                className={styles.togglePassword}
                onClick={toggleShowPassword}
              >
                {showPassword ? <FiEye size={20} color="#71727A" /> : <FiEyeOff size={20} color="#71727A" />}
              </span>
            </div>
            <div className={styles.inputGroup}>
            <span className={styles.icon_lock}>
                <FiLock size={20} color="#71727A" />
            </span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={t.confirmNewPassword || "Подтверждение нового пароля"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={styles.input}
              />
            </div>

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

export default ChangePassword;
