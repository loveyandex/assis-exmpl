import {
  streamText,
  UIMessage,
  convertToModelMessages,
} from "ai";
import { createOpenAI } from '@ai-sdk/openai';
import {
  type InferUITools,
  type ToolSet,
  type UIDataTypes,
  stepCountIs,
  tool,
} from 'ai';
import { z } from 'zod';

const tools = {
  listAllProjects: tool({
    description: 'List all projects accessible to the authenticated user in the GitLab instance.',
    inputSchema: z.object({}),
    execute: async () => {
      const gitlabUrl = process.env.GITLAB_URL || 'https://gitlab.com/api/v4';
      const gitlabToken = process.env.GITLAB_TOKEN;
      if (!gitlabToken) throw new Error("GITLAB_TOKEN environment variable is not set.");

      const endpoint = "projects";
      const params: { order_by: string; sort: string; per_page: number; page: number } = {
        order_by: "id",
        sort: "asc",
        per_page: 100,
        page: 1,
      };
      let allProjects: any[] = [];
      let currentPage = 1;

      try {
        while (true) {
          const response = await fetch(`${gitlabUrl}/${endpoint}?${new URLSearchParams(params as any).toString()}`, {
            headers: {
              "PRIVATE-TOKEN": gitlabToken,
              "Content-Type": "application/json",
            },
          });
          const projects = await response.json();
          if (!projects.length) break;
          allProjects = allProjects.concat(projects);
          currentPage += 1;
          params.page = currentPage;
        }

        if (!allProjects.length) return "No projects found.";

        const result = [`Total projects retrieved: ${allProjects.length}`];
        for (const project of allProjects) {
          const topics = project.tag_list?.join(", ") || "No topics";
          const description = project.description || "No description";
          const namespace = project.namespace?.name || "Unknown namespace";
          result.push(
            `${project.id}:${project.name} (${namespace}) by creator ${project.creator_id || 'Unknown'}, description: ${description}, topics: ${topics}`
          );
        }
        return result.join("\n");
      } catch (e) {
        return `Error listing projects: ${e instanceof Error ? e.message : String(e)}`;
      }
    },
  }),
  createProject: tool({
    description: 'Create a new project in a GitLab group.',
    inputSchema: z.object({
      name: z.string().describe('The name of the new project.'),
      namespaceId: z.number().describe('The ID of the GitLab group to create the project under. Must be an integer.'),
      description: z.string().optional().describe('Optional description for the project.'),
      visibility: z.enum(['private', 'internal', 'public']).optional().describe('Visibility level: private, internal, or public. Defaults to private.'),
    }),
    execute: async ({ name, namespaceId, description, visibility = 'private' }) => {
      const gitlabUrl = process.env.GITLAB_URL || 'https://gitlab.com/api/v4';
      const gitlabToken = process.env.GITLAB_TOKEN;
      if (!gitlabToken) throw new Error("GITLAB_TOKEN environment variable is not set.");

      const data: {
        name: string;
        namespace_id: number;
        visibility: 'private' | 'internal' | 'public';
        description?: string;
      } = {
        name,
        namespace_id: namespaceId,
        visibility: visibility,
      };
      if (description) data.description = description;

      try {
        const response = await fetch(`${gitlabUrl}/projects`, {
          method: 'POST',
          headers: {
            "PRIVATE-TOKEN": gitlabToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
        const project = await response.json();
        return JSON.stringify(project);
      } catch (e) {
        return `Error creating project: ${e instanceof Error ? e.message : String(e)}`;
      }
    },
  }),
} satisfies ToolSet;

export type ChatTools = InferUITools<typeof tools>;

export type ChatMessage = UIMessage<never, UIDataTypes, ChatTools>;

const openai = createOpenAI({
  baseURL: "https://api.cerebras.ai/v1",
  apiKey: process.env.CEREBRAS_API_KEY,
});

export async function POST(req: Request) {
  const { messages }: { messages: ChatMessage[] } = await req.json();

  const result = streamText({
    model: openai.chat("gpt-oss-120b"),
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    tools,
    system: `You are Xmasih, an AI assistant that can manage GitLab projects. Use the listAllProjects tool to list projects or createProject tool to create a new project. Ask for required parameters (name, namespaceId) when needed and confirm before creating.`,
  });

  return result.toUIMessageStreamResponse();
}