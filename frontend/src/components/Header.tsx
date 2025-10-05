import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import type { Persona } from '../types';

type Props = {
  persona: Persona;
  onPersonaChange: (persona: Persona) => void;
};

export function Header({ persona, onPersonaChange }: Props) {
  const { theme, cycleTheme } = useTheme();

  const themeIcons = {
    light: Sun,
    dark: Moon,
  };

  const Icon = themeIcons[theme];

  return (
    <header className="border-b border-border/20 bg-bg/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-fg">Devil's Advocate</h1>
          <span className="hidden sm:inline-block px-2 py-1 text-xs font-medium bg-orb-from/10 text-orb-from rounded-full">
            Always Oppose
          </span>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={persona}
            onChange={(e) => onPersonaChange(e.target.value as Persona)}
            className="px-3 py-1.5 rounded-lg bg-bg border border-border/30 text-fg text-sm focus:outline-none focus:ring-2 focus:ring-orb-from/50"
            aria-label="Select persona"
          >
            <option value="socrates">Socrates</option>
            <option value="karen2.0">Karen 2.0</option>
            <option value="professorlogic">Professor Logic</option>
          </select>

          <button
            onClick={cycleTheme}
            className="p-2 rounded-lg hover:bg-muted/10 transition-colors focus:outline-none focus:ring-2 focus:ring-orb-from/50"
            aria-label={`Current theme: ${theme}. Click to cycle themes.`}
            title={`Theme: ${theme}`}
          >
            <Icon className="w-5 h-5 text-fg" />
          </button>
        </div>
      </div>
    </header>
  );
}
