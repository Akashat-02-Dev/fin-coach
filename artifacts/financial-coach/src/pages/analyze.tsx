import { useState } from "react";
import { useLocation } from "wouter";
import { useRunAnalysis, getListAnalysisHistoryQueryKey, getGetAnalysisStatsQueryKey } from "@workspace/api-client-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Loader2, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const formSchema = z.object({
  monthlyIncome: z.coerce.number().min(0, "Income must be positive"),
  dependants: z.coerce.number().min(0).default(0),
  expenses: z.array(z.object({
    category: z.string().min(1, "Category is required"),
    amount: z.coerce.number().min(0)
  })).min(1, "At least one expense is required"),
  debts: z.array(z.object({
    name: z.string().min(1, "Debt name required"),
    amount: z.coerce.number().min(0.01, "Amount must be > 0"),
    interestRate: z.coerce.number().min(0),
    minPayment: z.coerce.number().min(0).optional().nullable()
  })).optional(),
  notes: z.string().optional().nullable()
});

type FormValues = z.infer<typeof formSchema>;

const defaultExpenses = [
  { category: "Housing", amount: 0 },
  { category: "Food", amount: 0 },
  { category: "Transport", amount: 0 },
  { category: "Utilities", amount: 0 },
  { category: "Healthcare", amount: 0 }
];

