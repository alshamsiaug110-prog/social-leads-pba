import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { useIsMobile } from "@/hooks/useMobile";
import { trpc } from "@/lib/trpc";
import { Bell, BookOpenCheck, CheckCheck, ChevronRight, Inbox, LayoutDashboard, LogOut, MessagesSquare, PanelLeft, PlugZap, Send, TriangleAlert } from "lucide-react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

const menuItems = [
  { icon: LayoutDashboard, label: "Operations", path: "/" },
  { icon: BookOpenCheck, label: "FAQ Library", path: "/faqs" },
  { icon: Inbox, label: "Inbox Review", path: "/imports" },
  { icon: MessagesSquare, label: "Conversations", path: "/conversations" },
  { icon: Send, label: "Publisher", path: "/publish" },
  { icon: PlugZap, label: "Integrations", path: "/integrations" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();
  if (loading) return <DashboardLayoutSkeleton />;
  if (!user) {
    return (
      <div className="min-h-screen bg-[#102a37] px-6 py-10 text-[#fbf7ef]">
        <div className="mx-auto flex min-h-[75vh] max-w-md flex-col items-center justify-center text-center">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.28em] text-[#d4b07a]">Premier Ballet Academy</p>
          <h1 className="font-display text-5xl italic leading-none">Social Desk</h1>
          <p className="mt-6 text-sm leading-6 text-[#c8d0d2]">Sign in to manage the approved customer-service knowledge base, review historical messages, and monitor social conversations.</p>
          <Button onClick={() => startLogin()} className="mt-8 bg-[#d4b07a] text-[#102a37] hover:bg-[#e0c08c]">Sign in securely <ChevronRight className="ml-1 h-4 w-4" /></Button>
        </div>
      </div>
    );
  }
  return <SidebarProvider><DashboardLayoutContent>{children}</DashboardLayoutContent></SidebarProvider>;
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { toggleSidebar } = useSidebar();
  const isMobile = useIsMobile();
  const active = menuItems.find(item => item.path === location)?.label ?? "Social Desk";
  const notifications = trpc.notifications.list.useQuery(undefined, { refetchInterval: 15_000 });
  const utils = trpc.useUtils();
  const markRead = trpc.notifications.markRead.useMutation({ onSuccess: () => utils.notifications.list.invalidate() });
  const markAllRead = trpc.notifications.markAllRead.useMutation({ onSuccess: () => utils.notifications.list.invalidate() });

  return (
    <>
      <Sidebar collapsible="icon" className="border-r border-[#284451] bg-[#102a37] text-[#fbf7ef]">
        <SidebarHeader className="h-24 justify-center px-3">
          <div className="flex items-center gap-3"><button onClick={toggleSidebar} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#54717c] text-[#d4b07a] transition hover:bg-[#1b3a48]" aria-label="Toggle navigation"><PanelLeft className="h-4 w-4" /></button><div className="min-w-0 group-data-[collapsible=icon]:hidden"><p className="font-display text-xl italic leading-none">PBA</p><p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[#9fb0b5]">Social Desk</p></div></div>
        </SidebarHeader>
        <SidebarContent className="px-2 pt-3">
          <p className="mb-2 px-3 text-[10px] uppercase tracking-[0.2em] text-[#76909a] group-data-[collapsible=icon]:hidden">Control room</p>
          <SidebarMenu>
            {menuItems.map(item => <SidebarMenuItem key={item.path}><SidebarMenuButton isActive={item.path === location} onClick={() => setLocation(item.path)} tooltip={item.label} className="h-11 text-[#d7e0e1] hover:bg-[#1b3a48] hover:text-white data-[active=true]:bg-[#d4b07a] data-[active=true]:text-[#102a37]"><item.icon className="h-4 w-4" /><span>{item.label}</span></SidebarMenuButton></SidebarMenuItem>)}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="border-t border-[#284451] p-3">
          <DropdownMenu><DropdownMenuTrigger asChild><button className="flex w-full items-center gap-3 rounded-xl px-1 py-1 text-left hover:bg-[#1b3a48]"><Avatar className="h-9 w-9 border border-[#54717c]"><AvatarFallback className="bg-[#244553] text-xs text-[#fbf7ef]">{user?.name?.slice(0, 1).toUpperCase()}</AvatarFallback></Avatar><div className="min-w-0 group-data-[collapsible=icon]:hidden"><p className="truncate text-sm">{user?.name || "Administrator"}</p><p className="mt-0.5 text-xs text-[#9fb0b5]">Staff access</p></div></button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={logout} className="text-destructive"><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="relative min-h-screen bg-[#f6f0e6]">
        <div className="fixed right-4 top-4 z-50 sm:right-6 sm:top-5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline" size="icon" className="relative border-[#d0c0a8] bg-[#fffcf7] text-[#102a37] shadow-sm hover:bg-[#f0e4d1]" aria-label="Open staff notifications"><Bell className="h-4 w-4" />{notifications.data?.unreadCount ? <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-[#b84343] px-1 text-center text-[10px] font-bold leading-5 text-white">{notifications.data.unreadCount > 9 ? "9+" : notifications.data.unreadCount}</span> : null}</Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[min(25rem,calc(100vw-2rem))] border-[#d8cbb8] bg-[#fffcf7] p-0 text-[#102a37]">
              <div className="flex items-center justify-between border-b border-[#e6dac7] px-4 py-3"><div><p className="font-display text-xl italic">Staff notifications</p><p className="text-xs text-[#756b60]">Operational events from the controlled social desk</p></div><Button variant="ghost" size="sm" className="text-xs text-[#4d7a89]" disabled={!notifications.data?.unreadCount || markAllRead.isPending} onClick={() => markAllRead.mutate()}><CheckCheck className="mr-1 h-3.5 w-3.5" />Read all</Button></div>
              <div className="max-h-[min(30rem,calc(100vh-8rem))] overflow-y-auto">{notifications.isLoading ? <p className="p-5 text-sm text-[#756b60]">Loading notifications…</p> : notifications.data?.notifications.length ? notifications.data.notifications.map(item => <button key={item.id} className={`flex w-full gap-3 border-b border-[#eee3d4] px-4 py-3 text-left transition hover:bg-[#f6eddf] ${!item.readAt ? "bg-[#fff8ed]" : ""}`} onClick={() => { if (!item.readAt) markRead.mutate({ id: item.id }); if (item.href) setLocation(item.href); }}><span className={`mt-0.5 rounded-full p-1.5 ${item.severity === "critical" ? "bg-[#f6dede] text-[#af3f3f]" : item.severity === "warning" ? "bg-[#f7e7c4] text-[#8e651d]" : "bg-[#dcece4] text-[#3f7460]"}`}><TriangleAlert className="h-3.5 w-3.5" /></span><span className="min-w-0 flex-1"><span className="flex items-start justify-between gap-3"><span className="font-medium">{item.title}</span>{!item.readAt ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#b84343]" /> : null}</span>{item.detail ? <span className="mt-1 block text-xs leading-5 text-[#756b60]">{item.detail}</span> : null}<span className="mt-1 block text-[11px] text-[#9a8b7a]">{new Date(item.createdAt).toLocaleString()}</span></span></button>) : <p className="p-5 text-sm text-[#756b60]">No staff notifications yet.</p>}</div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {isMobile && <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-[#d8cbb8] bg-[#f6f0e6]/95 px-4 backdrop-blur"><SidebarTrigger className="text-[#102a37]" /><span className="font-display text-xl italic">{active}</span></header>}
        <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </>
  );
}
