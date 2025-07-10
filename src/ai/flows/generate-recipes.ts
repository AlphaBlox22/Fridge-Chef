// src/ai/flows/generate-recipes.ts
'use server';
/**
 * @fileOverview AI flow to generate simple recipe suggestions based on identified ingredients.
 *
 * - generateRecipes - A function that generates recipe suggestions.
 * - GenerateRecipesInput - The input type for the generateRecipes function.
 * - GenerateRecipesOutput - The return type for the generateRecipes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateRecipesInputSchema = z.object({
  ingredients: z
    .string()
    .describe('A comma-separated list of ingredients identified from the fridge photo.'),
});
export type GenerateRecipesInput = z.infer<typeof GenerateRecipesInputSchema>;

const GenerateRecipesOutputSchema = z.object({
  recipes: z.array(
    z.object({
      name: z.string().describe('The name of the recipe.'),
      ingredients: z.string().describe('The ingredients required for the recipe.'),
      instructions: z.string().describe('The step-by-step instructions for the recipe.'),
    })
  ).describe('An array of recipe suggestions based on the available ingredients.'),
});
export type GenerateRecipesOutput = z.infer<typeof GenerateRecipesOutputSchema>;

export async function generateRecipes(input: GenerateRecipesInput): Promise<GenerateRecipesOutput> {
  return generateRecipesFlow(input);
}

const generateRecipesPrompt = ai.definePrompt({
  name: 'generateRecipesPrompt',
  input: {schema: GenerateRecipesInputSchema},
  output: {schema: GenerateRecipesOutputSchema},
  prompt: `You are a recipe suggestion AI. Given a list of ingredients, you will suggest simple recipes that can be made with those ingredients.

  Ingredients: {{{ingredients}}}

  Please provide 3 recipe suggestions.
  Each recipe must have a name, the required ingredients from the provided list, and step-by-step instructions.
  The ingredients field in the output should only contain ingredients from the input. Do not suggest ingredients which are not present in the input.
  Recipes must be simple, and able to be prepared in under 30 minutes.
  `,
});

const generateRecipesFlow = ai.defineFlow(
  {
    name: 'generateRecipesFlow',
    inputSchema: GenerateRecipesInputSchema,
    outputSchema: GenerateRecipesOutputSchema,
  },
  async input => {
    const {output} = await generateRecipesPrompt(input);
    return output!;
  }
);
