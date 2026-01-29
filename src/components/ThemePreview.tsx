import { useState } from 'react';
import { Palette, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Convert HEX to HSL
const hexToHSL = (hex: string): string => {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

// Get luminance to determine if color is light or dark
const getLuminance = (hex: string): number => {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
};

interface ThemePalette {
  name: string;
  colors: string[];
  mapping: {
    background: number;
    foreground: number;
    card: number;
    primary: number;
    secondary: number;
    accent: number;
    muted: number;
  };
}

const palettes: ThemePalette[] = [
  {
    name: 'Natural',
    colors: ['#CCD5AE', '#E9EDC9', '#FEFAE0', '#FAEDCD', '#D4A373'],
    mapping: { background: 2, foreground: -1, card: 3, primary: 4, secondary: 0, accent: 4, muted: 1 }
  },
  {
    name: 'Bold Blue',
    colors: ['#00296B', '#003F88', '#00509D', '#FDC500', '#FFD500'],
    mapping: { background: 0, foreground: -1, card: 1, primary: 3, secondary: 2, accent: 4, muted: 1 }
  },
  {
    name: 'Ocean',
    colors: ['#05668D', '#427AA1', '#EBF2FA', '#679436', '#A5BE00'],
    mapping: { background: 2, foreground: -1, card: 2, primary: 0, secondary: 1, accent: 3, muted: 1 }
  },
  {
    name: 'Vibrant',
    colors: ['#FF9F1C', '#FFBF69', '#FFFFFF', '#CBF3F0', '#2EC4B6'],
    mapping: { background: 2, foreground: -1, card: 3, primary: 0, secondary: 4, accent: 0, muted: 1 }
  },
  {
    name: 'Earthy',
    colors: ['#DD6E42', '#E8DAB2', '#4F6D7A', '#C0D6DF', '#EAEAEA'],
    mapping: { background: 4, foreground: -1, card: 3, primary: 0, secondary: 2, accent: 0, muted: 1 }
  },
  {
    name: 'Forest',
    colors: ['#2C6E49', '#4C956C', '#FEFEE3', '#FFC9B9', '#D68C45'],
    mapping: { background: 2, foreground: -1, card: 3, primary: 0, secondary: 1, accent: 4, muted: 1 }
  },
  {
    name: 'Pastel',
    colors: ['#DDFFD9', '#ECC8AE', '#D7907B', '#6C4B5E', '#B3679B'],
    mapping: { background: 0, foreground: -1, card: 1, primary: 4, secondary: 2, accent: 4, muted: 1 }
  },
  {
    name: 'Dark Purple',
    colors: ['#30343F', '#FAFAFF', '#E4D9FF', '#273469', '#1E2749'],
    mapping: { background: 4, foreground: -1, card: 0, primary: 2, secondary: 3, accent: 2, muted: 0 }
  },
  {
    name: 'Ethereal Neon',
    colors: ['#050511', '#FDF7FF', '#7B61FF', '#39F3FF', '#FFA9FF', '#C8FF8C'],
    mapping: { background: 0, foreground: 1, card: 0, primary: 2, secondary: 3, accent: 4, muted: 5 }
  },
];

// Original Blood Moon theme
const originalTheme = {
  background: '0 92% 15%',
  foreground: '0 0% 100%',
  card: '0 100% 10%',
  cardForeground: '0 0% 100%',
  popover: '0 100% 12%',
  popoverForeground: '0 0% 100%',
  primary: '40 5% 89%',
  primaryForeground: '0 92% 15%',
  secondary: '0 100% 27%',
  secondaryForeground: '0 0% 100%',
  muted: '0 50% 12%',
  mutedForeground: '0 20% 70%',
  accent: '348 83% 47%',
  accentForeground: '0 0% 100%',
  border: '0 60% 20%',
  input: '0 50% 15%',
  ring: '348 83% 47%',
};

export const ThemePreview = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState<string | null>(null);

  const applyTheme = (palette: ThemePalette) => {
    const root = document.documentElement;
    const { colors, mapping } = palette;
    
    // Determine foreground color based on background luminance
    const bgColor = colors[mapping.background];
    const bgLuminance = getLuminance(bgColor);
    const foregroundColor = bgLuminance > 0.5 ? '#1a1a1a' : '#ffffff';
    const mutedForegroundColor = bgLuminance > 0.5 ? '#666666' : '#a0a0a0';
    
    // Primary foreground based on primary luminance
    const primaryColor = colors[mapping.primary];
    const primaryLuminance = getLuminance(primaryColor);
    const primaryForeground = primaryLuminance > 0.5 ? '#1a1a1a' : '#ffffff';
    
    // Secondary foreground
    const secondaryColor = colors[mapping.secondary];
    const secondaryLuminance = getLuminance(secondaryColor);
    const secondaryForeground = secondaryLuminance > 0.5 ? '#1a1a1a' : '#ffffff';
    
    // Accent foreground
    const accentColor = colors[mapping.accent];
    const accentLuminance = getLuminance(accentColor);
    const accentForeground = accentLuminance > 0.5 ? '#1a1a1a' : '#ffffff';
    
    // Card foreground
    const cardColor = colors[mapping.card];
    const cardLuminance = getLuminance(cardColor);
    const cardForeground = cardLuminance > 0.5 ? '#1a1a1a' : '#ffffff';
    
    // Muted color - slightly darker/lighter than background
    const mutedColor = colors[mapping.muted];
    
    // Border color - blend between card and secondary
    const borderLuminance = getLuminance(cardColor);
    const borderColor = borderLuminance > 0.5 ? '#cccccc' : '#444444';

    // Apply CSS variables
    root.style.setProperty('--background', hexToHSL(bgColor));
    root.style.setProperty('--foreground', hexToHSL(foregroundColor));
    root.style.setProperty('--card', hexToHSL(cardColor));
    root.style.setProperty('--card-foreground', hexToHSL(cardForeground));
    root.style.setProperty('--popover', hexToHSL(cardColor));
    root.style.setProperty('--popover-foreground', hexToHSL(cardForeground));
    root.style.setProperty('--primary', hexToHSL(primaryColor));
    root.style.setProperty('--primary-foreground', hexToHSL(primaryForeground));
    root.style.setProperty('--secondary', hexToHSL(secondaryColor));
    root.style.setProperty('--secondary-foreground', hexToHSL(secondaryForeground));
    root.style.setProperty('--muted', hexToHSL(mutedColor));
    root.style.setProperty('--muted-foreground', hexToHSL(mutedForegroundColor));
    root.style.setProperty('--accent', hexToHSL(accentColor));
    root.style.setProperty('--accent-foreground', hexToHSL(accentForeground));
    root.style.setProperty('--border', hexToHSL(borderColor));
    root.style.setProperty('--input', hexToHSL(mutedColor));
    root.style.setProperty('--ring', hexToHSL(accentColor));
    
    setActiveTheme(palette.name);
  };

  const resetTheme = () => {
    const root = document.documentElement;
    
    root.style.setProperty('--background', originalTheme.background);
    root.style.setProperty('--foreground', originalTheme.foreground);
    root.style.setProperty('--card', originalTheme.card);
    root.style.setProperty('--card-foreground', originalTheme.cardForeground);
    root.style.setProperty('--popover', originalTheme.popover);
    root.style.setProperty('--popover-foreground', originalTheme.popoverForeground);
    root.style.setProperty('--primary', originalTheme.primary);
    root.style.setProperty('--primary-foreground', originalTheme.primaryForeground);
    root.style.setProperty('--secondary', originalTheme.secondary);
    root.style.setProperty('--secondary-foreground', originalTheme.secondaryForeground);
    root.style.setProperty('--muted', originalTheme.muted);
    root.style.setProperty('--muted-foreground', originalTheme.mutedForeground);
    root.style.setProperty('--accent', originalTheme.accent);
    root.style.setProperty('--accent-foreground', originalTheme.accentForeground);
    root.style.setProperty('--border', originalTheme.border);
    root.style.setProperty('--input', originalTheme.input);
    root.style.setProperty('--ring', originalTheme.ring);
    
    setActiveTheme(null);
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100]">
      {/* Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full shadow-lg gap-2"
        style={{ 
          backgroundColor: '#6366f1', 
          color: 'white',
          border: 'none'
        }}
      >
        <Palette className="w-4 h-4" />
        Preview Themes
        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
      </Button>

      {/* Theme Panel */}
      {isOpen && (
        <div 
          className="absolute bottom-12 right-0 w-72 rounded-xl shadow-2xl border overflow-hidden animate-fade-in"
          style={{ 
            backgroundColor: '#ffffff', 
            borderColor: '#e5e7eb',
            color: '#1f2937'
          }}
        >
          <div className="p-3 border-b" style={{ borderColor: '#e5e7eb' }}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm" style={{ color: '#1f2937' }}>Theme Palettes</h3>
              <button
                onClick={resetTheme}
                className="text-xs px-2 py-1 rounded hover:opacity-80 transition-opacity"
                style={{ 
                  backgroundColor: '#fee2e2', 
                  color: '#dc2626' 
                }}
              >
                Reset
              </button>
            </div>
          </div>
          
          <div className="p-2 max-h-80 overflow-y-auto">
            {palettes.map((palette) => (
              <button
                key={palette.name}
                onClick={() => applyTheme(palette)}
                className="w-full p-2 rounded-lg mb-1 flex items-center gap-3 transition-all hover:scale-[1.02]"
                style={{ 
                  backgroundColor: activeTheme === palette.name ? '#f3f4f6' : 'transparent',
                }}
              >
                {/* Color swatches */}
                <div className="flex -space-x-1">
                  {palette.colors.map((color, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-full border-2"
                      style={{ 
                        backgroundColor: color,
                        borderColor: '#ffffff',
                        zIndex: 5 - i
                      }}
                    />
                  ))}
                </div>
                
                {/* Name */}
                <span className="flex-1 text-sm font-medium text-left" style={{ color: '#374151' }}>
                  {palette.name}
                </span>
                
                {/* Active indicator */}
                {activeTheme === palette.name && (
                  <Check className="w-4 h-4" style={{ color: '#10b981' }} />
                )}
              </button>
            ))}
          </div>
          
          <div className="p-2 border-t text-xs text-center" style={{ borderColor: '#e5e7eb', color: '#9ca3af' }}>
            Click a palette to preview
          </div>
        </div>
      )}
    </div>
  );
};
