import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { User as UserIcon, Mail, Lock, Save, Calendar, Briefcase, DollarSign, ShieldAlert, Coins, Trash2, CreditCard, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { 
  useDeleteProfile, 
  useCancelSubscription,
  getAuthMeQueryKey 
} from "@workspace/api-client-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const formSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Please enter a valid email address"),
    dateOfBirth: z.string().min(1, "Date of birth is required"),
    employmentStatus: z.string().min(1, "Employment status is required"),
    annualIncomeRange: z.string().min(1, "Annual income range is required"),
    riskTolerance: z.string().min(1, "Risk tolerance is required"),
    baseCurrency: z.string().min(1, "Base currency is required"),
    currentPassword: z.string().optional().or(z.literal("")),
    newPassword: z.string().optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.newPassword && !data.currentPassword) {
        return false;
      }
      return true;
    },
    {
      message: "Current password is required to set a new password",
      path: ["currentPassword"],
    }
  )
  .refine(
    (data) => {
      if (data.newPassword && data.newPassword.length < 8) {
        return false;
      }
      return true;
    },
    {
      message: "New password must be at least 8 characters long",
      path: ["newPassword"],
    }
  );

type FormValues = z.infer<typeof formSchema>;

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
} as const;

export default function Profile() {
  const { user, updateProfileMutation } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const cancelSubscriptionMutation = useCancelSubscription({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAuthMeQueryKey() });
        toast({
          title: "Subscription Cancelled",
          description: "Your Premium subscription has been cancelled and you have been downgraded to the Free tier.",
        });
      },
      onError: (err: any) => {
        toast({
          title: "Failed to cancel subscription",
          description: err.data?.error ?? err.message,
          variant: "destructive",
        });
      },
    }
  });

  const deleteProfileMutation = useDeleteProfile({
    mutation: {
      onSuccess: () => {
        queryClient.setQueryData(getAuthMeQueryKey(), null);
        queryClient.clear();
        toast({
          title: "Account Deleted",
          description: "Your profile and all associated data have been permanently removed.",
        });
      },
      onError: (err: any) => {
        toast({
          title: "Failed to delete account",
          description: err.data?.error ?? err.message,
          variant: "destructive",
        });
      },
    }
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      email: user?.email ?? "",
      dateOfBirth: user?.dateOfBirth ?? "",
      employmentStatus: user?.employmentStatus ?? "employed",
      annualIncomeRange: user?.annualIncomeRange ?? "$50,000 - $100,000",
      riskTolerance: user?.riskTolerance ?? "moderate",
      baseCurrency: user?.baseCurrency ?? "USD",
      currentPassword: "",
      newPassword: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    const payload = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      dateOfBirth: values.dateOfBirth,
      employmentStatus: values.employmentStatus,
      annualIncomeRange: values.annualIncomeRange,
      riskTolerance: values.riskTolerance,
      baseCurrency: values.baseCurrency,
      currentPassword: values.currentPassword || null,
      newPassword: values.newPassword || null,
    };

    updateProfileMutation.mutate(
      { data: payload },
      {
        onSuccess: () => {
          form.reset({
            ...values,
            currentPassword: "",
            newPassword: "",
          });
        },
        onError: (err: any) => {
          const message = err.data?.error ?? err.message ?? "Failed to update profile";
          form.setError("root", { message });
        },
      }
    );
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-8 space-y-8 max-w-5xl mx-auto"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your personal information, financial coaching settings, and credentials.</p>
      </motion.div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md bg-muted/60 mb-8">
          <TabsTrigger value="profile">Profile & Security</TabsTrigger>
          <TabsTrigger value="billing">Subscription & Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* User Card */}
        <motion.div variants={itemVariants} className="md:col-span-1">
          <Card className="glass-card text-center py-8">
            <CardContent className="space-y-4 flex flex-col items-center">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-extrabold text-2xl shadow-lg">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div>
                <h3 className="text-lg font-bold">{user?.firstName} {user?.lastName}</h3>
                <p className="text-xs text-muted-foreground mt-1">{user?.email}</p>
              </div>
              <div className="pt-4 border-t border-border/50 w-full text-xs text-muted-foreground space-y-2 text-left px-4">
                <div><strong>Joined:</strong> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ""}</div>
                <div><strong>Date of Birth:</strong> {user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : "Not set"}</div>
                <div className="capitalize"><strong>Employment:</strong> {user?.employmentStatus?.replace("_", " ")}</div>
                <div><strong>Income Range:</strong> {user?.annualIncomeRange}</div>
                <div className="capitalize"><strong>Risk Profile:</strong> {user?.riskTolerance}</div>
                <div><strong>Currency:</strong> {user?.baseCurrency}</div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Profile Details Form */}
        <motion.div variants={itemVariants} className="md:col-span-2">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Account & Financial Details</CardTitle>
              <CardDescription>Update your personal information and investment preferences.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Personal Section */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input className="pl-10 bg-background/50" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input className="pl-10 bg-background/50" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input className="pl-10 bg-background/50" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input type="date" className="pl-10 bg-background/50" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Financial Section */}
                  <div className="pt-6 border-t border-border/50 space-y-4">
                    <h4 className="font-semibold text-sm">Financial Context (Coaching Profile)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="employmentStatus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Employment Status</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground z-10" />
                                <select
                                  className="pl-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                  {...field}
                                >
                                  <option value="employed">Employed</option>
                                  <option value="self_employed">Self Employed</option>
                                  <option value="unemployed">Unemployed</option>
                                  <option value="retired">Retired</option>
                                  <option value="student">Student</option>
                                  <option value="other">Other</option>
                                </select>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="baseCurrency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Base Currency</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Coins className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground z-10" />
                                <select
                                  className="pl-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                  {...field}
                                >
                                  <option value="USD">USD ($)</option>
                                  <option value="EUR">EUR (€)</option>
                                  <option value="GBP">GBP (£)</option>
                                  <option value="CAD">CAD (C$)</option>
                                  <option value="AUD">AUD (A$)</option>
                                  <option value="INR">INR (₹)</option>
                                </select>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="annualIncomeRange"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Annual Income Range</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground z-10" />
                                <select
                                  className="pl-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                  {...field}
                                >
                                  <option value="Under $50,000">Under $50,000</option>
                                  <option value="$50,000 - $100,000">$50,000 - $100,000</option>
                                  <option value="$100,000 - $150,000">$100,000 - $150,000</option>
                                  <option value="$150,000 - $250,000">$150,000 - $250,000</option>
                                  <option value="$250,000+">$250,000+</option>
                                </select>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="riskTolerance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Risk Tolerance</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <ShieldAlert className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground z-10" />
                                <select
                                  className="pl-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                  {...field}
                                >
                                  <option value="conservative">Conservative</option>
                                  <option value="moderate">Moderate</option>
                                  <option value="aggressive">Aggressive</option>
                                </select>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Password Section */}
                  <div className="pt-6 border-t border-border/50 space-y-4">
                    <h4 className="font-semibold text-sm">Change Credentials</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input type="password" placeholder="••••••••" className="pl-10 bg-background/50" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input type="password" placeholder="••••••••" className="pl-10 bg-background/50" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {form.formState.errors.root && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20 text-center"
                    >
                      {form.formState.errors.root.message}
                    </motion.div>
                  )}

                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="w-full sm:w-auto h-11 px-6 font-semibold bg-gradient-to-r from-primary to-primary/90 hover:opacity-95 transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    {updateProfileMutation.isPending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </Button>
                 </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Danger Zone Card */}
        <motion.div variants={itemVariants} className="md:col-span-2 md:col-start-2">
          <Card className="border border-destructive/20 bg-destructive/5 dark:bg-destructive/10">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                <span>Danger Zone</span>
              </CardTitle>
              <CardDescription>
                Permanently delete your account and all associated financial data. This action is irreversible.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">Delete Account</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  All vault accounts, net worth snapshots, analysis history, and goals will be permanently destroyed.
                </p>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="font-semibold shadow-md shrink-0">
                    Delete Profile
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="glass-card border border-destructive/30 backdrop-blur-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-destructive font-bold flex items-center gap-2">
                      ⚠️ Permanent Account Deletion
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-foreground/90 space-y-2 mt-2">
                      <p>
                        Are you absolutely sure you want to delete your profile?
                      </p>
                      <p className="font-medium text-destructive">
                        This will permanently wipe your account, decrypted financial vault details, budget analyses, history, and goals from our database.
                      </p>
                      <p className="text-xs text-muted-foreground font-semibold">
                        This action cannot be undone.
                      </p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="mt-4">
                    <AlertDialogCancel className="bg-background/50 border-border/50">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteProfileMutation.mutate()}
                      className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold shadow-md"
                    >
                      Yes, Delete My Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      </TabsContent>

      <TabsContent value="billing" className="mt-0 space-y-6">
        <motion.div variants={itemVariants}>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Subscription Details
              </CardTitle>
              <CardDescription>Manage your premium subscription plan and invoice details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {user?.subscriptionTier === "premium" ? (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-amber-500/15 rounded-lg text-amber-500 mt-0.5">
                        <Sparkles className="h-5 w-5 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground flex items-center gap-2">
                          FinCoach Pro Plan <span className="text-[10px] bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-extrabold uppercase">Active</span>
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          You have unlimited access to all AI-driven budgeting plans, forecasting, and CSV exports.
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold shrink-0">Premium Member</Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 text-sm">
                    <div className="space-y-1">
                      <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Subscription Status</span>
                      <p className="font-semibold capitalize text-emerald-500">{user.subscriptionStatus || "active"}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Next Renewal Date</span>
                      <p className="font-semibold font-mono">
                        {user.currentPeriodEnd
                          ? new Date(user.currentPeriodEnd).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : "N/A"}
                      </p>
                    </div>

                  </div>

                  {user.subscriptionStatus !== "cancelled" && (
                    <div className="pt-6 border-t border-border/50">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            disabled={cancelSubscriptionMutation.isPending}
                            className="border-destructive/30 hover:border-destructive/60 text-destructive hover:bg-destructive/5 font-semibold"
                          >
                            Cancel Subscription
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="glass-card border border-destructive/30 backdrop-blur-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-destructive font-bold flex items-center gap-2">
                              ⚠️ Cancel Premium Membership?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-foreground/90 space-y-2 mt-2">
                              <p>
                                Are you sure you want to cancel your FinCoach Pro subscription?
                              </p>
                              <p className="font-medium text-destructive">
                                You will immediately lose access to premium AI-generated coaching recommendations, comparison reports, and net worth forecasting tools.
                              </p>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="mt-4">
                            <AlertDialogCancel className="bg-background/50 border-border/50">Keep Premium</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => cancelSubscriptionMutation.mutate()}
                              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold shadow-md"
                            >
                              {cancelSubscriptionMutation.isPending ? "Cancelling..." : "Yes, Downgrade Me"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-muted/30">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary mt-0.5">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground">Free Tier Account</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        You are currently on our Free coaching plan. Upgrade to access premium features.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <h5 className="font-semibold text-sm">Unlock FinCoach Pro to get:</h5>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span>Personalized AI wealth coaching insights</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span>Multi-month compare dashboards</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span>CSV transaction exports</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span>Detailed net worth forecasting models</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-border/50">
                    <Button asChild className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-amber-950 font-bold shadow-md">
                      <Link href="/pricing">Upgrade to Premium</Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </TabsContent>
      </Tabs>
    </motion.div>
  );
}
