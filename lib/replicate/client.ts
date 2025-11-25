import type { Ingredient, RecipeInput } from '@/lib/types/recipe';
import Replicate from 'replicate';
import { IMAGE_RECIPE_PROMPT, URL_RECIPE_PROMPT } from './prompts';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

interface ExtractedRecipe {
  title: string;
  servings: number;
  ingredients: { name: string; amount: number | null; unit: string | null }[];
  instructions: string;
}

function parseRecipeResponse(output: unknown): RecipeInput {
  let jsonStr: string;

  if (typeof output === 'string') {
    jsonStr = output;
  } else if (Array.isArray(output)) {
    jsonStr = output.join('');
  } else {
    throw new Error('Unexpected output format from model');
  }

  // Try to extract JSON from the response
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }

  let parsed: ExtractedRecipe;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error('Failed to parse JSON from response');
  }

  // Validate required fields
  if (!parsed.title || typeof parsed.title !== 'string') {
    throw new Error('Missing or invalid title');
  }

  if (!parsed.instructions || typeof parsed.instructions !== 'string') {
    throw new Error('Missing or invalid instructions');
  }

  if (!Array.isArray(parsed.ingredients) || parsed.ingredients.length === 0) {
    throw new Error('Missing or invalid ingredients');
  }

  // Transform to RecipeInput format
  const ingredients: Omit<Ingredient, 'id' | 'sortOrder'>[] = parsed.ingredients
    .filter((ing) => ing.name && typeof ing.name === 'string')
    .map((ing) => ({
      name: ing.name.trim(),
      amount: typeof ing.amount === 'number' ? ing.amount : null,
      unit: ing.unit && typeof ing.unit === 'string' ? ing.unit.trim() : null,
    }));

  return {
    title: parsed.title.trim(),
    instructions: parsed.instructions.trim(),
    servings: typeof parsed.servings === 'number' ? parsed.servings : 4,
    ingredients,
  };
}

import { getSetting } from '../db/queries/settings';

// ... existing code ...

export async function extractRecipeFromImage(imageBase64: string): Promise<RecipeInput> {
  const imageUrl = imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`;

  const model = await getSetting('recipe_model') || 'openai/gpt-5-mini';

  // Define input based on model
  const input: Record<string, unknown> = {
    prompt: IMAGE_RECIPE_PROMPT,
  };

  if (model === 'anthropic/claude-4.5-sonnet') {
    // Claude uses 'image' (string) and max_tokens
    input.image = imageUrl;
    input.max_tokens = 2048;
  } else if (model.startsWith('google/gemini')) {
    // Gemini expects 'images' (array)
    input.images = [imageUrl];
  } else {
    // Default (gpt-5) uses image_input array
    input.image_input = [imageUrl];
    input.reasoning_effort = 'minimal';
  }

  const output = await replicate.run(model as `${string}/${string}`, { input });

  return parseRecipeResponse(output);
}

export async function extractRecipeFromText(content: string): Promise<RecipeInput> {
  // Truncate content if too long
  const truncatedContent = content.length > 10000 ? content.substring(0, 10000) : content;

  const model = await getSetting('recipe_model') || 'openai/gpt-5-mini';

  const input: Record<string, unknown> = {
    prompt: `${URL_RECIPE_PROMPT}\n\n${truncatedContent}`,
  };

  if (model === 'anthropic/claude-4.5-sonnet') {
    input.max_tokens = 2048;
  }

  const output = await replicate.run(model as `${string}/${string}`, { input });

  return parseRecipeResponse(output);
}

export async function generateRecipeImage(title: string, ingredients: string[]): Promise<Buffer> {
  const ingredientsList = ingredients.slice(0, 12).join(', ');
  const prompt = `Professional food photography of "${title}" dish with ${ingredientsList}, appetizing, well-plated on a wooden surface, some of the ingredients visible behind and around the dish, natural lighting, shallow depth of field, isometric view`;

  const output = await replicate.run('google/nano-banana', {
    input: {
      prompt,
      aspect_ratio: '16:9',
    },
  });

  // Output is a FileOutput object - can be used directly as a Buffer
  if (output instanceof Buffer) {
    return output;
  }

  // If it's a FileOutput with url() method
  if (output && typeof output === 'object' && typeof (output as { url?: () => string }).url === 'function') {
    const url = (output as { url: () => string }).url();
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch generated image');
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  // If it's already array-like (can be written to file directly)
  if (output && typeof output === 'object') {
    return Buffer.from(output as ArrayBuffer);
  }

  throw new Error('Unexpected output format from image generation model');
}
