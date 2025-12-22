'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { TagBadge, colorClasses } from '@/components/tags/tag-badge';
import type { Tag, TagColor } from '@/lib/types/recipe';
import { ArrowLeft, Pencil, Trash2, Check, X, Plus } from 'lucide-react';
import { toast } from 'sonner';

const TAG_COLORS: TagColor[] = [
  'gray', 'red', 'orange', 'amber', 'yellow',
  'green', 'emerald', 'cyan', 'blue', 'purple', 'pink'
];

interface TagWithUsage extends Tag {
  usageCount?: number;
}

function TagsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromRecipeId = searchParams.get('from');

  const [tags, setTags] = useState<TagWithUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState<TagColor>('blue');
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState<TagColor>('blue');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchTags();
  }, []);

  async function fetchTags() {
    try {
      const response = await fetch('/api/tags');
      if (!response.ok) throw new Error('Failed to fetch tags');
      const data = await response.json();

      // Fetch usage counts for each tag
      const tagsWithUsage = await Promise.all(
        data.map(async (tag: Tag) => {
          try {
            const res = await fetch(`/api/tags/${tag.id}`);
            if (res.ok) {
              const tagData = await res.json();
              return { ...tag, usageCount: tagData.usageCount || 0 };
            }
          } catch {
            // Ignore errors for usage count
          }
          return { ...tag, usageCount: 0 };
        })
      );

      setTags(tagsWithUsage);
    } catch (error) {
      console.error('Error fetching tags:', error);
      toast.error('Tags konnten nicht geladen werden');
    } finally {
      setIsLoading(false);
    }
  }

  function handleBack() {
    if (fromRecipeId) {
      router.push(`/recipes/${fromRecipeId}/edit`);
    } else {
      router.back();
    }
  }

  function startEditing(tag: TagWithUsage) {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditName('');
    setEditColor('blue');
  }

  async function saveEdit() {
    if (!editName.trim() || editingId === null) return;

    try {
      const response = await fetch(`/api/tags/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), color: editColor }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update tag');
      }

      const updatedTag = await response.json();
      setTags(tags.map((t) => (t.id === editingId ? { ...t, ...updatedTag } : t)));
      cancelEditing();
      toast.success('Tag aktualisiert');
    } catch (error) {
      console.error('Error updating tag:', error);
      toast.error(error instanceof Error ? error.message : 'Tag konnte nicht aktualisiert werden');
    }
  }

  async function handleDelete(tagId: number) {
    setDeletingId(tagId);

    try {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete tag');
      }

      setTags(tags.filter((t) => t.id !== tagId));
      toast.success('Tag gelöscht');
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast.error(error instanceof Error ? error.message : 'Tag konnte nicht gelöscht werden');
    } finally {
      setDeletingId(null);
    }
  }

  async function handleCreate() {
    if (!newName.trim()) return;

    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), color: newColor }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create tag');
      }

      const newTag = await response.json();
      setTags([...tags, { ...newTag, usageCount: 0 }]);
      setNewName('');
      setIsCreating(false);
      toast.success('Tag erstellt');
    } catch (error) {
      console.error('Error creating tag:', error);
      toast.error(error instanceof Error ? error.message : 'Tag konnte nicht erstellt werden');
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Tags verwalten</h1>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* Create new tag */}
        <Card className="gap-2">
          <CardHeader>
            <CardTitle className="text-base">Neuer Tag</CardTitle>
          </CardHeader>
          <CardContent>
            {isCreating ? (
              <div className="space-y-3">
                <Input
                  type="text"
                  placeholder="Tag-Name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreate();
                    }
                    if (e.key === 'Escape') {
                      setIsCreating(false);
                      setNewName('');
                    }
                  }}
                />
                <div className="flex flex-wrap gap-1.5">
                  {TAG_COLORS.map((color) => {
                    const colors = colorClasses[color];
                    return (
                      <button
                        key={color}
                        type="button"
                        className={`
                          h-7 w-7 rounded-full flex items-center justify-center
                          ${colors.bg}
                          ${newColor === color ? 'ring-2 ring-offset-1 ring-primary' : ''}
                        `}
                        onClick={() => setNewColor(color)}
                      >
                        {newColor === color && (
                          <Check className={`h-3.5 w-3.5 ${colors.text}`} />
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreate} disabled={!newName.trim()} className="flex-1">
                    Erstellen
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreating(false);
                      setNewName('');
                    }}
                  >
                    Abbrechen
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsCreating(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Tag erstellen
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Tag list */}
        <Card className="gap-2">
          <CardHeader>
            <CardTitle className="text-base">Alle Tags ({tags.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-4 w-16" />
                    <div className="flex-1" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                ))}
              </div>
            ) : tags.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Noch keine Tags vorhanden
              </p>
            ) : (
              <div className="space-y-2">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="py-2 border-b last:border-0"
                  >
                    {editingId === tag.id ? (
                      // Edit mode
                      <div className="space-y-2">
                        <Input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              saveEdit();
                            }
                            if (e.key === 'Escape') {
                              cancelEditing();
                            }
                          }}
                        />
                        <div className="flex flex-wrap gap-1">
                          {TAG_COLORS.map((color) => {
                            const colors = colorClasses[color];
                            return (
                              <button
                                key={color}
                                type="button"
                                className={`
                                  h-6 w-6 rounded-full flex items-center justify-center
                                  ${colors.bg}
                                  ${editColor === color ? 'ring-2 ring-offset-1 ring-primary' : ''}
                                `}
                                onClick={() => setEditColor(color)}
                              >
                                {editColor === color && (
                                  <Check className={`h-3 w-3 ${colors.text}`} />
                                )}
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={saveEdit} disabled={!editName.trim()}>
                            <Check className="h-4 w-4 mr-1" />
                            Speichern
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEditing}>
                            <X className="h-4 w-4 mr-1" />
                            Abbrechen
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // View mode - 2 rows on mobile
                      <div className="space-y-1">
                        <TagBadge tag={tag} />
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            {tag.usageCount === 1 ? '1 Rezept' : `${tag.usageCount} Rezepte`}
                          </span>
                          <div className="flex">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => startEditing(tag)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(tag.id)}
                              disabled={deletingId === tag.id}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function TagsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3 p-4">
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-6 w-32" />
          </div>
        </header>
        <main className="p-4">
          <Skeleton className="h-48 w-full" />
        </main>
      </div>
    }>
      <TagsPageContent />
    </Suspense>
  );
}
