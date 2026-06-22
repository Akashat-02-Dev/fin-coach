import { useListAnalysisHistory } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { BarChart2 } from "lucide-react";

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

export default function Compare() {
  const { data: history, isLoading } = useListAnalysisHistory();
  const { user } = useAuth();
  const currencySymbol = user?.baseCurrency ? (new Intl.NumberFormat("en-US", { style: "currency", currency: user.baseCurrency }).formatToParts(0).find(p => p.type === 'currency')?.value || '$') : '$';

  const formatCurrency = (val: number | null | undefined) => 
    val != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency: user?.baseCurrency || 'USD', maximumFractionDigits: 0 }).format(val) : '-';
  
  const formatPercent = (val: number | null | undefined) => 
    val != null ? new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 }).format(val / 100) : '-';

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 max-w-6xl mx-auto animate-pulse">
        <div className="h-8 w-48 bg-muted rounded-md mb-8" />
        <div className="h-96 w-full bg-muted rounded-xl" />
        <div className="h-64 w-full bg-muted rounded-xl" />
      </div>
    );
  }

  const sortedHistory = [...(history || [])].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  if (sortedHistory.length < 2) {
    return (
      <motion.div 
        className="p-6 md:p-8 max-w-5xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-8">Compare Months</h1>
        <Card className="glass-card text-center py-16">
          <CardContent>
            <BarChart2 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">Run at least 2 analyses to compare months</h3>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const chartData = sortedHistory.map(item => ({
    name: format(new Date(item.createdAt), "MMM d"),
    Income: item.monthlyIncome,
    Expenses: item.totalExpenses,
    Savings: (item.savingsRate ?? 0) * item.monthlyIncome / 100,
  }));

  return (
    <motion.div 
      className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.h1 variants={itemVariants} className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
        Compare Months
      </motion.h1>
      
      <motion.div variants={itemVariants}>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Income vs Expenses vs Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(val) => `${currencySymbol}${val}`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="Income" fill="#0d9488" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Expenses" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Savings" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Data Table</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Income</TableHead>
                  <TableHead>Expenses</TableHead>
                  <TableHead>Savings Rate</TableHead>
                  <TableHead>Debt</TableHead>
                  <TableHead>Net Surplus</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{format(new Date(item.createdAt), "MMM d, yyyy")}</TableCell>
                    <TableCell className="font-mono">{formatCurrency(item.monthlyIncome)}</TableCell>
                    <TableCell className="font-mono">{formatCurrency(item.totalExpenses)}</TableCell>
                    <TableCell className="font-mono text-primary font-bold">{formatPercent(item.savingsRate)}</TableCell>
                    <TableCell className="font-mono">{formatCurrency(item.totalDebt)}</TableCell>
                    <TableCell className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(item.monthlyIncome - item.totalExpenses)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}