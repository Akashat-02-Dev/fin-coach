import { useState } from "wouter";
import { Link } from "wouter";
import { useListAnalysisHistory, useDeleteAnalysis, getListAnalysisHistoryQueryKey, getGetAnalysisStatsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, ArrowRight, FileText, Download } from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export default function History() {
  const { data: history, isLoading } = useListAnalysisHistory();
  const deleteAnalysis = useDeleteAnalysis();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const formatCurrency = (val: number | null | undefined) => 
    val != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val) : '-';
  
  const formatPercent = (val: number | null | undefined) => 
    val != null ? new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 }).format(val / 100) : '-';

  const handleDelete = (id: number) => {
    deleteAnalysis.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Analysis deleted" });
        queryClient.invalidateQueries({ queryKey: getListAnalysisHistoryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAnalysisStatsQueryKey() });
      },
      onError: () => {
        toast({ title: "Error deleting analysis", variant: "destructive" });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 max-w-5xl mx-auto animate-pulse">
        <Skeleton className="h-10 w-48" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      </div>
    );
  }

  const hasHistory = history && history.length > 0;

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analysis History</h1>
          <p className="text-muted-foreground mt-1">Review your past financial reports and track your progress over time.</p>
        </div>
        <div className="flex items-center gap-2">
          {hasHistory && (
            <Button variant="outline" onClick={() => window.open("/api/analysis/export/csv", "_blank")}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          )}
          <Button asChild>
            <Link href="/analyze">Run New Analysis</Link>
          </Button>
        </div>
      </div>

      {!hasHistory ? (
         <Card className="text-center py-16 border-dashed border-2">
           <CardContent className="space-y-4">
             <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
             <h3 className="text-lg font-medium">No history found</h3>
             <p className="text-muted-foreground">You haven't run any financial analyses yet.</p>
           </CardContent>
         </Card>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <Card key={item.id} className="overflow-hidden hover-elevate transition-all border-border">
              <div className="flex flex-col sm:flex-row">
                <div className="p-6 bg-muted/30 sm:w-1/4 sm:border-r border-border flex flex-col justify-center">
                  <div className="text-sm text-muted-foreground">Date</div>
                  <div className="font-semibold text-lg">{format(new Date(item.createdAt), 'MMM d, yyyy')}</div>
                  <div className="mt-4 text-xs font-mono text-muted-foreground">ID: {item.id}</div>
                </div>
                
                <div className="p-6 flex-1 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Income</div>
                      <div className="font-medium">{formatCurrency(item.monthlyIncome)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Expenses</div>
                      <div className="font-medium">{formatCurrency(item.totalExpenses)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Savings Rate</div>
                      <div className="font-bold text-primary">{formatPercent(item.savingsRate)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Total Debt</div>
                      <div className="font-medium">{formatCurrency(item.totalDebt)}</div>
                    </div>
                  </div>
                  
                  <div className="flex sm:flex-col gap-2 w-full sm:w-auto shrink-0 justify-end mt-4 sm:mt-0">
                    <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                      <Link href={`/results/${item.id}`}>View Full Report <ArrowRight className="ml-2 h-4 w-4" /></Link>
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-full sm:w-auto text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Delete</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this analysis report. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDelete(item.id)}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}