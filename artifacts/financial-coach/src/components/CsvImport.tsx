import { useState, useRef, useCallback } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ParseResult {
  rowCount: number;
  detectedColumns: { date: string; description: string; amount: string };
  expenses: Record<string, number>;
}

interface Props {
  onApply: (expenses: Record<string, number>) => void;
}

type State =
  | { status: "idle" }
  | { status: "dragging" }
  | { status: "parsing" }
  | { status: "done"; result: ParseResult; fileName: string }
  | { status: "error"; message: string };

export function CsvImport({ onApply }: Props) {
  const [state, setState] = useState<State>({ status: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setState({ status: "error", message: "Please upload a .csv file." });
      return;
    }
    setState({ status: "parsing" });
    try {
      const formData = new FormData();
      formData.append("file", file);
      const resp = await fetch("/api/analysis/parse-csv", { method: "POST", body: formData });
      const data = await resp.json();
      if (!resp.ok) {
        setState({ status: "error", message: data.error ?? "Failed to parse file." });
        return;
      }
      setState({ status: "done", result: data as ParseResult, fileName: file.name });
    } catch {
      setState({ status: "error", message: "Network error — could not reach server." });
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setState({ status: "idle" });
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      e.target.value = "";
    },
    [processFile],
  );

  const reset = () => setState({ status: "idle" });

  return (
    <Card className="shadow-sm border-dashed border-2 border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Import Bank Statement</CardTitle>
            <Badge variant="secondary" className="text-xs font-normal">Optional</Badge>
          </div>
          {(state.status === "done" || state.status === "error") && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={reset} data-testid="button-csv-reset">
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <CardDescription>
          Upload a CSV export from your bank to auto-fill expenses. Supports most bank formats with Date, Description, and Amount columns.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {state.status === "idle" || state.status === "dragging" ? (
          <div
            data-testid="csv-dropzone"
            onDragEnter={() => setState({ status: "dragging" })}
            onDragLeave={() => setState({ status: "idle" })}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-md border border-dashed py-8 px-4 cursor-pointer transition-colors",
              state.status === "dragging"
                ? "border-primary bg-primary/10"
                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5",
            )}
          >
            <Upload className={cn("h-8 w-8 transition-colors", state.status === "dragging" ? "text-primary" : "text-muted-foreground")} />
            <p className="text-sm text-muted-foreground text-center">
              <span className="font-medium text-foreground">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">.csv files up to 5MB</p>
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={onFileChange}
              data-testid="input-csv-file"
            />
          </div>
        ) : state.status === "parsing" ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Reading transactions and categorizing with AI...</p>
          </div>
        ) : state.status === "error" ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm font-medium text-destructive">{state.message}</p>
            <Button variant="outline" size="sm" onClick={reset} data-testid="button-csv-retry">
              Try another file
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              <span>
                <span className="font-medium text-foreground">{state.result.rowCount} transactions</span> from{" "}
                <span className="font-medium text-foreground">{state.fileName}</span> — categorized into{" "}
                {Object.keys(state.result.expenses).length} groups
              </span>
            </div>

            <div className="rounded-md border bg-background divide-y max-h-56 overflow-y-auto">
              {Object.entries(state.result.expenses)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, amount]) => (
                  <div key={cat} className="flex items-center justify-between px-3 py-2 text-sm" data-testid={`csv-category-${cat}`}>
                    <span className="text-foreground">{cat}</span>
                    <span className="font-mono text-muted-foreground">${amount.toFixed(2)}</span>
                  </div>
                ))}
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                className="flex-1"
                onClick={() => {
                  if (state.status === "done") onApply(state.result.expenses);
                }}
                data-testid="button-csv-apply"
              >
                Use These Expenses
              </Button>
              <Button type="button" variant="outline" onClick={reset} data-testid="button-csv-discard">
                Discard
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
