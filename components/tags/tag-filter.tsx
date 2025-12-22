'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { Tag } from '@/lib/types/recipe';
import { TagBadge } from './tag-badge';
import { Button } from '@/components/ui/button';
import { Filter, X, Settings } from 'lucide-react';

interface TagFilterProps {
  selectedTagIds: number[];
  onTagsChange: (tagIds: number[]) => void;
}

export function TagFilter({ selectedTagIds, onTagsChange }: TagFilterProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function fetchTags() {
    try {
      const response = await fetch('/api/tags');
      if (response.ok) {
        const data = await response.json();
        setTags(data);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function toggleTag(tagId: number) {
    if (selectedTagIds.includes(tagId)) {
      onTagsChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onTagsChange([...selectedTagIds, tagId]);
    }
  }

  if (isLoading || tags.length === 0) {
    return null;
  }

  const selectedTags = tags.filter((t) => selectedTagIds.includes(t.id));
  const filterCount = selectedTagIds.length;

  return (
    <div className="relative" ref={popoverRef}>
      <Button
        variant="outline"
        size="icon"
        className="relative h-9 w-9 shrink-0"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Filter className="h-4 w-4" />
        {filterCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
            {filterCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-md border bg-popover p-3 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Nach Tags filtern</span>
            {filterCount > 0 && (
              <button
                type="button"
                onClick={() => onTagsChange([])}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                Alle entfernen
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => {
              const isSelected = selectedTagIds.includes(tag.id);
              return (
                <span
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`cursor-pointer transition-opacity ${isSelected ? 'opacity-100' : 'opacity-50 hover:opacity-75'}`}
                >
                  <TagBadge tag={tag} size="sm" />
                </span>
              );
            })}
          </div>

          {selectedTags.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <span className="text-xs text-muted-foreground">Aktive Filter:</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {selectedTags.map((tag) => (
                  <TagBadge
                    key={tag.id}
                    tag={tag}
                    size="sm"
                    onRemove={() => toggleTag(tag.id)}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="mt-3 pt-3 border-t">
            <Link
              href="/tags"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <Settings className="h-3 w-3" />
              Tags verwalten
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
