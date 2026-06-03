import { Link } from "wouter";
import { useGetAnalysisStats, useListAnalysisHistory } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Activity, DollarSign, PiggyBank, CreditCard, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { SpendingTrendsChart } from "@/components/SpendingTrendsChart";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetAnalysisStats();
  const { data: history, isLoading: historyLoading } = useListAnalysisHistory();

  const formatCurrency = (val: number | null | undefined) =>
    val != null
      ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val)
      : "—";

  const formatPercent = (val: number | null | undefined) =>
    val != null
      ? new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 }).format(val / 100)
      : "—";

  if (statsLoading || historyLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const recentHistory = history?.slice(0, 5) ?? [];
  const allHistory = history ?? [];
  const hasHistory = allHistory.length > 0;
  const hasMultiple = allHistory.length >= 2;

  const avgSavingsRate = stats?.avgSavingsRate ?? null;
  const savingsRateColor =
    avgSavingsRate == null ? "text-foreground"
    : avgSavingsRate >= 20 ? "text-green-600 dark:text-green-400"
    : avgSavingsRate >= 10 ? "text-primary"
    : avgSavingsRate >= 0 ? "text-yellow-600 dark:text-yellow-400"
    : "text-destructive";

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Overview</h1>
          <p className="text-muted-foreground mt-1">
            Your high-level financial health summary based on past analyses.
          </p>
        </div>
        <Button asChild data-testid="button-new-analysis">
          <Link href="/analyze" className="flex items-center gap-2">
            New Analysis <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {hasHistory ? (
        <>
          {/* Stat cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-sm" data-testid="stat-total-analyses">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Analyses</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono">{stats?.totalAnalyses ?? 0}</div>
              </CardContent>
            </Card>

            <Card className="shadow-sm" data-testid="stat-avg-savings-rate">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Savings Rate</CardTitle>
                <PiggyBank className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold font-mono ${savingsRateColor}`}>
                  {formatPercent(stats?.avgSavingsRate)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {avgSavingsRate != null && avgSavingsRate >= 20
                    ? "Excellent — above 20% target"
                    : avgSavingsRate != null && avgSavingsRate >= 10
                    ? "Good — aim for 20%"
                    : avgSavingsRate != null && avgSavingsRate >= 0
                    ? "Low — review expenses"
                    : avgSavingsRate != null
                    ? "Negative — spending exceeds income"
                    : ""}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm" data-testid="stat-avg-income">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Monthly Income</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono">{formatCurrency(stats?.avgMonthlyIncome)}</div>
              </CardContent>
            </Card>

            <Card className="shadow-sm" data-testid="stat-avg-debt">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Total Debt</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono">{formatCurrency(stats?.avgTotalDebt)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Trends chart */}
          <Card className="shadow-sm" data-testid="card-trends-chart">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <CardTitle>Spending Trends</CardTitle>
              </div>
              <CardDescription>
                {hasMultiple
                  ? `Income, expenses, savings rate and debt across all ${allHistory.length} analyses — oldest to newest.`
                  : "Run more analyses over time to see your financial trends develop."}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {hasMultiple ? (
                <SpendingTrendsChart history={allHistory} />
              ) : (
                <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
                  <TrendingUp className="h-8 w-8 text-muted-foreground/40" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Not enough data yet</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Run at least 2 analyses to see trends over time.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/analyze">Run Another Analysis</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Analyses */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-tight">Recent Analyses</h2>
              {allHistory.length > 5 && (
                <Button variant="link" asChild className="text-primary p-0">
                  <Link href="/history">View all {allHistory.length}</Link>
                </Button>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recentHistory.map((item) => {
                const savingsRate = item.savingsRate;
                const rateColor =
                  savingsRate == null ? ""
                  : savingsRate >= 20 ? "text-green-600 dark:text-green-400"
                  : savingsRate >= 10 ? "text-primary"
                  : savingsRate >= 0 ? "text-yellow-600 dark:text-yellow-400"
                  : "text-destructive";

                return (
                  <Card
                    key={item.id}
                    className="hover-elevate border-border hover:border-primary/40 transition-colors"
                    data-testid={`card-analysis-${item.id}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{format(new Date(item.createdAt), "MMM d, yyyy")}</CardTitle>
                        <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          #{item.id}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Income</span>
                          <span className="font-mono font-medium">{formatCurrency(item.monthlyIncome)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Expenses</span>
                          <span className="font-mono font-medium">{formatCurrency(item.totalExpenses)}</span>
                        </div>
                        {item.totalDebt != null && item.totalDebt > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Debt</span>
                            <span className="font-mono font-medium text-muted-foreground">{formatCurrency(item.totalDebt)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-2 mt-1 border-t border-border">
                          <span className="text-muted-foreground">Savings Rate</span>
                          <span className={`font-mono font-bold ${rateColor}`}>
                            {formatPercent(item.savingsRate)}
                          </span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="w-full mt-4" asChild>
                        <Link href={`/results/${item.id}`} data-testid={`link-results-${item.id}`}>
                          View Report
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        /* Empty state */
        <Card className="bg-primary/5 border-primary/20 text-center py-16">
          <CardContent className="space-y-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center mb-4">
              <Activity className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-xl font-bold">No analyses yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto text-sm">
              Run your first financial analysis to get a comprehensive health check, personalized budget, and savings strategies.
            </p>
            <Button asChild className="mt-4 shadow-sm hover-elevate" data-testid="button-start-first-analysis">
              <Link href="/analyze">Start First Analysis</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
