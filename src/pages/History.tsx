import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function History() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          setError("User not authenticated");
          return;
        }

        const { data, error: txError } = await supabase
          .from("transactions")
          .select("*")
          .eq("sender_id", user.id)
          .order("created_at", { ascending: false });

        if (txError) {
          setError("Failed to fetch transactions");
          return;
        }

        setTransactions(data || []);
      } catch (err) {
        console.error(err);
        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <h1 className="text-2xl font-semibold mb-6">
        Transaction History
      </h1>

      {loading && (
        <div className="text-gray-400">Loading transactions...</div>
      )}

      {error && (
        <div className="text-red-400 mb-4">{error}</div>
      )}

      {!loading && transactions.length === 0 && !error && (
        <div className="text-gray-400">
          No transactions yet.
        </div>
      )}

      {transactions.map((tx) => (
        <div key={tx.id} className="bg-gray-800 p-4 rounded-xl mb-4">
          <div className="flex justify-between">
            <span>₹ {tx.amount}</span>
            <span className="text-sm text-gray-400">
              {tx.created_at
                ? new Date(tx.created_at).toLocaleString()
                : "—"}
            </span>
          </div>

          <div className="text-xs text-gray-500 mt-2">
            Token: {tx.token_id
              ? tx.token_id.substring(0, 8) + "..."
              : "N/A"}
          </div>

          <div
            className={`text-sm mt-1 ${
              tx.status === "completed"
                ? "text-emerald-400"
                : "text-yellow-400"
            }`}
          >
            {tx.status}
          </div>
        </div>
      ))}
    </div>
  );
}
