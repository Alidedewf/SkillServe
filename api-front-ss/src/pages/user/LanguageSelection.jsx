// src/pages/LanguageSelection.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './LanguageSelection.module.css';
import logo from '../../assets/images/skillserve2.svg';
import translations from '../../i18n/translations';

const LanguageSelection = () => {
    const navigate = useNavigate();

    const handleLanguageSelect = (lang) => {
        localStorage.setItem('lang', lang);
        navigate(`/login?lang=${lang}`);
    };

    // Можно взять язык из localStorage, если хотим динамику текста на этой же странице
    const lang = localStorage.getItem('lang') || 'ru';
    const t = translations[lang];

    return (
        <div className={styles.container}>
            <img src={logo} alt="SS Logo" className={styles.logo} />
            <h2 className={styles.title}>{t.chooseLanguage}</h2>
            <button
                className={styles.languageButton}
                onClick={() => handleLanguageSelect('ru')}
            >
                {t.russian}
            </button>
            <button
                className={styles.languageButton}
                onClick={() => handleLanguageSelect('kz')}
            >
                {t.kazakh}
            </button>
        </div>
    );
};

export default LanguageSelection;