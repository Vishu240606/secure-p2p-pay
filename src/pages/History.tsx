import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Tx {
  id: string;
  sender_id: string;
  receiver_id: string;
  sender_public_id: string;
  receiver_public_id: string;
  amount: number;
  token_id: string;
  status: string;
  created_at: string;
}

export default function History() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .limit(100);

      if (cancelled) return;
      if (error) {
        setError("Could not load transactions.");
      } else {
        setTransactions((data as Tx[]) ?? []);
        setError(null);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 pb-8 pt-6">
      <div className="mx-auto w-full max-w-sm">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/")}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <p className="font-semibold text-foreground">History</p>
          <div className="h-10 w-10" />
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {error && !loading && (
          <div className="glass-card rounded-xl p-6 text-sm text-center text-destructive">
            {error}
          </div>
        )}

        {!loading && !error && transactions.length === 0 && (
          <div className="glass-card rounded-xl p-6 text-sm text-center text-muted-foreground">
            No transactions yet
          </div>
        )}

        <div className="space-y-3">
          {transactions.map((tx) => {
            const sent = tx.sender_id === user?.id;
            const counterparty = sent ? tx.receiver_public_id : tx.sender_public_id;
            return (
              <div key={tx.id} className="glass-card rounded-xl p-4 flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${sent ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
                  {sent ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {sent ? "Sent to" : "Received from"}{" "}
                    <span className="font-mono">{counterparty}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(tx.created_at).toLocaleString()}
                  </p>
                </div>
                <p className={`font-mono font-semibold ${sent ? "text-destructive" : "text-primary"}`}>
                  {sent ? "-" : "+"}${Number(tx.amount).toFixed(2)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
