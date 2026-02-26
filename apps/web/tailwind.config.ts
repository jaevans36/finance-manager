import type { Config } from 'tailwindcss';
import preset from '../../packages/ui/tailwind.preset';

export default {
  presets: [preset],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
} satisfies Config;
