"use client"

import * as React from "react"
import { Search, Lock, Clock, Calendar, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Chat {
  id: string
  title: string
  timestamp: string
  category: 'yesterday' | 'last7days' | 'thisyear'
}

const mockChats: Chat[] = [
  { id: '1', title: 'Python Tools Class Implementation', timestamp: '24 hours ago', category: 'yesterday' },
  { id: '2', title: 'Docker Compose GitLab LDAP Setup', timestamp: '4 days ago', category: 'last7days' },
  { id: '3', title: 'Clarifying Project Details for Collaboration', timestamp: '7 days ago', category: 'last7days' },
  { id: '4', title: 'مشروع مكرر: توضیح ومساعدة بالعربية', timestamp: 'Aug 14', category: 'thisyear' },
  { id: '5', title: 'REST API for Camera AI Admin', timestamp: 'Aug 5', category: 'thisyear' },
  { id: '6', title: 'Expressions of Love and Technology', timestamp: 'Jul 23', category: 'thisyear' },
  { id: '7', title: 'Brief Exchange on Message Completion', timestamp: 'Jul 15', category: 'thisyear' },
  { id: '8', title: 'CelestiaGPT: Introduction and Inquiry', timestamp: 'Jul 15', category: 'thisyear' },
  { id: '9', title: 'Friendly greeting', timestamp: 'Jul 14', category: 'thisyear' },
  { id: '10', title: 'Solana Price Drop from All-Time High', timestamp: 'Jul 14', category: 'thisyear' },
  { id: '11', title: 'Sending Chat Messages with Images in Python', timestamp: 'Jul 2', category: 'thisyear' },
]

interface SearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onChatSelect?: (chatId: string) => void
}

export function SearchModal({ open, onOpenChange, onChatSelect }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [filteredChats, setFilteredChats] = React.useState(mockChats)

  React.useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredChats(mockChats)
    } else {
      const filtered = mockChats.filter(chat =>
        chat.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredChats(filtered)
    }
  }, [searchQuery])

  const groupedChats = React.useMemo(() => {
    const groups = {
      yesterday: filteredChats.filter(chat => chat.category === 'yesterday'),
      last7days: filteredChats.filter(chat => chat.category === 'last7days'),
      thisyear: filteredChats.filter(chat => chat.category === 'thisyear')
    }
    return groups
  }, [filteredChats])

  const handleChatClick = (chatId: string) => {
    onChatSelect?.(chatId)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 bg-sidebar border-sidebar-border">
        <DialogHeader className="p-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-sidebar-accent border-sidebar-border"
            />
          </div>
        </DialogHeader>
        
        <div className="px-4 pb-2">
          <div className="text-sm font-medium text-sidebar-foreground mb-2">Actions</div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 h-10 bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-foreground"
            onClick={() => handleChatClick('new')}
          >
            <Lock className="h-4 w-4" />
            Create New Private Chat
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto max-h-96">
          {groupedChats.yesterday.length > 0 && (
            <div className="px-4 pb-2">
              <div className="text-sm font-medium text-sidebar-foreground mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Yesterday
              </div>
              {groupedChats.yesterday.map((chat) => (
                <div
                  key={chat.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-sidebar-accent cursor-pointer text-sm"
                  onClick={() => handleChatClick(chat.id)}
                >
                  <span className="text-sidebar-foreground truncate">{chat.title}</span>
                  <span className="text-xs text-muted-foreground">{chat.timestamp}</span>
                </div>
              ))}
            </div>
          )}

          {groupedChats.last7days.length > 0 && (
            <div className="px-4 pb-2">
              <div className="text-sm font-medium text-sidebar-foreground mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Last 7 Days
              </div>
              {groupedChats.last7days.map((chat) => (
                <div
                  key={chat.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-sidebar-accent cursor-pointer text-sm"
                  onClick={() => handleChatClick(chat.id)}
                >
                  <span className="text-sidebar-foreground truncate">{chat.title}</span>
                  <span className="text-xs text-muted-foreground">{chat.timestamp}</span>
                </div>
              ))}
            </div>
          )}

          {groupedChats.thisyear.length > 0 && (
            <div className="px-4 pb-2">
              <div className="text-sm font-medium text-sidebar-foreground mb-2 flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                This Year
              </div>
              {groupedChats.thisyear.map((chat) => (
                <div
                  key={chat.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-sidebar-accent cursor-pointer text-sm"
                  onClick={() => handleChatClick(chat.id)}
                >
                  <span className="text-sidebar-foreground truncate">{chat.title}</span>
                  <span className="text-xs text-muted-foreground">{chat.timestamp}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
