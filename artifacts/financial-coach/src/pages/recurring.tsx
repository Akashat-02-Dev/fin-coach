import { useGetRecurringTransactions } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";
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

export default function Recurring() {
  const { data: transactions, isLoading } = useGetRecurringTransactions();
  const { user } = useAuth();

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto animate-pulse">
        <Skeleton className="h-10 w-48 rounded-md mb-8" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <motion.div 
        className="p-6 md:p-8 max-w-5xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-8">Recurring Transactions</h1>
        <Card className="glass-card text-center py-16">
          <CardContent>
            <RefreshCw className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">No recurring transactions detected. Run an analysis first.</h3>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const sortedTransactions = [...transactions].sort((a, b) => {
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    return b.estimatedMonthly - a.estimatedMonthly;
  });

  const total = sortedTransactions.reduce((sum, t) => sum + t.estimatedMonthly, 0);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: user?.baseCurrency || 'USD' }).format(val);

  return (
    <motion.div 
      className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.h1 variants={itemVariants} className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
        Recurring Transactions
      </motion.h1>

      <motion.div variants={itemVariants}>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Detected Subscriptions & Bills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
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
                      <TableCell className="font-mono">{formatCurrency(t.estimatedMonthly)}</TableCell>
                      <TableCell>
                        {t.confidence >= 0.8 ? (
                          <Badge className="bg-green-500 hover:bg-green-600 text-white">High</Badge>
                        ) : t.confidence >= 0.5 ? (
                          <Badge className="bg-amber-500 hover:bg-amber-600 text-white">Medium</Badge>
                        ) : (
                          <Badge className="bg-slate-500 hover:bg-slate-600 text-white">Low</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="mt-6 pt-4 border-t border-border/50 flex justify-end">
              <h3 className="text-xl font-bold">Total recurring: <span className="text-primary font-mono">{formatCurrency(total)}</span>/mo</h3>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}