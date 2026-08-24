import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './Login.module.css';
import logo from '../../assets/images/skillserve2.svg';
import { motion } from 'framer-motion';
import { loginUser } from '../../services/api';
import { setAuth } from '../../services/adminApi';
import translations from '../../i18n/translations';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [language, setLanguage] = useState('ru');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const langParam = params.get('lang') || localStorage.getItem('lang') || 'ru';
    setLanguage(langParam);
    localStorage.setItem('lang', langParam);
  }, [location]);

  const t = translations[language];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await loginUser(email, password);
      // Токен пришёл в httpOnly-cookie; в localStorage кладём только claims для гвардов.
      setAuth(data.user, data.expiresAt);

      if (data.user.role === 'SUPER_ADMIN') {
        navigate('/superadmin');
      } else if (data.user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate(`/home?lang=${language}`);
      }
    } catch (err) {
      console.error('[Login Error]', err);
      setError(err.message || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
    >
      <div className={styles.container}>
        <div className={styles.card}>
          <img src={logo} alt="SS Logo" className={styles.logo} />
          <h2 className={styles.title}>{t.login}</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder={t.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.input}
            />
            <input
              type="password"
              placeholder={t.password}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.input}
            />
            {error && <p className={styles.error}>{error}</p>}

            <button type="submit" className={styles.button}>
              {t.continue}
            </button>
            <p
              className={styles.forgotPassword}
              onClick={() => navigate('/reset-password')}
            >
              {t.forgotPasswordQuestion}
            </p>
          </form>
        </div>
      </div>
    </motion.div>
  );
};

export default Login;