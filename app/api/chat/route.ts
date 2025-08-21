import {
  streamText,
  UIMessage,
  convertToModelMessages,
} from "ai";

import { createOpenAI } from '@ai-sdk/openai'


const openai = createOpenAI({
      baseURL: "https://api.cerebras.ai/v1",
      apiKey: process.env.CEREBRAS_API_KEY
})



export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const result = streamText({
    model: openai.chat("llama-4-scout-17b-16e-instruct"), // Your local model name
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
} 
 