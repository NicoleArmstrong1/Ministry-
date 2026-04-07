import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "empowerment": "Empowerment of Vision, Destiny, Transformation, Inspire and Connect",
      "ministry_name": "Lightbearer V Ministry",
      "preach": "Preach",
      "inspire": "Inspire",
      "connect": "Connect",
      "comment_section": "Comment Section",
      "send": "Send",
      "live": "LIVE",
      "join_zoom": "Join Zoom Meeting",
      "church_till": "Church Till Number: 254 794 464107",
      "tabs": {
        "record": "Record",
        "music": "Music",
        "advert": "Advert"
      }
    }
  },
  sw: {
    translation: {
      "empowerment": "Uwezeshaji wa Maono, Hatima, Mabadiliko, Hamasa na Kuunganisha",
      "ministry_name": "Huduma ya Lightbearer V",
      "preach": "Hubiri",
      "inspire": "Hamasisha",
      "connect": "Unganisha",
      "comment_section": "Sehemu ya Maoni",
      "send": "Tuma",
      "live": "MUBASHARA",
      "join_zoom": "Jiunge na Mkutano wa Zoom",
      "church_till": "Nambari ya Till ya Kanisa: 254 794 464107",
      "tabs": {
        "record": "Rekodi",
        "music": "Muziki",
        "advert": "Matangazo"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
