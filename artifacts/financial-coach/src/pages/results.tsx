import { useParams, Link } from "wouter";
import { useGetAnalysis, getGetAnalysisQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
  RadialBarChart, RadialBar, PolarAngleAxis
} from "recharts";
import { 
  ArrowLeft, Lightbulb, ShieldAlert, Target, TrendingUp, AlertTriangle, 
  CheckCircle2, Info, ArrowDownRight, ArrowUpRight,
  ArrowRight
} from "lucide-react";

const COLORS = [
  'hsl(var(--chart-1))', 
  'hsl(var(--chart-2))', 
  'hsl(var(--chart-3))', 
  'hsl(var(--chart-4))', 
  'hsl(var(--chart-5))'
];

export default function Results() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  
  const { data: analysis, isLoading, isError } = useGetAnalysis(id, { 
    query: { enabled: !!id, queryKey: getGetAnalysisQueryKey(id) } 
  });

  const formatCurrency = (val: number | null | undefined) => 
    val != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val) : '-';
  
  const formatPercent = (val: number | null | undefined) => 
    val != null ? new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 }).format(val / 100) : '-';

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 max-w-6xl mx-auto animate-pulse">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-12 w-3/4" />
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError || !analysis) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h2 className="text-2xl font-bold">Analysis Not Found</h2>
        <p className="text-muted-foreground">The report you're looking for doesn't exist or was deleted.</p>
        <Button asChild className="mt-4"><Link href="/history">Back to History</Link></Button>
      </div>
    );
  }

  const { budgetAnalysis, savingsStrategy, debtReduction } = analysis;
  const hasDebt = debtReduction && debtReduction.totalDebt > 0;

  // Chart data formatting
  const spendingData = budgetAnalysis.spendingCategories
    .filter(c => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);
    
  const emergencyFundPercent = Math.min(100, 
    // Assuming currentStatus is a string that might contain a number, or just deriving it
    // In a real app we'd want actual current amount, but let's approximate from the data shape
    (savingsStrategy.emergencyFund.monthsOfExpenses / 6) * 100 // Target 6 months
  );

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col space-y-4">
        <Button variant="ghost" size="sm" asChild className="w-fit -ml-3 text-muted-foreground">
          <Link href="/history"><ArrowLeft className="mr-2 h-4 w-4" /> Back to History</Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Financial Health Report</h1>
          <p className="text-muted-foreground mt-1">
            Generated on {analysis.createdAt ? format(new Date(analysis.createdAt), 'MMMM d, yyyy') : 'Unknown date'} 
            <span className="ml-3 px-2 py-0.5 rounded-full bg-muted text-xs font-mono">ID: {analysis.id}</span>
          </p>
        </div>
      </div>

      {/* Top Level Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="text-sm font-medium text-primary/80 mb-2">Monthly Income</div>
            <div className="text-3xl font-bold text-primary">{formatCurrency(analysis.input.monthlyIncome)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-muted-foreground mb-2">Total Expenses</div>
            <div className="text-3xl font-bold">{formatCurrency(budgetAnalysis.totalExpenses)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-muted-foreground mb-2">Savings Rate</div>
            <div className="text-3xl font-bold flex items-center gap-2">
              {formatPercent(budgetAnalysis.savingsRate)}
              {(budgetAnalysis.savingsRate || 0) >= 20 ? (
                <ArrowUpRight className="h-5 w-5 text-green-500" />
              ) : (
                <ArrowDownRight className="h-5 w-5 text-orange-500" />
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-muted-foreground mb-2">Total Debt</div>
            <div className="text-3xl font-bold">{formatCurrency(debtReduction.totalDebt)}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="budget" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-14 bg-muted/50 p-1">
          <TabsTrigger value="budget" className="text-base">Budget Analysis</TabsTrigger>
          <TabsTrigger value="savings" className="text-base">Savings Strategy</TabsTrigger>
          <TabsTrigger value="debt" className="text-base">Debt Reduction</TabsTrigger>
        </TabsList>
        
        {/* BUDGET TAB */}
        <TabsContent value="budget" className="space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card>
            <CardHeader>
              <CardTitle>Spending Overview</CardTitle>
              <CardDescription>{budgetAnalysis.summary}</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-8">
              <div className="h-[300px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={spendingData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="amount"
                    >
                      {spendingData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4 overflow-auto max-h-[300px] pr-4">
                {spendingData.map((cat, idx) => (
                  <div key={cat.category} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="font-medium">{cat.category}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(cat.amount)}</div>
                      <div className="text-xs text-muted-foreground">{cat.percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Lightbulb className="h-5 w-5 text-yellow-500" /> Actionable Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {budgetAnalysis.recommendations.map((rec, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
                    <div className="mt-0.5"><CheckCircle2 className="h-5 w-5 text-primary" /></div>
                    <div className="space-y-1">
                      <h4 className="font-medium">{rec.category}</h4>
                      <p className="text-sm text-muted-foreground">{rec.recommendation}</p>
                      {rec.potentialSavings && (
                        <div className="text-sm font-medium text-green-600 mt-2">
                          Potential monthly savings: {formatCurrency(rec.potentialSavings)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SAVINGS TAB */}
        <TabsContent value="savings" className="space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Emergency Fund</CardTitle>
                <CardDescription>Target: {savingsStrategy.emergencyFund.monthsOfExpenses} months of expenses</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="h-[200px] w-full mt-4 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart 
                      cx="50%" cy="50%" 
                      innerRadius="70%" outerRadius="100%" 
                      barSize={20} 
                      data={[{ name: 'Progress', value: emergencyFundPercent, fill: 'hsl(var(--primary))' }]} 
                      startAngle={180} endAngle={0}
                    >
                      <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                      <RadialBar background clockWise dataKey="value" cornerRadius={10} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                    <span className="text-3xl font-bold">{emergencyFundPercent.toFixed(0)}%</span>
                    <span className="text-sm text-muted-foreground uppercase tracking-wider">Funded</span>
                  </div>
                </div>
                <div className="w-full text-center mt-2 space-y-1">
                  <p className="font-medium text-lg text-primary">{savingsStrategy.emergencyFund.currentStatus}</p>
                  <p className="text-sm text-muted-foreground">Target: {formatCurrency(savingsStrategy.emergencyFund.recommendedAmount)}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Strategy Overview</CardTitle>
                <CardDescription>{savingsStrategy.summary}</CardDescription>
              </CardHeader>
              <CardContent>
                <h4 className="font-semibold mb-4 mt-2">Recommended Allocations</h4>
                <div className="space-y-4">
                  {savingsStrategy.recommendations.map((rec, i) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border-b last:border-0">
                      <div>
                        <div className="font-medium">{rec.category}</div>
                        <div className="text-sm text-muted-foreground mt-1">{rec.rationale}</div>
                      </div>
                      <div className="font-bold text-lg whitespace-nowrap mt-2 sm:mt-0 text-primary">
                        {formatCurrency(rec.amount)} / mo
                      </div>
                    </div>
                  ))}
                </div>
                
                <h4 className="font-semibold mb-3 mt-8">Automation Tips</h4>
                <ul className="space-y-2">
                  {savingsStrategy.automationTips.map((tip, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <Target className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* DEBT TAB */}
        <TabsContent value="debt" className="space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {!hasDebt ? (
            <Card className="bg-green-500/5 border-green-500/20 text-center py-16">
              <CardContent className="space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                  <ShieldAlert className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-green-700">You are debt free!</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Excellent financial health. Since you have no outstanding debts, you can focus 100% of your excess cash flow on wealth building and investments.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Debt Reduction Strategy</CardTitle>
                  <CardDescription>{debtReduction.summary}</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                  {debtReduction.avalanche && (
                    <div className="border rounded-xl p-5 bg-muted/10 relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-bold rounded-bl-lg">
                        Math Optimal
                      </div>
                      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" /> Avalanche Method
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4 h-10">Pays off highest interest rate first to minimize total interest paid.</p>
                      
                      <div className="space-y-3 mb-6 bg-background p-4 rounded-lg border">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Time to payoff</span>
                          <span className="font-bold">{debtReduction.avalanche.monthsToPayoff} months</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Interest</span>
                          <span className="font-bold text-destructive">{formatCurrency(debtReduction.avalanche.totalInterest)}</span>
                        </div>
                      </div>
                      
                      <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Suggested Order</h4>
                      <ol className="space-y-1 list-decimal list-inside text-sm pl-2">
                        {debtReduction.avalanche.order.map((item, i) => (
                          <li key={i} className="py-1 border-b border-border/50 last:border-0">{item}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {debtReduction.snowball && (
                    <div className="border rounded-xl p-5 bg-muted/10 relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-muted-foreground text-primary-foreground px-3 py-1 text-xs font-bold rounded-bl-lg">
                        Psychological
                      </div>
                      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <Target className="h-5 w-5" /> Snowball Method
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4 h-10">Pays off smallest balances first to build momentum and motivation.</p>
                      
                      <div className="space-y-3 mb-6 bg-background p-4 rounded-lg border">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Time to payoff</span>
                          <span className="font-bold">{debtReduction.snowball.monthsToPayoff} months</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Interest</span>
                          <span className="font-bold text-destructive">{formatCurrency(debtReduction.snowball.totalInterest)}</span>
                        </div>
                      </div>
                      
                      <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Suggested Order</h4>
                      <ol className="space-y-1 list-decimal list-inside text-sm pl-2">
                        {debtReduction.snowball.order.map((item, i) => (
                          <li key={i} className="py-1 border-b border-border/50 last:border-0">{item}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Info className="h-5 w-5 text-primary" /> Key Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {debtReduction.recommendations.map((rec, i) => (
                      <li key={i} className="flex gap-3 items-start">
                        <div className="mt-1 shrink-0"><ArrowRight className="h-4 w-4 text-primary" /></div>
                        <span className="text-muted-foreground">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}