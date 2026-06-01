import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useDeviceKeys } from "@/hooks/useDeviceKeys";
import { Shield, LogOut, ArrowUpRight, ArrowDownLeft, Clock, Copy } from "lucide-react";
import { toast } from "sonner";

const Dashboard = () => {
  const { signOut } = useAuth();
  const { profile, loading } = useProfile();
  useDeviceKeys();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-pulse-glow rounded-full bg-primary" />
      </div>
    );
  }

  const displayName = profile?.display_name ?? "User";
  const balance = profile?.balance ?? 0;
  const publicId = profile?.public_id ?? "—";

  const copyId = async () => {
    if (!profile?.public_id) return;
    try {
      await navigator.clipboard.writeText(profile.public_id);
      toast.success("ID copied");
    } catch {
      toast.error("Could not copy");
    }
  };

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
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        {/* Balance Card */}
        <div className="glass-card rounded-2xl p-6 mb-4 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <p className="text-sm text-muted-foreground mb-1">Total Balance</p>
          <p className="text-4xl font-bold tracking-tight text-foreground font-mono">
            ${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
          <div className="mt-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
              Active
            </span>
          </div>
        </div>

        {/* Public ID Card */}
        <button
          onClick={copyId}
          className="glass-card w-full rounded-2xl p-4 mb-6 flex items-center justify-between text-left animate-slide-up hover:bg-secondary/40 transition-colors"
          style={{ animationDelay: "0.15s" }}
        >
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Your ProxiPay ID</p>
            <p className="font-mono text-sm text-foreground truncate">{publicId}</p>
          </div>
          <Copy className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-3" />
        </button>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3 mb-8 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <button
            onClick={() => navigate("/send")}
            className="glass-card flex flex-col items-center gap-2 rounded-xl p-4 text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowUpRight className="h-5 w-5" />
            <span className="text-xs font-medium">Send</span>
          </button>
          <button
            onClick={() => navigate("/receive")}
            className="glass-card flex flex-col items-center gap-2 rounded-xl p-4 text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowDownLeft className="h-5 w-5" />
            <span className="text-xs font-medium">Receive</span>
          </button>
          <button
            onClick={() => navigate("/history")}
            className="glass-card flex flex-col items-center gap-2 rounded-xl p-4 text-muted-foreground hover:text-primary transition-colors"
          >
            <Clock className="h-5 w-5" />
            <span className="text-xs font-medium">History</span>
          </button>
        </div>

        {/* Recent Activity hint */}
        <div className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <div className="glass-card rounded-xl p-6 text-sm text-center text-muted-foreground">
            Tap History to see your transactions
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
