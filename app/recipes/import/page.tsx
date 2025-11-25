'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RecipeForm } from '@/components/recipes/recipe-form';
import { toast } from 'sonner';
import type { RecipeInput } from '@/lib/types/recipe';

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        const maxDim = 1200;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = (height / width) * maxDim;
            width = maxDim;
          } else {
            width = (width / height) * maxDim;
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export default function ImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState('');
  const [extractedRecipe, setExtractedRecipe] = useState<RecipeInput | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Bitte wähle ein Bild aus');
      return;
    }

    setLoading(true);
    setExtractedRecipe(null);

    try {
      const compressed = await compressImage(file);
      setPreviewImage(compressed);

      const res = await fetch('/api/import/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: compressed }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Fehler beim Importieren');
        return;
      }

      // Add the image to the extracted recipe
      setExtractedRecipe({
        ...data.data,
        imageData: compressed,
      });
      toast.success('Rezept erkannt! Bitte überprüfe die Daten.');
    } catch {
      toast.error('Verbindungsfehler');
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  async function handleUrlImport(e: React.FormEvent) {
    e.preventDefault();

    if (!url.trim()) {
      toast.error('Bitte gib eine URL ein');
      return;
    }

    setLoading(true);
    setExtractedRecipe(null);
    setPreviewImage(null);

    try {
      const res = await fetch('/api/import/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Fehler beim Importieren');
        return;
      }

      setExtractedRecipe(data.data);
      toast.success('Rezept erkannt! Bitte überprüfe die Daten.');
    } catch {
      toast.error('Verbindungsfehler');
    } finally {
      setLoading(false);
    }
  }

  function handleRecipeCreated() {
    toast.success('Rezept gespeichert!');
    router.push('/');
    router.refresh();
  }

  function resetImport() {
    setExtractedRecipe(null);
    setPreviewImage(null);
    setUrl('');
  }

  // Show recipe form if we have extracted data
  if (extractedRecipe) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header
          title="Rezept überprüfen"
          showBack
          actions={
            <Button variant="ghost" size="sm" onClick={resetImport}>
              Neu importieren
            </Button>
          }
        />
        <main className="p-4">
          <p className="text-sm text-muted-foreground mb-4">
            Überprüfe und bearbeite das erkannte Rezept, bevor du es speicherst.
          </p>
          <RecipeForm
            recipe={{
              id: '',
              ...extractedRecipe,
              imageData: extractedRecipe.imageData || previewImage || null,
              sourceUrl: extractedRecipe.sourceUrl || null,
              ingredients: extractedRecipe.ingredients.map((ing, i) => ({
                ...ing,
                id: i,
                sortOrder: i,
              })),
              createdAt: new Date(),
              updatedAt: new Date(),
            }}
            onSubmit={handleRecipeCreated}
          />
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title="Rezept importieren" showBack />

      <main className="p-4">
        <Tabs defaultValue="image" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="image">Aus Bild</TabsTrigger>
            <TabsTrigger value="url">Von URL</TabsTrigger>
          </TabsList>

          <TabsContent value="image" className="mt-6 space-y-4">
            <div
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
              onClick={() => !loading && fileInputRef.current?.click()}
            >
              {loading ? (
                <div className="space-y-3">
                  <div className="animate-spin mx-auto w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
                  <p className="text-muted-foreground">Rezept wird analysiert...</p>
                </div>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mx-auto mb-3 text-muted-foreground"
                  >
                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                    <circle cx="12" cy="13" r="3" />
                  </svg>
                  <p className="text-lg font-medium mb-1">Foto aufnehmen oder auswählen</p>
                  <p className="text-sm text-muted-foreground">
                    Fotografiere ein Rezept aus einem Kochbuch oder wähle ein Bild aus
                  </p>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
              disabled={loading}
            />
          </TabsContent>

          <TabsContent value="url" className="mt-6 space-y-4">
            <form onSubmit={handleUrlImport} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Rezept-URL</label>
                <Input
                  type="url"
                  placeholder="https://beispiel.de/rezept"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={loading}
                />
                <p className="text-sm text-muted-foreground">
                  Füge die URL einer Rezeptseite ein, um das Rezept automatisch zu importieren
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading || !url.trim()}>
                {loading ? (
                  <>
                    <div className="animate-spin mr-2 w-4 h-4 border-2 border-background border-t-transparent rounded-full" />
                    Wird importiert...
                  </>
                ) : (
                  'Rezept importieren'
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
}
