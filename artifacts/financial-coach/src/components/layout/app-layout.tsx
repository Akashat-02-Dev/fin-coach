import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, PlusCircle, History, Activity, Target, 
  BarChart2, RefreshCw, CreditCard, TrendingUp, User, LogOut, Lock, Calculator
} from "lucide-react";
import { useHealthCheck } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { TrialExpiredPaywall } from "@/components/TrialExpiredPaywall";
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
  const { user, logoutMutation } = useAuth();

  return (
    <Sidebar className="glass-sidebar h-screen transition-all duration-300">
      <SidebarHeader className="p-4 border-b border-border/50 mb-2">
        <h2 className="text-xl font-bold tracking-tight text-primary flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-md flex items-center justify-center text-primary-foreground text-xs font-bold">
            FC
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
            FinCoach
          </span>
        </h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="px-3 space-y-1.5">
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location === "/"}>
              <Link href="/" className="flex items-center gap-3 w-full p-2.5 rounded-lg text-sm font-medium transition-all hover:bg-primary/10">
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location === "/compare"}>
              <Link href="/compare" className="flex items-center gap-3 w-full p-2.5 rounded-lg text-sm font-medium transition-all hover:bg-primary/10">
                <BarChart2 className="h-4 w-4" />
                <span>Compare</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location === "/analyze"}>
              <Link href="/analyze" className="flex items-center gap-3 w-full p-2.5 rounded-lg text-sm font-medium transition-all hover:bg-primary/10">
                <PlusCircle className="h-4 w-4" />
                <span>New Analysis</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location === "/goals"}>
              <Link href="/goals" className="flex items-center gap-3 w-full p-2.5 rounded-lg text-sm font-medium transition-all hover:bg-primary/10">
                <Target className="h-4 w-4" />
                <span>Goals</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location === "/recurring"}>
              <Link href="/recurring" className="flex items-center gap-3 w-full p-2.5 rounded-lg text-sm font-medium transition-all hover:bg-primary/10">
                <RefreshCw className="h-4 w-4" />
                <span>Recurring</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location === "/debt-planner"}>
              <Link href="/debt-planner" className="flex items-center gap-3 w-full p-2.5 rounded-lg text-sm font-medium transition-all hover:bg-primary/10">
                <CreditCard className="h-4 w-4" />
                <span>Debt Planner</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location === "/vault"}>
              <Link href="/vault" className="flex items-center gap-3 w-full p-2.5 rounded-lg text-sm font-medium transition-all hover:bg-primary/10">
                <Lock className="h-4 w-4" />
                <span>Financial Vault</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location === "/investments"}>
              <Link href="/investments" className="flex items-center gap-3 w-full p-2.5 rounded-lg text-sm font-medium transition-all hover:bg-primary/10">
                <Calculator className="h-4 w-4" />
                <span>ROI Calculator</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location === "/net-worth"}>
              <Link href="/net-worth" className="flex items-center gap-3 w-full p-2.5 rounded-lg text-sm font-medium transition-all hover:bg-primary/10">
                <TrendingUp className="h-4 w-4" />
                <span>Net Worth</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location === "/history"}>
              <Link href="/history" className="flex items-center gap-3 w-full p-2.5 rounded-lg text-sm font-medium transition-all hover:bg-primary/10">
                <History className="h-4 w-4" />
                <span>History</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location === "/profile"}>
              <Link href="/profile" className="flex items-center gap-3 w-full p-2.5 rounded-lg text-sm font-medium transition-all hover:bg-primary/10">
                <User className="h-4 w-4" />
                <span>Profile Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-border/50 space-y-3">
        {user && user.subscriptionTier === "free" && !user.isTrialExpired && (
          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border border-teal-500/15 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 dark:text-teal-300">
              <span>⏳</span>
              <span>{user.trialDaysRemaining} days left of trial</span>
            </div>
            <Link href="/pricing" className="text-[10px] font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 transition-colors uppercase tracking-wider">
              Upgrade &rarr;
            </Link>
          </div>
        )}
        {user && (
          <div className="flex items-center justify-between bg-background/50 p-2.5 rounded-lg border border-border/30">
            <div className="flex flex-col min-w-0 pr-1">
              <span className="font-semibold truncate text-xs">{user.firstName} {user.lastName}</span>
              <span className="text-muted-foreground truncate text-[10px]">{user.email}</span>
            </div>
            <button
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="text-muted-foreground hover:text-destructive hover:bg-muted/80 transition-all p-1.5 rounded-md shrink-0"
              title="Log Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-background/50 p-2.5 rounded-lg border border-border/30">
          {isLoading ? (
            <div className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-pulse" />
          ) : health?.status === "ok" ? (
            <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
          ) : (
            <div className="h-2 w-2 rounded-full bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
          )}
          <span>System: {isLoading ? "Checking..." : health?.status === "ok" ? "Online" : "Offline"}</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const showPaywall = user?.isTrialExpired && user?.subscriptionTier !== "premium";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-background via-background to-secondary/30 text-foreground selection:bg-primary/20 relative">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse pointer-events-none dark:mix-blend-screen" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse pointer-events-none dark:mix-blend-screen" />
        
        <AppSidebar />
        <main className="flex-1 overflow-auto relative z-10">
          {showPaywall ? (
            <div className="w-full h-full min-h-[50vh] flex items-center justify-center pointer-events-none select-none opacity-20">
              {/* Hidden main content during lockdown to save GPU and prevent visual visibility */}
            </div>
          ) : (
            children
          )}
        </main>

        {showPaywall && <TrialExpiredPaywall />}
      </div>
    </SidebarProvider>
  );
}