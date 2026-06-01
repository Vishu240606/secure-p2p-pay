import { ArrowLeft, Copy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";

export default function Receive() {
  const navigate = useNavigate();
  const { profile, loading } = useProfile();

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
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/")}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <p className="font-semibold text-foreground">Receive</p>
          <div className="h-10 w-10" />
        </div>

        {loading || !profile ? (
          <div className="glass-card rounded-2xl p-8 text-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-6 text-center space-y-5">
            <p className="text-sm text-muted-foreground">
              Share your ProxiPay ID or QR with the sender
            </p>

            <div className="mx-auto inline-block rounded-xl bg-white p-4">
              <QRCodeSVG value={profile.public_id} size={192} level="M" />
            </div>

            <button
              onClick={copyId}
              className="mx-auto inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2 text-sm font-mono text-foreground hover:bg-secondary/80 transition-colors"
            >
              {profile.public_id}
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            </button>

            <p className="text-xs text-muted-foreground">
              The sender enters this ID on their Send screen.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
