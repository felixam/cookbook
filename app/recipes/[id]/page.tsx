'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
import { Copy, Share2 } from 'lucide-react';
import type { Recipe } from '@/lib/types/recipe';
import { scaleAmount } from '@/lib/utils/amount';

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
  const [checkedSteps, setCheckedSteps] = useState<Set<string>>(new Set());
  const [displayServings, setDisplayServings] = useState<number | null>(null);
  const [savingServings, setSavingServings] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && !!navigator.share);
  }, []);

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

  function getIngredientsText(): string {
    if (!recipe) return '';
    return recipe.ingredients
      .filter((_, index) => !checkedIngredients.has(index))
      .map(ing => {
        const amount = formatAmount(ing.amount, ing.unit);
        return amount ? `${amount} ${ing.name}` : ing.name;
      })
      .join('\n');
  }

  async function shareIngredients() {
    if (!recipe) return;
    try {
      await navigator.share({ title: recipe.title, text: getIngredientsText() });
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        toast.error('Teilen fehlgeschlagen');
      }
    }
  }

  async function copyIngredients() {
    await navigator.clipboard.writeText(getIngredientsText());
    toast.success('In Zwischenablage kopiert');
  }

  function formatAmount(amount: string | null, unit: string | null): string {
    if (amount === null || amount === '') {
      return unit || '';
    }
    // Apply servings scaling if needed
    const newServ = displayServings ?? recipe?.servings ?? 1;
    const oldServ = recipe?.servings ?? 1;
    const scaled = newServ !== oldServ
      ? scaleAmount(amount, newServ, oldServ)
      : amount;
    return unit ? `${scaled} ${unit}` : scaled;
  }

  function adjustServings(delta: number) {
    if (!recipe) return;
    const current = displayServings ?? recipe.servings;
    const newValue = Math.max(1, current + delta);
    setDisplayServings(newValue);
  }

  function halfServings() {
    if (!recipe) return;
    const current = displayServings ?? recipe.servings;
    if (current % 2 === 0 && current > 1) {
      setDisplayServings(current / 2);
    }
  }

  function doubleServings() {
    if (!recipe) return;
    const current = displayServings ?? recipe.servings;
    setDisplayServings(current * 2);
  }

  async function saveAdjustedServings() {
    if (!recipe || !displayServings || displayServings === recipe.servings) return;

    setSavingServings(true);
    try {
      const adjustedIngredients = recipe.ingredients.map(ing => ({
        name: ing.name,
        amount: ing.amount !== null ? scaleAmount(ing.amount, displayServings, recipe.servings) : null,
        unit: ing.unit,
      }));

      const res = await fetch(`/api/recipes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: recipe.title,
          instructions: recipe.instructions,
          servings: displayServings,
          sourceUrl: recipe.sourceUrl,
          imageData: recipe.imageData,
          ingredients: adjustedIngredients,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setRecipe(updated);
        setDisplayServings(null);
        toast.success('Rezept gespeichert');
      } else {
        toast.error('Fehler beim Speichern');
      }
    } catch {
      toast.error('Verbindungsfehler');
    } finally {
      setSavingServings(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 space-y-4">
          <Skeleton className="aspect-video w-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/4" />
          <div className="space-y-2 mt-6">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
      </div>
    );
  }

  if (!recipe) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
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
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold">{recipe.title}</h1>
            <div className="flex gap-2">
              <Link href={`/recipes/${id}/edit`}>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  <span className="sr-only">Bearbeiten</span>
                </Button>
              </Link>
              <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => setDeleteDialogOpen(true)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                <span className="sr-only">Löschen</span>
              </Button>
            </div>
          </div>
          <div> {/* This is the new wrapper div */}
            <div className="flex items-center gap-3 mt-1">
              <span className="text-muted-foreground">Portionen:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={halfServings}
                  className="w-8 h-8 rounded-full border border-input flex items-center justify-center hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={(displayServings ?? recipe.servings) % 2 !== 0 || (displayServings ?? recipe.servings) <= 1}
                >
                  <span className="text-sm font-medium">½</span>
                </button>
                <button
                  type="button"
                  onClick={() => adjustServings(-1)}
                  className="w-8 h-8 rounded-full border border-input flex items-center justify-center hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                <button
                  type="button"
                  onClick={doubleServings}
                  className="w-8 h-8 rounded-full border border-input flex items-center justify-center hover:bg-accent transition-colors"
                >
                  <span className="text-sm font-medium">2×</span>
                </button>
              </div>
              {displayServings && displayServings !== recipe.servings && (
                <>
                  <button
                    type="button"
                    onClick={() => setDisplayServings(null)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    (Original: {recipe.servings})
                  </button>
                  <button
                    type="button"
                    onClick={saveAdjustedServings}
                    disabled={savingServings}
                    className="ml-auto text-xs px-2 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {savingServings ? 'Speichern...' : 'Speichern'}
                  </button>
                </>
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
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-xl font-bold mr-1">Zutaten</h2>
              <button
                type="button"
                onClick={copyIngredients}
                className="p-1.5 rounded-full hover:bg-accent transition-colors text-muted-foreground"
                title="Zutaten kopieren"
              >
                <Copy className="w-[18px] h-[18px]" />
              </button>
              {canShare && (
                <button
                  type="button"
                  onClick={shareIngredients}
                  className="p-1.5 rounded-full hover:bg-accent transition-colors text-muted-foreground"
                  title="Zutaten teilen"
                >
                  <Share2 className="w-[18px] h-[18px]" />
                </button>
              )}
            </div>
            <ul className="space-y-2">
              {recipe.ingredients.map((ing, index) => (
                <li key={ing.id || index} className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => toggleIngredient(index)}
                    className={`w-6 h-6 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
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
            <h2 className="text-xl font-bold mb-3">Zubereitung</h2>
            <div className="prose max-w-none dark:prose-invert prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground">
              <ReactMarkdown
                components={{
                  h1: ({ node, ...props }) => <h1 className="text-lg font-bold mt-4 mb-2" {...props} />,
                  h2: ({ node, ...props }) => <h2 className="text-base font-semibold mt-4 mb-3" {...props} />,
                  h3: ({ node, ...props }) => <h3 className="text-base font-semibold mt-3 mb-1" {...props} />,
                  h4: ({ node, ...props }) => <h4 className="text-base font-medium mt-2 mb-1" {...props} />,
                  li: ({ node, children, ...props }) => {
                    const key = String(children).slice(0, 50);
                    const isChecked = checkedSteps.has(key);
                    return (
                      <li
                        className={`cursor-pointer transition-colors hover:bg-muted/50 rounded px-1 -mx-1 ${isChecked ? 'opacity-50 line-through' : ''}`}
                        onClick={() => {
                          setCheckedSteps(prev => {
                            const next = new Set(prev);
                            if (next.has(key)) {
                              next.delete(key);
                            } else {
                              next.add(key);
                            }
                            return next;
                          });
                        }}
                        {...props}
                      >
                        {children}
                      </li>
                    );
                  },
                }}
              >
                {recipe.instructions}
              </ReactMarkdown>
            </div>
          </section>
        </div>
      </main>

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
