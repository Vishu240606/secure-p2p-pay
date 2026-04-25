import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import {
  generatePaymentToken,
  validatePaymentToken,
  markTokenUsed,
  TOKEN_TTL_MS,
  type SignedPaymentToken,
} from "@/lib/token";
import { toast } from "sonner";

export default function SendMoney() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading } = useProfile();

  const [amount, setAmount] = useState("");
  const [token, setToken] = useState<SignedPaymentToken | null>(null);
  const [now, setNow] = useState(Date.now());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [token]);

  const remainingMs = token ? Math.max(0, token.payload.expiresAt - now) : 0;
  const remainingSec = Math.ceil(remainingMs / 1000);
  const expired = !!token && remainingMs <= 0;

  const numericAmount = useMemo(() => Number(amount), [amount]);
  const balance = profile?.balance ?? 0;

  const handleGenerate = async () => {
    if (!user) return;
    if (!numericAmount || numericAmount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (numericAmount > balance) {
      toast.error("Insufficient balance");
      return;
    }
    try {
      const t = await generatePaymentToken(user.id, numericAmount);
      setToken(t);
      setNow(Date.now());
      toast.success("Token generated — valid for 30s");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to generate token");
    }
  };

  const handleConfirm = async () => {
    if (!user || !token) return;
    setSubmitting(true);
    try {
      // Fetch sender's public key for validation
      const { data: senderProfile, error } = await supabase
        .from("profiles")
        .select("public_key, balance")
        .eq("id", user.id)
        .single();

      if (error || !senderProfile?.public_key) {
        toast.error("Missing device public key");
        return;
      }

      const result = await validatePaymentToken(token, senderProfile.public_key);
      if (!result.valid) {
        toast.error(result.reason);
        setToken(null);
        return;
      }

      if ((senderProfile.balance ?? 0) < token.payload.amount) {
        toast.error("Insufficient balance");
        return;
      }

      // Consume token + debit balance
      markTokenUsed(token.payload.tokenId);
      const newBalance = Number(senderProfile.balance) - token.payload.amount;

      const { error: updErr } = await supabase
        .from("profiles")
        .update({ balance: newBalance })
        .eq("id", user.id);
      if (updErr) {
        toast.error("Failed to update balance");
        return;
      }

      toast.success("Payment sent");
      navigate("/success", { state: { amount: token.payload.amount } });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 pb-8 pt-6">
      <div className="mx-auto w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-slide-up">
          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <p className="font-semibold text-foreground">Send Money</p>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
        </div>

        {/* Balance */}
        <div className="glass-card rounded-2xl p-6 mb-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
          <p className="text-3xl font-bold tracking-tight text-foreground font-mono">
            ${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Amount input */}
        {!token && (
          <div className="glass-card rounded-2xl p-6 mb-6 animate-slide-up" style={{ animationDelay: "0.15s" }}>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">
              Amount
            </label>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-2xl font-mono text-muted-foreground">$</span>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-transparent text-3xl font-mono font-bold text-foreground outline-none placeholder:text-muted-foreground/40"
              />
            </div>
            <button
              onClick={handleGenerate}
              className="mt-6 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Generate Secure Token
            </button>
          </div>
        )}

        {/* Token panel */}
        {token && (
          <div className="glass-card rounded-2xl p-6 mb-6 animate-slide-up">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Single-Use Token
            </p>
            <p className="mt-2 break-all font-mono text-xs text-foreground/80">
              {token.payload.tokenId}
            </p>

            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Amount</p>
                <p className="text-2xl font-mono font-bold text-foreground">
                  ${token.payload.amount.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Expires in</p>
                <p
                  className={`text-2xl font-mono font-bold ${
                    expired ? "text-destructive" : "text-primary"
                  }`}
                >
                  {expired ? "00s" : `${remainingSec.toString().padStart(2, "0")}s`}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={`h-full ${expired ? "bg-destructive" : "bg-primary"} transition-all`}
                style={{ width: `${(remainingMs / TOKEN_TTL_MS) * 100}%` }}
              />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={() => setToken(null)}
                className="rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-foreground hover:bg-secondary/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={expired || submitting}
                className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                {submitting ? "Confirming..." : expired ? "Expired" : "Confirm"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
