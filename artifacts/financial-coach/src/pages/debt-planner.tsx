import { useState } from "react";
import { useGetDebtPayoffPlan } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CreditCard } from "lucide-react";

export default function DebtPlanner() {
  const { data: plan, isLoading } = useGetDebtPayoffPlan();
  const [method, setMethod] = useState<"avalanche" | "snowball">("avalanche");
  const [showAllRows, setShowAllRows] = useState(false);

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;

  if (!plan?.hasDebts) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Debt Payoff Planner</h1>
        <Card className="text-center py-16">
          <CardContent>
            <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">No debts found in your latest analysis</h3>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  const selectedPlan = plan[method];
  const otherPlan = plan[method === "avalanche" ? "snowball" : "avalanche"];
  
  const chartData = selectedPlan?.schedule.map((row) => ({
    month: `Month ${row.month}`,
    remainingBalance: row.remainingBalance
  })).filter((_, i, arr) => arr.length <= 36 || i % 3 === 0 || i === arr.length - 1) || [];

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight">Debt Payoff Planner</h1>

      <Tabs value={method} onValueChange={(val) => setMethod(val as "avalanche" | "snowball")}>
        <TabsList className="mb-4">
          <TabsTrigger value="avalanche">Avalanche (Highest Interest First)</TabsTrigger>
          <TabsTrigger value="snowball">Snowball (Smallest Balance First)</TabsTrigger>
        </TabsList>
        
        {method === "avalanche" && plan.avalanche && plan.snowball && plan.avalanche.totalInterest < plan.snowball.totalInterest && (
          <div className="bg-green-100 text-green-800 p-4 rounded-md mb-6 dark:bg-green-900/30 dark:text-green-300">
            Avalanche saves you {formatCurrency(plan.snowball.totalInterest - plan.avalanche.totalInterest)} less interest vs Snowball
          </div>
        )}
        
        <div className="grid md:grid-cols-4 gap-4 mb-6 mt-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-sm text-muted-foreground">Total Debt</div>
              <div className="text-2xl font-bold">{formatCurrency(plan.totalDebt)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-sm text-muted-foreground">Monthly Budget</div>
              <div className="text-2xl font-bold">{formatCurrency(plan.monthlyBudget)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-sm text-muted-foreground">Months to Pay Off</div>
              <div className="text-2xl font-bold">{selectedPlan?.monthsToPayoff}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-sm text-muted-foreground">Total Interest</div>
              <div className="text-2xl font-bold">{formatCurrency(selectedPlan?.totalInterest || 0)}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Payoff Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(val) => `$${val}`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Area type="monotone" dataKey="remainingBalance" stroke="#ef4444" fill="#fecaca" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Debt Name</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Principal</TableHead>
                  <TableHead>Interest</TableHead>
                  <TableHead>Remaining Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedPlan?.schedule.slice(0, showAllRows ? undefined : 12).map((row, i) => (
                  <TableRow key={i}>
                    <TableCell>{row.month}</TableCell>
                    <TableCell>{row.debtName}</TableCell>
                    <TableCell>{formatCurrency(row.payment)}</TableCell>
                    <TableCell>{formatCurrency(row.principalPaid)}</TableCell>
                    <TableCell>{formatCurrency(row.interestPaid)}</TableCell>
                    <TableCell>{formatCurrency(row.remainingBalance)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!showAllRows && (selectedPlan?.schedule.length || 0) > 12 && (
              <div className="text-center mt-4">
                <Button variant="outline" onClick={() => setShowAllRows(true)}>Show all rows</Button>
              </div>
            )}
          </CardContent>
        </Card>

      </Tabs>
    </div>
  );
}