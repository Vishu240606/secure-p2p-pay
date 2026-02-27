import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function History() {
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return;

      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("sender_id", userId)
        .order("created_at", { ascending: false });

      if (data) setTransactions(data);
    };

    fetchTransactions();
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <h1 className="text-2xl font-semibold mb-6">
        Transaction History
      </h1>

      {transactions.map((tx) => (
        <div key={tx.id} className="bg-gray-800 p-4 rounded-xl mb-4">
          <div className="flex justify-between">
            <span>₹ {tx.amount}</span>
            <span className="text-sm text-gray-400">
              {new Date(tx.created_at).toLocaleString()}
            </span>
          </div>

          <div className="text-xs text-gray-500 mt-2">
            Token: {tx.token_id.substring(0, 8)}...
          </div>

          <div className="text-emerald-400 text-sm mt-1">
            {tx.status}
          </div>
        </div>
      ))}
    </div>
  );
}
