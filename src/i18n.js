// src/i18n.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // the translations
    resources: {
      en: {
        translation: require("../public/locales/en.json"),
      },
      hi: {
        translation: require("../public/locales/hi.json"),
      },
      gu: {
        translation: require("../public/locales/gu.json"),
      },
    },
    fallbackLng: "en",
    debug: false,
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;