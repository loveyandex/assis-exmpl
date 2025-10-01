"use client";

import * as React from "react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { Thread } from "@/components/assistant-ui/thread";
import { UIMessage } from "ai";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ThemeToggle } from "@/components/theme-toggle";
import { SearchModal } from "@/components/search-modal";
import { SettingsModal } from "@/components/settings-modal";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Assistant = ({ 
  chatId, 
  initialMessages = [] 
}: { 
  chatId?: string; 
  initialMessages?: UIMessage[] 
}) => {
  const [searchModalOpen, setSearchModalOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<UIMessage[]>(initialMessages);

  // Refetch messages when navigating back to this page or when chatId changes
  React.useEffect(() => {
    let aborted = false;
    async function fetchMessages() {
      if (!chatId) return;
      try {
        const res = await fetch(`/api/chat?chatId=${encodeURIComponent(chatId)}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!aborted && Array.isArray(data?.messages)) {
          setMessages(data.messages as UIMessage[]);
        }
      } catch {}
    }

    fetchMessages();

    const onPageShow = () => fetchMessages();
    const onFocus = () => fetchMessages();
    window.addEventListener('pageshow', onPageShow);
    window.addEventListener('focus', onFocus);
    return () => {
      aborted = true;
      window.removeEventListener('pageshow', onPageShow);
      window.removeEventListener('focus', onFocus);
    };
  }, [chatId]);

  const runtime = useChatRuntime({
    id: chatId,
    messages,
  });

  const handleChatSelect = (chatId: string) => {
    if (chatId === 'new') {
      // Handle new chat creation
      window.location.href = '/';
    } else {
      // Navigate to existing chat
      window.location.href = `/chat/${chatId}`;
    }
  };

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <SidebarProvider>
        <div className="flex h-dvh w-full pr-0.5">
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="#">
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage></BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <div className="ml-auto flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchModalOpen(true)}
                  className="h-8 w-8"
                >
                  <Search className="h-4 w-4" />
                  <span className="sr-only">Search chats</span>
                </Button>
                <SettingsModal />
                <ThemeToggle />
              </div>
            </header>
            <div className="flex-1 overflow-hidden">
              <Thread />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
      <SearchModal 
        open={searchModalOpen} 
        onOpenChange={setSearchModalOpen}
        onChatSelect={handleChatSelect}
      />
    </AssistantRuntimeProvider>
  );
};
