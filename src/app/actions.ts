'use server';

import { identifyIngredients } from '@/ai/flows/identify-ingredients';
import { generateRecipes, type GenerateRecipesOutput } from '@/ai/flows/generate-recipes';

interface IdentifyResult {
  ingredients?: string[];
  error?: string;
}

export async function handleIdentifyIngredients(prevState: any, formData: FormData): Promise<IdentifyResult> {
  const file = formData.get('image') as File;
  if (!file || file.size === 0) {
    return { error: 'Please select an image file.' };
  }

  // Check for file type
  if (!file.type.startsWith('image/')) {
    return { error: 'Invalid file type. Please upload an image.' };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const photoDataUri = `data:${file.type};base64,${buffer.toString('base64')}`;

    const result = await identifyIngredients({ photoDataUri });
    if (result.ingredients && result.ingredients.length > 0) {
      return { ingredients: result.ingredients };
    } else {
      return { error: 'Could not identify any ingredients. Please try a different photo.' };
    }
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred.';
    return { error: `An unexpected error occurred while analyzing the image: ${errorMessage}` };
  }
}

interface RecipeResult {
    recipes?: GenerateRecipesOutput['recipes'];
    error?: string;
}

export async function handleGenerateRecipes(ingredients: string[]): Promise<RecipeResult> {
    if (!ingredients || ingredients.length === 0) {
        return { error: 'No ingredients were provided to generate recipes.' };
    }
    
    try {
        const result = await generateRecipes({ ingredients: ingredients.join(', ') });
        if (result.recipes && result.recipes.length > 0) {
            return { recipes: result.recipes };
        } else {
            return { error: 'Could not generate any recipes with the given ingredients.' };
        }
    } catch(e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred.';
        return { error: `An unexpected error occurred while generating recipes: ${errorMessage}` };
    }
}
