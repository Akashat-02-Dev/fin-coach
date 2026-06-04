import { useState } from "react";
import { useListNetWorth, useCreateNetWorthEntry, useDeleteNetWorthEntry, getListNetWorthQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";

export default function NetWorth() {
  const { data: entries, isLoading } = useListNetWorth();
  const createEntry = useCreateNetWorthEntry();
  const deleteEntry = useDeleteNetWorthEntry();
  const queryClient = useQueryClient();

  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [assets, setAssets] = useState("");
  const [liabilities, setLiabilities] = useState("");
  const [notes, setNotes] = useState("");

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEntry.mutate({
      data: {
        date: new Date(date).toISOString(),
        assets: Number(assets),
        liabilities: Number(liabilities),
        notes: notes || undefined
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNetWorthQueryKey() });
        setAssets("");
        setLiabilities("");
        setNotes("");
      }
    });
  };

  const handleDelete = (id: number) => {
    deleteEntry.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNetWorthQueryKey() });
      }
    });
  };

  const currentAssets = Number(assets) || 0;
  const currentLiabilities = Number(liabilities) || 0;
  const currentNetWorth = currentAssets - currentLiabilities;

  const sortedEntries = [...(entries || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const chartData = sortedEntries.map(e => ({
    ...e,
    formattedDate: format(new Date(e.date), "MMM d, yy")
  }));

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight">Net Worth Tracker</h1>
      
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Add Snapshot</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Total Assets ($)</Label>
                  <Input type="number" step="0.01" value={assets} onChange={(e) => setAssets(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Total Liabilities ($)</Label>
                  <Input type="number" step="0.01" value={liabilities} onChange={(e) => setLiabilities(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
                
                <div className="pt-4 border-t border-border mt-4">
                  <div className="flex justify-between font-bold mb-4">
                    <span>Net Worth:</span>
                    <span className={currentNetWorth >= 0 ? "text-primary" : "text-destructive"}>
                      {formatCurrency(currentNetWorth)}
                    </span>
                  </div>
                  <Button type="submit" className="w-full" disabled={createEntry.isPending}>
                    {createEntry.isPending ? "Adding..." : "Add Snapshot"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-8">
          {sortedEntries.length === 0 ? (
            <Card className="text-center py-16 border-dashed">
              <CardContent>
                <h3 className="text-lg font-medium mb-2">No data yet</h3>
                <p className="text-muted-foreground">Add your first snapshot to start tracking your net worth.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Net Worth Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="formattedDate" />
                        <YAxis tickFormatter={(val) => `$${val}`} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Line type="monotone" dataKey="assets" name="Assets" stroke="#22c55e" strokeWidth={2} />
                        <Line type="monotone" dataKey="liabilities" name="Liabilities" stroke="#ef4444" strokeWidth={2} />
                        <Line type="monotone" dataKey="netWorth" name="Net Worth" stroke="#0d9488" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>History</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Assets</TableHead>
                        <TableHead>Liabilities</TableHead>
                        <TableHead>Net Worth</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...sortedEntries].reverse().map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>{format(new Date(entry.date), "MMM d, yyyy")}</TableCell>
                          <TableCell>{formatCurrency(entry.assets)}</TableCell>
                          <TableCell>{formatCurrency(entry.liabilities)}</TableCell>
                          <TableCell className="font-bold">{formatCurrency(entry.netWorth)}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)} className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}