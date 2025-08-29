import {
  streamText,
  UIMessage,
  convertToModelMessages,
  validateUIMessages,
  TypeValidationError,
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
import { loadChat, saveChat, createChat } from '@/lib/db';



const tools = {
  listAllProjects: tool({
    description: 'List all projects accessible to the authenticated user in the GitLab instance.',
    inputSchema: z.object({}),
    execute: async () => {
      const gitlabUrl = process.env.GITLAB_URL || 'https://gitlab.com/api/v4';
      const gitlabToken = process.env.GITLAB_TOKEN;
      if (!gitlabToken) throw new Error("GITLAB_TOKEN environment variable is not set.");

      const endpoint = "projects";
      const params: { order_by: string; sort: string; per_page: number; page?: number } = {
        order_by: "id",
        sort: "asc",
        per_page: 100,
      };
      let allProjects: any[] = [];
      let currentPage = 1;

      try {
        while (true) {
          params.page = currentPage;
          const response = await fetch(`${gitlabUrl}/${endpoint}?${new URLSearchParams(params as any).toString()}`, {
            headers: {
              "PRIVATE-TOKEN": gitlabToken,
              "Content-Type": "application/json",
            },
          });
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const projects: any[] = await response.json();
          if (!projects.length) break;
          allProjects = allProjects.concat(projects);
          currentPage += 1;
        }

        if (!allProjects.length) return "No groups found.";

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
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const project = await response.json();
        return JSON.stringify(project);
      } catch (e) {
        return `Error creating project: ${e instanceof Error ? e.message : String(e)}`;
      }
    },
  }),
  updateProject: tool({
    description: 'Update an existing project in a GitLab group.',
    inputSchema: z.object({
      projectId: z.number().describe('The ID of the project to update. Must be an integer.'),
      name: z.string().optional().describe('Optional new name for the project.'),
      description: z.string().optional().describe('Optional new description for the project.'),
      visibility: z.enum(['private', 'internal', 'public']).optional().describe('Optional new visibility level.'),
    }),
    execute: async ({ projectId, name, description, visibility }) => {
      const gitlabUrl = process.env.GITLAB_URL || 'https://gitlab.com/api/v4';
      const gitlabToken = process.env.GITLAB_TOKEN;
      if (!gitlabToken) throw new Error("GITLAB_TOKEN environment variable is not set.");

      const data: { [key: string]: string } = {};
      if (name) data.name = name;
      if (description) data.description = description;
      if (visibility) data.visibility = visibility;
      if (Object.keys(data).length === 0) return "No updates provided.";

      try {
        const response = await fetch(`${gitlabUrl}/projects/${projectId}`, {
          method: 'PUT',
          headers: {
            "PRIVATE-TOKEN": gitlabToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const project = await response.json();
        return JSON.stringify(project);
      } catch (e) {
        return `Error updating project: ${e instanceof Error ? e.message : String(e)}`;
      }
    },
  }),
  deleteProject: tool({
    description: 'Delete a project from a GitLab group.',
    inputSchema: z.object({
      projectId: z.number().describe('The ID of the project to delete. Must be an integer.'),
    }),
    execute: async ({ projectId }) => {
      const gitlabUrl = process.env.GITLAB_URL || 'https://gitlab.com/api/v4';
      const gitlabToken = process.env.GITLAB_TOKEN;
      if (!gitlabToken) throw new Error("GITLAB_TOKEN environment variable is not set.");

      try {
        const response = await fetch(`${gitlabUrl}/projects/${projectId}`, {
          method: 'DELETE',
          headers: {
            "PRIVATE-TOKEN": gitlabToken,
          },
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return `Project ${projectId} deleted successfully.`;
      } catch (e) {
        return `Error deleting project: ${e instanceof Error ? e.message : String(e)}`;
      }
    },
  }),
  getReadmeContent: tool({
    description: 'Retrieve the content of README.md from a GitLab project.',
    inputSchema: z.object({
      projectId: z.number().describe('The ID of the project. Must be an integer.'),
      branch: z.string().default('main').describe('The branch to fetch README.md from.'),
    }),
    execute: async ({ projectId, branch }) => {
      const gitlabUrl = process.env.GITLAB_URL || 'https://gitlab.com/api/v4';
      const gitlabToken = process.env.GITLAB_TOKEN;
      if (!gitlabToken) throw new Error("GITLAB_TOKEN environment variable is not set.");

      const filePath = "README.md";
      const endpoint = `projects/${projectId}/repository/files/${encodeURIComponent(filePath)}`;
      const params = { ref: branch };

      try {
        const response = await fetch(`${gitlabUrl}/${endpoint}?${new URLSearchParams(params as any).toString()}`, {
          headers: {
            "PRIVATE-TOKEN": gitlabToken,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          if (response.status === 404) return "README.md does not exist in this project.";
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const fileData = await response.json();
        const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
        return content;
      } catch (e) {
        return `Error retrieving README.md: ${e instanceof Error ? e.message : String(e)}`;
      }
    },
  }),
  createReadme: tool({
    description: 'Create a new README.md file in a GitLab project with user input for content.',
    inputSchema: z.object({
      projectId: z.number().describe('The ID of the project. Must be an integer.'),
      content: z.string().describe('The Markdown content for the new README.md.'),
      commitMessage: z.string().default('Create README.md').describe('The commit message.'),
      branch: z.string().default('main').describe('The branch to create README.md on.'),
    }),
    execute: async ({ projectId, content, commitMessage, branch }) => {
      const gitlabUrl = process.env.GITLAB_URL || 'https://gitlab.com/api/v4';
      const gitlabToken = process.env.GITLAB_TOKEN;
      if (!gitlabToken) throw new Error("GITLAB_TOKEN environment variable is not set.");

      const filePath = "README.md";
      const endpoint = `projects/${projectId}/repository/files/${encodeURIComponent(filePath)}`;
      const encodedContent = content;
      const data = {
        branch,
        content: encodedContent,
        commit_message: commitMessage,
      };

      try {
        const response = await fetch(`${gitlabUrl}/${endpoint}`, {
          method: 'POST',
          headers: {
            "PRIVATE-TOKEN": gitlabToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
        if (!response.ok) {
          if (response.status === 400 && (await response.text()).includes("already exists"))
            return "README.md already exists. Use update_readme instead.";
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return `README.md created successfully in project ${projectId}.`;
      } catch (e) {
        return `Error creating README.md: ${e instanceof Error ? e.message : String(e)}`;
      }
    },
  }),
  updateReadme: tool({
    description: 'Update the content of README.md in a GitLab project.',
    inputSchema: z.object({
      projectId: z.number().describe('The ID of the project. Must be an integer.'),
      content: z.string().describe('The new Markdown content for README.md.'),
      commitMessage: z.string().default('Update README.md').describe('The commit message.'),
      branch: z.string().default('main').describe('The branch to update README.md on.'),
    }),
    execute: async ({ projectId, content, commitMessage, branch }) => {
      const gitlabUrl = process.env.GITLAB_URL || 'https://gitlab.com/api/v4';
      const gitlabToken = process.env.GITLAB_TOKEN;
      if (!gitlabToken) throw new Error("GITLAB_TOKEN environment variable is not set.");

      const filePath = "README.md";
      const endpoint = `projects/${projectId}/repository/files/${encodeURIComponent(filePath)}`;
      const encodedContent =content;
      const data = {
        branch,
        content: encodedContent,
        commit_message: commitMessage,
      };

      try {
        const response = await fetch(`${gitlabUrl}/${endpoint}`, {
          method: 'PUT',
          headers: {
            "PRIVATE-TOKEN": gitlabToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
        if (!response.ok) {
          if (response.status === 404) return "README.md does not exist. Use create_readme instead.";
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return `README.md updated successfully in project ${projectId}.`;
      } catch (e) {
        return `Error updating README.md: ${e instanceof Error ? e.message : String(e)}`;
      }
    },
  }),
  deleteReadme: tool({
    description: 'Delete README.md from a GitLab project.',
    inputSchema: z.object({
      projectId: z.number().describe('The ID of the project. Must be an integer.'),
      commitMessage: z.string().default('Delete README.md').describe('The commit message.'),
      branch: z.string().default('main').describe('The branch to delete README.md from.'),
    }),
    execute: async ({ projectId, commitMessage, branch }) => {
      const gitlabUrl = process.env.GITLAB_URL || 'https://gitlab.com/api/v4';
      const gitlabToken = process.env.GITLAB_TOKEN;
      if (!gitlabToken) throw new Error("GITLAB_TOKEN environment variable is not set.");

      const filePath = "README.md";
      const endpoint = `projects/${projectId}/repository/files/${encodeURIComponent(filePath)}`;
      const data = {
        branch,
        commit_message: commitMessage,
      };

      try {
        const response = await fetch(`${gitlabUrl}/${endpoint}`, {
          method: 'DELETE',
          headers: {
            "PRIVATE-TOKEN": gitlabToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
        if (!response.ok) {
          if (response.status === 404) return "README.md does not exist.";
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return `README.md deleted successfully from project ${projectId}.`;
      } catch (e) {
        return `Error deleting README.md: ${e instanceof Error ? e.message : String(e)}`;
      }
    },
  }),
  listAllGroups: tool({
    description: 'List all groups accessible to the authenticated user in the GitLab instance.',
    inputSchema: z.object({}),
    execute: async () => {
      const gitlabUrl = process.env.GITLAB_URL || 'https://gitlab.com/api/v4';
      const gitlabToken = process.env.GITLAB_TOKEN;
      if (!gitlabToken) throw new Error("GITLAB_TOKEN environment variable is not set.");

      const endpoint = "groups";
      const params: { order_by: string; sort: string; per_page: number; page?: number } = {
        order_by: "id",
        sort: "asc",
        per_page: 100,
      };
      let allGroups: any[] = [];
      let currentPage = 1;

      try {
        while (true) {
          params.page = currentPage;
          const response = await fetch(`${gitlabUrl}/${endpoint}?${new URLSearchParams(params as any).toString()}`, {
            headers: {
              "PRIVATE-TOKEN": gitlabToken,
              "Content-Type": "application/json",
            },
          });
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const groups: any[] = await response.json();
          if (!groups.length) break;
          allGroups = allGroups.concat(groups);
          currentPage += 1;
        }

        if (!allGroups.length) return "No groups found.";

        const result = [`Total groups retrieved: ${allGroups.length}`];
        for (const group of allGroups) {
          const description = group.description || "No description";
          const visibility = group.visibility || "Unknown";
          const memberCount = group.member_count || "Unknown";
          result.push(
            `group_id: ${group.id}, group name: ${group.name} (path: ${group.path || 'Unknown'}), description: ${description}, visibility: ${visibility}, members: ${memberCount}`
          );
        }
        return result.join("\n");
      } catch (e) {
        return `Error listing groups: ${e instanceof Error ? e.message : String(e)}`;
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

// GET handler for resuming streams
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId');

  if (!chatId) {
    return new Response('chatId is required', { status: 400 });
  }

  try {
    const messages = await loadChat(chatId);
    return Response.json({ messages });
  } catch (error) {
    console.error('❌ API GET: Failed to load chat:', error);
    return new Response('Chat not found', { status: 404 });
  }
}

export async function POST(req: Request) {
  const { messages, chatId }: { messages: ChatMessage[]; chatId?: string } = await req.json();

  console.log('🔍 API: Received request with chatId:', chatId, 'and', messages.length, 'messages');

  // If no chatId is provided, create a new chat
  let currentChatId: string;
  if (!chatId) {
    try {
      currentChatId = await createChat();
      console.log('📝 API: Created new chat with ID:', currentChatId);
    } catch (error) {
      console.error('❌ API: Failed to create new chat:', error);
      return new Response('Failed to create chat', { status: 500 });
    }
  } else {
    currentChatId = chatId;
    console.log('📝 API: Using existing chat with ID:', currentChatId);
  }

  // Load previous messages from database
  let previousMessages: UIMessage[] = [];
  try {
    previousMessages = await loadChat(currentChatId);
    console.log('📚 API: Loaded', previousMessages.length, 'previous messages from database');
  } catch (error) {
    console.error('❌ API: Failed to load chat:', error);
    // If chat doesn't exist, start with empty history
    previousMessages = [];
  }

  // Append new message to previous messages
  const allMessages = [...previousMessages, ...messages];
  console.log('📝 API: Total messages to process:', allMessages.length);

  // Validate loaded messages against tools
  let validatedMessages: UIMessage[];
  try {
    validatedMessages = await validateUIMessages({
      messages: allMessages,
      tools: tools as any,
    });
  } catch (error) {
    if (error instanceof TypeValidationError) {
      console.error('⚠️ API: Database messages validation failed:', error);
      // Start with empty history if validation fails
      validatedMessages = messages;
    } else {
      throw error;
    }
  }

  const result = streamText({
    model: openai.chat("gpt-oss-120b"),
    messages: convertToModelMessages(validatedMessages),
    stopWhen: stepCountIs(5),
    tools,
    system: `You are Xmasih, an AI assistant that can manage GitLab projects. Use the listAllProjects tool to list projects or createProject tool to create a new project. Ask for required parameters (name, namespaceId) when needed and confirm before creating.`,
  });

  return result.toUIMessageStreamResponse({
    originalMessages: validatedMessages,
    onFinish: async ({ messages }) => {
      console.log('💾 API: onFinish called with', messages.length, 'messages, saving to chatId:', currentChatId);
      try {
        await saveChat(currentChatId, messages);
        console.log('✅ API: Successfully saved chat to database');
      } catch (error) {
        console.error('❌ API: Failed to save chat:', error);
      }
    },
  });
}