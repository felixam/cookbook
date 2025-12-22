'use client';

import { TagSelector } from '@/components/tags/tag-selector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Ingredient, Recipe, RecipeInput, Tag } from '@/lib/types/recipe';
import { cn } from '@/lib/utils';
import { isValidAmount } from '@/lib/utils/amount';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ImageUpload } from './image-upload';
import { IngredientInput } from './ingredient-input';
import { RefineDialog } from './refine-dialog';

type IngredientField = 'name' | 'amount' | 'unit';

interface ChangedFields {
  title: boolean;
  servings: boolean;
  instructions: boolean;
  ingredients: Map<number, Set<IngredientField>>;
}

const highlightClass = 'bg-yellow-50 dark:bg-yellow-900/20 ring-1 ring-yellow-200 dark:ring-yellow-800';

interface RecipeFormProps {
  recipe?: Recipe;
  onSubmit?: (recipe: Recipe) => void;
}

export function RecipeForm({ recipe, onSubmit }: RecipeFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState(recipe?.title || '');
  const [instructions, setInstructions] = useState(recipe?.instructions || '');
  const [servings, setServings] = useState(recipe?.servings || 4);
  const [sourceUrl, setSourceUrl] = useState(recipe?.sourceUrl || '');
  const [imageData, setImageData] = useState<string | null>(recipe?.imageData || null);
  const [ingredients, setIngredients] = useState<Omit<Ingredient, 'id' | 'sortOrder'>[]>(
    recipe?.ingredients.map(({ name, amount, unit }) => ({ name, amount, unit })) || [
      { name: '', amount: null, unit: null },
    ]
  );
  const [selectedTags, setSelectedTags] = useState<Tag[]>(recipe?.tags || []);
  const [changedFields, setChangedFields] = useState<ChangedFields>({
    title: false,
    servings: false,
    instructions: false,
    ingredients: new Map(),
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const validIngredients = ingredients.filter((ing) => ing.name.trim());

    if (validIngredients.length === 0) {
      setError('Mindestens eine Zutat ist erforderlich');
      setLoading(false);
      return;
    }

    // Validate ingredient amounts
    const invalidAmount = validIngredients.find(
      (ing) => ing.amount !== null && ing.amount !== '' && !isValidAmount(ing.amount)
    );
    if (invalidAmount) {
      setError(`Ungültige Mengenangabe: "${invalidAmount.amount}". Erlaubt sind Zahlen (z.B. 200), Dezimalzahlen (z.B. 2.5) oder Brüche (z.B. 1/2, 1 1/2).`);
      setLoading(false);
      return;
    }

    const data: RecipeInput = {
      title: title.trim(),
      instructions: instructions.trim(),
      servings,
      sourceUrl: sourceUrl.trim() || null,
      imageData,
      ingredients: validIngredients,
      tagIds: selectedTags.map((t) => t.id),
    };

    try {
      const isUpdate = Boolean(recipe?.id);
      const url = isUpdate ? `/api/recipes/${recipe!.id}` : '/api/recipes';
      const method = isUpdate ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || 'Ein Fehler ist aufgetreten');
        return;
      }

      if (onSubmit) {
        onSubmit(result);
      } else {
        router.push(`/recipes/${result.id}`);
        router.refresh();
      }
    } catch {
      setError('Verbindungsfehler');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Titel</Label>
        <Input
          id="title"
          placeholder="Name des Rezepts"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (changedFields.title) {
              setChangedFields((prev) => ({ ...prev, title: false }));
            }
          }}
          className={cn(changedFields.title && highlightClass)}
          required
        />
      </div>

      <TagSelector
        selectedTags={selectedTags}
        onTagsChange={setSelectedTags}
      />

      <ImageUpload
        value={imageData}
        onChange={setImageData}
        title={title}
        ingredients={ingredients.filter((ing) => ing.name.trim())}
      />

      <div className="space-y-2">
        <Label htmlFor="servings">Portionen</Label>
        <Input
          id="servings"
          type="number"
          min="1"
          value={servings}
          onChange={(e) => {
            setServings(parseInt(e.target.value) || 1);
            if (changedFields.servings) {
              setChangedFields((prev) => ({ ...prev, servings: false }));
            }
          }}
          className={cn('w-24', changedFields.servings && highlightClass)}
        />
      </div>

      <IngredientInput
        ingredients={ingredients}
        onChange={setIngredients}
        highlightedFields={changedFields.ingredients}
        onHighlightClear={(index, field) => {
          setChangedFields((prev) => {
            const newIngredients = new Map(prev.ingredients);
            const fieldSet = newIngredients.get(index);
            if (fieldSet) {
              fieldSet.delete(field);
              if (fieldSet.size === 0) {
                newIngredients.delete(index);
              }
            }
            return { ...prev, ingredients: newIngredients };
          });
        }}
      />

      <div className="flex justify-end">
        <RefineDialog
          recipe={{ title, servings, ingredients, instructions }}
          onRefine={(refined) => {
            const normalize = (s: string | null) => (s ?? '').trim().toLowerCase();

            // Detect which fields changed
            const changed: ChangedFields = {
              title: refined.title.trim() !== title.trim(),
              servings: refined.servings !== servings,
              instructions: refined.instructions.trim() !== instructions.trim(),
              ingredients: new Map(),
            };

            // Two-pass ingredient matching
            const matchedOldIndices = new Set<number>();
            const matches = new Map<number, (typeof ingredients)[number]>();

            // Pass 1: Match by name
            refined.ingredients.forEach((newIng, newIdx) => {
              const newName = normalize(newIng.name);
              const oldIdx = ingredients.findIndex(
                (old, i) => !matchedOldIndices.has(i) && normalize(old.name) === newName
              );
              if (oldIdx !== -1) {
                matchedOldIndices.add(oldIdx);
                matches.set(newIdx, ingredients[oldIdx]);
              }
            });

            // Pass 2: Match remaining by amount + unit
            refined.ingredients.forEach((newIng, newIdx) => {
              if (matches.has(newIdx)) return;
              const oldIdx = ingredients.findIndex((old, i) => {
                if (matchedOldIndices.has(i)) return false;
                return (
                  normalize(newIng.amount) === normalize(old.amount) &&
                  normalize(newIng.unit) === normalize(old.unit)
                );
              });
              if (oldIdx !== -1) {
                matchedOldIndices.add(oldIdx);
                matches.set(newIdx, ingredients[oldIdx]);
              }
            });

            // Detect ingredient field changes
            refined.ingredients.forEach((newIng, i) => {
              const oldIng = matches.get(i);
              const fieldChanges = new Set<IngredientField>();

              if (!oldIng) {
                fieldChanges.add('name');
                fieldChanges.add('amount');
                fieldChanges.add('unit');
              } else {
                if (normalize(newIng.name) !== normalize(oldIng.name)) fieldChanges.add('name');
                if (normalize(newIng.amount) !== normalize(oldIng.amount)) fieldChanges.add('amount');
                if (normalize(newIng.unit) !== normalize(oldIng.unit)) fieldChanges.add('unit');
              }

              if (fieldChanges.size > 0) {
                changed.ingredients.set(i, fieldChanges);
              }
            });

            setChangedFields(changed);
            setTitle(refined.title);
            setServings(refined.servings);
            setIngredients(refined.ingredients);
            setInstructions(refined.instructions);
          }}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="instructions">Zubereitung</Label>
        <p className="text-sm text-muted-foreground">
          Verwende Markdown für Formatierungen (z.B. # für Überschriften, - für Listen).
        </p>
        <Textarea
          id="instructions"
          placeholder={"# Vorbereitung\nZwiebeln würfeln...\n\n# Zubereitung\nAlles anbraten..."}
          value={instructions}
          onChange={(e) => {
            setInstructions(e.target.value);
            if (changedFields.instructions) {
              setChangedFields((prev) => ({ ...prev, instructions: false }));
            }
          }}
          className={cn(changedFields.instructions && highlightClass)}
          rows={8}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sourceUrl">Quelle (optional)</Label>
        <Input
          id="sourceUrl"
          type="url"
          placeholder="https://..."
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3 sticky bottom-16 md:bottom-0 z-40 bg-background py-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Speichern...' : recipe?.id ? 'Aktualisieren' : 'Rezept erstellen'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Abbrechen
        </Button>
      </div>
    </form>
  );
}
