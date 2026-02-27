import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useDeviceKeys } from "@/hooks/useDeviceKeys";
import { Shield, LogOut, ArrowUpRight, ArrowDownLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const { signOut } = useAuth();
  const { profile, loading } = useProfile();
  useDeviceKeys();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-pulse-glow rounded-full bg-primary" />
      </div>
    );
  }

  const balance = profile?.balance ?? 0;
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
            ${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
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
          <button className="glass-card flex flex-col items-center gap-2 rounded-xl p-4 text-muted-foreground hover:text-primary transition-colors">
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

        {/* Recent Activity Placeholder */}
        <div className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <h2 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Recent Activity
          </h2>
          <div className="glass-card rounded-xl p-8 text-center">
            <p className="text-sm text-muted-foreground">No transactions yet</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
