import { getAllRecipesWithIngredients } from '@/lib/db/queries/recipes';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';

interface ExportIngredient {
  name: string;
  amount: number | null;
  unit: string | null;
}

interface ExportRecipe {
  title: string;
  instructions: string;
  servings: number;
  imageData: string | null;
  sourceUrl: string | null;
  ingredients: ExportIngredient[];
}

interface ExportData {
  version: number;
  exportedAt: string;
  recipes: ExportRecipe[];
}

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const recipes = await getAllRecipesWithIngredients();

    const exportData: ExportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      recipes: recipes.map((recipe) => ({
        title: recipe.title,
        instructions: recipe.instructions,
        servings: recipe.servings,
        imageData: recipe.imageData,
        sourceUrl: recipe.sourceUrl,
        ingredients: recipe.ingredients.map((ing) => ({
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
        })),
      })),
    };

    const filename = `rezepte-export-${new Date().toISOString().split('T')[0]}.json`;

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting recipes:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
