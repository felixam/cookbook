'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { SearchBar } from '@/components/layout/search-bar';
import { RecipeCard } from '@/components/recipes/recipe-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { MotionWrapper } from '@/components/ui/motion-wrapper';
import type { RecipeListItem } from '@/lib/types/recipe';
import {
  getCachedRecipes,
  setCachedRecipes,
  hasRecipesChanged,
} from '@/lib/cache/recipes';

export default function HomePage() {
  const cachedData = getCachedRecipes('');
  const [recipes, setRecipes] = useState<RecipeListItem[]>(cachedData ?? []);
  const [loading, setLoading] = useState(cachedData === null);
  const [searchQuery, setSearchQuery] = useState('');
  const currentQueryRef = useRef('');

  const fetchRecipes = useCallback(async (query?: string, isBackgroundFetch = false) => {
    const queryKey = query ?? '';
    currentQueryRef.current = queryKey;

    try {
      const url = query ? `/api/recipes?q=${encodeURIComponent(query)}` : '/api/recipes';
      const res = await fetch(url);
      if (res.ok) {
        const data: RecipeListItem[] = await res.json();

        // Only update if this is still the current query
        if (currentQueryRef.current !== queryKey) return;

        // Cache the results
        setCachedRecipes(data, queryKey);

        // Only update state if data actually changed
        setRecipes((prev) => {
          if (hasRecipesChanged(prev, data)) {
            return data;
          }
          return prev;
        });
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      if (!isBackgroundFetch) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    // If we have cached data, do a background fetch to check for updates
    // Otherwise, show loading and fetch
    if (cachedData !== null) {
      fetchRecipes(undefined, true);
    } else {
      fetchRecipes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      const cachedForQuery = getCachedRecipes(searchQuery);

      if (cachedForQuery !== null) {
        // Show cached data immediately
        setRecipes(cachedForQuery);
        setLoading(false);
        // Background fetch to check for updates
        fetchRecipes(searchQuery || undefined, true);
      } else if (searchQuery !== '') {
        // No cache, need to fetch with loading
        setLoading(true);
        fetchRecipes(searchQuery);
      } else {
        // Empty query - check cache
        const cachedAll = getCachedRecipes('');
        if (cachedAll !== null) {
          setRecipes(cachedAll);
          setLoading(false);
          fetchRecipes(undefined, true);
        } else {
          fetchRecipes();
        }
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery, fetchRecipes]);

  return (
    <div className="min-h-screen bg-background">
      <main className="p-4 space-y-4">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Rezept suchen..."
        />

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-video w-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            ))}
          </div>
        ) : recipes.length === 0 ? (
          <MotionWrapper>
            <div className="text-center py-12">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mx-auto mb-4 text-muted-foreground"
              >
                <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
                <line x1="6" x2="18" y1="17" y2="17" />
              </svg>
              <h2 className="text-xl font-semibold mb-2">
                {searchQuery ? 'Keine Rezepte gefunden' : 'Noch keine Rezepte'}
              </h2>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? 'Versuche einen anderen Suchbegriff'
                  : 'Erstelle dein erstes Rezept oder importiere eines'}
              </p>
              {!searchQuery && (
                <div className="flex gap-2 justify-center">
                  <Link href="/recipes/new">
                    <Button>Rezept erstellen</Button>
                  </Link>
                  <Link href="/recipes/import">
                    <Button variant="outline">Importieren</Button>
                  </Link>
                </div>
              )}
            </div>
          </MotionWrapper>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recipes.map((recipe, index) => (
              <RecipeCard key={recipe.id} recipe={recipe} index={index} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
