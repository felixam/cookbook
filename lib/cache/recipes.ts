import type { RecipeListItem } from '@/lib/types/recipe';

interface RecipeCache {
  data: RecipeListItem[];
  query: string;
  timestamp: number;
}

let cache: RecipeCache | null = null;

export function getCachedRecipes(query: string = ''): RecipeListItem[] | null {
  if (cache && cache.query === query) {
    return cache.data;
  }
  return null;
}

export function setCachedRecipes(data: RecipeListItem[], query: string = ''): void {
  cache = {
    data,
    query,
    timestamp: Date.now(),
  };
}

