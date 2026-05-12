// src/i18n/index.js
import translations from './translations';

export const getTranslation = (lang, key) => {
    if (!translations[lang]) return key;      // fallback
    return translations[lang][key] || key;    // fallback
};