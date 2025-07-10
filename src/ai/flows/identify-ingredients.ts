// src/ai/flows/identify-ingredients.ts
'use server';
/**
 * @fileOverview This file defines a Genkit flow for identifying ingredients from an image.
 *
 * - identifyIngredients - A function that accepts an image data URI and returns a list of identified ingredients.
 * - IdentifyIngredientsInput - The input type for the identifyIngredients function.
 * - IdentifyIngredientsOutput - The return type for the identifyIngredients function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IdentifyIngredientsInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of fridge contents, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type IdentifyIngredientsInput = z.infer<typeof IdentifyIngredientsInputSchema>;

const IdentifyIngredientsOutputSchema = z.object({
  ingredients: z
    .array(z.string())
    .describe('A list of ingredients identified in the photo.'),
});
export type IdentifyIngredientsOutput = z.infer<typeof IdentifyIngredientsOutputSchema>;

export async function identifyIngredients(
  input: IdentifyIngredientsInput
): Promise<IdentifyIngredientsOutput> {
  return identifyIngredientsFlow(input);
}

const identifyIngredientsPrompt = ai.definePrompt({
  name: 'identifyIngredientsPrompt',
  input: {schema: IdentifyIngredientsInputSchema},
  output: {schema: IdentifyIngredientsOutputSchema},
  prompt: `You are an expert at identifying ingredients in a photo. Please analyze the image and extract a list of the ingredients.

  Photo: {{media url=photoDataUri}}

  Return a simple list of ingredients.`,
});

const identifyIngredientsFlow = ai.defineFlow(
  {
    name: 'identifyIngredientsFlow',
    inputSchema: IdentifyIngredientsInputSchema,
    outputSchema: IdentifyIngredientsOutputSchema,
  },
  async input => {
    const {output} = await identifyIngredientsPrompt(input);
    return output!;
  }
);
