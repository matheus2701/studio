'use server';

/**
 * @fileOverview An AI scheduling assistant that analyzes past booking data to suggest optimal appointment times.
 *
 * - optimizeSchedule - A function that handles the schedule optimization process.
 * - OptimizeScheduleInput - The input type for the optimizeSchedule function.
 * - OptimizeScheduleOutput - The return type for the optimizeSchedule function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimizeScheduleInputSchema = z.object({
  pastBookingData: z
    .string()
    .describe('A string containing past booking data, including appointment times and procedure types.'),
  customerPreferences: z
    .string()
    .describe('A string containing customer preferences, such as preferred times and procedures.'),
});
export type OptimizeScheduleInput = z.infer<typeof OptimizeScheduleInputSchema>;

const OptimizeScheduleOutputSchema = z.object({
  suggestedAppointmentTimes: z
    .string()
    .describe('A string containing suggested optimal appointment times, minimizing wait times and maximizing efficiency.'),
  recommendedProcedures: z
    .string()
    .describe('A string containing recommended procedures for each customer based on past booking data and preferences.'),
});
export type OptimizeScheduleOutput = z.infer<typeof OptimizeScheduleOutputSchema>;

export async function optimizeSchedule(input: OptimizeScheduleInput): Promise<OptimizeScheduleOutput> {
  return optimizeScheduleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'optimizeSchedulePrompt',
  input: {schema: OptimizeScheduleInputSchema},
  output: {schema: OptimizeScheduleOutputSchema},
  prompt: `You are an AI scheduling assistant designed to optimize appointment times and recommend procedures.

  Analyze the past booking data and customer preferences provided below to suggest optimal appointment times and recommend relevant procedures for each customer.

  Past Booking Data: {{{pastBookingData}}}
  Customer Preferences: {{{customerPreferences}}}

  Based on this information, provide suggested appointment times that minimize wait times and maximize efficiency for the service provider, and recommend procedures tailored to each customer's preferences.
  Make sure to return your response in plain text.
  `,
});

const optimizeScheduleFlow = ai.defineFlow(
  {
    name: 'optimizeScheduleFlow',
    inputSchema: OptimizeScheduleInputSchema,
    outputSchema: OptimizeScheduleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
