import React from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PremiumGateProps {
  children: React.ReactNode;
  className?: string;
}

export function PremiumGate({ children, className }: PremiumGateProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className={`w-full h-48 animate-pulse bg-muted rounded-xl flex items-center justify-center ${className || ""}`}>
        <span className="text-muted-foreground text-sm">Loading Premium Features...</span>
      </div>
    );
  }

  const isPremium = user?.subscriptionTier === "premium";

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <div className={`relative overflow-hidden rounded-xl border border-border/40 bg-card/30 backdrop-blur-sm ${className || ""}`}>
      {/* Blurred background content */}
      <div className="pointer-events-none select-none blur-md filter brightness-[0.6] p-4 transition-all duration-300">
        {children}
      </div>

      {/* Lock overlay banner */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-t from-background/90 via-background/30 to-transparent z-10">
        <div className="glass-card max-w-sm p-6 rounded-2xl border border-amber-500/20 bg-background/90 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-350">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-amber-950 font-bold shadow-lg shadow-amber-500/35">
            <Sparkles className="h-6 w-6 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h4 className="text-lg font-bold tracking-tight text-foreground">Premium Feature Gated</h4>
            <p className="text-xs text-muted-foreground">
              Upgrade your coaching account to unlock advanced AI financial advice, scenario CSV exports, and customized debt planning.
            </p>
          </div>
          <Button
            asChild
            className="w-full font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-amber-950 shadow-md transition-all hover:scale-[1.02] active:scale-95 border-0"
          >
            <Link to="/pricing">
              Upgrade to Premium
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
