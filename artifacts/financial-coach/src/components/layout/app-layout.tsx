import { Link, useLocation } from "wouter";
import { LayoutDashboard, PlusCircle, History, Activity, Target, BarChart2, RefreshCw, CreditCard, TrendingUp } from "lucide-react";
import { useHealthCheck } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const [location] = useLocation();
  const { data: health, isLoading } = useHealthCheck();

  return (
    <Sidebar className="border-r border-border bg-sidebar h-screen">
      <SidebarHeader className="p-4 border-b border-border mb-2">
        <h2 className="text-xl font-bold tracking-tight text-primary flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
            FC
          </div>
          FinCoach
        </h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="px-2 space-y-1">
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location === "/"}>
              <Link href="/" className="flex items-center gap-3 w-full p-2 text-sm font-medium transition-colors">
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location === "/compare"}>
              <Link href="/compare" className="flex items-center gap-3 w-full p-2 text-sm font-medium transition-colors">
                <BarChart2 className="h-4 w-4" />
                <span>Compare</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location === "/analyze"}>
              <Link href="/analyze" className="flex items-center gap-3 w-full p-2 text-sm font-medium transition-colors">
                <PlusCircle className="h-4 w-4" />
                <span>New Analysis</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location === "/goals"}>
              <Link href="/goals" className="flex items-center gap-3 w-full p-2 text-sm font-medium transition-colors">
                <Target className="h-4 w-4" />
                <span>Goals</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location === "/recurring"}>
              <Link href="/recurring" className="flex items-center gap-3 w-full p-2 text-sm font-medium transition-colors">
                <RefreshCw className="h-4 w-4" />
                <span>Recurring</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location === "/debt-planner"}>
              <Link href="/debt-planner" className="flex items-center gap-3 w-full p-2 text-sm font-medium transition-colors">
                <CreditCard className="h-4 w-4" />
                <span>Debt Planner</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location === "/net-worth"}>
              <Link href="/net-worth" className="flex items-center gap-3 w-full p-2 text-sm font-medium transition-colors">
                <TrendingUp className="h-4 w-4" />
                <span>Net Worth</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location === "/history"}>
              <Link href="/history" className="flex items-center gap-3 w-full p-2 text-sm font-medium transition-colors">
                <History className="h-4 w-4" />
                <span>History</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {isLoading ? (
            <div className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-pulse" />
          ) : health?.status === "ok" ? (
            <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
          ) : (
            <div className="h-2 w-2 rounded-full bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
          )}
          <span>System Status: {isLoading ? "Checking..." : health?.status === "ok" ? "Online" : "Offline"}</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground selection:bg-primary/20">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}