import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import styles from './NotFound.module.css';
import translations from '../../i18n/translations';

const NotFound = () => {
  const navigate = useNavigate();
  const lang = localStorage.getItem('lang') || 'ru';
  const t = translations[lang] || translations.ru;

  return (
    <div className={styles.container}>
      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className={styles.glow}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        <motion.h1 
          className={styles.errorCode}
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          404
        </motion.h1>
        
        <h2 className={styles.title}>{t.notFoundTitle}</h2>
        <p className={styles.description}>{t.notFoundDesc}</p>
        
        <motion.button
          className={styles.backButton}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/home')}
        >
          {t.goHome}
        </motion.button>
      </motion.div>
    </div>
  );
};

export default NotFound;
