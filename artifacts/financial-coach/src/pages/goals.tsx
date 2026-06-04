import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useGetGoals, useUpsertGoals, getGetGoalsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, Save } from "lucide-react";

const formSchema = z.object({
  targetSavingsRate: z.coerce.number().min(0).max(100).optional().or(z.literal("")),
  targetMonthlySavings: z.coerce.number().min(0).optional().or(z.literal("")),
  targetDebtPayoffMonths: z.coerce.number().min(0).optional().or(z.literal("")),
  targetEmergencyFundMonths: z.coerce.number().min(0).optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

export default function GoalsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: goals, isLoading } = useGetGoals();
  const upsertGoals = useUpsertGoals();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      targetSavingsRate: "",
      targetMonthlySavings: "",
      targetDebtPayoffMonths: "",
      targetEmergencyFundMonths: "",
      notes: "",
    },
  });

  const initializedRef = useRef(false);

  useEffect(() => {
    if (goals && !initializedRef.current) {
      form.reset({
        targetSavingsRate: goals.targetSavingsRate ?? "",
        targetMonthlySavings: goals.targetMonthlySavings ?? "",
        targetDebtPayoffMonths: goals.targetDebtPayoffMonths ?? "",
        targetEmergencyFundMonths: goals.targetEmergencyFundMonths ?? "",
        notes: goals.notes ?? "",
      });
      initializedRef.current = true;
    }
  }, [goals, form]);

  const onSubmit = (values: FormValues) => {
    upsertGoals.mutate(
      {
        data: {
          targetSavingsRate: values.targetSavingsRate === "" ? null : Number(values.targetSavingsRate),
          targetMonthlySavings: values.targetMonthlySavings === "" ? null : Number(values.targetMonthlySavings),
          targetDebtPayoffMonths: values.targetDebtPayoffMonths === "" ? null : Number(values.targetDebtPayoffMonths),
          targetEmergencyFundMonths: values.targetEmergencyFundMonths === "" ? null : Number(values.targetEmergencyFundMonths),
          notes: values.notes === "" ? null : values.notes,
        },
      },
      {
        onSuccess: (updatedGoals) => {
          queryClient.setQueryData(getGetGoalsQueryKey(), updatedGoals);
          toast({
            title: "Goals saved",
            description: "Your dashboard will now track progress.",
          });
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Failed to save goals",
            description: "An error occurred while saving your goals. Please try again.",
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 max-w-3xl mx-auto">
        <Skeleton className="h-10 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-10 w-24" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Goals</h1>
          <p className="text-muted-foreground mt-1">
            Set your targets to track your progress on the dashboard.
          </p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Your Targets
          </CardTitle>
          <CardDescription>
            All fields are optional. Fill out the ones that matter to you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="targetSavingsRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Savings Rate (%)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g. 20" {...field} />
                      </FormControl>
                      <FormDescription>Recommended: 20% or more</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="targetMonthlySavings"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Monthly Savings ($)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g. 1000" {...field} />
                      </FormControl>
                      <FormDescription>Amount to save each month</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="targetDebtPayoffMonths"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Debt Payoff (months)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g. 24" {...field} />
                      </FormControl>
                      <FormDescription>Months until you are debt-free</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="targetEmergencyFundMonths"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Emergency Fund</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g. 6" {...field} />
                      </FormControl>
                      <FormDescription>Standard advice: 3–6 months</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any context for your goals?" 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-2">
                <Button 
                  type="submit" 
                  disabled={upsertGoals.isPending}
                  data-testid="button-save-goals"
                  className="flex items-center gap-2"
                >
                  {upsertGoals.isPending ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="h-4 w-4" /> Save Goals
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
