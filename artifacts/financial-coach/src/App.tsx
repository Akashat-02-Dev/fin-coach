import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/app-layout";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import Dashboard from "@/pages/dashboard";
import Analyze from "@/pages/analyze";
import Results from "@/pages/results";
import History from "@/pages/history";
import GoalsPage from "@/pages/goals";
import Compare from "@/pages/compare";
import Recurring from "@/pages/recurring";
import DebtPlanner from "@/pages/debt-planner";
import NetWorth from "@/pages/net-worth";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Profile from "@/pages/profile";
import Vault from "@/pages/vault";
import Pricing from "@/pages/pricing";
import Investments from "@/pages/investments";

const queryClient = new QueryClient();

function Redirect({ to }: { to: string }) {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation(to);
  }, [to, setLocation]);
  return null;
}

function Router() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground animate-pulse font-medium">Securing session...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated users are strictly guarded
  if (!user) {
    return (
      <Switch>
        <Route path="/signup" component={Signup} />
        <Route path="/login" component={Login} />
        <Route>
          <Redirect to="/login" />
        </Route>
      </Switch>
    );
  }

  // Authenticated users cannot go to login or signup
  if (location === "/login" || location === "/signup") {
    return <Redirect to="/" />;
  }

  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/analyze" component={Analyze} />
        <Route path="/results/:id" component={Results} />
        <Route path="/history" component={History} />
        <Route path="/goals" component={GoalsPage} />
        <Route path="/compare" component={Compare} />
        <Route path="/recurring" component={Recurring} />
        <Route path="/debt-planner" component={DebtPlanner} />
        <Route path="/net-worth" component={NetWorth} />
        <Route path="/profile" component={Profile} />
        <Route path="/vault" component={Vault} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/investments" component={Investments} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;