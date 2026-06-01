import { useLocation, useNavigate } from "react-router-dom";
import { Check } from "lucide-react";

export default function Success() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state ?? {}) as { amount?: number; to?: string };
  const amount = typeof state.amount === "number" ? state.amount : 0;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm text-center animate-slide-up">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 glow">
          <Check className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Payment Successful</h2>
        <p className="text-3xl font-mono font-bold text-primary mb-2">
          ${amount.toFixed(2)}
        </p>
        {state.to && (
          <p className="text-sm text-muted-foreground mb-8">
            to <span className="font-mono">{state.to}</span>
          </p>
        )}
        <button
          onClick={() => navigate("/")}
          className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
