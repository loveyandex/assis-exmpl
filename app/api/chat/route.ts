import {
  streamText,
  UIMessage,
  convertToModelMessages,
} from "ai";

import { createOpenAI } from '@ai-sdk/openai'

import {
  type InferUITools,
  type ToolSet,
  type UIDataTypes, 
  stepCountIs, 
  tool,
} from 'ai';
import { z } from 'zod';

const tools = {
  getWeather: tool({
    description: 'Get the weather for a location',
    inputSchema: z.object({
      city: z.string().describe('The city to get the weather for'),
      unit: z
        .enum(['C', 'F'])
        .describe('The unit to display the temperature in'),
    }),
    execute: async ({ city, unit }) => {
      const weather = {
        value: 24,
        description: 'Sunny',

      };

      return `It is currently ${weather.value}°${unit} and ${weather.description} in ${city}!`;
    },
  }),
} satisfies ToolSet;

export type ChatTools = InferUITools<typeof tools>;

export type ChatMessage = UIMessage<never, UIDataTypes, ChatTools>;




const openai = createOpenAI({
      baseURL: "https://api.cerebras.ai/v1",
      apiKey: process.env.CEREBRAS_API_KEY
})



export async function POST(req: Request) {
  
  const { messages }: { messages: ChatMessage[] } = await req.json();

  const result = streamText({
    model: openai.chat("gpt-oss-120b"), // Your local model name
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    tools,
    system: `You are Xmasih  that can provide weather information. Use the getWeather tool when the user asks about the weather.ask for the city and unit (C or F).`,
  });

  return result.toUIMessageStreamResponse();
} 
 