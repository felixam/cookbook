'use client';

import { SearchBar } from '@/components/layout/search-bar';
import { RecipeCard } from '@/components/recipes/recipe-card';
import { TagFilter } from '@/components/tags/tag-filter';
import { Button } from '@/components/ui/button';
import { MotionWrapper } from '@/components/ui/motion-wrapper';
import { Skeleton } from '@/components/ui/skeleton';
import { getCachedRecipes, setCachedRecipes } from '@/lib/cache/recipes';
import type { RecipeListItem } from '@/lib/types/recipe';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL params
  const initialQuery = searchParams.get('q') || '';
  const initialTags = searchParams.get('tags');
  const initialTagIds = initialTags
    ? initialTags.split(',').map((id) => parseInt(id, 10)).filter((id) => !isNaN(id))
    : [];

  // Check cache for initial query
  const cacheKey = initialQuery || '';
  const cachedData = getCachedRecipes(cacheKey);
  const [recipes, setRecipes] = useState<RecipeListItem[]>(cachedData ?? []);
  const [loading, setLoading] = useState(cachedData === null);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(initialTagIds);
  const currentQueryRef = useRef('');

  // Update URL when filters change
  const updateUrl = useCallback((query: string, tagIds: number[]) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (tagIds.length > 0) params.set('tags', tagIds.join(','));
    const newUrl = params.toString() ? `/?${params}` : '/';
    router.replace(newUrl, { scroll: false });
  }, [router]);

  const fetchRecipes = useCallback(async (query?: string, tagIds?: number[], isBackgroundFetch = false) => {
    const queryKey = query ?? '';
    currentQueryRef.current = queryKey;
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (tagIds && tagIds.length > 0) params.set('tags', tagIds.join(','));
      const url = params.toString() ? `/api/recipes?${params}` : '/api/recipes';
      const res = await fetch(url);
      if (res.ok) {
        const data: RecipeListItem[] = await res.json();

        // Only update if this is still the current query
        if (currentQueryRef.current !== queryKey) return;

        // Cache the results
        setCachedRecipes(data, queryKey);

        setRecipes(data);
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      if (!isBackgroundFetch) {
        setLoading(false);
      }
    }
  }, []);

  // Fetch on mount with URL params
  useEffect(() => {
    // If we have cached data, do a background fetch to check for updates
    // Otherwise, show loading and fetch
    if (cachedData !== null) {
      fetchRecipes(initialQuery || undefined, initialTagIds.length > 0 ? initialTagIds : undefined, true);
    } else {
      fetchRecipes(initialQuery || undefined, initialTagIds.length > 0 ? initialTagIds : undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle search query changes with debounce
  useEffect(() => {
    const debounce = setTimeout(() => {
      const cacheKey = searchQuery || '';
      const cachedForQuery = getCachedRecipes(cacheKey);

      if (cachedForQuery !== null && selectedTagIds.length === 0) {
        // Show cached data immediately (only if no tag filters)
        setRecipes(cachedForQuery);
        setLoading(false);
        // Background fetch to check for updates
        fetchRecipes(searchQuery || undefined, selectedTagIds.length > 0 ? selectedTagIds : undefined, true);
      } else {
        // Need to fetch (either no cache or tag filters applied)
        if (selectedTagIds.length === 0) {
          setLoading(true);
        }
        fetchRecipes(searchQuery || undefined, selectedTagIds.length > 0 ? selectedTagIds : undefined);
      }
      updateUrl(searchQuery, selectedTagIds);
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery, selectedTagIds, fetchRecipes, updateUrl]);

  // Handle tag changes
  function handleTagsChange(tagIds: number[]) {
    setSelectedTagIds(tagIds);
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="p-4 space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Rezept suchen..."
            />
          </div>
          <TagFilter
            selectedTagIds={selectedTagIds}
            onTagsChange={handleTagsChange}
          />
        </div>

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
                {searchQuery || selectedTagIds.length > 0 ? 'Keine Rezepte gefunden' : 'Noch keine Rezepte'}
              </h2>
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedTagIds.length > 0
                  ? 'Versuche einen anderen Suchbegriff oder Filter'
                  : 'Erstelle dein erstes Rezept oder importiere eines'}
              </p>
              {!searchQuery && selectedTagIds.length === 0 && (
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

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <main className="p-4 space-y-4">
          <div className="flex gap-2">
            <Skeleton className="flex-1 h-9" />
            <Skeleton className="h-9 w-9" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-video w-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            ))}
          </div>
        </main>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}
