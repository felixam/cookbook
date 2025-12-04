import { query, getClient } from '../connection';
import type { Recipe, RecipeInput, RecipeListItem, Ingredient } from '@/lib/types/recipe';

interface RecipeRow {
  id: string;
  title: string;
  instructions: string;
  servings: number;
  image_data: string | null;
  source_url: string | null;
  created_at: Date;
  updated_at: Date;
}

interface IngredientRow {
  id: number;
  recipe_id: string;
  name: string;
  amount: string | null;
  unit: string | null;
  sort_order: number;
}

export async function getAllRecipes(searchQuery?: string): Promise<RecipeListItem[]> {
  let sql = `
    SELECT id, title, image_data, servings, created_at
    FROM recipes_recipes
  `;
  const params: string[] = [];

  if (searchQuery && searchQuery.trim()) {
    sql += ` WHERE to_tsvector('german', title) @@ plainto_tsquery('german', $1)
             OR title ILIKE $2`;
    params.push(searchQuery.trim(), `%${searchQuery.trim()}%`);
  }

  sql += ` ORDER BY created_at DESC`;

  const result = await query<RecipeRow>(sql, params);

  return result.rows.map((row) => ({
    id: row.id,
    title: row.title,
    imageData: row.image_data,
    servings: row.servings,
    createdAt: row.created_at,
  }));
}

export async function getRecipeById(id: string): Promise<Recipe | null> {
  const recipeResult = await query<RecipeRow>(
    `SELECT id, title, instructions, servings, image_data, source_url, created_at, updated_at
     FROM recipes_recipes WHERE id = $1`,
    [id]
  );

  if (recipeResult.rows.length === 0) {
    return null;
  }

  const row = recipeResult.rows[0];

  const ingredientsResult = await query<IngredientRow>(
    `SELECT id, recipe_id, name, amount, unit, sort_order
     FROM recipes_ingredients WHERE recipe_id = $1 ORDER BY sort_order`,
    [id]
  );

  const ingredients: Ingredient[] = ingredientsResult.rows.map((ing) => ({
    id: ing.id,
    name: ing.name,
    amount: ing.amount ? parseFloat(ing.amount) : null,
    unit: ing.unit,
    sortOrder: ing.sort_order,
  }));

  return {
    id: row.id,
    title: row.title,
    instructions: row.instructions,
    servings: row.servings,
    imageData: row.image_data,
    sourceUrl: row.source_url,
    ingredients,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createRecipe(input: RecipeInput): Promise<Recipe> {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const recipeResult = await client.query<RecipeRow>(
      `INSERT INTO recipes_recipes (title, instructions, servings, image_data, source_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, instructions, servings, image_data, source_url, created_at, updated_at`,
      [input.title, input.instructions, input.servings, input.imageData || null, input.sourceUrl || null]
    );

    const recipe = recipeResult.rows[0];

    const ingredients: Ingredient[] = [];
    for (let i = 0; i < input.ingredients.length; i++) {
      const ing = input.ingredients[i];
      const ingResult = await client.query<IngredientRow>(
        `INSERT INTO recipes_ingredients (recipe_id, name, amount, unit, sort_order)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, recipe_id, name, amount, unit, sort_order`,
        [recipe.id, ing.name, ing.amount, ing.unit, i]
      );
      const row = ingResult.rows[0];
      ingredients.push({
        id: row.id,
        name: row.name,
        amount: row.amount ? parseFloat(row.amount) : null,
        unit: row.unit,
        sortOrder: row.sort_order,
      });
    }

    await client.query('COMMIT');

    return {
      id: recipe.id,
      title: recipe.title,
      instructions: recipe.instructions,
      servings: recipe.servings,
      imageData: recipe.image_data,
      sourceUrl: recipe.source_url,
      ingredients,
      createdAt: recipe.created_at,
      updatedAt: recipe.updated_at,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function updateRecipe(id: string, input: RecipeInput): Promise<Recipe | null> {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const recipeResult = await client.query<RecipeRow>(
      `UPDATE recipes_recipes
       SET title = $1, instructions = $2, servings = $3, image_data = $4, source_url = $5
       WHERE id = $6
       RETURNING id, title, instructions, servings, image_data, source_url, created_at, updated_at`,
      [input.title, input.instructions, input.servings, input.imageData || null, input.sourceUrl || null, id]
    );

    if (recipeResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    const recipe = recipeResult.rows[0];

    // Delete existing ingredients and re-insert
    await client.query('DELETE FROM recipes_ingredients WHERE recipe_id = $1', [id]);

    const ingredients: Ingredient[] = [];
    for (let i = 0; i < input.ingredients.length; i++) {
      const ing = input.ingredients[i];
      const ingResult = await client.query<IngredientRow>(
        `INSERT INTO recipes_ingredients (recipe_id, name, amount, unit, sort_order)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, recipe_id, name, amount, unit, sort_order`,
        [recipe.id, ing.name, ing.amount, ing.unit, i]
      );
      const row = ingResult.rows[0];
      ingredients.push({
        id: row.id,
        name: row.name,
        amount: row.amount ? parseFloat(row.amount) : null,
        unit: row.unit,
        sortOrder: row.sort_order,
      });
    }

    await client.query('COMMIT');

    return {
      id: recipe.id,
      title: recipe.title,
      instructions: recipe.instructions,
      servings: recipe.servings,
      imageData: recipe.image_data,
      sourceUrl: recipe.source_url,
      ingredients,
      createdAt: recipe.created_at,
      updatedAt: recipe.updated_at,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteRecipe(id: string): Promise<boolean> {
  const result = await query('DELETE FROM recipes_recipes WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function getAllRecipesWithIngredients(): Promise<Recipe[]> {
  const recipesResult = await query<RecipeRow>(
    `SELECT id, title, instructions, servings, image_data, source_url, created_at, updated_at
     FROM recipes_recipes ORDER BY created_at DESC`
  );

  const recipes: Recipe[] = [];

  for (const row of recipesResult.rows) {
    const ingredientsResult = await query<IngredientRow>(
      `SELECT id, recipe_id, name, amount, unit, sort_order
       FROM recipes_ingredients WHERE recipe_id = $1 ORDER BY sort_order`,
      [row.id]
    );

    const ingredients: Ingredient[] = ingredientsResult.rows.map((ing) => ({
      id: ing.id,
      name: ing.name,
      amount: ing.amount ? parseFloat(ing.amount) : null,
      unit: ing.unit,
      sortOrder: ing.sort_order,
    }));

    recipes.push({
      id: row.id,
      title: row.title,
      instructions: row.instructions,
      servings: row.servings,
      imageData: row.image_data,
      sourceUrl: row.source_url,
      ingredients,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  return recipes;
}

export async function recipeExistsByTitle(title: string): Promise<boolean> {
  const result = await query<{ exists: boolean }>(
    `SELECT EXISTS(SELECT 1 FROM recipes_recipes WHERE LOWER(title) = LOWER($1)) as exists`,
    [title]
  );
  return result.rows[0].exists;
}
