'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { BottomNav } from '@/components/layout/bottom-nav';
import { RecipeForm } from '@/components/recipes/recipe-form';
import { Skeleton } from '@/components/ui/skeleton';
import type { Recipe } from '@/lib/types/recipe';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditRecipePage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header title="Laden..." showBack backHref={`/recipes/${id}`} />
        <div className="p-4 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="aspect-video w-full" />
          <Skeleton className="h-10 w-24" />
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
          <Skeleton className="h-32 w-full" />
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
      <Header title="Rezept bearbeiten" showBack backHref={`/recipes/${id}`} />
      <main className="p-4">
        <RecipeForm recipe={recipe} />
      </main>
      <BottomNav />
    </div>
  );
}
