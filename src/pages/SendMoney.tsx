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

const PUBLIC_ID_RE = /^user_[a-z0-9]{4,12}$/i;

export default function SendMoney() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading, refresh } = useProfile();

  const [receiverId, setReceiverId] = useState("");
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
  const cleanReceiver = receiverId.trim();

  const validateInputs = (): string | null => {
    if (!cleanReceiver) return "Enter a receiver ID";
    if (!PUBLIC_ID_RE.test(cleanReceiver)) return "Invalid receiver ID format";
    if (profile?.public_id && cleanReceiver.toLowerCase() === profile.public_id.toLowerCase()) {
      return "You cannot send to yourself";
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return "Enter a valid amount";
    if (numericAmount > balance) return "Insufficient balance";
    return null;
  };

  const handleGenerate = async () => {
    if (!user) return;
    const err = validateInputs();
    if (err) {
      toast.error(err);
      return;
    }
    try {
      const t = await generatePaymentToken(user.id, numericAmount);
      setToken(t);
      setNow(Date.now());
      toast.success("Token generated — valid for 30s");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to generate token");
    }
  };

  const handleConfirm = async () => {
    if (!user || !token) return;
    setSubmitting(true);
    try {
      // Fetch sender's public key for local validation
      const { data: senderProfile, error: profErr } = await supabase
        .from("profiles")
        .select("public_key")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profErr || !senderProfile?.public_key) {
        toast.error("Missing device key. Please re-login.");
        return;
      }

      const result = await validatePaymentToken(token, senderProfile.public_key);
      if (result.valid === false) {
        toast.error(result.reason);
        setToken(null);
        return;
      }

      // Atomic server-side transfer
      const { error: rpcErr } = await supabase.rpc("transfer_funds", {
        p_receiver_public_id: cleanReceiver,
        p_amount: numericAmount,
        p_token_id: token.payload.tokenId,
      });

      if (rpcErr) {
        toast.error(rpcErr.message || "Transfer failed");
        return;
      }

      markTokenUsed(token.payload.tokenId);
      await refresh();
      toast.success("Payment sent");
      navigate("/success", { state: { amount: token.payload.amount, to: cleanReceiver } });
    } catch (e: any) {
      toast.error(e?.message ?? "Transfer failed");
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
        <div className="flex items-center justify-between mb-8 animate-slide-up">
          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <p className="font-semibold text-foreground">Send Money</p>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 mb-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
          <p className="text-3xl font-bold tracking-tight text-foreground font-mono">
            ${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </div>

        {!token && (
          <div className="glass-card rounded-2xl p-6 mb-6 animate-slide-up space-y-5" style={{ animationDelay: "0.15s" }}>
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Receiver ID</label>
              <input
                type="text"
                placeholder="user_xxxxxx"
                value={receiverId}
                onChange={(e) => setReceiverId(e.target.value)}
                maxLength={32}
                autoComplete="off"
                className="mt-2 w-full rounded-lg bg-secondary/60 px-3 py-2 font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Amount</label>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-2xl font-mono text-muted-foreground">$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  min="0"
                  step="0.01"
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-transparent text-3xl font-mono font-bold text-foreground outline-none placeholder:text-muted-foreground/40"
                />
              </div>
            </div>
            <button
              onClick={handleGenerate}
              className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Generate Secure Token
            </button>
          </div>
        )}

        {token && (
          <div className="glass-card rounded-2xl p-6 mb-6 animate-slide-up">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Single-Use Token</p>
            <p className="mt-2 break-all font-mono text-xs text-foreground/80">{token.payload.tokenId}</p>

            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-xs text-muted-foreground">To</p>
                <p className="font-mono text-sm text-foreground">{cleanReceiver}</p>
                <p className="mt-2 text-xs text-muted-foreground">Amount</p>
                <p className="text-2xl font-mono font-bold text-foreground">
                  ${token.payload.amount.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Expires in</p>
                <p className={`text-2xl font-mono font-bold ${expired ? "text-destructive" : "text-primary"}`}>
                  {expired ? "00s" : `${remainingSec.toString().padStart(2, "0")}s`}
                </p>
              </div>
            </div>

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
