import { createContext, useContext, useState, useEffect } from 'react'

export const THEMES = {
  cream: {
    id: 'cream',
    name: 'Warm Cream',
    icon: '☀️',
    preview: ['#edeade', '#c8785a', '#3d3830'],
    vars: {
      '--bg': '#edeade',
      '--surface': '#ffffff',
      '--surface-2': '#f9fafb',
      '--border': '#e2ddd5',
      '--text': '#3d3830',
      '--text-muted': '#6b6560',
      '--text-dim': '#9d9890',
      '--accent': '#c8785a',
      '--accent-dark': '#b06048',
      '--accent-bg': '#f5ede4',
      '--header-bg': 'rgba(237,234,222,.92)',
      '--shadow-color': 'rgba(80,50,20,.08)',
      '--shadow-md': 'rgba(80,50,20,.12)',
      '--overlay': 'rgba(60,50,40,.45)',
      '--input-bg': '#ffffff',
      '--scrollbar': '#d5cfc6',
    },
  },
  dark: {
    id: 'dark',
    name: 'Dark Coop',
    icon: '🌙',
    preview: ['#1C1A17', '#E89472', '#F5F2EC'],
    vars: {
      '--bg': '#1C1A17',
      '--surface': '#25221E',
      '--surface-2': '#2D2925',
      '--border': '#3B3630',
      '--text': '#F5F2EC',
      '--text-muted': '#C9C1B6',
      '--text-dim': '#A39D94',
      '--accent': '#E89472',
      '--accent-dark': '#C8785A',
      '--accent-bg': 'rgba(232,148,114,0.16)',
      '--accent-ink': '#F9D3B8',
      '--header-bg': 'rgba(28,26,23,.9)',
      '--shadow-color': 'rgba(0,0,0,.42)',
      '--shadow-md': 'rgba(0,0,0,.62)',
      '--overlay': 'rgba(11,9,7,.72)',
      '--input-bg': '#2D2925',
      '--scrollbar': '#514A42',
    },
  },
  forest: {
    id: 'forest',
    name: 'Forest',
    icon: '🌿',
    preview: ['#eef4ee', '#3a7d44', '#1a3020'],
    vars: {
      '--bg': '#eef4ee',
      '--surface': '#ffffff',
      '--surface-2': '#f4faf4',
      '--border': '#c8ddc8',
      '--text': '#1a3020',
      '--text-muted': '#4a6b50',
      '--text-dim': '#7a9b80',
      '--accent': '#3a7d44',
      '--accent-dark': '#2d6235',
      '--accent-bg': '#e4f3e6',
      '--header-bg': 'rgba(238,244,238,.92)',
      '--shadow-color': 'rgba(30,80,40,.08)',
      '--shadow-md': 'rgba(30,80,40,.14)',
      '--overlay': 'rgba(10,40,20,.5)',
      '--input-bg': '#ffffff',
      '--scrollbar': '#b8d4ba',
    },
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean',
    icon: '🌊',
    preview: ['#eef2f8', '#3b68c4', '#1a2340'],
    vars: {
      '--bg': '#eef2f8',
      '--surface': '#ffffff',
      '--surface-2': '#f4f7fd',
      '--border': '#ccd8f0',
      '--text': '#1a2340',
      '--text-muted': '#4a5878',
      '--text-dim': '#8090b8',
      '--accent': '#3b68c4',
      '--accent-dark': '#2d52a0',
      '--accent-bg': '#e6edf8',
      '--header-bg': 'rgba(238,242,248,.92)',
      '--shadow-color': 'rgba(30,40,80,.08)',
      '--shadow-md': 'rgba(30,40,80,.14)',
      '--overlay': 'rgba(10,20,60,.5)',
      '--input-bg': '#ffffff',
      '--scrollbar': '#b0c4e8',
    },
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset',
    icon: '🌅',
    preview: ['#fdf4ee', '#e05c28', '#2d1810'],
    vars: {
      '--bg': '#fdf4ee',
      '--surface': '#ffffff',
      '--surface-2': '#fff8f4',
      '--border': '#f0ddd0',
      '--text': '#2d1810',
      '--text-muted': '#6b4838',
      '--text-dim': '#9b8078',
      '--accent': '#e05c28',
      '--accent-dark': '#c04818',
      '--accent-bg': '#fef0e8',
      '--header-bg': 'rgba(253,244,238,.92)',
      '--shadow-color': 'rgba(80,30,10,.08)',
      '--shadow-md': 'rgba(80,30,10,.14)',
      '--overlay': 'rgba(60,20,10,.5)',
      '--input-bg': '#ffffff',
      '--scrollbar': '#f0c4a8',
    },
  },
}

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [themeId, setThemeIdRaw] = useState(
    () => localStorage.getItem('clucktrack_theme') || 'cream'
  )

  const theme = THEMES[themeId] || THEMES.cream

  useEffect(() => {
    const root = document.documentElement
    Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v))
    root.setAttribute('data-theme', themeId)
  }, [themeId, theme])

  const setThemeId = (id) => {
    localStorage.setItem('clucktrack_theme', id)
    setThemeIdRaw(id)
  }

  return (
    <ThemeContext.Provider value={{ theme, themeId, setThemeId, THEMES }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
