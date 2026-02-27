import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useDeviceKeys } from "@/hooks/useDeviceKeys";
import { Shield, LogOut, ArrowUpRight, ArrowDownLeft, Clock } from "lucide-react";

const Dashboard = () => {
  const { signOut } = useAuth();
  const { profile, loading } = useProfile();
  useDeviceKeys();

  const initialBalance = profile?.balance ?? 0;

  const [localBalance, setLocalBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    setLocalBalance(initialBalance);
  }, [initialBalance]);

  // 🔐 Generate pairing code
  function generateSessionCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // 👤 Biometric (WebAuthn with demo fallback)
  async function authenticateUser() {
    try {
      if (!window.PublicKeyCredential) {
        alert("Biometric not supported. Simulating for demo.");
        return true;
      }

      await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          timeout: 60000,
          userVerification: "required",
        },
      } as any);

      return true;
    } catch (err) {
      alert("Biometric blocked in preview. Simulating success.");
      return true;
    }
  }

  // 🚀 Send Logic
  const handleSend = async () => {
    const amountInput = prompt("Enter amount to send:");

    if (!amountInput) return;

    const amount = parseFloat(amountInput);

    if (isNaN(amount) || amount <= 0) {
      alert("Invalid amount");
      return;
    }

    if (amount > localBalance) {
      alert("Insufficient balance");
      return;
    }

    const sessionCode = generateSessionCode();
    alert("Share this code with receiver: " + sessionCode);

    const isAuthenticated = await authenticateUser();

    if (!isAuthenticated) {
      alert("Authentication Failed");
      return;
    }

    // Deduct balance
    setLocalBalance(prev => prev - amount);

    // Add transaction entry
    const newTransaction = {
      id: Date.now(),
      type: "Sent",
      amount,
      date: new Date().toLocaleString(),
    };

    setTransactions(prev => [newTransaction, ...prev]);

    alert("Transaction Successful!");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-pulse-glow rounded-full bg-primary" />
      </div>
    );
  }

  const displayName = profile?.display_name ?? "User";

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 pb-8 pt-6">
      <div className="mx-auto w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Welcome back</p>
              <p className="font-semibold text-foreground">{displayName}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        {/* Balance Card */}
        <div className="glass-card rounded-2xl p-6 mb-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <p className="text-sm text-muted-foreground mb-1">Total Balance</p>
          <p className="text-4xl font-bold tracking-tight text-foreground font-mono">
            ${localBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
          <div className="mt-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
              Active
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3 mb-8 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <button
            onClick={handleSend}
            className="glass-card flex flex-col items-center gap-2 rounded-xl p-4 text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowUpRight className="h-5 w-5" />
            <span className="text-xs font-medium">Send</span>
          </button>

          <button className="glass-card flex flex-col items-center gap-2 rounded-xl p-4 text-muted-foreground hover:text-primary transition-colors">
            <ArrowDownLeft className="h-5 w-5" />
            <span className="text-xs font-medium">Receive</span>
          </button>

          <button className="glass-card flex flex-col items-center gap-2 rounded-xl p-4 text-muted-foreground hover:text-primary transition-colors">
            <Clock className="h-5 w-5" />
            <span className="text-xs font-medium">History</span>
          </button>
        </div>

        {/* Recent Activity */}
        <div className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <h2 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Recent Activity
          </h2>
          <div className="glass-card rounded-xl p-6 text-sm">
            {transactions.length === 0 ? (
              <p className="text-muted-foreground text-center">No transactions yet</p>
            ) : (
              <div className="space-y-3">
                {transactions.map(tx => (
                  <div key={tx.id} className="flex justify-between">
                    <span>{tx.type}</span>
                    <span className="text-red-400">
                      - ${tx.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
