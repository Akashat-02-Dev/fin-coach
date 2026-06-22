import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import {
  Eye,
  EyeOff,
  Lock,
  Plus,
  Trash2,
  ShieldCheck,
  Building2,
  TrendingUp,
  ShieldAlert,
  DollarSign,
  Briefcase,
  HelpCircle,
} from "lucide-react";
import {
  useGetVaultAccounts,
  useCreateVaultAccount,
  useDeleteVaultAccount,
  useGetVaultInvestments,
  useCreateVaultInvestment,
  useDeleteVaultInvestment,
  useGetVaultInsurancePolicies,
  useCreateVaultInsurancePolicy,
  useDeleteVaultInsurancePolicy,
  getGetVaultAccountsQueryKey,
  getGetVaultInvestmentsQueryKey,
  getGetVaultInsurancePoliciesQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

// Zod validation schemas
const accountFormSchema = z.object({
  institutionName: z.string().min(1, "Institution name is required"),
  accountType: z.string().min(1, "Account type is required"),
  encryptedAccountMask: z.string().min(4, "Account mask must be at least 4 characters (e.g. ****1234)"),
  currentBalance: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: "Balance must be a positive number",
  }),
  interestRate: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: "Interest rate must be a positive number",
  }),
});

const investmentFormSchema = z.object({
  assetClass: z.string().min(1, "Asset class is required"),
  tickerSymbol: z.string().optional(),
  currentValue: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: "Current value must be a positive number",
  }),
  costBasis: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: "Cost basis must be a positive number",
  }),
});

const insuranceFormSchema = z.object({
  policyType: z.string().min(1, "Policy type is required"),
  coverageAmount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: "Coverage amount must be a positive number",
  }),
  monthlyPremium: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: "Monthly premium must be a positive number",
  }),
});

// Container and item animation settings
const listVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } },
} as const;

