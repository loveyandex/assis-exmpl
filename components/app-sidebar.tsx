"use client"
import * as React from "react"
import { Settings2, LogOut, User as UserIcon } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { ThreadList } from "./assistant-ui/thread-list"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [username, setUsername] = React.useState<string>("");
  const [role, setRole] = React.useState<string>("");
  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ action: 'me', username: 'x', password: 'x' }) });
        const j = await res.json();
        setUsername(j?.user?.username || "");
        setRole(j?.user?.role || "");
      } catch {}
    })();
  }, []);

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
                <Link href="/">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Image src="/nemo.png" alt="Nemo" width={16} height={16} className="size-4" />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-semibold">Nemo</span>
                  </div>
                </Link>
              </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <ThreadList />
      </SidebarContent>
      
      <SidebarRail />
      <SidebarFooter>
        <SidebarMenu>
          {role === 'ADMIN' ? (
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link href="/admin/users">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Settings2 className="size-4" />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-semibold">{username ? username : 'Admin'}</span>
                    <span className="">Manage Users</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ) : null}
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <button onClick={async ()=>{ await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ action: 'logout', username: 'x', password: 'x' }) }); window.location.assign('/login'); }}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <LogOut className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Logout</span>
                  <span className="">Sign out</span>
                </div>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
