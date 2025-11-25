'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import type { Recipe } from '@/lib/types/recipe';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function RecipeDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [displayServings, setDisplayServings] = useState<number | null>(null);

  useEffect(() => {
    async function fetchRecipe() {
      try {
        const res = await fetch(`/api/recipes/${id}`);
        if (res.ok) {
          const data = await res.json();
          setRecipe(data);
        } else if (res.status === 404) {
          router.push('/');
        }
      } catch (error) {
        console.error('Error fetching recipe:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchRecipe();
  }, [id, router]);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/recipes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Rezept gelöscht');
        router.push('/');
        router.refresh();
      } else {
        toast.error('Fehler beim Löschen');
      }
    } catch {
      toast.error('Verbindungsfehler');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  }

  function toggleIngredient(index: number) {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  // Calculate the multiplier for servings adjustment
  const servingsMultiplier = recipe && displayServings
    ? displayServings / recipe.servings
    : 1;

  function formatAmount(amount: number | null, unit: string | null): string {
    if (amount === null) {
      return unit || '';
    }
    // Apply servings multiplier
    const adjusted = amount * servingsMultiplier;
    const formatted = adjusted % 1 === 0
      ? adjusted.toString()
      : adjusted.toFixed(2).replace(/\.?0+$/, '');
    return unit ? `${formatted} ${unit}` : formatted;
  }

  function adjustServings(delta: number) {
    if (!recipe) return;
    const current = displayServings ?? recipe.servings;
    const newValue = Math.max(1, current + delta);
    setDisplayServings(newValue);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header title="Laden..." showBack />
        <div className="p-4 space-y-4">
          <Skeleton className="aspect-video w-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/4" />
          <div className="space-y-2 mt-6">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!recipe) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header
        title={recipe.title}
        showBack
        actions={
          <div className="flex gap-1">
            <Link href={`/recipes/${id}/edit`}>
              <Button size="icon" variant="ghost">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  <path d="m15 5 4 4" />
                </svg>
              </Button>
            </Link>
            <Button
              size="icon"
              variant="ghost"
              className="text-destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </Button>
          </div>
        }
      />

      <main>
        {recipe.imageData && (
          <div className="aspect-video w-full">
            <img
              src={recipe.imageData}
              alt={recipe.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-4 space-y-6">
          <div>
            <h1 className="text-2xl font-bold">{recipe.title}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-muted-foreground">Portionen:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adjustServings(-1)}
                  className="w-8 h-8 rounded-full border border-input flex items-center justify-center hover:bg-accent transition-colors"
                  disabled={(displayServings ?? recipe.servings) <= 1}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" />
                  </svg>
                </button>
                <span className="w-8 text-center font-medium">
                  {displayServings ?? recipe.servings}
                </span>
                <button
                  type="button"
                  onClick={() => adjustServings(1)}
                  className="w-8 h-8 rounded-full border border-input flex items-center justify-center hover:bg-accent transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" />
                    <path d="M12 5v14" />
                  </svg>
                </button>
              </div>
              {displayServings && displayServings !== recipe.servings && (
                <button
                  type="button"
                  onClick={() => setDisplayServings(null)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  (Original: {recipe.servings})
                </button>
              )}
            </div>
            {recipe.sourceUrl && (
              <a
                href={recipe.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline mt-1 inline-block"
              >
                Originalrezept ansehen
              </a>
            )}
          </div>

          <section>
            <h2 className="text-lg font-semibold mb-3">Zutaten</h2>
            <ul className="space-y-2">
              {recipe.ingredients.map((ing, index) => (
                <li key={ing.id || index} className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleIngredient(index)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      checkedIngredients.has(index)
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-muted-foreground'
                    }`}
                  >
                    {checkedIngredients.has(index) && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                  <span
                    className={
                      checkedIngredients.has(index)
                        ? 'line-through text-muted-foreground'
                        : ''
                    }
                  >
                    <span className="font-medium">
                      {formatAmount(ing.amount, ing.unit)}
                    </span>{' '}
                    {ing.name}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">Zubereitung</h2>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>
                {recipe.instructions}
              </ReactMarkdown>
            </div>
          </section>
        </div>
      </main>

      <BottomNav />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rezept löschen?</DialogTitle>
            <DialogDescription>
              Möchtest du &quot;{recipe.title}&quot; wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Löschen...' : 'Löschen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
