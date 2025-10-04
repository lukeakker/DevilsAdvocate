/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        fg: 'var(--fg)',
        muted: 'var(--muted)',
        'orb-from': 'var(--orb-from)',
        'orb-to': 'var(--orb-to)',
      },
    },
  },
  plugins: [],
};
