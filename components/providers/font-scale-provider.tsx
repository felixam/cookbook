'use client';

import { createContext, useContext, useLayoutEffect, useState } from 'react';

export type FontScale = '1' | '1.1' | '1.2';

interface FontScaleContextType {
  fontScale: FontScale;
  setFontScale: (scale: FontScale) => void;
}

const FontScaleContext = createContext<FontScaleContextType | undefined>(undefined);

const STORAGE_KEY = 'font-scale';
const DEFAULT_SCALE: FontScale = '1';
const VALID_SCALES = ['1', '1.1', '1.2'];

function getStoredScale(): FontScale {
  if (typeof window === 'undefined') return DEFAULT_SCALE;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored && VALID_SCALES.includes(stored) ? (stored as FontScale) : DEFAULT_SCALE;
}

function applyFontScale(scale: FontScale) {
  const baseSize = 16 * parseFloat(scale);
  document.documentElement.style.fontSize = `${baseSize}px`;
}

export function FontScaleProvider({ children }: { children: React.ReactNode }) {
  const [fontScale, setFontScaleState] = useState<FontScale>(getStoredScale);

  useLayoutEffect(() => {
    applyFontScale(fontScale);
  }, [fontScale]);

  function setFontScale(scale: FontScale) {
    setFontScaleState(scale);
    localStorage.setItem(STORAGE_KEY, scale);
  }

  return (
    <FontScaleContext.Provider value={{ fontScale, setFontScale }}>
      {children}
    </FontScaleContext.Provider>
  );
}

export function useFontScale() {
  const context = useContext(FontScaleContext);
  if (context === undefined) {
    throw new Error('useFontScale must be used within a FontScaleProvider');
  }
  return context;
}
