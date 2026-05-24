/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        success: {
          50: '#ECFDF3',
          500: '#17B26A',
          700: '#067647',
        },
        warning: {
          50: '#FFFAEB',
          500: '#F79009',
          700: '#B54708',
        },
        danger: {
          50: '#FEF3F2',
          500: '#F04438',
          700: '#B42318',
        },
        info: {
          50: '#EFF8FF',
          500: '#2E90FA',
          700: '#175CD3',
        },
        farm: {
          orange: '#c8785a',
          'orange-ink': '#9B4A2E',
          'orange-dark': '#b06048',
          brown: '#8B6F47',
          'brown-dark': '#6B5437',
          'brown-light': '#A0896B',
          cream: '#F5EDDC',
        },
        // Warm light shell
        shell: {
          bg:         '#edeade',
          surface:    '#ffffff',
          border:     '#e2ddd5',
          text:       '#6b6560',
          'text-dim': '#9d9890',
        },
      },
      boxShadow: {
        'card':      '0 1px 2px rgba(80,50,20,.08), 0 2px 8px rgba(80,50,20,.05)',
        'card-hover':'0 2px 4px rgba(80,50,20,.12), 0 6px 16px rgba(80,50,20,.08)',
        'orange':    '0 4px 12px rgba(200,120,90,.28)',
        'modal':     '0 2px 8px rgba(80,50,20,.12), 0 1px 2px rgba(80,50,20,.08)',
      },
      borderRadius: {
        DEFAULT: '8px',
        'sm':    '4px',
        'md':    '8px',
        'lg':    '12px',
        'xl':    '12px',
        '2xl':   '16px',
        '3xl':   '24px',
        'full':  '9999px',
      },
      fontFamily: {
        sans: ['"Google Sans"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        display: ['36px', { lineHeight: '44px', fontWeight: '700' }],
        h1: ['28px', { lineHeight: '36px', fontWeight: '700' }],
        h2: ['22px', { lineHeight: '30px', fontWeight: '600' }],
        h3: ['18px', { lineHeight: '28px', fontWeight: '600' }],
        body: ['16px', { lineHeight: '24px' }],
        caption: ['12px', { lineHeight: '16px', fontWeight: '500' }],
        label: ['13px', { lineHeight: '18px', fontWeight: '600' }],
      },
    },
  },
  plugins: [],
}
