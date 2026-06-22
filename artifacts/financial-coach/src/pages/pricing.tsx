import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateSubscription, useVerifySignature } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { loadRazorpayScript } from "@/lib/razorpay";
import { useToast } from "@/hooks/use-toast";
import { Check, Sparkles, Star } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function Pricing() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAnnual, setIsAnnual] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const createSubscriptionMutation = useCreateSubscription();
  const verifySignatureMutation = useVerifySignature();

  const isPremium = user?.subscriptionTier === "premium";

  const handleUpgrade = async () => {
    if (isPremium) {
      toast({
        title: "Already Premium",
        description: "You already have an active Premium Subscription.",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast({
          title: "Setup Error",
          description: "Failed to load Razorpay payment window. Please check your connection.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // Call API to create subscription ID
      const response = await createSubscriptionMutation.mutateAsync();
      const { subscriptionId, keyId } = response;

      // Handle Mock Mode
      if (subscriptionId.startsWith("sub_mock_")) {
        // Automatically verify mock payments instantly for developer convenience
        const mockPaymentId = `pay_mock_${Math.random().toString(36).substring(7)}`;
        const mockSignature = `sig_mock_${Math.random().toString(36).substring(7)}`;
        
        await verifySignatureMutation.mutateAsync({
          data: {
            razorpayPaymentId: mockPaymentId,
            razorpaySubscriptionId: subscriptionId,
            razorpaySignature: mockSignature,
          }
        });

        toast({
          title: "Subscription Activated (Mock)",
          description: "Thank you for upgrading! Your premium account is now active.",
        });
        setLocation("/");
        setIsProcessing(false);
        return;
      }

      // Production Razorpay options
      const options = {
        key: keyId,
        subscription_id: subscriptionId,
        name: "FinCoach Pro",
        description: isAnnual ? "FinCoach Pro Annual Plan" : "FinCoach Pro Monthly Plan",
        handler: async (paymentResponse: any) => {
          setIsProcessing(true);
          try {
            await verifySignatureMutation.mutateAsync({
              data: {
                razorpayPaymentId: paymentResponse.razorpay_payment_id,
                razorpaySubscriptionId: paymentResponse.razorpay_subscription_id,
                razorpaySignature: paymentResponse.razorpay_signature,
              }
            });
            toast({
              title: "Payment Successful",
              description: "Welcome to FinCoach Pro! Your subscription is now active.",
            });
            setLocation("/");
          } catch (err: any) {
            toast({
              title: "Verification Failed",
              description: err.data?.error ?? "Failed to verify payment signature.",
              variant: "destructive",
            });
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: `${user?.firstName} ${user?.lastName}`,
          email: user?.email,
        },
        theme: {
          color: "#0f766e", // Teal-700
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          }
        }
      };

      const razorpayInstance = new (window as any).Razorpay(options);
      razorpayInstance.open();
    } catch (err: any) {
      toast({
        title: "Subscription Setup Failed",
        description: err.data?.error ?? err.message ?? "An error occurred setting up the subscription.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const freeFeatures = [
    "Basic budget calculations",
    "Net Worth recording",
    "Goal setting",
    "Basic historical reports",
  ];

  const premiumFeatures = [
    "All Free features included",
    "Personalized AI wealth coaching insights",
    "Multi-month compare dashboards",
    "CSV transaction exports",
    "Detailed net worth forecasting models",
    "Priority custom support",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
      className="p-8 max-w-5xl mx-auto space-y-12"
    >
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-500 via-teal-400 to-emerald-500">
          Unleash Financial Freedom
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Upgrade to Premium today to unlock powerful AI coaching models, custom tracking reports, and advanced forecasting calculators.
        </p>

        {/* Pricing Toggle */}
        <div className="flex items-center justify-center gap-4 pt-4">
          <span className={`text-sm font-semibold ${!isAnnual ? "text-primary" : "text-muted-foreground"}`}>Monthly</span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className="w-12 h-6 rounded-full bg-muted border border-border/80 flex items-center p-0.5 cursor-pointer relative"
          >
            <motion.div
              layout
              className="w-5 h-5 rounded-full bg-primary"
              animate={{ x: isAnnual ? 24 : 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
            />
          </button>
          <span className={`text-sm font-semibold flex items-center gap-1.5 ${isAnnual ? "text-primary" : "text-muted-foreground"}`}>
            Annual <span className="text-[10px] bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded-full font-bold">Save 20%</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto">
        {/* Free Tier Card */}
        <div className="flex">
          <Card className="glass-card flex-1 flex flex-col justify-between overflow-hidden border-border/40 hover:border-border/60 transition-colors">
            <CardHeader className="space-y-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl font-bold">Free Coaching</CardTitle>
              </div>
              <CardDescription>Ideal for checking basic metrics and setting goals</CardDescription>
              <div className="pt-4">
                <span className="text-4xl font-extrabold font-mono text-foreground">$0</span>
                <span className="text-muted-foreground text-sm font-medium"> / forever</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 flex-1 flex flex-col justify-between pt-4">
              <ul className="space-y-3 flex-1">
                {freeFeatures.map((feat, index) => (
                  <li key={index} className="flex items-start text-sm text-muted-foreground">
                    <Check className="h-4 w-4 mr-2.5 text-teal-500 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                disabled
                className="w-full h-11 border-border/60 text-muted-foreground bg-background/20 font-bold"
              >
                Current Plan
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Premium Tier Card */}
        <div className="flex relative">
          {/* Glowing gradient background border wrapper */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 via-teal-500 to-emerald-500 rounded-[var(--radius)] opacity-40 blur-md pointer-events-none" />
          
          <Card className="glass-card flex-1 flex flex-col justify-between overflow-hidden border-amber-500/30 bg-background/50 relative z-10">
            {/* Plan label badge */}
            <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950 text-[10px] font-extrabold px-3 py-1 rounded-bl-xl uppercase tracking-wider flex items-center gap-1 shadow-md shadow-amber-500/20">
              <Star className="h-3 w-3 fill-amber-950" /> Premium
            </div>

            <CardHeader className="space-y-2 pt-8">
              <CardTitle className="text-2xl font-black flex items-center gap-2">
                FinCoach Pro <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
              </CardTitle>
              <CardDescription className="text-foreground/80">Get advanced analytics and dynamic insights</CardDescription>
              <div className="pt-4">
                <span className="text-4xl font-extrabold font-mono text-foreground">
                  {isAnnual ? "$7.99" : "$9.99"}
                </span>
                <span className="text-muted-foreground text-sm font-medium"> / month</span>
                {isAnnual && (
                  <div className="text-xs text-amber-500 font-semibold mt-1">Billed annually ($95.88/yr)</div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6 flex-1 flex flex-col justify-between pt-4">
              <ul className="space-y-3 flex-1">
                {premiumFeatures.map((feat, index) => (
                  <li key={index} className="flex items-start text-sm text-foreground/90">
                    <Check className="h-4 w-4 mr-2.5 text-amber-500 shrink-0 mt-0.5" />
                    <span className="font-medium">{feat}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={handleUpgrade}
                disabled={isProcessing || isPremium}
                className={`w-full h-11 font-extrabold shadow-lg transition-transform hover:scale-[1.02] active:scale-95 border-0 ${
                  isPremium
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-gradient-to-r from-amber-500 via-amber-600 to-teal-600 text-white"
                }`}
              >
                {isProcessing ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : isPremium ? (
                  "Active Premium Subscriber"
                ) : (
                  "Upgrade to Premium"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
