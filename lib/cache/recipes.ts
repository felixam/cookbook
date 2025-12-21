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

export function invalidateRecipeCache(): void {
  cache = null;
}

export function hasRecipesChanged(
  oldRecipes: RecipeListItem[],
  newRecipes: RecipeListItem[]
): boolean {
  if (oldRecipes.length !== newRecipes.length) {
    return true;
  }

  for (let i = 0; i < newRecipes.length; i++) {
    const oldRecipe = oldRecipes[i];
    const newRecipe = newRecipes[i];

    if (
      oldRecipe.id !== newRecipe.id ||
      oldRecipe.title !== newRecipe.title ||
      oldRecipe.imageData !== newRecipe.imageData ||
      oldRecipe.servings !== newRecipe.servings
    ) {
      return true;
    }
  }

  return false;
}
