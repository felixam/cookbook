'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import type { RecipeListItem } from '@/lib/types/recipe';
import { motion } from 'framer-motion';
import { Clock, Users } from 'lucide-react';

interface RecipeCardProps {
  recipe: RecipeListItem;
  index?: number;
}

export function RecipeCard({ recipe, index = 0 }: RecipeCardProps) {
  return (
    <Link href={`/recipes/${recipe.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.1 }}
        whileHover={{ y: -5 }}
        className="h-full"
      >
        <Card className="overflow-hidden h-full border-none shadow-md hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur-sm group p-0 gap-0">
          <div className="aspect-[16/9] relative bg-muted overflow-hidden">
            {recipe.imageData ? (
              <motion.img
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.4 }}
                src={recipe.imageData}
                alt={recipe.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-secondary/50">
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
                  className="opacity-50"
                >
                  <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
                  <line x1="6" x2="18" y1="17" y2="17" />
                </svg>
              </div>
            )}
            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <Users size={12} />
              <span>{recipe.servings}</span>
            </div>
          </div>
          <CardContent className="p-4">
            <h3 className="font-bold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {recipe.title}
            </h3>
            <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
              <Clock size={12} />
              <span>
                {new Date(recipe.createdAt).toLocaleDateString('de-DE', {
                  day: 'numeric',
                  month: 'long',
                })}
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}
