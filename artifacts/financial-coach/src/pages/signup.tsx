import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Lock, ArrowRight, ArrowLeft, Calendar, Briefcase, DollarSign, ShieldAlert, Coins } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  employmentStatus: z.string().min(1, "Employment status is required"),
  annualIncomeRange: z.string().min(1, "Annual income range is required"),
  riskTolerance: z.string().min(1, "Risk tolerance is required"),
  baseCurrency: z.string().min(1, "Base currency is required"),
});

type FormValues = z.infer<typeof formSchema>;

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 28 } as const,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 80 : -80,
    opacity: 0,
    transition: { duration: 0.15 } as const,
  }),
};

export default function Signup() {
  const { signupMutation } = useAuth();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      dateOfBirth: "",
      employmentStatus: "employed",
      annualIncomeRange: "$50,000 - $100,000",
      riskTolerance: "moderate",
      baseCurrency: "USD",
    },
  });

  const { watch } = form;
  const passwordVal = watch("password") || "";

  // Password requirement checks
  const hasMinLength = passwordVal.length >= 8;
  const hasUpper = /[A-Z]/.test(passwordVal);
  const hasLower = /[a-z]/.test(passwordVal);
  const hasNumber = /[0-9]/.test(passwordVal);

  const handleNext = async () => {
    let isValid = false;
    if (step === 1) {
      isValid = await form.trigger(["email", "password"]);
    } else if (step === 2) {
      isValid = await form.trigger(["firstName", "lastName", "dateOfBirth"]);
    }

    if (isValid) {
      setDirection(1);
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setDirection(-1);
    setStep((prev) => prev - 1);
  };

  const onSubmit = (values: FormValues) => {
    signupMutation.mutate(
      { data: values },
      {
        onError: (err: any) => {
          const message = err.data?.error ?? err.message ?? "Failed to create account";
          form.setError("root", { message });
        },
      }
    );
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/35 p-4 relative overflow-hidden">
      {/* Background Blur Blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse pointer-events-none dark:mix-blend-screen" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse pointer-events-none dark:mix-blend-screen" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="w-full max-w-lg z-10"
      >
        <Card className="glass-card shadow-2xl border border-white/10 dark:border-white/5 backdrop-blur-2xl">
          <CardHeader className="space-y-2 text-center pb-4">
            <div className="mx-auto h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-md flex items-center justify-center text-primary-foreground font-bold text-lg mb-2">
              FC
            </div>
            <CardTitle className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
              Create Account
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Step {step} of 3: {step === 1 ? "Credentials" : step === 2 ? "Personal Info" : "Financial Profile"}
            </CardDescription>

            {/* Stepper progress bar */}
            <div className="w-full bg-border h-1 rounded-full overflow-hidden mt-4">
              <motion.div
                className="bg-primary h-full rounded-full"
                animate={{ width: `${(step / 3) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </CardHeader>

          <CardContent className="overflow-hidden">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <AnimatePresence mode="wait" custom={direction}>
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="space-y-4"
                    >
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="you@example.com"
                                  className="pl-10 bg-background/50 border-border/50 focus:border-primary/50"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="password"
                                  placeholder="••••••••"
                                  className="pl-10 bg-background/50 border-border/50 focus:border-primary/50"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Password validation panel */}
                      <div className="p-3 bg-secondary/20 border border-border/30 rounded-lg space-y-2 text-xs">
                        <span className="font-semibold text-muted-foreground">Password requirements:</span>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <div className="flex items-center gap-1.5">
                            <div className={`h-1.5 w-1.5 rounded-full ${hasMinLength ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                            <span className={hasMinLength ? 'text-emerald-500 font-medium' : 'text-muted-foreground'}>At least 8 chars</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className={`h-1.5 w-1.5 rounded-full ${hasUpper ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                            <span className={hasUpper ? 'text-emerald-500 font-medium' : 'text-muted-foreground'}>Uppercase letter</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className={`h-1.5 w-1.5 rounded-full ${hasLower ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                            <span className={hasLower ? 'text-emerald-500 font-medium' : 'text-muted-foreground'}>Lowercase letter</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className={`h-1.5 w-1.5 rounded-full ${hasNumber ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                            <span className={hasNumber ? 'text-emerald-500 font-medium' : 'text-muted-foreground'}>One number</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div
                      key="step2"
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    placeholder="John"
                                    className="pl-10 bg-background/50 border-border/50 focus:border-primary/50"
                                    {...field}
                                  />
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
                                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    placeholder="Doe"
                                    className="pl-10 bg-background/50 border-border/50 focus:border-primary/50"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date of Birth</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="date"
                                  className="pl-10 bg-background/50 border-border/50 focus:border-primary/50"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div
                      key="step3"
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-4">
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
                    </motion.div>
                  )}
                </AnimatePresence>

                {form.formState.errors.root && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20 text-center"
                  >
                    {form.formState.errors.root.message}
                  </motion.div>
                )}

                {/* Wizard navigation buttons */}
                <div className="flex gap-4 pt-2">
                  {step > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      className="flex-1 h-11 font-semibold flex items-center justify-center gap-2 border-border/50 bg-background/30"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Back</span>
                    </Button>
                  )}

                  {step < 3 ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      className="flex-1 h-11 font-semibold bg-gradient-to-r from-primary to-primary/90 hover:opacity-95 transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      <span>Next</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={signupMutation.isPending}
                      className="flex-1 h-11 font-semibold bg-gradient-to-r from-primary to-primary/90 hover:opacity-95 transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      {signupMutation.isPending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                      ) : (
                        <>
                          <span>Submit & Register</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </Form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link href="/login" className="text-primary hover:underline font-semibold transition-all">
                Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
