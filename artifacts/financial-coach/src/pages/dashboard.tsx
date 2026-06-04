import { Link } from "wouter";
import { useGetAnalysisStats, useListAnalysisHistory, useGetAnalysisInsights, useGetGoals } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Activity, DollarSign, PiggyBank, CreditCard, TrendingUp, TrendingDown, Target, Lightbulb, Zap } from "lucide-react";
import { format } from "date-fns";
import { SpendingTrendsChart } from "@/components/SpendingTrendsChart";
import { HealthScoreGauge } from "@/components/HealthScoreGauge";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetAnalysisStats();
  const { data: history, isLoading: historyLoading } = useListAnalysisHistory();
  const { data: insights, isLoading: insightsLoading } = useGetAnalysisInsights();
  const { data: goals, isLoading: goalsLoading } = useGetGoals();

  const formatCurrency = (val: number | null | undefined) =>
    val != null
      ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val)
      : "—";

  const formatPercent = (val: number | null | undefined) =>
    val != null
      ? new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 }).format(val / 100)
      : "—";

  if (statsLoading || historyLoading || insightsLoading || goalsLoading) {
    return (
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-36 w-full" />)}
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

  const renderVelocityBadge = (value: number | null | undefined, invert: boolean = false) => {
    if (!insights?.hasEnoughData || value == null) return null;
    if (value === 0) return null;
    
    // invert: true for expenses/debt (lower is better, so negative is green)
    const isImproving = invert ? value < 0 : value > 0;
    
    return (
      <Badge variant={isImproving ? "default" : "destructive"} className={`ml-2 text-[10px] px-1.5 py-0 rounded-sm ${isImproving ? 'bg-green-500 hover:bg-green-600' : ''}`}>
        {value > 0 ? <TrendingUp className="h-3 w-3 mr-0.5 inline" /> : <TrendingDown className="h-3 w-3 mr-0.5 inline" />}
        {value > 0 ? '+' : ''}{value.toFixed(1)}%
      </Badge>
    );
  };

  const hasAnyGoal = goals && (
    goals.targetSavingsRate != null || 
    goals.targetMonthlySavings != null || 
    goals.targetDebtPayoffMonths != null || 
    goals.targetEmergencyFundMonths != null
  );

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
          <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-5">
            {insights?.healthScore != null ? (
              <Card className="shadow-sm flex flex-col items-center justify-center p-4 col-span-1 md:col-span-3 lg:col-span-1 border-primary/20 bg-primary/5">
                <HealthScoreGauge score={insights.healthScore} label={insights.healthLabel || "Score"} />
              </Card>
            ) : (
              <Card className="shadow-sm" data-testid="stat-total-analyses">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Analyses</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-mono">{stats?.totalAnalyses ?? 0}</div>
                </CardContent>
              </Card>
            )}

            <Card className="shadow-sm" data-testid="stat-avg-savings-rate">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Savings Rate</CardTitle>
                <PiggyBank className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline">
                  <div className={`text-3xl font-bold font-mono ${savingsRateColor}`}>
                    {formatPercent(stats?.avgSavingsRate)}
                  </div>
                  {renderVelocityBadge(insights?.velocity.savingsRateChange, false)}
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
                <div className="flex items-baseline">
                  <div className="text-3xl font-bold font-mono">{formatCurrency(stats?.avgMonthlyIncome)}</div>
                  {renderVelocityBadge(insights?.velocity.incomeChange, false)}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm" data-testid="stat-avg-expenses">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Total Expenses</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline">
                  <div className="text-3xl font-bold font-mono">{formatCurrency(stats?.avgTotalExpenses)}</div>
                  {renderVelocityBadge(insights?.velocity.expensesChange, true)}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm" data-testid="stat-avg-debt">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Total Debt</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline">
                  <div className="text-3xl font-bold font-mono">{formatCurrency(stats?.avgTotalDebt)}</div>
                  {renderVelocityBadge(insights?.velocity.debtChange, true)}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Top Insights */}
            {insights?.tips && insights.tips.length > 0 && (
              <Card className="shadow-sm md:col-span-3">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    Personalized Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    {insights.tips.slice(0, 3).map((tip, i) => (
                      <div key={i} className="bg-muted/50 rounded-lg p-4 border border-border flex flex-col h-full">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold text-sm">{tip.category}</span>
                          <Badge variant="outline" className={
                            tip.priority === "high" ? "border-red-500 text-red-500" :
                            tip.priority === "medium" ? "border-amber-500 text-amber-500" :
                            "border-slate-500 text-slate-500"
                          }>
                            {tip.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground flex-1">{tip.text}</p>
                        {tip.potentialSavings != null && tip.potentialSavings > 0 && (
                          <div className="mt-3 pt-3 border-t border-border text-xs font-medium text-green-600 dark:text-green-400">
                            Save up to {formatCurrency(tip.potentialSavings)}/mo
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Projection & Goals Row */}
            {insights?.projection?.months12 != null && (
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    At your current pace
                  </CardTitle>
                  <CardDescription>
                    Based on a {formatCurrency(insights.projection.monthlySurplus)}/mo surplus
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-border pb-2">
                      <span className="text-muted-foreground text-sm">In 6 months</span>
                      <span className="font-mono font-bold text-lg">{formatCurrency(insights.projection.months6)}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-border pb-2">
                      <span className="text-muted-foreground text-sm">In 12 months</span>
                      <span className="font-mono font-bold text-lg text-primary">{formatCurrency(insights.projection.months12)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">In 24 months</span>
                      <span className="font-mono font-bold text-lg">{formatCurrency(insights.projection.months24)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className={insights?.projection?.months12 != null ? "md:col-span-2 shadow-sm" : "md:col-span-3 shadow-sm"}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Your Goals
                  </CardTitle>
                  <CardDescription>Progress towards your financial targets</CardDescription>
                </div>
                {!hasAnyGoal && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/goals">Set Goals</Link>
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {!hasAnyGoal ? (
                  <div className="py-6 text-center text-muted-foreground text-sm">
                    You haven't set any financial goals yet. Set targets for your savings rate, monthly surplus, and debt payoff to track your progress here.
                  </div>
                ) : (
                  <div className="space-y-6 mt-2">
                    {goals.targetSavingsRate != null && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">Savings Rate</span>
                          <span className="text-muted-foreground">
                            {formatPercent(insights?.latestSavingsRate)} / {goals.targetSavingsRate}% target
                          </span>
                        </div>
                        <Progress value={Math.min(100, Math.max(0, ((insights?.latestSavingsRate || 0) / goals.targetSavingsRate) * 100))} className="h-2" />
                      </div>
                    )}
                    
                    {goals.targetMonthlySavings != null && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">Monthly Savings</span>
                          <span className="text-muted-foreground">
                            {formatCurrency(insights?.latestMonthlySurplus)} / {formatCurrency(goals.targetMonthlySavings)} target
                          </span>
                        </div>
                        <Progress value={Math.min(100, Math.max(0, ((insights?.latestMonthlySurplus || 0) / goals.targetMonthlySavings) * 100))} className="h-2" />
                      </div>
                    )}

                    {goals.targetDebtPayoffMonths != null && (
                      <div className="flex justify-between items-center py-2 border-t border-border mt-2">
                        <div className="space-y-0.5">
                          <div className="text-sm font-medium">Debt Payoff Target</div>
                          <div className="text-xs text-muted-foreground">Become debt-free in {goals.targetDebtPayoffMonths} months</div>
                        </div>
                        <div className="text-sm font-semibold">
                          Target set
                        </div>
                      </div>
                    )}

                    {goals.targetEmergencyFundMonths != null && (
                      <div className="flex justify-between items-center py-2 border-t border-border mt-2">
                        <div className="space-y-0.5">
                          <div className="text-sm font-medium">Emergency Fund Target</div>
                          <div className="text-xs text-muted-foreground">Save {goals.targetEmergencyFundMonths} months of expenses</div>
                        </div>
                        <div className="text-sm font-semibold">
                          Target set
                        </div>
                      </div>
                    )}
                  </div>
                )}
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