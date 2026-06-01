import { ArrowLeft, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

export default function Profile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, loading } = useProfile();

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
          <p className="font-semibold text-foreground">Profile</p>
          <div className="h-10 w-10" />
        </div>

        {loading ? (
          <div className="glass-card rounded-2xl p-8 text-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : (
          <div className="space-y-4">
            <Field label="Display name" value={profile?.display_name ?? "—"} />
            <Field label="ProxiPay ID" value={profile?.public_id ?? "—"} mono />
            <Field label="Email" value={user?.email ?? "—"} />
            <Field
              label="Balance"
              value={`$${(profile?.balance ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
              mono
            />

            <button
              onClick={signOut}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-foreground hover:bg-secondary/80 transition-colors"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="glass-card rounded-xl p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm text-foreground ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
