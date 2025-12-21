'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

interface ImageUploadProps {
  value: string | null;
  onChange: (value: string | null) => void;
  title?: string;
  ingredients?: { name: string }[];
}

async function compressImage(file: File, maxSizeKB: number = 500): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Max dimensions
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

        // Start with high quality and reduce if needed
        let quality = 0.8;
        let result = canvas.toDataURL('image/jpeg', quality);

        // Reduce quality until size is acceptable
        while (result.length > maxSizeKB * 1024 * 1.37 && quality > 0.1) {
          quality -= 0.1;
          result = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(result);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function ImageUpload({ value, onChange, title, ingredients }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setLoading(true);

    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Bitte wähle ein Bild aus');
        return;
      }

      const compressed = await compressImage(file);
      onChange(compressed);
    } catch {
      setError('Fehler beim Verarbeiten des Bildes');
    } finally {
      setLoading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }

  async function handleGenerate() {
    if (!title?.trim()) {
      setError('Bitte gib zuerst einen Titel ein');
      return;
    }

    setError('');
    setGenerating(true);

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          ingredients: ingredients || [],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Fehler beim Generieren');
        return;
      }

      onChange(data.imageData);
    } catch {
      setError('Verbindungsfehler');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Bild</label>

      {value ? (
        <div className="relative">
          <img
            src={value}
            alt="Rezeptbild"
            className="w-full aspect-video object-cover rounded-md"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={() => onChange(null)}
          >
            Entfernen
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div
            className="border-2 border-dashed border-muted-foreground/25 rounded-md p-6 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
            onClick={() => !loading && !generating && inputRef.current?.click()}
          >
            {loading ? (
              <p className="text-muted-foreground">Bild wird verarbeitet...</p>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mx-auto mb-2 text-muted-foreground"
                >
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                </svg>
                <p className="text-muted-foreground text-sm">
                  Foto aufnehmen oder auswählen
                </p>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">oder</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGenerate}
            disabled={generating || loading}
          >
            {generating ? (
              <>
                <div className="animate-spin mr-2 w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                Bild wird generiert...
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2"
                >
                  <path d="M12 3v6" />
                  <circle cx="12" cy="12" r="1" />
                  <path d="M17.2 7.2 12 12" />
                  <path d="M21 12h-6" />
                  <path d="M17.2 16.8 12 12" />
                  <path d="M12 21v-6" />
                  <path d="M6.8 16.8 12 12" />
                  <path d="M3 12h6" />
                  <path d="M6.8 7.2 12 12" />
                </svg>
                Bild mit KI generieren
              </>
            )}
          </Button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
