export interface ParameterPreset {
  id: string;
  name: string;
  description?: string;
  parameters: Record<string, any>;
  createdAt: number;
}

const PRESETS_KEY = 'claude-prompt-parameter-presets';

export function getPresets(): ParameterPreset[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(PRESETS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function savePreset(preset: Omit<ParameterPreset, 'id' | 'createdAt'>): ParameterPreset {
  const presets = getPresets();
  const newPreset: ParameterPreset = {
    ...preset,
    id: `preset-${Date.now()}`,
    createdAt: Date.now()
  };
  presets.push(newPreset);
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  return newPreset;
}

export function deletePreset(id: string): void {
  const presets = getPresets().filter(p => p.id !== id);
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
}

export function updatePreset(id: string, updates: Partial<Omit<ParameterPreset, 'id' | 'createdAt'>>): void {
  const presets = getPresets().map(p => 
    p.id === id ? { ...p, ...updates } : p
  );
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
}
