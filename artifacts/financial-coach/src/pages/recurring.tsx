import { useGetRecurringTransactions } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";

export default function Recurring() {
  const { data: transactions, isLoading } = useGetRecurringTransactions();

  if (isLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Recurring Transactions</h1>
        <Card className="text-center py-16">
          <CardContent>
            <RefreshCw className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">No recurring transactions detected. Run an analysis first.</h3>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sortedTransactions = [...transactions].sort((a, b) => {
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    return b.estimatedMonthly - a.estimatedMonthly;
  });

  const total = sortedTransactions.reduce((sum, t) => sum + t.estimatedMonthly, 0);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight">Recurring Transactions</h1>

      <Card>
        <CardHeader>
          <CardTitle>Detected Subscriptions & Bills</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Est. Monthly</TableHead>
                <TableHead>Confidence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTransactions.map((t, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>{t.category}</TableCell>
                  <TableCell>{formatCurrency(t.estimatedMonthly)}</TableCell>
                  <TableCell>
                    {t.confidence >= 0.8 ? (
                      <Badge className="bg-green-500 hover:bg-green-600">High</Badge>
                    ) : t.confidence >= 0.5 ? (
                      <Badge className="bg-amber-500 hover:bg-amber-600">Medium</Badge>
                    ) : (
                      <Badge className="bg-slate-500 hover:bg-slate-600">Low</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="mt-6 pt-4 border-t flex justify-end">
            <h3 className="text-xl font-bold">Total recurring: {formatCurrency(total)}/mo</h3>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}