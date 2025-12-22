'use client';

import type { Tag, TagColor } from '@/lib/types/recipe';
import { X } from 'lucide-react';

interface TagBadgeProps {
  tag: Tag;
  onRemove?: () => void;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

const colorClasses: Record<TagColor, { bg: string; text: string }> = {
  gray: {
    bg: 'bg-gray-500/15 dark:bg-gray-400/20',
    text: 'text-gray-600 dark:text-gray-300',
  },
  red: {
    bg: 'bg-red-500/15 dark:bg-red-400/20',
    text: 'text-red-600 dark:text-red-300',
  },
  orange: {
    bg: 'bg-orange-500/15 dark:bg-orange-400/20',
    text: 'text-orange-600 dark:text-orange-300',
  },
  amber: {
    bg: 'bg-amber-500/15 dark:bg-amber-400/20',
    text: 'text-amber-600 dark:text-amber-300',
  },
  yellow: {
    bg: 'bg-yellow-500/15 dark:bg-yellow-400/20',
    text: 'text-yellow-600 dark:text-yellow-300',
  },
  green: {
    bg: 'bg-green-500/15 dark:bg-green-400/20',
    text: 'text-green-600 dark:text-green-300',
  },
  emerald: {
    bg: 'bg-emerald-500/15 dark:bg-emerald-400/20',
    text: 'text-emerald-600 dark:text-emerald-300',
  },
  cyan: {
    bg: 'bg-cyan-500/15 dark:bg-cyan-400/20',
    text: 'text-cyan-600 dark:text-cyan-300',
  },
  blue: {
    bg: 'bg-blue-500/15 dark:bg-blue-400/20',
    text: 'text-blue-600 dark:text-blue-300',
  },
  purple: {
    bg: 'bg-purple-500/15 dark:bg-purple-400/20',
    text: 'text-purple-600 dark:text-purple-300',
  },
  pink: {
    bg: 'bg-pink-500/15 dark:bg-pink-400/20',
    text: 'text-pink-600 dark:text-pink-300',
  },
};

export function TagBadge({ tag, onRemove, onClick, size = 'md' }: TagBadgeProps) {
  const colors = colorClasses[tag.color] || colorClasses.gray;
  const sizeClasses = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-0.5';

  const handleClick = onClick
    ? (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }
    : undefined;

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full font-medium
        ${colors.bg} ${colors.text}
        ${sizeClasses}
        ${onClick ? 'cursor-pointer hover:opacity-70' : ''}
      `}
      onClick={handleClick}
    >
      {tag.name}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
        >
          <X className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
        </button>
      )}
    </span>
  );
}

export { colorClasses };
