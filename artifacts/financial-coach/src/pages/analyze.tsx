import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useRunAnalysis, getListAnalysisHistoryQueryKey, getGetAnalysisStatsQueryKey } from "@workspace/api-client-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { CsvImport } from "@/components/CsvImport";

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
  { category: "Food & Dining", amount: 0 },
  { category: "Transport", amount: 0 },
  { category: "Utilities", amount: 0 },
  { category: "Healthcare", amount: 0 },
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

  const { fields: expenseFields, append: appendExpense, remove: removeExpense, replace: replaceExpenses } = useFieldArray({
    control: form.control,
    name: "expenses"
  });

  const { fields: debtFields, append: appendDebt, remove: removeDebt } = useFieldArray({
    control: form.control,
    name: "debts"
  });

  const handleCsvApply = useCallback((expenses: Record<string, number>) => {
    const entries = Object.entries(expenses)
      .filter(([, v]) => v > 0)
      .map(([category, amount]) => ({ category, amount }));

    if (entries.length > 0) {
      replaceExpenses(entries);
      toast({ title: "Expenses imported", description: `${entries.length} categories loaded from your bank statement.` });
    }
  }, [replaceExpenses, toast]);

  const onSubmit = (data: FormValues) => {
    const expensesObj: Record<string, number> = {};
    data.expenses.forEach(e => { expensesObj[e.category] = e.amount; });

    const payload = {
      monthlyIncome: data.monthlyIncome,
      dependants: data.dependants,
      expenses: expensesObj,
      debts: data.debts || [],
      notes: data.notes
    };

    setProgressStep(1);
    const timeouts = [
      setTimeout(() => setProgressStep(2), 3000),
      setTimeout(() => setProgressStep(3), 7000),
    ];

    runAnalysis.mutate({ data: payload }, {
      onSuccess: (res) => {
        timeouts.forEach(clearTimeout);
        queryClient.invalidateQueries({ queryKey: getListAnalysisHistoryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAnalysisStatsQueryKey() });
        toast({ title: "Analysis complete!" });
        if (res.id) setLocation(`/results/${res.id}`);
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
    const steps = [
      { label: "Budget Agent", desc: "Categorizing spending & calculating savings rate" },
      { label: "Savings Strategy Agent", desc: "Evaluating emergency fund & setting targets" },
      { label: "Debt Reduction Agent", desc: "Comparing payoff strategies & timelines" },
    ];
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-8 max-w-2xl mx-auto text-center space-y-12">
        <div className="space-y-4">
          <h2 className="text-3xl font-bold tracking-tight text-primary">Running Analysis</h2>
          <p className="text-muted-foreground">Our AI agents are crunching your numbers...</p>
        </div>
        <div className="w-full max-w-md space-y-8">
          {steps.map((step, i) => {
            const idx = i + 1;
            const done = progressStep > idx;
            const active = progressStep === idx;
            return (
              <div
                key={step.label}
                className={`flex items-center gap-4 transition-opacity duration-500 ${progressStep >= idx ? "opacity-100" : "opacity-30"}`}
              >
                <div className="shrink-0">
                  {done ? (
                    <CheckCircle2 className="h-8 w-8 text-primary" />
                  ) : active ? (
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  ) : (
                    <div className="h-8 w-8 rounded-full border-2 border-muted" />
                  )}
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-lg">{step.label}</h4>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Financial Analysis</h1>
        <p className="text-muted-foreground mt-1">Enter your financial details or import a bank statement to auto-fill expenses.</p>
      </div>

      {/* CSV Import */}
      <CsvImport onApply={handleCsvApply} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

          {/* Income & Basics */}
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
                        <Input type="number" placeholder="5000" className="pl-8 font-mono" data-testid="input-monthly-income" {...field} />
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
                      <Input type="number" placeholder="0" className="font-mono" data-testid="input-dependants" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Monthly Expenses */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Monthly Expenses</CardTitle>
                <CardDescription>
                  Average spending by category.{" "}
                  {expenseFields.length > 0 && (
                    <span className="text-primary font-medium">
                      Total: ${expenseFields.reduce((sum, _, i) => {
                        const val = form.getValues(`expenses.${i}.amount`);
                        return sum + (Number(val) || 0);
                      }, 0).toLocaleString()}
                    </span>
                  )}
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendExpense({ category: "", amount: 0 })}
                data-testid="button-add-expense"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Category
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {expenseFields.map((field, index) => (
                <div key={field.id} className="flex gap-4 items-start" data-testid={`expense-row-${index}`}>
                  <FormField
                    control={form.control}
                    name={`expenses.${index}.category`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="Category name" data-testid={`input-expense-category-${index}`} {...field} />
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
                            <Input type="number" placeholder="0" className="pl-8 font-mono" data-testid={`input-expense-amount-${index}`} {...field} />
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
                    data-testid={`button-remove-expense-${index}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Outstanding Debts */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Outstanding Debts</CardTitle>
                <CardDescription>Credit cards, loans, etc. Leave empty if none.</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendDebt({ name: "", amount: 0, interestRate: 0, minPayment: null })}
                data-testid="button-add-debt"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Debt
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {debtFields.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-lg">
                  No debts added — you are debt-free!
                </div>
              ) : (
                <div className="space-y-6">
                  {debtFields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-md relative bg-muted/20" data-testid={`debt-row-${index}`}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2 text-muted-foreground hover:text-destructive"
                        onClick={() => removeDebt(index)}
                        data-testid={`button-remove-debt-${index}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 pr-8">
                        <FormField
                          control={form.control}
                          name={`debts.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Name / Account</FormLabel>
                              <FormControl><Input placeholder="Visa..." data-testid={`input-debt-name-${index}`} {...field} /></FormControl>
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
                                  <Input type="number" className="pl-8 font-mono" data-testid={`input-debt-amount-${index}`} {...field} />
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
                                  <Input type="number" step="0.1" className="pr-8 font-mono" data-testid={`input-debt-rate-${index}`} {...field} />
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
                                  <Input type="number" className="pl-8 font-mono" data-testid={`input-debt-minpay-${index}`} {...field} value={field.value ?? ""} />
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

          {/* Additional Context */}
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
                        placeholder="Any financial goals or concerns for the AI to consider? (e.g. saving for a house in 2 years)"
                        className="min-h-[100px]"
                        data-testid="textarea-notes"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end pt-4 pb-12">
            <Button
              type="submit"
              size="lg"
              className="w-full sm:w-auto shadow-md font-semibold text-md px-8 hover-elevate"
              data-testid="button-run-analysis"
            >
              Run Complete Analysis
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
