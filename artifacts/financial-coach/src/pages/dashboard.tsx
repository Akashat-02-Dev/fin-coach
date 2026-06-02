import { Link } from "wouter";
import { useGetAnalysisStats, useListAnalysisHistory } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Activity, DollarSign, PiggyBank, CreditCard, TrendingDown } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetAnalysisStats();
  const { data: history, isLoading: historyLoading } = useListAnalysisHistory();

  const formatCurrency = (val: number | null | undefined) => 
    val != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val) : '-';
  
  const formatPercent = (val: number | null | undefined) => 
    val != null ? new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 }).format(val / 100) : '-';

  if (statsLoading || historyLoading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const recentHistory = history?.slice(0, 5) || [];
  const hasHistory = recentHistory.length > 0;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Overview</h1>
          <p className="text-muted-foreground mt-1">Your high-level financial health summary based on past analyses.</p>
        </div>
        <Button asChild>
          <Link href="/analyze" className="flex items-center gap-2">
            New Analysis <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {stats && stats.totalAnalyses > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Analyses</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAnalyses}</div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Savings Rate</CardTitle>
              <PiggyBank className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{formatPercent(stats.avgSavingsRate)}</div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-primary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Monthly Income</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.avgMonthlyIncome)}</div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-primary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Total Debt</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.avgTotalDebt)}</div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="bg-primary/5 border-primary/20 text-center py-12">
          <CardContent className="space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">No analyses yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Run your first financial analysis to get a comprehensive health check, personalized budget, and savings strategies.
            </p>
            <Button asChild className="mt-4 shadow-sm hover-elevate">
              <Link href="/analyze">Start First Analysis</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {hasHistory && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">Recent Analyses</h2>
            <Button variant="link" asChild className="text-primary">
              <Link href="/history">View all</Link>
            </Button>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentHistory.map((item) => (
              <Card key={item.id} className="hover-elevate border-border hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex justify-between items-center">
                    {format(new Date(item.createdAt), 'MMM d, yyyy')}
                    <span className="text-xs font-normal text-muted-foreground px-2 py-1 bg-muted rounded-full">
                      ID: {item.id}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Income</span>
                      <span className="font-medium">{formatCurrency(item.monthlyIncome)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Expenses</span>
                      <span className="font-medium">{formatCurrency(item.totalExpenses)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 mt-2 border-t border-border">
                      <span className="text-muted-foreground">Savings Rate</span>
                      <span className="font-bold text-primary">{formatPercent(item.savingsRate)}</span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full mt-4" asChild>
                    <Link href={`/results/${item.id}`}>View Results</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}