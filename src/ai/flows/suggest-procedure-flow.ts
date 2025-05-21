// src/ai/flows/suggest-procedure-flow.ts
'use server';

/**
 * @fileOverview AI agent that suggests relevant procedures based on past appointments and preferences.
 *
 * - suggestProcedure - A function that suggests procedures.
 * - SuggestProcedureInput - The input type for the suggestProcedure function.
 * - SuggestProcedureOutput - The return type for the suggestProcedure function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestProcedureInputSchema = z.object({
  pastAppointments: z
    .string()
    .describe(
      'A list of past appointments, including the type of procedure and the date of the appointment.'
    ),
  preferences: z
    .string()
    .describe(
      'A description of the users preferences, including types of procedures they like and any specific requests.'
    ),
});

export type SuggestProcedureInput = z.infer<typeof SuggestProcedureInputSchema>;

const SuggestProcedureOutputSchema = z.object({
  suggestedProcedures: z
    .string()
    .describe(
      'A list of suggested procedures based on the past appointments and preferences.'
    ),
  reasoning: z
    .string()
    .describe(
      'The reasoning behind the suggested procedures, including how they relate to the past appointments and preferences.'
    ),
});

export type SuggestProcedureOutput = z.infer<typeof SuggestProcedureOutputSchema>;

export async function suggestProcedure(
  input: SuggestProcedureInput
): Promise<SuggestProcedureOutput> {
  return suggestProcedureFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestProcedurePrompt',
  input: {schema: SuggestProcedureInputSchema},
  output: {schema: SuggestProcedureOutputSchema},
  prompt: `You are a beauty consultant who suggests relevant procedures to clients based on their past appointments and preferences.

  Past Appointments: {{{pastAppointments}}}
  Preferences: {{{preferences}}}

  Suggest procedures that the client might be interested in, and explain your reasoning.`,
});

const suggestProcedureFlow = ai.defineFlow(
  {
    name: 'suggestProcedureFlow',
    inputSchema: SuggestProcedureInputSchema,
    outputSchema: SuggestProcedureOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
