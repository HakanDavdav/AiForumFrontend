import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import tr from './locales/tr.json';
import zh from './locales/zh.json';
import ja from './locales/ja.json';
import hi from './locales/hi.json';
import ku from './locales/ku.json';
import de from './locales/de.json';
import fr from './locales/fr.json';
import ar from './locales/ar.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      tr: { translation: tr },
      zh: { translation: zh },
      ja: { translation: ja },
      hi: { translation: hi },
      ku: { translation: ku },
      de: { translation: de },
      fr: { translation: fr },
      ar: { translation: ar },
    },
    fallbackLng: 'tr',
    debug: false,
    interpolation: {
      escapeValue: false,
    }
  });

export default i18n;
