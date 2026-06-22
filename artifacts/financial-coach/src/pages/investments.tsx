import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  useGetBenchmarkRates, 
  useListInvestmentScenarios, 
  useCreateInvestmentScenario, 
  useDeleteInvestmentScenario,
  getListInvestmentScenariosQueryKey
} from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Calculator, Save, Trash2, Sparkles, TrendingUp, HelpCircle, 
  Percent, Coins, Building, ShieldCheck, HelpCircle as GoldIcon, Gem 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer 
} from "recharts";
import { 
  calculateCompoundInterest, 
  calculateFutureValueOfAnnuity, 
  calculateTotalInvested 
} from "@/utils/investment-math";
import { PremiumGate } from "@/components/premium-gate";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Framer motion variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 22 } }
} as const;

export default function Investments() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isPremium = user?.subscriptionTier === "premium";

  // State parameters
  const [amount, setAmount] = useState<number>(10000);
  const [years, setYears] = useState<number>(10);
  const [isMonthly, setIsMonthly] = useState<boolean>(false);
  const [scenarioName, setScenarioName] = useState<string>("");
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState<boolean>(false);

  // Queries & Mutations
  const { data: benchmarkRates, isLoading: ratesLoading } = useGetBenchmarkRates();
  
  const { data: savedScenarios, isLoading: scenariosLoading } = useListInvestmentScenarios({
    query: {
      queryKey: getListInvestmentScenariosQueryKey(),
      enabled: isPremium,
      retry: false,
    }
  });

  const createScenarioMutation = useCreateInvestmentScenario({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListInvestmentScenariosQueryKey() });
        toast({
          title: "Scenario Saved",
          description: `"${scenarioName}" has been successfully saved to your dashboard.`,
        });
        setScenarioName("");
        setIsSaveDialogOpen(false);
      },
      onError: (err: any) => {
        toast({
          title: "Save Failed",
          description: err.data?.error ?? "An unexpected error occurred while saving.",
          variant: "destructive",
        });
      }
    }
  });

  const deleteScenarioMutation = useDeleteInvestmentScenario({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListInvestmentScenariosQueryKey() });
        toast({
          title: "Scenario Deleted",
          description: "The scenario was successfully removed.",
        });
      },
      onError: (err: any) => {
        toast({
          title: "Deletion Failed",
          description: err.data?.error ?? "An unexpected error occurred during deletion.",
          variant: "destructive",
        });
      }
    }
  });

  // Fallback rate defaults
  const rates = useMemo(() => ({
    fixedDeposit: benchmarkRates?.fixedDeposit ?? 7.0,
    corporateBonds: benchmarkRates?.corporateBonds ?? 8.5,
    gold: benchmarkRates?.gold ?? 9.5,
    indexFunds: benchmarkRates?.indexFunds ?? 12.0,
    realEstate: benchmarkRates?.realEstate ?? 8.0,
  }), [benchmarkRates]);

  const baseCurrency = user?.baseCurrency || "USD";
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: baseCurrency,
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Performant memoized dataset calculation for Recharts grouped BarChart
  const chartData = useMemo(() => {
    const totalInvested = calculateTotalInvested(amount, years, isMonthly);

    const fdMaturity = isMonthly
      ? calculateFutureValueOfAnnuity(amount, rates.fixedDeposit, years)
      : calculateCompoundInterest(amount, rates.fixedDeposit, years);

    const bondsMaturity = isMonthly
      ? calculateFutureValueOfAnnuity(amount, rates.corporateBonds, years)
      : calculateCompoundInterest(amount, rates.corporateBonds, years);

    const goldMaturity = isMonthly
      ? calculateFutureValueOfAnnuity(amount, rates.gold, years)
      : calculateCompoundInterest(amount, rates.gold, years);

    const data = [
      {
        name: "Fixed Deposit",
        "Total Invested": totalInvested,
        "Maturity Value": fdMaturity,
        "Wealth Gained": Math.max(0, fdMaturity - totalInvested),
      },
      {
        name: "Corp Bonds",
        "Total Invested": totalInvested,
        "Maturity Value": bondsMaturity,
        "Wealth Gained": Math.max(0, bondsMaturity - totalInvested),
      },
      {
        name: "Gold",
        "Total Invested": totalInvested,
        "Maturity Value": goldMaturity,
        "Wealth Gained": Math.max(0, goldMaturity - totalInvested),
      },
    ];

    if (isPremium) {
      const indexMaturity = isMonthly
        ? calculateFutureValueOfAnnuity(amount, rates.indexFunds, years)
        : calculateCompoundInterest(amount, rates.indexFunds, years);

      const reMaturity = isMonthly
        ? calculateFutureValueOfAnnuity(amount, rates.realEstate, years)
        : calculateCompoundInterest(amount, rates.realEstate, years);

      data.push(
        {
          name: "Index Funds",
          "Total Invested": totalInvested,
          "Maturity Value": indexMaturity,
          "Wealth Gained": Math.max(0, indexMaturity - totalInvested),
        },
        {
          name: "Real Estate",
          "Total Invested": totalInvested,
          "Maturity Value": reMaturity,
          "Wealth Gained": Math.max(0, reMaturity - totalInvested),
        }
      );
    }

    return data;
  }, [amount, years, isMonthly, rates, isPremium]);

  // Handle Loading saved scenario configuration
  const handleLoadScenario = (sc: any) => {
    setAmount(sc.principalAmount);
    setYears(sc.durationYears);
    setIsMonthly(sc.investmentType === "monthly_sip");
    toast({
      title: "Scenario Loaded",
      description: `Loaded settings from "${sc.scenarioName}".`,
    });
  };

  const handleSaveSubmit = () => {
    if (!scenarioName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for this scenario.",
        variant: "destructive",
      });
      return;
    }

    createScenarioMutation.mutate({
      data: {
        scenarioName: scenarioName.trim(),
        investmentType: isMonthly ? "monthly_sip" : "lumpsum",
        principalAmount: amount,
        durationYears: years,
        metaData: {},
      }
    });
  };

  // Performant calculated single-asset variables for list indicators
  const currentTotalInvested = calculateTotalInvested(amount, years, isMonthly);

  const calculatedAssets = useMemo(() => {
    return Object.entries(rates).map(([key, cagr]) => {
      const maturity = isMonthly
        ? calculateFutureValueOfAnnuity(amount, cagr, years)
        : calculateCompoundInterest(amount, cagr, years);
      return {
        key,
        cagr,
        maturity,
        wealth: Math.max(0, maturity - currentTotalInvested),
      };
    });
  }, [amount, years, isMonthly, rates, currentTotalInvested]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            Investment ROI Comparator
          </h1>
          <p className="text-muted-foreground mt-1">
            Compare growth projections across different asset classes based on historical CAGR returns.
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Controls & Saved Scenarios */}
        <div className="space-y-6">
          <motion.div variants={itemVariants}>
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  Calculator Inputs
                </CardTitle>
                <CardDescription>Configure your scenario details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Investment Type Switch */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/40">
                  <Label htmlFor="sip-toggle" className="font-semibold text-sm cursor-pointer">
                    {isMonthly ? "Monthly SIP mode" : "Lumpsum mode"}
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Lumpsum</span>
                    <Switch
                      id="sip-toggle"
                      checked={isMonthly}
                      onCheckedChange={setIsMonthly}
                    />
                    <span className="text-xs text-muted-foreground">Monthly</span>
                  </div>
                </div>

                {/* Amount Input */}
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {isMonthly ? "Monthly Contribution" : "Lumpsum Principal"}
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-muted-foreground font-mono text-sm font-semibold">
                      {baseCurrency}
                    </span>
                    <Input
                      id="amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="pl-12 font-mono"
                    />
                  </div>
                </div>

                {/* Duration Slider */}
                <div className="space-y-4 pt-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Duration (Years)
                    </Label>
                    <span className="font-mono font-bold text-sm text-primary">{years} Years</span>
                  </div>
                  <Slider
                    value={[years]}
                    onValueChange={(val) => setYears(val[0])}
                    min={1}
                    max={30}
                    step={1}
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                    <span>1 Yr</span>
                    <span>15 Yrs</span>
                    <span>30 Yrs</span>
                  </div>
                </div>

                {/* Save Scenario Dialog Trigger */}
                <div className="pt-2 border-t border-border/50">
                  {isPremium ? (
                    <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full flex items-center justify-center gap-2 font-semibold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20">
                          <Save className="h-4 w-4" />
                          <span>Save Projection Scenario</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="glass-card border border-border/60">
                        <DialogHeader>
                          <DialogTitle>Save Scenario State</DialogTitle>
                          <DialogDescription>
                            Name this calculation state to recall it quickly from your profile.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-2">
                          <Label htmlFor="sc-name">Scenario Name</Label>
                          <Input
                            id="sc-name"
                            value={scenarioName}
                            onChange={(e) => setScenarioName(e.target.value)}
                            placeholder="e.g., Retirement SIP 2026"
                          />
                        </div>
                        <DialogFooter>
                          <Button variant="ghost" onClick={() => setIsSaveDialogOpen(false)}>Cancel</Button>
                          <Button 
                            onClick={handleSaveSubmit}
                            disabled={createScenarioMutation.isPending}
                          >
                            {createScenarioMutation.isPending ? "Saving..." : "Save Scenario"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <Button 
                      onClick={() => setLocation("/pricing")}
                      className="w-full flex items-center justify-center gap-2 font-semibold bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950 hover:opacity-90 border-0"
                    >
                      <Sparkles className="h-4 w-4 fill-amber-950" />
                      <span>Unlock Save Scenario (Premium)</span>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Saved Scenarios List (Premium only) */}
          {isPremium && (
            <motion.div variants={itemVariants}>
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Saved Scenarios
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 pb-4">
                  {scenariosLoading ? (
                    <div className="p-4 text-center text-xs text-muted-foreground animate-pulse">Loading scenarios...</div>
                  ) : !savedScenarios || savedScenarios.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground">No saved scenarios yet.</div>
                  ) : (
                    <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                      {savedScenarios.map((sc) => (
                        <div 
                          key={sc.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-border/40 hover:border-border/80 bg-background/30 transition-all cursor-pointer group"
                          onClick={() => handleLoadScenario(sc)}
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <p className="font-semibold text-xs truncate text-foreground">{sc.scenarioName}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">
                              {sc.investmentType?.replace("_", " ")} • {formatCurrency(sc.principalAmount)} • {sc.durationYears} yrs
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteScenarioMutation.mutate({ id: sc.id });
                            }}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Delete Scenario"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Right Columns - Visualizer Chart & Data Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chart Visualizer */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Growth Comparison Chart
                </CardTitle>
                <CardDescription>
                  Grouped comparison of Total Principal vs. Growth returns after {years} years.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                {ratesLoading ? (
                  <div className="h-[320px] flex items-center justify-center text-sm text-muted-foreground animate-pulse">
                    Analyzing asset performance rates...
                  </div>
                ) : (
                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(val) => formatCurrency(val)} />
                        <RechartsTooltip 
                          formatter={(value: number) => formatCurrency(value)}
                          contentStyle={{ background: "rgba(15, 23, 42, 0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#f8fafc" }}
                        />
                        <Legend />
                        <Bar dataKey="Total Invested" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Wealth Gained" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Results Grid / Details */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h3 className="font-bold text-lg text-foreground px-1">Detailed Breakdown</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {calculatedAssets.map((asset) => {
                const isPremiumAsset = asset.key === "indexFunds" || asset.key === "realEstate";
                
                // Asset details mapping
                const assetMeta: Record<string, { label: string; icon: any; color: string }> = {
                  fixedDeposit: { label: "Fixed Deposit", icon: ShieldCheck, color: "text-blue-500 bg-blue-500/10" },
                  corporateBonds: { label: "Corporate Bonds", icon: Coins, color: "text-indigo-500 bg-indigo-500/10" },
                  gold: { label: "Gold Bullion", icon: Gem, color: "text-amber-500 bg-amber-500/10" },
                  indexFunds: { label: "Index Mutual Funds", icon: TrendingUp, color: "text-teal-500 bg-teal-500/10" },
                  realEstate: { label: "Real Estate", icon: Building, color: "text-emerald-500 bg-emerald-500/10" },
                };

                const meta = assetMeta[asset.key] || { label: asset.key, icon: HelpCircle, color: "text-muted-foreground bg-muted/10" };
                const IconComponent = meta.icon;

                // Card markup
                const cardContent = (
                  <Card className={`glass-card relative overflow-hidden transition-all duration-300 ${isPremiumAsset && !isPremium ? "border-amber-500/20" : ""}`}>
                    <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                      <div>
                        <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                          <div className={`p-1.5 rounded-md ${meta.color} mr-1 shrink-0`}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                          {meta.label}
                        </CardTitle>
                        <CardDescription className="text-xs mt-0.5">Assumed CAGR: {asset.cagr}%</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Total Invested</span>
                          <p className="font-mono font-medium mt-0.5">{formatCurrency(currentTotalInvested)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Growth Profit</span>
                          <p className="font-mono font-bold text-green-500 mt-0.5">+{formatCurrency(asset.wealth)}</p>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-border/40">
                        <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Maturity Value</span>
                        <p className="font-mono font-bold text-lg text-primary">{formatCurrency(asset.maturity)}</p>
                      </div>
                    </CardContent>
                  </Card>
                );

                if (isPremiumAsset) {
                  return (
                    <PremiumGate key={asset.key} className="h-full">
                      {cardContent}
                    </PremiumGate>
                  );
                }

                return (
                  <div key={asset.key}>
                    {cardContent}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
