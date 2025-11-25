'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { BottomNav } from '@/components/layout/bottom-nav';
import { SearchBar } from '@/components/layout/search-bar';
import { RecipeCard } from '@/components/recipes/recipe-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { MotionWrapper } from '@/components/ui/motion-wrapper';
import type { RecipeListItem } from '@/lib/types/recipe';

export default function HomePage() {
  const [recipes, setRecipes] = useState<RecipeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRecipes = useCallback(async (query?: string) => {
    try {
      const url = query ? `/api/recipes?q=${encodeURIComponent(query)}` : '/api/recipes';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setRecipes(data);
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchQuery !== '') {
        fetchRecipes(searchQuery);
      } else {
        fetchRecipes();
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery, fetchRecipes]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header
        title="Familienrezepte"
        actions={
          <Link href="/recipes/new">
            <Button size="icon" variant="ghost">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
            </Button>
          </Link>
        }
      />

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

      <BottomNav />
    </div>
  );
}
