import { useState } from "react";
import { useGetDebtPayoffPlan } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CreditCard } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
} as const;

export default function DebtPlanner() {
  const { data: plan, isLoading } = useGetDebtPayoffPlan();
  const [method, setMethod] = useState<"avalanche" | "snowball">("avalanche");
  const [showAllRows, setShowAllRows] = useState(false);
  const { user } = useAuth();
  const currencySymbol = user?.baseCurrency ? (new Intl.NumberFormat("en-US", { style: "currency", currency: user.baseCurrency }).formatToParts(0).find(p => p.type === 'currency')?.value || '$') : '$';

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto animate-pulse">
        <Skeleton className="h-10 w-48 rounded-md mb-8" />
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    );
  }

  if (!plan?.hasDebts) {
    return (
      <motion.div 
        className="p-6 md:p-8 max-w-5xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-8">Debt Payoff Planner</h1>
        <Card className="glass-card text-center py-16">
          <CardContent>
            <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">No debts found in your latest analysis</h3>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: user?.baseCurrency || 'USD', maximumFractionDigits: 0 }).format(val);

  const selectedPlan = plan[method];
  const otherPlan = plan[method === "avalanche" ? "snowball" : "avalanche"];
  
  const chartData = selectedPlan?.schedule.map((row) => ({
    month: `Month ${row.month}`,
    remainingBalance: row.remainingBalance
  })).filter((_, i, arr) => arr.length <= 36 || i % 3 === 0 || i === arr.length - 1) || [];

  return (
    <motion.div 
      className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.h1 variants={itemVariants} className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
        Debt Payoff Planner
      </motion.h1>

      <Tabs value={method} onValueChange={(val) => setMethod(val as "avalanche" | "snowball")}>
        <motion.div variants={itemVariants} className="flex flex-col gap-4">
          <TabsList className="w-fit">
            <TabsTrigger value="avalanche">Avalanche (Highest Interest First)</TabsTrigger>
            <TabsTrigger value="snowball">Snowball (Smallest Balance First)</TabsTrigger>
          </TabsList>
          
          {method === "avalanche" && plan.avalanche && plan.snowball && plan.avalanche.totalInterest < plan.snowball.totalInterest && (
            <div className="bg-green-100 text-green-800 p-4 rounded-xl dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-900/50 text-sm font-medium">
              Avalanche saves you <span className="font-bold text-green-700 dark:text-green-400">{formatCurrency(plan.snowball.totalInterest - plan.avalanche.totalInterest)}</span> in interest vs the Snowball method.
            </div>
          )}
        </motion.div>
        
        {/* Responsive Grid */}
        <motion.div variants={itemVariants} className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6 mt-4">
          <Card className="glass-card transition-transform hover:-translate-y-1 duration-300">
            <CardContent className="pt-6 text-center">
              <div className="text-sm text-muted-foreground mb-1">Total Debt</div>
              <div className="text-2xl font-bold font-mono text-primary">{formatCurrency(plan.totalDebt)}</div>
            </CardContent>
          </Card>
          <Card className="glass-card transition-transform hover:-translate-y-1 duration-300">
            <CardContent className="pt-6 text-center">
              <div className="text-sm text-muted-foreground mb-1">Monthly Budget</div>
              <div className="text-2xl font-bold font-mono text-primary">{formatCurrency(plan.monthlyBudget)}</div>
            </CardContent>
          </Card>
          <Card className="glass-card transition-transform hover:-translate-y-1 duration-300">
            <CardContent className="pt-6 text-center">
              <div className="text-sm text-muted-foreground mb-1">Months to Pay Off</div>
              <div className="text-2xl font-bold font-mono text-primary">{selectedPlan?.monthsToPayoff}</div>
            </CardContent>
          </Card>
          <Card className="glass-card transition-transform hover:-translate-y-1 duration-300">
            <CardContent className="pt-6 text-center">
              <div className="text-sm text-muted-foreground mb-1">Total Interest</div>
              <div className="text-2xl font-bold font-mono text-destructive">{formatCurrency(selectedPlan?.totalInterest || 0)}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Payoff Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorDebt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.01}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(val) => `${currencySymbol}${val}`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Area type="monotone" dataKey="remainingBalance" stroke="#ef4444" fillOpacity={1} fill="url(#colorDebt)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Payment Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
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
                        <TableCell className="font-medium">{row.month}</TableCell>
                        <TableCell>{row.debtName}</TableCell>
                        <TableCell className="font-mono">{formatCurrency(row.payment)}</TableCell>
                        <TableCell className="font-mono">{formatCurrency(row.principalPaid)}</TableCell>
                        <TableCell className="font-mono text-destructive">{formatCurrency(row.interestPaid)}</TableCell>
                        <TableCell className="font-mono font-semibold">{formatCurrency(row.remainingBalance)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {!showAllRows && (selectedPlan?.schedule.length || 0) > 12 && (
                <div className="text-center mt-4">
                  <Button variant="outline" onClick={() => setShowAllRows(true)} className="rounded-full">
                    Show all rows
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </Tabs>
    </motion.div>
  );
}