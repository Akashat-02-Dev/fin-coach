import { Link } from "wouter";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[80vh] w-full p-4">
      <Card className="w-full max-w-md shadow-sm border-border">
        <CardContent className="pt-12 pb-12 flex flex-col items-center text-center space-y-6">
          <div className="h-16 w-16 bg-muted flex items-center justify-center rounded-full mb-2">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">404 - Page Not Found</h1>
            <p className="text-muted-foreground max-w-[250px] mx-auto">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>
          
          <Button asChild className="mt-4 hover-elevate">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Return to Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}