export default function Vault() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [showBalances, setShowBalances] = useState(false);
  const [activeTab, setActiveTab] = useState<"accounts" | "investments" | "insurance">("accounts");

  // React Query queries
  const { data: accounts, isLoading: accountsLoading } = useGetVaultAccounts();
  const { data: investments, isLoading: investmentsLoading } = useGetVaultInvestments();
  const { data: insurance, isLoading: insuranceLoading } = useGetVaultInsurancePolicies();

  // React Query mutations
  const createAccountMutation = useCreateVaultAccount({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetVaultAccountsQueryKey() });
        toast({ title: "Account added", description: "Your bank details have been secure-saved." });
        accountForm.reset();
      },
      onError: (err: any) => {
        toast({
          title: "Error adding account",
          description: err.data?.error ?? err.message,
          variant: "destructive",
        });
      },
    }
  });

  const deleteAccountMutation = useDeleteVaultAccount({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetVaultAccountsQueryKey() });
        toast({ title: "Account deleted", description: "Account removed from your vault." });
      },
    }
  });

  const createInvestmentMutation = useCreateVaultInvestment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetVaultInvestmentsQueryKey() });
        toast({ title: "Investment added", description: "Portfolio data updated." });
        investmentForm.reset();
      },
      onError: (err: any) => {
        toast({
          title: "Error adding investment",
          description: err.data?.error ?? err.message,
          variant: "destructive",
        });
      },
    }
  });

  const deleteInvestmentMutation = useDeleteVaultInvestment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetVaultInvestmentsQueryKey() });
        toast({ title: "Investment deleted", description: "Investment removed from your vault." });
      },
    }
  });

  const createInsuranceMutation = useCreateVaultInsurancePolicy({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetVaultInsurancePoliciesQueryKey() });
        toast({ title: "Policy added", description: "Insurance details saved." });
        insuranceForm.reset();
      },
      onError: (err: any) => {
        toast({
          title: "Error adding policy",
          description: err.data?.error ?? err.message,
          variant: "destructive",
        });
      },
    }
  });

  const deleteInsuranceMutation = useDeleteVaultInsurancePolicy({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetVaultInsurancePoliciesQueryKey() });
        toast({ title: "Policy deleted", description: "Insurance policy removed." });
      },
    }
  });

  // Forms
  const accountForm = useForm<z.infer<typeof accountFormSchema>>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: { institutionName: "", accountType: "checking", encryptedAccountMask: "", currentBalance: "", interestRate: "" },
  });

  const investmentForm = useForm<z.infer<typeof investmentFormSchema>>({
    resolver: zodResolver(investmentFormSchema),
    defaultValues: { assetClass: "stocks", tickerSymbol: "", currentValue: "", costBasis: "" },
  });

  const insuranceForm = useForm<z.infer<typeof insuranceFormSchema>>({
    resolver: zodResolver(insuranceFormSchema),
    defaultValues: { policyType: "life", coverageAmount: "", monthlyPremium: "" },
  });

  // Currency masking display formatting
  const formatCurrency = (val: number | string) => {
    const baseCurr = user?.baseCurrency || "USD";
    if (!showBalances) {
      const formatter = new Intl.NumberFormat("en-US", { style: "currency", currency: baseCurr });
      const parts = formatter.formatToParts(0);
      const symbol = parts.find(part => part.type === 'currency')?.value || '$';
      return `${symbol}••••••`;
    }
    const num = typeof val === "string" ? parseFloat(val) : val;
    return new Intl.NumberFormat("en-US", { style: "currency", currency: baseCurr }).format(num);
  };

  const formatPercent = (val: number | string) => {
    if (!showBalances) return "••%";
    const num = typeof val === "string" ? parseFloat(val) : val;
    return `${num.toFixed(2)}%`;
  };

  return (
    <motion.div
      variants={listVariants}
      initial="hidden"
      animate="show"
      className="p-8 space-y-8 max-w-6xl mx-auto"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Encrypted Financial Vault</h1>
            <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full">
              <ShieldCheck className="h-3 w-3" />
              <span>AES-256-GCM Secure</span>
            </div>
          </div>
          <p className="text-muted-foreground mt-1">
            Store and manage bank credentials, portfolio assets, and policies.
          </p>
        </div>

        {/* Show/Hide eyeball toggle */}
        <Button
          variant="outline"
          onClick={() => setShowBalances(!showBalances)}
          className="w-full sm:w-auto h-11 px-5 border-border/50 bg-background/50 hover:bg-background/80 shadow-sm flex items-center justify-center gap-2 shrink-0 select-none transition-all"
        >
          {showBalances ? (
            <>
              <EyeOff className="h-4 w-4 text-primary" />
              <span>Hide Sensitive Info</span>
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 text-primary" />
              <span>Show Sensitive Info</span>
            </>
          )}
        </Button>
      </motion.div>

      {/* Tabs list with Framer Motion Layout Indicator */}
      <motion.div variants={itemVariants} className="flex border-b border-border/40 p-1 bg-muted/30 rounded-lg max-w-md">
        {(["accounts", "investments", "insurance"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 relative py-2.5 text-sm font-semibold capitalize transition-all select-none rounded-md ${
              activeTab === tab ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {activeTab === tab && (
              <motion.div
                layoutId="activeVaultTab"
                className="absolute inset-0 bg-primary rounded-md shadow-md"
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
              />
            )}
            <span className="relative z-10">{tab}</span>
          </button>
        ))}
      </motion.div>

      {/* Dynamic Tab Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Columns: Displaying the data tables */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            {activeTab === "accounts" && (
              <motion.div
                key="accounts"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                <Card className="glass-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      <span>Bank & Credit Card Accounts</span>
                    </CardTitle>
                    <CardDescription>Accounts registered in your vault.</CardDescription>
                  </CardHeader>
                  <CardContent className="px-0 sm:px-6">
                    {accountsLoading ? (
                      <div className="p-6 space-y-3">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                      </div>
                    ) : !accounts || accounts.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground text-sm">
                        No bank accounts registered in the vault yet.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Institution</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Account Mask</TableHead>
                              <TableHead className="text-right">Balance</TableHead>
                              <TableHead className="text-right">Rate</TableHead>
                              <TableHead className="w-12"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {accounts.map((acc) => (
                              <TableRow key={acc.id}>
                                <TableCell className="font-semibold">{acc.institutionName}</TableCell>
                                <TableCell className="capitalize text-xs text-muted-foreground">
                                  {acc.accountType?.replace("_", " ")}
                                </TableCell>
                                <TableCell className="font-mono text-xs">{acc.encryptedAccountMask}</TableCell>
                                <TableCell className="text-right font-semibold font-mono">
                                  {formatCurrency(acc.currentBalance)}
                                </TableCell>
                                <TableCell className="text-right font-mono text-xs">
                                  {formatPercent(acc.interestRate)}
                                </TableCell>
                                <TableCell>
                                  <button
                                    onClick={() => deleteAccountMutation.mutate({ id: acc.id })}
                                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-1.5 rounded-md transition-all"
                                    title="Delete Account"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === "investments" && (
              <motion.div
                key="investments"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                <Card className="glass-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <span>Investment Portfolios</span>
                    </CardTitle>
                    <CardDescription>Bonds, mutual funds, stocks, and real estate assets.</CardDescription>
                  </CardHeader>
                  <CardContent className="px-0 sm:px-6">
                    {investmentsLoading ? (
                      <div className="p-6 space-y-3">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                      </div>
                    ) : !investments || investments.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground text-sm">
                        No investments stored in the vault yet.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Asset Class</TableHead>
                              <TableHead>Ticker</TableHead>
                              <TableHead className="text-right">Current Value</TableHead>
                              <TableHead className="text-right">Cost Basis</TableHead>
                              <TableHead className="w-12"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {investments.map((inv) => (
                              <TableRow key={inv.id}>
                                <TableCell className="font-semibold capitalize">
                                  {inv.assetClass?.replace("_", " ")}
                                </TableCell>
                                <TableCell className="font-mono text-xs uppercase text-muted-foreground">
                                  {inv.tickerSymbol || "N/A"}
                                </TableCell>
                                <TableCell className="text-right font-semibold font-mono">
                                  {formatCurrency(inv.currentValue)}
                                </TableCell>
                                <TableCell className="text-right font-mono text-xs text-muted-foreground">
                                  {formatCurrency(inv.costBasis)}
                                </TableCell>
                                <TableCell>
                                  <button
                                    onClick={() => deleteInvestmentMutation.mutate({ id: inv.id })}
                                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-1.5 rounded-md transition-all"
                                    title="Delete Investment"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === "insurance" && (
              <motion.div
                key="insurance"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                <Card className="glass-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5 text-primary" />
                      <span>Insurance Policies</span>
                    </CardTitle>
                    <CardDescription>Life, health, auto, and home policy coverages.</CardDescription>
                  </CardHeader>
                  <CardContent className="px-0 sm:px-6">
                    {insuranceLoading ? (
                      <div className="p-6 space-y-3">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                      </div>
                    ) : !insurance || insurance.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground text-sm">
                        No insurance policies saved in the vault yet.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Policy Type</TableHead>
                              <TableHead className="text-right">Coverage Amount</TableHead>
                              <TableHead className="text-right">Monthly Premium</TableHead>
                              <TableHead className="w-12"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {insurance.map((pol) => (
                              <TableRow key={pol.id}>
                                <TableCell className="font-semibold capitalize">{pol.policyType}</TableCell>
                                <TableCell className="text-right font-semibold font-mono">
                                  {formatCurrency(pol.coverageAmount)}
                                </TableCell>
                                <TableCell className="text-right font-mono text-xs text-muted-foreground">
                                  {formatCurrency(pol.monthlyPremium)}
                                </TableCell>
                                <TableCell>
                                  <button
                                    onClick={() => deleteInsuranceMutation.mutate({ id: pol.id })}
                                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-1.5 rounded-md transition-all"
                                    title="Delete Policy"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Dynamic Form to Add New Vault Item */}
        <div className="lg:col-span-1">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                <span>Add Vault Item</span>
              </CardTitle>
              <CardDescription>
                Add details below. Sensitive account data is immediately encrypted.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeTab === "accounts" && (
                <Form {...accountForm}>
                  <form
                    onSubmit={accountForm.handleSubmit((values) =>
                      createAccountMutation.mutate({
                        data: {
                          ...values,
                          currentBalance: parseFloat(values.currentBalance),
                          interestRate: parseFloat(values.interestRate),
                        },
                      })
                    )}
                    className="space-y-4"
                  >
                    <FormField
                      control={accountForm.control}
                      name="institutionName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Institution Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Chase, Fidelity, Wells Fargo" className="bg-background/50" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={accountForm.control}
                      name="accountType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Type</FormLabel>
                          <FormControl>
                            <select
                              className="w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                              {...field}
                            >
                              <option value="checking">Checking</option>
                              <option value="savings">Savings</option>
                              <option value="credit_card">Credit Card</option>
                              <option value="mortgage">Mortgage Loan</option>
                              <option value="auto_loan">Auto Loan</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={accountForm.control}
                      name="encryptedAccountMask"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Mask (e.g. ****1234)</FormLabel>
                          <FormControl>
                            <Input placeholder="****4321" className="bg-background/50" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={accountForm.control}
                        name="currentBalance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Balance ($)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="5000.00" className="bg-background/50" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={accountForm.control}
                        name="interestRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rate (%)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="4.25" className="bg-background/50" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={createAccountMutation.isPending}
                      className="w-full h-11 mt-2 font-semibold bg-gradient-to-r from-primary to-primary/90 hover:opacity-95 transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      {createAccountMutation.isPending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                      ) : (
                        <>
                          <Lock className="h-4 w-4" />
                          <span>Secure Save Account</span>
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              )}

              {activeTab === "investments" && (
                <Form {...investmentForm}>
                  <form
                    onSubmit={investmentForm.handleSubmit((values) =>
                      createInvestmentMutation.mutate({
                        data: {
                          ...values,
                          tickerSymbol: values.tickerSymbol || null,
                          currentValue: parseFloat(values.currentValue),
                          costBasis: parseFloat(values.costBasis),
                        },
                      })
                    )}
                    className="space-y-4"
                  >
                    <FormField
                      control={investmentForm.control}
                      name="assetClass"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Asset Class</FormLabel>
                          <FormControl>
                            <select
                              className="w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                              {...field}
                            >
                              <option value="stocks">Stocks</option>
                              <option value="etfs">ETFs</option>
                              <option value="mutual_funds">Mutual Funds</option>
                              <option value="bonds">Bonds</option>
                              <option value="real_estate">Real Estate</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={investmentForm.control}
                      name="tickerSymbol"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ticker Symbol (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="VTI, AAPL, SPY" className="bg-background/50 uppercase" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={investmentForm.control}
                        name="currentValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Value ($)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="12500.00" className="bg-background/50" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={investmentForm.control}
                        name="costBasis"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cost Basis ($)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="10000.00" className="bg-background/50" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={createInvestmentMutation.isPending}
                      className="w-full h-11 mt-2 font-semibold bg-gradient-to-r from-primary to-primary/90 hover:opacity-95 transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      {createInvestmentMutation.isPending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                      ) : (
                        <>
                          <Lock className="h-4 w-4" />
                          <span>Secure Save Investment</span>
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              )}

              {activeTab === "insurance" && (
                <Form {...insuranceForm}>
                  <form
                    onSubmit={insuranceForm.handleSubmit((values) =>
                      createInsuranceMutation.mutate({
                        data: {
                          ...values,
                          coverageAmount: parseFloat(values.coverageAmount),
                          monthlyPremium: parseFloat(values.monthlyPremium),
                        },
                      })
                    )}
                    className="space-y-4"
                  >
                    <FormField
                      control={insuranceForm.control}
                      name="policyType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Policy Type</FormLabel>
                          <FormControl>
                            <select
                              className="w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                              {...field}
                            >
                              <option value="life">Life Insurance</option>
                              <option value="health">Health Insurance</option>
                              <option value="auto">Auto Insurance</option>
                              <option value="home">Home Insurance</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={insuranceForm.control}
                      name="coverageAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Coverage Amount ($)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="500000.00" className="bg-background/50" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={insuranceForm.control}
                      name="monthlyPremium"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monthly Premium ($)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="45.00" className="bg-background/50" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={createInsuranceMutation.isPending}
                      className="w-full h-11 mt-2 font-semibold bg-gradient-to-r from-primary to-primary/90 hover:opacity-95 transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      {createInsuranceMutation.isPending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                      ) : (
                        <>
                          <Lock className="h-4 w-4" />
                          <span>Secure Save Policy</span>
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
