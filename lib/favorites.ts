export interface FavoriteItem {
  id: string;
  type: 'prompt' | 'workflow';
  timestamp: number;
}

const FAVORITES_KEY = 'claude-prompt-favorites';
const RECENT_KEY = 'claude-prompt-recent';

export function getFavorites(): FavoriteItem[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(FAVORITES_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function addFavorite(id: string, type: 'prompt' | 'workflow'): void {
  const favorites = getFavorites();
  if (!favorites.some(f => f.id === id && f.type === type)) {
    favorites.push({ id, type, timestamp: Date.now() });
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }
}

export function removeFavorite(id: string, type: 'prompt' | 'workflow'): void {
  const favorites = getFavorites().filter(f => !(f.id === id && f.type === type));
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

export function isFavorite(id: string, type: 'prompt' | 'workflow'): boolean {
  return getFavorites().some(f => f.id === id && f.type === type);
}

export function getRecentItems(): FavoriteItem[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(RECENT_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function addRecentItem(id: string, type: 'prompt' | 'workflow'): void {
  let recent = getRecentItems().filter(r => !(r.id === id && r.type === type));
  recent.unshift({ id, type, timestamp: Date.now() });
  recent = recent.slice(0, 20);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
}
