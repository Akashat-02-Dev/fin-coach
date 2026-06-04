import { useListAnalysisHistory } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { BarChart2 } from "lucide-react";

export default function Compare() {
  const { data: history, isLoading } = useListAnalysisHistory();

  const formatCurrency = (val: number | null | undefined) => 
    val != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val) : '-';
  
  const formatPercent = (val: number | null | undefined) => 
    val != null ? new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 }).format(val / 100) : '-';

  if (isLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  const sortedHistory = [...(history || [])].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  if (sortedHistory.length < 2) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Compare Months</h1>
        <Card className="text-center py-16">
          <CardContent>
            <BarChart2 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">Run at least 2 analyses to compare months</h3>
          </CardContent>
        </Card>
      </div>
    );
  }

  const chartData = sortedHistory.map(item => ({
    name: format(new Date(item.createdAt), "MMM d"),
    Income: item.monthlyIncome,
    Expenses: item.totalExpenses,
    Savings: (item.savingsRate ?? 0) * item.monthlyIncome / 100,
  }));

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight">Compare Months</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Income vs Expenses vs Savings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(val) => `$${val}`} />
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

      <Card>
        <CardHeader>
          <CardTitle>Data Table</CardTitle>
        </CardHeader>
        <CardContent>
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
                  <TableCell>{format(new Date(item.createdAt), "MMM d, yyyy")}</TableCell>
                  <TableCell>{formatCurrency(item.monthlyIncome)}</TableCell>
                  <TableCell>{formatCurrency(item.totalExpenses)}</TableCell>
                  <TableCell>{formatPercent(item.savingsRate)}</TableCell>
                  <TableCell>{formatCurrency(item.totalDebt)}</TableCell>
                  <TableCell>{formatCurrency(item.monthlyIncome - item.totalExpenses)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}