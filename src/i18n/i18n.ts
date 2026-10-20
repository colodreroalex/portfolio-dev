import { atom } from 'nanostores';
import esTranslations from './es.json';
import enTranslations from './en.json';

export type Language = 'es' | 'en';

export const translations = {
  es: esTranslations,
  en: enTranslations
};

// Create a store for the language
export const languageStore = atom<Language>('es');

// Function to get translations
export function getTranslations(lang: Language) {
  return translations[lang];
}

// Function to switch language
export function switchLanguage(lang: Language) {
  languageStore.set(lang);
  // Save to cookies for persistence
  if (typeof window !== 'undefined') {
    document.cookie = `preferred-lang=${lang}; path=/; max-age=31536000; SameSite=Strict`;
  }
}

// Function to initialize language from cookies
export function initLanguage() {
  if (typeof window !== 'undefined') {
    // Parse cookies
    const cookies = document.cookie.split('; ').reduce((prev, current) => {
      const [name, value] = current.split('=');
      prev[name] = value;
      return prev;
    }, {} as Record<string, string>);
    
    const savedLang = cookies['preferred-lang'] as Language;
    if (savedLang && (savedLang === 'es' || savedLang === 'en')) {
      languageStore.set(savedLang);
    } else {
      // Try to detect browser language
      const browserLang = navigator.language.split('-')[0];
      if (browserLang === 'en') {
        languageStore.set('en');
        // Set cookie for first-time visitors based on browser language
        document.cookie = `preferred-lang=en; path=/; max-age=31536000; SameSite=Strict`;
      }
      // Default is already 'es'
    }
  }
}
