import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ar from './locales/ar.json';
import en from './locales/en.json';

export type AppLanguage = 'ar' | 'en';

const STORAGE_KEY = 'admin.lang';

export const getStoredLanguage = (): AppLanguage => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'en' ? 'en' : 'ar';
};

/** Keep <html lang/dir> in sync with the active language (Arabic is RTL). */
export const applyDocumentDirection = (lng: AppLanguage) => {
  const dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
  document.documentElement.dir = dir;
};

export const setLanguage = (lng: AppLanguage) => {
  localStorage.setItem(STORAGE_KEY, lng);
  void i18n.changeLanguage(lng);
};

void i18n.use(initReactI18next).init({
  resources: {
    ar: { translation: ar },
    en: { translation: en },
  },
  lng: getStoredLanguage(),
  fallbackLng: 'ar',
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', (lng) => {
  applyDocumentDirection(lng === 'en' ? 'en' : 'ar');
});

applyDocumentDirection(getStoredLanguage());

export default i18n;
