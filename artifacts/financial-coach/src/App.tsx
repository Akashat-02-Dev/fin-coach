import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/app-layout";
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

const queryClient = new QueryClient();

function Router() {
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
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;