export default function Analyze() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const runAnalysis = useRunAnalysis();
  
  const [progressStep, setProgressStep] = useState(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      monthlyIncome: 0,
      dependants: 0,
      expenses: defaultExpenses,
      debts: [],
      notes: ""
    }
  });

  const { fields: expenseFields, append: appendExpense, remove: removeExpense } = useFieldArray({
    control: form.control,
    name: "expenses"
  });

  const { fields: debtFields, append: appendDebt, remove: removeDebt } = useFieldArray({
    control: form.control,
    name: "debts"
  });

  const onSubmit = (data: FormValues) => {
    // Transform expenses array back into the object map expected by the API
    const expensesObj: Record<string, number> = {};
    data.expenses.forEach(e => {
      expensesObj[e.category] = e.amount;
    });

    const payload = {
      monthlyIncome: data.monthlyIncome,
      dependants: data.dependants,
      expenses: expensesObj,
      debts: data.debts || [],
      notes: data.notes
    };

    // Simulate multi-step progress visually while mutation is pending
    setProgressStep(1); // Start
    
    const timeouts = [
      setTimeout(() => setProgressStep(2), 1500),
      setTimeout(() => setProgressStep(3), 3000),
      setTimeout(() => setProgressStep(4), 4500)
    ];

    runAnalysis.mutate({ data: payload }, {
      onSuccess: (res) => {
        timeouts.forEach(clearTimeout);
        queryClient.invalidateQueries({ queryKey: getListAnalysisHistoryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAnalysisStatsQueryKey() });
        
        toast({ title: "Analysis complete!" });
        if (res.id) {
          setLocation(`/results/${res.id}`);
        }
      },
      onError: (err) => {
        timeouts.forEach(clearTimeout);
        setProgressStep(0);
        toast({ 
          title: "Analysis failed", 
          description: err.error || "An unexpected error occurred", 
          variant: "destructive" 
        });
      }
    });
  };

  if (runAnalysis.isPending) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-8 max-w-2xl mx-auto text-center space-y-12">
        <div className="space-y-4">
          <h2 className="text-3xl font-bold tracking-tight text-primary">Running Analysis</h2>
          <p className="text-muted-foreground">Our AI agents are crunching your numbers...</p>
        </div>

        <div className="w-full max-w-md space-y-8">
          <div className={`flex items-center gap-4 transition-opacity duration-500 ${progressStep >= 1 ? 'opacity-100' : 'opacity-30'}`}>
            <div className="relative">
              {progressStep > 1 ? (
                <CheckCircle2 className="h-8 w-8 text-primary" />
              ) : (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              )}
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-lg">Budget Agent</h4>
              <p className="text-sm text-muted-foreground">Categorizing spending & calculating savings rate</p>
            </div>
          </div>

          <div className={`flex items-center gap-4 transition-opacity duration-500 ${progressStep >= 2 ? 'opacity-100' : 'opacity-30'}`}>
            <div className="relative">
              {progressStep > 2 ? (
                <CheckCircle2 className="h-8 w-8 text-primary" />
              ) : progressStep === 2 ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : (
                <div className="h-8 w-8 rounded-full border-2 border-muted" />
              )}
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-lg">Savings Strategy Agent</h4>
              <p className="text-sm text-muted-foreground">Evaluating emergency fund & setting targets</p>
            </div>
          </div>

          <div className={`flex items-center gap-4 transition-opacity duration-500 ${progressStep >= 3 ? 'opacity-100' : 'opacity-30'}`}>
            <div className="relative">
              {progressStep > 3 ? (
                <CheckCircle2 className="h-8 w-8 text-primary" />
              ) : progressStep === 3 ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : (
                <div className="h-8 w-8 rounded-full border-2 border-muted" />
              )}
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-lg">Debt Reduction Agent</h4>
              <p className="text-sm text-muted-foreground">Comparing payoff strategies & timelines</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Financial Analysis</h1>
        <p className="text-muted-foreground mt-1">Enter your current financial details. Our AI agents will provide a comprehensive health check.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Section 1: Basic Info */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Income & Basics</CardTitle>
              <CardDescription>Your regular monthly cash flow.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="monthlyIncome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Income (After Tax)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                        <Input type="number" placeholder="5000" className="pl-8 font-mono" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dependants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dependants</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" className="font-mono" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Section 2: Expenses */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Monthly Expenses</CardTitle>
                <CardDescription>Average spending by category.</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => appendExpense({ category: "", amount: 0 })}>
                <Plus className="h-4 w-4 mr-2" /> Add Category
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {expenseFields.map((field, index) => (
                <div key={field.id} className="flex gap-4 items-start">
                  <FormField
                    control={form.control}
                    name={`expenses.${index}.category`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="Category name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`expenses.${index}.amount`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                            <Input type="number" placeholder="0" className="pl-8 font-mono" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="mt-0.5 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => removeExpense(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Section 3: Debts */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Outstanding Debts</CardTitle>
                <CardDescription>Credit cards, loans, etc. Leave empty if none.</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => appendDebt({ name: "", amount: 0, interestRate: 0, minPayment: null })}>
                <Plus className="h-4 w-4 mr-2" /> Add Debt
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {debtFields.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-lg">
                  No debts added. You are debt-free!
                </div>
              ) : (
                <div className="space-y-6">
                  {debtFields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-md relative bg-muted/20">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="absolute right-2 top-2 text-muted-foreground hover:text-destructive"
                        onClick={() => removeDebt(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 pr-8">
                        <FormField
                          control={form.control}
                          name={`debts.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Name/Account</FormLabel>
                              <FormControl><Input placeholder="Visa..." {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`debts.${index}.amount`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Balance</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                                  <Input type="number" className="pl-8 font-mono" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`debts.${index}.interestRate`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Interest Rate</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input type="number" step="0.1" className="pr-8 font-mono" {...field} />
                                  <span className="absolute right-3 top-2.5 text-muted-foreground">%</span>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`debts.${index}.minPayment`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Min Payment</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                                  <Input type="number" className="pl-8 font-mono" {...field} value={field.value || ''} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 4: Notes */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Additional Context</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea 
                        placeholder="Any specific financial goals or concerns you'd like the AI to consider? (e.g. saving for a house in 2 years)" 
                        className="min-h-[100px]"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end pt-4 pb-12">
            <Button type="submit" size="lg" className="w-full sm:w-auto shadow-md font-semibold text-md px-8 hover-elevate">
              Run Complete Analysis
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}