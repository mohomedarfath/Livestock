// Simple translation dictionary for CluckTrack
const translations = {
  en: {
    'Dashboard': 'Dashboard',
    'Daily Log': 'Daily Log',
    'Flocks': 'Flocks',
    'Vaccines': 'Vaccines',
    'Feed Costs': 'Feed Costs',
    'Sales': 'Sales',
    'Medicine': 'Medicine',
    'FCR': 'FCR',
    'Profit/Loss': 'Profit/Loss',
    'More': 'More',
    'Logout': 'Logout',
  },
  si: {
    'Dashboard': 'Dashboard',
    'Daily Log': 'Dainika',
    'Flocks': 'Kuruluwa',
    'Vaccines': 'Ennataa',
    'Feed Costs': 'Khada',
    'Sales': 'Vikrinima',
    'Medicine': 'Oushadha',
    'FCR': 'FCR',
    'Profit/Loss': 'Labha',
    'More': 'Athe',
    'Logout': 'Logout',
  }
}

export const useLanguage = () => {
  const [language, setLanguage] = typeof window !== 'undefined'
    ? require('react').useState(() => localStorage.getItem('clucktrack_language') || 'en')
    : ['en', () => {}]

  const changeLanguage = (lang) => {
    setLanguage(lang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('clucktrack_language', lang)
    }
  }

  const t = (key) => {
    return translations[language]?.[key] || translations['en']?.[key] || key
  }

  return { language, changeLanguage, t }
}

export default translations
