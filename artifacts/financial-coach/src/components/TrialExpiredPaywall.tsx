import { useState } from "react";
import { useCreateSubscription, useVerifySignature, getAuthMeQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { loadRazorpayScript } from "@/lib/razorpay";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Lock, LogOut, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export function TrialExpiredPaywall() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  const createSubscriptionMutation = useCreateSubscription();
  const verifySignatureMutation = useVerifySignature();

  const handleUpgrade = async () => {
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
        const mockPaymentId = `pay_mock_${Math.random().toString(36).substring(7)}`;
        const mockSignature = `sig_mock_${Math.random().toString(36).substring(7)}`;
        
        await verifySignatureMutation.mutateAsync({
          data: {
            razorpayPaymentId: mockPaymentId,
            razorpaySubscriptionId: subscriptionId,
            razorpaySignature: mockSignature,
          }
        });

        // Instantly force refetch of auth user details to refresh components
        await queryClient.refetchQueries({ queryKey: getAuthMeQueryKey() });

        toast({
          title: "Subscription Activated (Mock)",
          description: "Thank you for upgrading! Your premium account is now active.",
        });
        setIsProcessing(false);
        return;
      }

      // Production Razorpay options
      const options = {
        key: keyId,
        subscription_id: subscriptionId,
        name: "FinCoach Pro",
        description: "FinCoach Pro Monthly Plan",
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

            // Update local query cache to instantly unblur the app
            await queryClient.refetchQueries({ queryKey: getAuthMeQueryKey() });

            toast({
              title: "Payment Successful",
              description: "Welcome to FinCoach Pro! Your subscription is now active.",
            });
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-2xl bg-background/55 p-4 select-none">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-card/90 border border-border/70 shadow-2xl rounded-2xl p-8 backdrop-blur-xl relative overflow-hidden"
      >
        {/* Glow gradients */}
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-primary/25 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-teal-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col items-center text-center space-y-6 relative z-10">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary animate-pulse shadow-[0_0_15px_rgba(20,184,166,0.25)]">
            <Lock className="h-7 w-7" />
          </div>

          <div className="space-y-1">
            <h2 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-primary/80">
              Trial Concluded
            </h2>
            <p className="text-muted-foreground text-sm font-medium">
              Your 15-day free trial has expired.
            </p>
          </div>

          <p className="text-foreground/90 text-sm leading-relaxed max-w-md">
            Your 15-day trial has concluded. Unlock continuous professional financial planning, advanced AI coaching, and ROI engines instantly.
          </p>

          <div className="w-full space-y-3 pt-2">
            <Button
              onClick={handleUpgrade}
              disabled={isProcessing}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-teal-700 hover:from-primary/95 hover:to-teal-800 text-primary-foreground shadow-lg shadow-primary/20 relative overflow-hidden transition-all duration-300 transform active:scale-[0.98]"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></span>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Sparkles className="h-4 w-4 text-yellow-300 animate-pulse" />
                  Upgrade to Premium Now
                </span>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending || isProcessing}
              className="w-full h-11 border-border/70 hover:bg-muted/65 text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 transition-all duration-200"
            >
              <LogOut className="h-4 w-4" />
              Log Out of Account
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
