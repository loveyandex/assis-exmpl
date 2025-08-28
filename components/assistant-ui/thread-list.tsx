"use client";

import type { FC } from "react";
import { useEffect, useState } from "react";
import { ArchiveIcon, PlusIcon, SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const ThreadList: FC = () => {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const router = useRouter();

  // Load chat history
  useEffect(() => {
    loadChatHistory();
  }, []);

  const loadChatHistory = async (pageNum: number = 1, append: boolean = false) => {
    try {
      const response = await fetch(`/api/chats?page=${pageNum}&limit=20`);
      if (response.ok) {
        const data = await response.json();
        if (append) {
          setChats(prev => [...prev, ...data.chats]);
        } else {
          setChats(data.chats || []);
        }
        setHasMore(data.pagination?.hasMore || false);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await loadChatHistory(page + 1, true);
  };

  const handleChatClick = (chatId: string) => {
    router.push(`/chat/${chatId}`);
  };

  const handleNewChat = () => {
    router.push('/');
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
      }
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  return (
    <>
      <div className="flex flex-col items-stretch gap-1.5">
        <div className="flex items-center gap-2 p-2">
          <Button 
            onClick={handleNewChat}
            className="flex-1 justify-start gap-2"
            variant="ghost"
          >
            <PlusIcon className="h-4 w-4" />
            New Chat
          </Button>
          <Dialog open={showSearch} onOpenChange={setShowSearch}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <SearchIcon className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Search Chats</DialogTitle>
              </DialogHeader>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search chat titles and messages..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      handleSearch(e.target.value);
                    }}
                    className="mb-4"
                  />
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {searchResults.map((result) => (
                      <div
                        key={result.id}
                        onClick={() => {
                          handleChatClick(result.id);
                          setShowSearch(false);
                        }}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-accent"
                      >
                        <div className="font-medium">{result.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {result.excerpt}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex-1 border-l pl-4">
                  <h3 className="font-medium mb-2">Recent Chats</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {chats.slice(0, 10).map((chat) => (
                      <div
                        key={chat.id}
                        onClick={() => {
                          handleChatClick(chat.id);
                          setShowSearch(false);
                        }}
                        className="p-2 text-sm cursor-pointer hover:bg-accent rounded"
                      >
                        {chat.title}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {loading ? (
          <div className="p-4 text-center text-muted-foreground">Loading chats...</div>
        ) : (
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => handleChatClick(chat.id)}
                className="flex items-center justify-between p-2 hover:bg-accent rounded cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{chat.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(chat.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: Implement archive functionality
                  }}
                >
                  <ArchiveIcon className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            {hasMore && (
              <div className="p-2 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="w-full"
                >
                  {loadingMore ? 'Loading...' : 'Load More Chats'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
