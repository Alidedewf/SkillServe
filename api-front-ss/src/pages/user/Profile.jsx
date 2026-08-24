import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; 
import Navbar from '../../components/user/Navbar';
import ProfileHeader from '../../components/user/ProfileHeader';
import translations from '../../i18n/translations'; 
import styles from './Profile.module.css';
import { fetchUserProfile, logoutUser } from '../../services/api';
import { FiAward, FiStar, FiLayers, FiGlobe, FiLock, FiHelpCircle, FiChevronRight, FiLogOut } from 'react-icons/fi';

const Profile = () => {
    const navigate = useNavigate();
    const location = useLocation(); 
    const [user, setUser] = useState(null);
    const [languageExpanded, setLanguageExpanded] = useState(false);
    const [language, setLanguage] = useState(localStorage.getItem('lang') || 'ru');

    const t = translations[language];

    useEffect(() => {
        const params = new URLSearchParams(location.search); 
        const langParam = params.get('lang') || localStorage.getItem('lang') || 'ru';
        setLanguage(langParam);
        localStorage.setItem('lang', langParam);

        // Загружаем реальные данные профиля из бэкенда
        const loadProfile = async () => {
            try {
                // Авторизация по httpOnly-cookie; маршрут защищён ProtectedRoute.
                const data = await fetchUserProfile();
                setUser({
                    name: data.name,
                    email: data.email,
                    avatar: data.avatar_url
                        ? data.avatar_url
                        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.name)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf,ffd5dc`,
                    restaurant: data.restaurant,
                });
            } catch (err) {
                console.error('Ошибка загрузки профиля:', err);
            }
        };
        loadProfile();
    }, [location, navigate]); 

    const toggleLanguageExpansion = () => {
        setLanguageExpanded(!languageExpanded);
    };

    const handleLanguageChange = (selectedLang) => {
        setLanguage(selectedLang);
        localStorage.setItem('lang', selectedLang);
        setLanguageExpanded(false); 
    };

    const handleCertificatesClick = () => navigate('/certificates');
    const handleRatingClick = () => navigate('/rating');
    const handleChangePasswordClick = () => navigate('/change-password');
    const handleFAQClick = () => navigate('/faq');

    const handleLogout = () => {
        logoutUser();
        navigate('/login');
    };


    return (
        <div className={styles.container}>
            {user && <ProfileHeader user={user} />}
            <div className={styles.settingsList}>
                <div className={styles.settingItem} onClick={handleCertificatesClick}>
                    <FiAward size={24} className={styles.iconPrefix} />
                    <span>{t.certificates}</span>
                    <FiChevronRight size={24} className={styles.iconSuffix} />
                </div>
                <div className={styles.settingItem} onClick={handleRatingClick}>
                    <FiStar size={24} className={styles.iconPrefix} />
                    <span>{t.rating}</span>
                    <FiChevronRight size={24} className={styles.iconSuffix} />
                </div>
                <div className={styles.settingItem}>
                    <FiLayers size={24} className={styles.iconPrefix} />
                    <span>{t.themes}</span>
                    <FiChevronRight size={24} className={styles.iconSuffix} />
                </div>

                <div className={styles.settingItem} onClick={toggleLanguageExpansion}>
                    <FiGlobe size={24} className={styles.iconPrefix} />
                    <span>{t.language}</span>
                    <FiChevronRight
                        size={24}
                        className={`${styles.iconSuffix} ${languageExpanded ? styles.rotatedArrow : ''}`}
                    />
                </div>
                {languageExpanded && (
                    <div className={styles.expandedBlock}>
                        <div
                            className={styles.languageOption}
                            onClick={() => handleLanguageChange('kz')}
                        >
                            {t.kazakh}
                        </div>
                        <div
                            className={styles.languageOption}
                            onClick={() => handleLanguageChange('ru')}
                        >
                            {t.russian}
                        </div>
                    </div>
                )}

                <div className={styles.settingItem} onClick={handleChangePasswordClick}>
                    <FiLock size={24} className={styles.iconPrefix} />
                    <span>{t.changePassword}</span>
                    <FiChevronRight size={24} className={styles.iconSuffix} />
                </div>
                <div className={styles.settingItem} onClick={handleFAQClick}>
                    <FiHelpCircle size={24} className={styles.iconPrefix} />
                    <span>{t.faq}</span>
                    <FiChevronRight size={24} className={styles.iconSuffix} />
                </div>
                <div className={styles.logoutItem} onClick={handleLogout}>
                    <FiLogOut size={24} className={styles.iconLogout} />
                    <span>{language === 'ru' ? 'Выйти' : 'Шығу'}</span>
                    <FiChevronRight size={24} className={styles.iconLogout} />
                </div>
            </div>
            <Navbar />
        </div>
    );
};

export default Profile;