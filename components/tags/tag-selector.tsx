'use client';

import { useState, useEffect, useRef } from 'react';
import type { Tag, TagColor } from '@/lib/types/recipe';
import { TagBadge, colorClasses } from './tag-badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, ChevronDown, Check } from 'lucide-react';

interface TagSelectorProps {
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
}

const TAG_COLORS: TagColor[] = [
  'gray', 'red', 'orange', 'amber', 'yellow',
  'green', 'emerald', 'cyan', 'blue', 'purple', 'pink'
];

export function TagSelector({ selectedTags, onTagsChange }: TagSelectorProps) {
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState<TagColor>('blue');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsCreating(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function fetchTags() {
    try {
      const response = await fetch('/api/tags');
      if (!response.ok) throw new Error('Failed to fetch tags');
      const tags = await response.json();
      setAllTags(tags);
    } catch (err) {
      console.error('Error fetching tags:', err);
      setError('Tags konnten nicht geladen werden');
    } finally {
      setIsLoading(false);
    }
  }

  function handleTagToggle(tag: Tag) {
    const isSelected = selectedTags.some((t) => t.id === tag.id);
    if (isSelected) {
      onTagsChange(selectedTags.filter((t) => t.id !== tag.id));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  }

  function handleRemoveTag(tagId: number) {
    onTagsChange(selectedTags.filter((t) => t.id !== tagId));
  }

  async function handleCreateTag() {
    if (!newTagName.trim()) return;

    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName.trim(), color: newTagColor }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create tag');
      }

      const newTag = await response.json();
      setAllTags([...allTags, newTag]);
      onTagsChange([...selectedTags, newTag]);
      setNewTagName('');
      setIsCreating(false);
    } catch (err) {
      console.error('Error creating tag:', err);
      setError(err instanceof Error ? err.message : 'Tag konnte nicht erstellt werden');
    }
  }

  const availableTags = allTags.filter((tag) => !selectedTags.some((t) => t.id === tag.id));

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Tags</label>

      {/* Selected tags */}
      <div className="flex flex-wrap gap-1.5 min-h-[28px]">
        {selectedTags.map((tag) => (
          <TagBadge
            key={tag.id}
            tag={tag}
            onRemove={() => handleRemoveTag(tag.id)}
            size="sm"
          />
        ))}
      </div>

      {/* Tag selector dropdown */}
      <div className="relative" ref={dropdownRef}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full justify-between"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
        >
          <span className="text-muted-foreground">
            {isLoading ? 'Laden...' : 'Tag hinzufügen'}
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-md">
            {error && (
              <div className="px-2 py-1 text-xs text-red-500">{error}</div>
            )}

            {/* Available tags */}
            <div className="max-h-40 overflow-y-auto">
              {availableTags.length === 0 && !isCreating && (
                <div className="px-2 py-1 text-sm text-muted-foreground">
                  {allTags.length === 0 ? 'Keine Tags vorhanden' : 'Alle Tags ausgewählt'}
                </div>
              )}
              {availableTags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent"
                  onClick={() => handleTagToggle(tag)}
                >
                  <TagBadge tag={tag} size="sm" />
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="my-1 border-t" />

            {/* Create new tag */}
            {isCreating ? (
              <div className="space-y-2 p-2">
                <Input
                  type="text"
                  placeholder="Tag-Name"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="h-8 text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateTag();
                    }
                    if (e.key === 'Escape') {
                      setIsCreating(false);
                      setNewTagName('');
                    }
                  }}
                />

                {/* Color picker */}
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
                          ${newTagColor === color ? 'ring-2 ring-offset-1 ring-primary' : ''}
                        `}
                        onClick={() => setNewTagColor(color)}
                      >
                        {newTagColor === color && (
                          <Check className={`h-3 w-3 ${colors.text}`} />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="flex-1"
                    onClick={handleCreateTag}
                    disabled={!newTagName.trim()}
                  >
                    Erstellen
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsCreating(false);
                      setNewTagName('');
                    }}
                  >
                    Abbrechen
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                onClick={() => setIsCreating(true)}
              >
                <Plus className="h-4 w-4" />
                Neuen Tag erstellen
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
