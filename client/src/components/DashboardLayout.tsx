import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { useIsMobile } from "@/hooks/useMobile";
import { BarChart3, BookOpenCheck, ChevronRight, Inbox, LayoutDashboard, LogOut, MessagesSquare, PanelLeft, PlugZap, Send } from "lucide-react";
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
      <SidebarInset className="min-h-screen bg-[#f6f0e6]">
        {isMobile && <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-[#d8cbb8] bg-[#f6f0e6]/95 px-4 backdrop-blur"><SidebarTrigger className="text-[#102a37]" /><span className="font-display text-xl italic">{active}</span></header>}
        <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </>
  );
}
